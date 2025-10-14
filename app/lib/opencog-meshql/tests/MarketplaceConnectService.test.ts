/**
 * Tests for MarketplaceConnectService
 */

import {describe, it, expect, beforeEach} from 'vitest';
import {pino} from 'pino';
import {
  MarketplaceConnectService,
  MarketplacePlatform,
  ConnectionStatus,
  ListingStatus,
  OrderStatus,
} from '../MarketplaceConnectService';
import {OpenCogMeshQLService} from '../OpenCogMeshQLService';
import {NodeStatus} from '../types';

describe('MarketplaceConnectService', () => {
  let service: MarketplaceConnectService;
  let meshService: OpenCogMeshQLService;
  let logger: ReturnType<typeof pino>;

  beforeEach(() => {
    logger = pino({level: 'silent'});
    meshService = new OpenCogMeshQLService({
      meshId: 'test-mesh',
      nodes: [
        {
          id: 'node-1',
          endpoint: 'http://localhost:8001',
          status: NodeStatus.Active,
          capabilities: ['REASON', 'LEARN'],
          lastHeartbeat: new Date(),
        },
      ],
      defaultTimeout: 5000,
      heartbeatIntervalMs: 1000,
      logger,
    });

    service = new MarketplaceConnectService(
      meshService,
      {
        defaultSyncInterval: 60,
        defaultInventoryBuffer: 5,
        enableAutoSync: true,
        maxRetries: 3,
      },
      logger,
    );
  });

  describe('Initialization', () => {
    it('should initialize with root concept', () => {
      const rootAtom = meshService.getAtom('marketplace-connect-root');
      expect(rootAtom).toBeDefined();
      expect(rootAtom?.name).toBe('ShopifyMarketplaceConnect');
      expect(rootAtom?.type).toBe('ConceptNode');
    });

    it('should create platform concepts', () => {
      const amazonPlatform = meshService.getAtom('marketplace-platform-amazon');
      expect(amazonPlatform).toBeDefined();
      expect(amazonPlatform?.name).toBe(MarketplacePlatform.Amazon);

      const ebayPlatform = meshService.getAtom('marketplace-platform-ebay');
      expect(ebayPlatform).toBeDefined();
      expect(ebayPlatform?.name).toBe(MarketplacePlatform.eBay);

      const walmartPlatform = meshService.getAtom('marketplace-platform-walmart');
      expect(walmartPlatform).toBeDefined();
      expect(walmartPlatform?.name).toBe(MarketplacePlatform.Walmart);

      const targetPlatform = meshService.getAtom('marketplace-platform-target_plus');
      expect(targetPlatform).toBeDefined();
      expect(targetPlatform?.name).toBe(MarketplacePlatform.TargetPlus);
    });

    it('should link platforms to root', () => {
      const amazonLinks = meshService.getOutgoingLinks('marketplace-platform-amazon');
      expect(amazonLinks.length).toBeGreaterThan(0);
      
      const linkToRoot = amazonLinks.find(
        link => link.outgoing.includes('marketplace-connect-root'),
      );
      expect(linkToRoot).toBeDefined();
      expect(linkToRoot?.type).toBe('InheritanceLink');
    });
  });

  describe('Marketplace Connection Management', () => {
    it('should connect to a marketplace', async () => {
      const connection = await service.connectMarketplace(
        MarketplacePlatform.Amazon,
        {
          apiKey: 'test-key',
          secretKey: 'test-secret',
          merchantId: 'test-merchant',
        },
        {
          autoSync: true,
          syncIntervalMinutes: 30,
        },
      );

      expect(connection).toBeDefined();
      expect(connection.platform).toBe(MarketplacePlatform.Amazon);
      expect(connection.status).toBe(ConnectionStatus.Connected);
      expect(connection.settings.autoSync).toBe(true);
      expect(connection.settings.syncIntervalMinutes).toBe(30);
      expect(connection.connectedAt).toBeInstanceOf(Date);
    });

    it('should create connection atom in hypergraph', async () => {
      const connection = await service.connectMarketplace(
        MarketplacePlatform.eBay,
        {apiKey: 'test-key'},
      );

      const connectionAtom = meshService.getAtom(`marketplace-connection-${connection.id}`);
      expect(connectionAtom).toBeDefined();
      expect(connectionAtom?.type).toBe('ConceptNode');
      expect(connectionAtom?.name).toContain('eBay');
    });

    it('should link connection to platform', async () => {
      const connection = await service.connectMarketplace(
        MarketplacePlatform.Walmart,
        {apiKey: 'test-key'},
      );

      const connectionAtom = meshService.getAtom(`marketplace-connection-${connection.id}`);
      const outgoingLinks = meshService.getOutgoingLinks(connectionAtom!.id);
      
      const platformLink = outgoingLinks.find(
        link => link.outgoing.includes('marketplace-platform-walmart'),
      );
      expect(platformLink).toBeDefined();
      expect(platformLink?.type).toBe('MemberLink');
    });

    it('should disconnect from a marketplace', async () => {
      const connection = await service.connectMarketplace(
        MarketplacePlatform.Amazon,
        {apiKey: 'test-key'},
      );

      await service.disconnectMarketplace(connection.id);

      const retrievedConnection = service.getConnection(connection.id);
      expect(retrievedConnection).toBeUndefined();
    });

    it('should get all connections', async () => {
      await service.connectMarketplace(MarketplacePlatform.Amazon, {apiKey: 'key1'});
      await service.connectMarketplace(MarketplacePlatform.eBay, {apiKey: 'key2'});

      const connections = service.getConnections();
      expect(connections.length).toBe(2);
    });
  });

  describe('Product Listing Management', () => {
    let connectionId: string;

    beforeEach(async () => {
      const connection = await service.connectMarketplace(
        MarketplacePlatform.Amazon,
        {apiKey: 'test-key'},
      );
      connectionId = connection.id;
    });

    it('should create a product listing', async () => {
      const listing = await service.createListing('product-123', connectionId, {
        title: 'Test Product',
        description: 'A great product',
        price: 29.99,
        inventoryQuantity: 100,
        sku: 'SKU-123',
        category: 'Electronics',
      });

      expect(listing).toBeDefined();
      expect(listing.shopifyProductId).toBe('product-123');
      expect(listing.platform).toBe(MarketplacePlatform.Amazon);
      expect(listing.status).toBe(ListingStatus.Active);
      expect(listing.title).toBe('Test Product');
      expect(listing.price).toBe(29.99);
    });

    it('should create listing atom in hypergraph', async () => {
      const listing = await service.createListing('product-456', connectionId, {
        title: 'Another Product',
      });

      const listingAtom = meshService.getAtom(`marketplace-listing-${listing.id}`);
      expect(listingAtom).toBeDefined();
      expect(listingAtom?.type).toBe('ConceptNode');
      expect(listingAtom?.name).toBe('Another Product');
    });

    it('should link listing to connection', async () => {
      const listing = await service.createListing('product-789', connectionId, {
        title: 'Third Product',
      });

      const listingAtom = meshService.getAtom(`marketplace-listing-${listing.id}`);
      const outgoingLinks = meshService.getOutgoingLinks(listingAtom!.id);
      
      const connectionLink = outgoingLinks.find(
        link => link.outgoing.includes(`marketplace-connection-${connectionId}`),
      );
      expect(connectionLink).toBeDefined();
      expect(connectionLink?.type).toBe('MemberLink');
    });

    it('should link listing to Shopify product', async () => {
      const listing = await service.createListing('product-999', connectionId, {
        title: 'Fourth Product',
      });

      const listingAtom = meshService.getAtom(`marketplace-listing-${listing.id}`);
      const outgoingLinks = meshService.getOutgoingLinks(listingAtom!.id);
      
      const productLink = outgoingLinks.find(
        link => link.outgoing.includes('shopify-product-product-999'),
      );
      expect(productLink).toBeDefined();
      expect(productLink?.type).toBe('EvaluationLink');
    });

    it('should update a listing', async () => {
      const listing = await service.createListing('product-111', connectionId, {
        title: 'Original Title',
        price: 19.99,
      });

      const updated = await service.updateListing(listing.id, {
        title: 'Updated Title',
        price: 24.99,
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.price).toBe(24.99);
      expect(updated.status).toBe(ListingStatus.Active);
    });

    it('should delete a listing', async () => {
      const listing = await service.createListing('product-222', connectionId, {
        title: 'To Delete',
      });

      await service.deleteListing(listing.id);

      const allListings = service.getListings();
      const deletedListing = allListings.find(l => l.id === listing.id);
      expect(deletedListing).toBeUndefined();
    });

    it('should get listings by product', async () => {
      await service.createListing('product-shared', connectionId, {
        title: 'Shared Product Amazon',
      });

      const ebayConnection = await service.connectMarketplace(
        MarketplacePlatform.eBay,
        {apiKey: 'key2'},
      );

      await service.createListing('product-shared', ebayConnection.id, {
        title: 'Shared Product eBay',
      });

      const listings = service.getListingsByProduct('product-shared');
      expect(listings.length).toBe(2);
    });

    it('should get listings by marketplace', async () => {
      await service.createListing('product-a', connectionId, {title: 'Product A'});
      await service.createListing('product-b', connectionId, {title: 'Product B'});

      const listings = service.getListingsByMarketplace(MarketplacePlatform.Amazon);
      expect(listings.length).toBeGreaterThanOrEqual(2);
    });

    it('should throw error when creating listing with invalid connection', async () => {
      await expect(
        service.createListing('product-error', 'invalid-connection-id', {title: 'Error'}),
      ).rejects.toThrow('Connection not found');
    });
  });

  describe('Inventory Synchronization', () => {
    let connectionId: string;

    beforeEach(async () => {
      const connection = await service.connectMarketplace(
        MarketplacePlatform.Amazon,
        {apiKey: 'test-key'},
        {inventoryBufferPercent: 10},
      );
      connectionId = connection.id;
    });

    it('should create inventory sync rule', () => {
      const rule = service.createInventorySyncRule(
        'All Marketplaces',
        [MarketplacePlatform.Amazon, MarketplacePlatform.eBay],
        {
          syncMode: 'realtime',
          buffer: 5,
          enabled: true,
        },
      );

      expect(rule).toBeDefined();
      expect(rule.name).toBe('All Marketplaces');
      expect(rule.marketplaces).toHaveLength(2);
      expect(rule.syncMode).toBe('realtime');
      expect(rule.buffer).toBe(5);
      expect(rule.enabled).toBe(true);
    });

    it('should create sync rule atom in hypergraph', () => {
      const rule = service.createInventorySyncRule('Test Rule', [MarketplacePlatform.Amazon]);

      const ruleAtom = meshService.getAtom(`inventory-sync-rule-${rule.id}`);
      expect(ruleAtom).toBeDefined();
      expect(ruleAtom?.type).toBe('ConceptNode');
      expect(ruleAtom?.name).toBe('Test Rule');
    });

    it('should sync inventory with buffer', async () => {
      const listing = await service.createListing('product-sync', connectionId, {
        title: 'Sync Product',
        inventoryQuantity: 50,
      });

      await service.syncInventory('product-sync', 100);

      const allListings = service.getListings();
      const syncedListing = allListings.find(l => l.id === listing.id);
      
      // With 10% buffer, 100 becomes 90
      expect(syncedListing?.inventoryQuantity).toBe(90);
    });

    it('should get all sync rules', () => {
      service.createInventorySyncRule('Rule 1', [MarketplacePlatform.Amazon]);
      service.createInventorySyncRule('Rule 2', [MarketplacePlatform.eBay]);

      const rules = service.getSyncRules();
      expect(rules.length).toBe(2);
    });
  });

  describe('Order Management', () => {
    let connectionId: string;

    beforeEach(async () => {
      const connection = await service.connectMarketplace(
        MarketplacePlatform.Amazon,
        {apiKey: 'test-key'},
      );
      connectionId = connection.id;
    });

    it('should import an order', async () => {
      const order = await service.importOrder(connectionId, {
        marketplaceOrderId: 'AMZ-12345',
        customerId: 'customer-1',
        items: [
          {
            id: 'item-1',
            listingId: 'listing-1',
            productId: 'product-1',
            sku: 'SKU-1',
            quantity: 2,
            price: 29.99,
            title: 'Test Product',
          },
        ],
        totalAmount: 59.98,
        currency: 'USD',
        shippingAddress: {
          name: 'John Doe',
          address1: '123 Main St',
          city: 'New York',
          province: 'NY',
          country: 'US',
          zip: '10001',
        },
        billingAddress: {
          name: 'John Doe',
          address1: '123 Main St',
          city: 'New York',
          province: 'NY',
          country: 'US',
          zip: '10001',
        },
      });

      expect(order).toBeDefined();
      expect(order.marketplaceOrderId).toBe('AMZ-12345');
      expect(order.platform).toBe(MarketplacePlatform.Amazon);
      expect(order.status).toBe(OrderStatus.Pending);
      expect(order.items.length).toBe(1);
      expect(order.totalAmount).toBe(59.98);
    });

    it('should create order atom in hypergraph', async () => {
      const order = await service.importOrder(connectionId, {
        marketplaceOrderId: 'AMZ-67890',
        customerId: 'customer-2',
        items: [],
        totalAmount: 100,
        currency: 'USD',
        shippingAddress: {} as any,
        billingAddress: {} as any,
      });

      const orderAtom = meshService.getAtom(`marketplace-order-${order.id}`);
      expect(orderAtom).toBeDefined();
      expect(orderAtom?.type).toBe('ConceptNode');
      expect(orderAtom?.name).toContain('AMZ-67890');
    });

    it('should link order to connection', async () => {
      const order = await service.importOrder(connectionId, {
        marketplaceOrderId: 'AMZ-11111',
        customerId: 'customer-3',
        items: [],
        totalAmount: 50,
        currency: 'USD',
        shippingAddress: {} as any,
        billingAddress: {} as any,
      });

      const orderAtom = meshService.getAtom(`marketplace-order-${order.id}`);
      const outgoingLinks = meshService.getOutgoingLinks(orderAtom!.id);
      
      const connectionLink = outgoingLinks.find(
        link => link.outgoing.includes(`marketplace-connection-${connectionId}`),
      );
      expect(connectionLink).toBeDefined();
      expect(connectionLink?.type).toBe('MemberLink');
    });

    it('should update order status', async () => {
      const order = await service.importOrder(connectionId, {
        marketplaceOrderId: 'AMZ-22222',
        customerId: 'customer-4',
        items: [],
        totalAmount: 75,
        currency: 'USD',
        shippingAddress: {} as any,
        billingAddress: {} as any,
      });

      const updated = await service.updateOrderStatus(order.id, OrderStatus.Shipped);

      expect(updated.status).toBe(OrderStatus.Shipped);
      expect(updated.fulfilledAt).toBeInstanceOf(Date);
    });

    it('should get orders by marketplace', async () => {
      await service.importOrder(connectionId, {
        marketplaceOrderId: 'AMZ-33333',
        customerId: 'customer-5',
        items: [],
        totalAmount: 100,
        currency: 'USD',
        shippingAddress: {} as any,
        billingAddress: {} as any,
      });

      const orders = service.getOrdersByMarketplace(MarketplacePlatform.Amazon);
      expect(orders.length).toBeGreaterThanOrEqual(1);
    });

    it('should get orders by status', async () => {
      const order = await service.importOrder(connectionId, {
        marketplaceOrderId: 'AMZ-44444',
        customerId: 'customer-6',
        items: [],
        totalAmount: 150,
        currency: 'USD',
        shippingAddress: {} as any,
        billingAddress: {} as any,
      });

      await service.updateOrderStatus(order.id, OrderStatus.Processing);

      const processingOrders = service.getOrdersByStatus(OrderStatus.Processing);
      expect(processingOrders.length).toBeGreaterThanOrEqual(1);
      expect(processingOrders.some(o => o.id === order.id)).toBe(true);
    });

    it('should throw error when importing order with invalid connection', async () => {
      await expect(
        service.importOrder('invalid-connection', {
          marketplaceOrderId: 'ERROR',
          customerId: 'customer',
          items: [],
          totalAmount: 0,
          currency: 'USD',
          shippingAddress: {} as any,
          billingAddress: {} as any,
        }),
      ).rejects.toThrow('Connection not found');
    });
  });

  describe('Statistics and Monitoring', () => {
    it('should provide comprehensive statistics', async () => {
      // Create connections
      const amazonConnection = await service.connectMarketplace(
        MarketplacePlatform.Amazon,
        {apiKey: 'key1'},
      );
      await service.connectMarketplace(MarketplacePlatform.eBay, {apiKey: 'key2'});

      // Create listings
      await service.createListing('product-1', amazonConnection.id, {title: 'Product 1'});
      await service.createListing('product-2', amazonConnection.id, {title: 'Product 2'});

      // Create orders
      await service.importOrder(amazonConnection.id, {
        marketplaceOrderId: 'ORDER-1',
        customerId: 'customer-1',
        items: [],
        totalAmount: 100,
        currency: 'USD',
        shippingAddress: {} as any,
        billingAddress: {} as any,
      });

      // Create sync rules
      service.createInventorySyncRule('Rule 1', [MarketplacePlatform.Amazon]);

      const stats = service.getStats();

      expect(stats.connections.total).toBe(2);
      expect(stats.connections.active).toBe(2);
      expect(stats.listings.total).toBe(2);
      expect(stats.listings.active).toBe(2);
      expect(stats.orders.total).toBe(1);
      expect(stats.syncRules.total).toBe(1);
      expect(stats.syncRules.enabled).toBe(1);
      expect(stats.hypergraph.totalAtoms).toBeGreaterThan(0);
    });

    it('should count items by platform', async () => {
      const amazonConnection = await service.connectMarketplace(
        MarketplacePlatform.Amazon,
        {apiKey: 'key1'},
      );
      const ebayConnection = await service.connectMarketplace(
        MarketplacePlatform.eBay,
        {apiKey: 'key2'},
      );

      await service.createListing('product-1', amazonConnection.id, {title: 'Amazon 1'});
      await service.createListing('product-2', amazonConnection.id, {title: 'Amazon 2'});
      await service.createListing('product-3', ebayConnection.id, {title: 'eBay 1'});

      const stats = service.getStats();

      expect(stats.listings.byPlatform[MarketplacePlatform.Amazon]).toBe(2);
      expect(stats.listings.byPlatform[MarketplacePlatform.eBay]).toBe(1);
    });

    it('should count orders by status', async () => {
      const connection = await service.connectMarketplace(
        MarketplacePlatform.Amazon,
        {apiKey: 'key'},
      );

      const order1 = await service.importOrder(connection.id, {
        marketplaceOrderId: 'ORDER-1',
        customerId: 'customer-1',
        items: [],
        totalAmount: 100,
        currency: 'USD',
        shippingAddress: {} as any,
        billingAddress: {} as any,
      });

      const order2 = await service.importOrder(connection.id, {
        marketplaceOrderId: 'ORDER-2',
        customerId: 'customer-2',
        items: [],
        totalAmount: 200,
        currency: 'USD',
        shippingAddress: {} as any,
        billingAddress: {} as any,
      });

      await service.updateOrderStatus(order1.id, OrderStatus.Shipped);

      const stats = service.getStats();

      expect(stats.orders.byStatus[OrderStatus.Pending]).toBe(1);
      expect(stats.orders.byStatus[OrderStatus.Shipped]).toBe(1);
    });
  });
});
