/**
 * Example: Shopify Marketplace Connect Infrastructure
 * 
 * This example demonstrates the complete marketplace connect infrastructure
 * implemented as an adaptation of OpenCog atomspace. It shows all features
 * detailed in the help center including:
 * 
 * - Multi-marketplace connections (Amazon, eBay, Walmart, Target Plus)
 * - Product listing management
 * - Inventory synchronization
 * - Order management and fulfillment
 * - Statistics and monitoring
 */

import {pino} from 'pino';
import {
  OpenCogMeshQLService,
  MarketplaceConnectService,
  MarketplacePlatform,
  ConnectionStatus,
  ListingStatus,
  OrderStatus,
  NodeStatus,
} from '../index';

// Create logger
const logger = pino({level: 'info'});

// 1. Configure and create the mesh service
const meshConfig = {
  meshId: 'marketplace-connect-mesh',
  nodes: [
    {
      id: 'marketplace-node-1',
      endpoint: 'http://localhost:8001',
      status: NodeStatus.Active,
      capabilities: ['REASON', 'LEARN', 'PLAN'],
      lastHeartbeat: new Date(),
    },
    {
      id: 'marketplace-node-2',
      endpoint: 'http://localhost:8002',
      status: NodeStatus.Active,
      capabilities: ['REASON', 'EXECUTE'],
      lastHeartbeat: new Date(),
    },
  ],
  defaultTimeout: 5000,
  heartbeatIntervalMs: 1000,
};

const meshService = new OpenCogMeshQLService(meshConfig);

// 2. Create the Marketplace Connect service
const marketplaceService = new MarketplaceConnectService(
  meshService,
  {
    defaultSyncInterval: 30, // 30 minutes
    defaultInventoryBuffer: 10, // 10% safety buffer
    enableAutoSync: true,
    maxRetries: 3,
  },
  logger,
);

async function demonstrateMarketplaceConnect() {
  console.log('=== Shopify Marketplace Connect Infrastructure Demo ===\n');

  // ============================================================================
  // STEP 1: Connect to Marketplaces
  // ============================================================================
  console.log('1. Connecting to Marketplaces...');

  const amazonConnection = await marketplaceService.connectMarketplace(
    MarketplacePlatform.Amazon,
    {
      apiKey: 'amazon-api-key-123',
      secretKey: 'amazon-secret-key-456',
      merchantId: 'merchant-789',
    },
    {
      autoSync: true,
      syncIntervalMinutes: 30,
      inventoryBufferPercent: 10,
      priceAdjustmentPercent: 0,
    },
  );
  console.log(`   ✓ Connected to Amazon (ID: ${amazonConnection.id})`);

  const ebayConnection = await marketplaceService.connectMarketplace(
    MarketplacePlatform.eBay,
    {
      apiKey: 'ebay-api-key-123',
      token: 'ebay-token-456',
    },
    {
      autoSync: true,
      syncIntervalMinutes: 60,
      inventoryBufferPercent: 5,
    },
  );
  console.log(`   ✓ Connected to eBay (ID: ${ebayConnection.id})`);

  const walmartConnection = await marketplaceService.connectMarketplace(
    MarketplacePlatform.Walmart,
    {
      apiKey: 'walmart-api-key-123',
      secretKey: 'walmart-secret-key-456',
    },
  );
  console.log(`   ✓ Connected to Walmart (ID: ${walmartConnection.id})\n`);

  // ============================================================================
  // STEP 2: Create Product Listings
  // ============================================================================
  console.log('2. Creating Product Listings...');

  const amazonListing1 = await marketplaceService.createListing(
    'shopify-product-12345',
    amazonConnection.id,
    {
      title: 'Premium Wireless Headphones',
      description: 'High-quality wireless headphones with noise cancellation',
      price: 149.99,
      inventoryQuantity: 100,
      sku: 'WH-PREMIUM-001',
      category: 'Electronics > Audio',
      images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
      attributes: {
        color: 'Black',
        brand: 'TechAudio',
        model: 'TA-WH-2024',
      },
    },
  );
  console.log(`   ✓ Created Amazon listing: ${amazonListing1.title}`);

  const ebayListing1 = await marketplaceService.createListing(
    'shopify-product-12345',
    ebayConnection.id,
    {
      title: 'Premium Wireless Headphones - Brand New',
      description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life',
      price: 154.99,
      inventoryQuantity: 100,
      sku: 'WH-PREMIUM-001',
      category: 'Consumer Electronics > Portable Audio',
      images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
      attributes: {
        color: 'Black',
        brand: 'TechAudio',
        condition: 'New',
      },
    },
  );
  console.log(`   ✓ Created eBay listing: ${ebayListing1.title}`);

  const amazonListing2 = await marketplaceService.createListing(
    'shopify-product-67890',
    amazonConnection.id,
    {
      title: 'Organic Cotton T-Shirt',
      description: 'Comfortable and eco-friendly organic cotton t-shirt',
      price: 29.99,
      inventoryQuantity: 500,
      sku: 'SHIRT-ORGANIC-M-BLK',
      category: 'Clothing > Mens > Shirts',
      images: ['https://example.com/shirt1.jpg'],
      attributes: {
        size: 'Medium',
        color: 'Black',
        material: '100% Organic Cotton',
      },
    },
  );
  console.log(`   ✓ Created Amazon listing: ${amazonListing2.title}\n`);

  // ============================================================================
  // STEP 3: Configure Inventory Synchronization
  // ============================================================================
  console.log('3. Configuring Inventory Sync Rules...');

  const syncRule1 = marketplaceService.createInventorySyncRule(
    'All Marketplaces - Realtime',
    [MarketplacePlatform.Amazon, MarketplacePlatform.eBay, MarketplacePlatform.Walmart],
    {
      syncMode: 'realtime',
      buffer: 10,
      enabled: true,
    },
  );
  console.log(`   ✓ Created sync rule: ${syncRule1.name}`);

  const syncRule2 = marketplaceService.createInventorySyncRule(
    'Scheduled Sync - High Volume Products',
    [MarketplacePlatform.Amazon, MarketplacePlatform.eBay],
    {
      syncMode: 'scheduled',
      buffer: 5,
      enabled: true,
    },
  );
  console.log(`   ✓ Created sync rule: ${syncRule2.name}\n`);

  // ============================================================================
  // STEP 4: Synchronize Inventory
  // ============================================================================
  console.log('4. Synchronizing Inventory...');

  console.log('   - Updating inventory for Wireless Headphones to 150 units');
  await marketplaceService.syncInventory('shopify-product-12345', 150);
  console.log('   ✓ Inventory synced across all marketplaces (with buffers applied)');

  const headphoneListings = marketplaceService.getListingsByProduct('shopify-product-12345');
  for (const listing of headphoneListings) {
    console.log(
      `     - ${listing.platform}: ${listing.inventoryQuantity} units (${listing.status})`,
    );
  }
  console.log('');

  // ============================================================================
  // STEP 5: Import and Manage Orders
  // ============================================================================
  console.log('5. Managing Marketplace Orders...');

  const order1 = await marketplaceService.importOrder(amazonConnection.id, {
    marketplaceOrderId: 'AMZ-111-2222222-3333333',
    customerId: 'amazon-customer-12345',
    items: [
      {
        id: 'item-1',
        listingId: amazonListing1.id,
        productId: 'shopify-product-12345',
        sku: 'WH-PREMIUM-001',
        quantity: 2,
        price: 149.99,
        title: 'Premium Wireless Headphones',
      },
    ],
    totalAmount: 299.98,
    currency: 'USD',
    shippingAddress: {
      name: 'John Smith',
      address1: '123 Main Street',
      address2: 'Apt 4B',
      city: 'New York',
      province: 'NY',
      country: 'US',
      zip: '10001',
      phone: '+1-555-0123',
    },
    billingAddress: {
      name: 'John Smith',
      address1: '123 Main Street',
      address2: 'Apt 4B',
      city: 'New York',
      province: 'NY',
      country: 'US',
      zip: '10001',
    },
  });
  console.log(`   ✓ Imported Amazon order: ${order1.marketplaceOrderId}`);
  console.log(`     - Status: ${order1.status}`);
  console.log(`     - Total: $${order1.totalAmount}`);
  console.log(`     - Items: ${order1.items.length}`);

  const order2 = await marketplaceService.importOrder(ebayConnection.id, {
    marketplaceOrderId: 'EBAY-44-55555555-666666',
    customerId: 'ebay-user-98765',
    items: [
      {
        id: 'item-2',
        listingId: ebayListing1.id,
        productId: 'shopify-product-12345',
        sku: 'WH-PREMIUM-001',
        quantity: 1,
        price: 154.99,
        title: 'Premium Wireless Headphones - Brand New',
      },
    ],
    totalAmount: 154.99,
    currency: 'USD',
    shippingAddress: {
      name: 'Sarah Johnson',
      address1: '456 Oak Avenue',
      city: 'Los Angeles',
      province: 'CA',
      country: 'US',
      zip: '90001',
    },
    billingAddress: {
      name: 'Sarah Johnson',
      address1: '456 Oak Avenue',
      city: 'Los Angeles',
      province: 'CA',
      country: 'US',
      zip: '90001',
    },
  });
  console.log(`   ✓ Imported eBay order: ${order2.marketplaceOrderId}\n`);

  // ============================================================================
  // STEP 6: Update Order Status
  // ============================================================================
  console.log('6. Processing Orders...');

  await marketplaceService.updateOrderStatus(order1.id, OrderStatus.Processing);
  console.log(`   ✓ Order ${order1.marketplaceOrderId} -> Processing`);

  await marketplaceService.updateOrderStatus(order1.id, OrderStatus.Shipped);
  console.log(`   ✓ Order ${order1.marketplaceOrderId} -> Shipped`);

  await marketplaceService.updateOrderStatus(order2.id, OrderStatus.Processing);
  console.log(`   ✓ Order ${order2.marketplaceOrderId} -> Processing\n`);

  // ============================================================================
  // STEP 7: Statistics and Monitoring
  // ============================================================================
  console.log('7. Marketplace Connect Statistics:');

  const stats = marketplaceService.getStats();

  console.log('\n   Connections:');
  console.log(`     - Total: ${stats.connections.total}`);
  console.log(`     - Active: ${stats.connections.active}`);
  console.log('     - By Platform:');
  for (const [platform, count] of Object.entries(stats.connections.byPlatform)) {
    console.log(`       • ${platform}: ${count}`);
  }

  console.log('\n   Product Listings:');
  console.log(`     - Total: ${stats.listings.total}`);
  console.log(`     - Active: ${stats.listings.active}`);
  console.log('     - By Platform:');
  for (const [platform, count] of Object.entries(stats.listings.byPlatform)) {
    console.log(`       • ${platform}: ${count}`);
  }

  console.log('\n   Orders:');
  console.log(`     - Total: ${stats.orders.total}`);
  console.log('     - By Status:');
  for (const [status, count] of Object.entries(stats.orders.byStatus)) {
    console.log(`       • ${status}: ${count}`);
  }
  console.log('     - By Platform:');
  for (const [platform, count] of Object.entries(stats.orders.byPlatform)) {
    console.log(`       • ${platform}: ${count}`);
  }

  console.log('\n   Inventory Sync Rules:');
  console.log(`     - Total: ${stats.syncRules.total}`);
  console.log(`     - Enabled: ${stats.syncRules.enabled}`);

  console.log('\n   OpenCog HyperGraph:');
  console.log(`     - Total Atoms: ${stats.hypergraph.totalAtoms}`);
  console.log(`     - Total Links: ${stats.hypergraph.totalLinks}`);

  // ============================================================================
  // STEP 8: Query Operations
  // ============================================================================
  console.log('\n8. Querying Marketplace Data:');

  const allConnections = marketplaceService.getConnections();
  console.log(`\n   Active Connections: ${allConnections.length}`);
  for (const conn of allConnections) {
    console.log(`     - ${conn.platform}: ${conn.status}`);
  }

  const allListings = marketplaceService.getListings();
  console.log(`\n   All Listings: ${allListings.length}`);

  const amazonListings = marketplaceService.getListingsByMarketplace(MarketplacePlatform.Amazon);
  console.log(`   Amazon Listings: ${amazonListings.length}`);

  const ebayListings = marketplaceService.getListingsByMarketplace(MarketplacePlatform.eBay);
  console.log(`   eBay Listings: ${ebayListings.length}`);

  const pendingOrders = marketplaceService.getOrdersByStatus(OrderStatus.Pending);
  console.log(`\n   Pending Orders: ${pendingOrders.length}`);

  const processingOrders = marketplaceService.getOrdersByStatus(OrderStatus.Processing);
  console.log(`   Processing Orders: ${processingOrders.length}`);

  const shippedOrders = marketplaceService.getOrdersByStatus(OrderStatus.Shipped);
  console.log(`   Shipped Orders: ${shippedOrders.length}`);

  console.log('\n=== Demo Complete ===');
  console.log('\nKey Features Demonstrated:');
  console.log('✓ Multi-marketplace connection management');
  console.log('✓ Product listing creation and synchronization');
  console.log('✓ Inventory sync with configurable buffers');
  console.log('✓ Order import and status management');
  console.log('✓ Comprehensive statistics and monitoring');
  console.log('✓ OpenCog atomspace integration with hypergraph');
  console.log('\nAll features from the help center at:');
  console.log('https://www.shopifymarketplaceconnecthelp.com/hc/en-us');
  console.log('are now implemented as OpenCog services! 🎉');
}

// Run the demonstration
demonstrateMarketplaceConnect().catch((error) => {
  console.error('Error running demonstration:', error);
  process.exit(1);
});
