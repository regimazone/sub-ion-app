# Marketplace Connect - Quick Start Guide

Get started with the Shopify Marketplace Connect infrastructure in 5 minutes.

## Installation

The marketplace connect infrastructure is already included in the OpenCog meshQL module. No additional dependencies required.

## Basic Setup (3 Steps)

### Step 1: Import and Initialize

```typescript
import {
  OpenCogMeshQLService,
  MarketplaceConnectService,
  MarketplacePlatform,
  NodeStatus,
} from '~/lib/opencog-meshql';
import {logger} from '~/utils/logger.server';

// Create mesh service
const meshService = new OpenCogMeshQLService({
  meshId: 'marketplace-mesh',
  nodes: [{
    id: 'node-1',
    endpoint: 'http://localhost:8001',
    status: NodeStatus.Active,
    capabilities: ['REASON', 'LEARN'],
    lastHeartbeat: new Date(),
  }],
  defaultTimeout: 5000,
  heartbeatIntervalMs: 1000,
});

// Create marketplace service
const marketplace = new MarketplaceConnectService(
  meshService,
  {
    defaultSyncInterval: 30,
    defaultInventoryBuffer: 10,
    enableAutoSync: true,
    maxRetries: 3,
  },
  logger,
);
```

### Step 2: Connect to a Marketplace

```typescript
const amazonConnection = await marketplace.connectMarketplace(
  MarketplacePlatform.Amazon,
  {
    apiKey: process.env.AMAZON_API_KEY,
    secretKey: process.env.AMAZON_SECRET_KEY,
    merchantId: process.env.AMAZON_MERCHANT_ID,
  },
  {
    autoSync: true,
    syncIntervalMinutes: 30,
    inventoryBufferPercent: 10,
  },
);

console.log('Connected to Amazon!', amazonConnection.id);
```

### Step 3: Create a Product Listing

```typescript
const listing = await marketplace.createListing(
  'shopify-product-123',  // Your Shopify product ID
  amazonConnection.id,
  {
    title: 'Premium Wireless Headphones',
    description: 'High-quality wireless headphones with noise cancellation',
    price: 149.99,
    inventoryQuantity: 100,
    sku: 'WH-PREMIUM-001',
    category: 'Electronics > Audio',
    images: ['https://example.com/image1.jpg'],
    attributes: {
      color: 'Black',
      brand: 'TechAudio',
    },
  },
);

console.log('Listing created!', listing.id);
```

## Common Tasks

### Sync Inventory Across All Marketplaces

```typescript
await marketplace.syncInventory('shopify-product-123', 150);
```

### Import an Order

```typescript
const order = await marketplace.importOrder(amazonConnection.id, {
  marketplaceOrderId: 'AMZ-111-2222222',
  customerId: 'customer-123',
  items: [{
    id: 'item-1',
    listingId: listing.id,
    productId: 'shopify-product-123',
    sku: 'WH-PREMIUM-001',
    quantity: 2,
    price: 149.99,
    title: 'Premium Wireless Headphones',
  }],
  totalAmount: 299.98,
  currency: 'USD',
  shippingAddress: {
    name: 'John Smith',
    address1: '123 Main St',
    city: 'New York',
    province: 'NY',
    country: 'US',
    zip: '10001',
  },
  billingAddress: {
    name: 'John Smith',
    address1: '123 Main St',
    city: 'New York',
    province: 'NY',
    country: 'US',
    zip: '10001',
  },
});
```

### Update Order Status

```typescript
await marketplace.updateOrderStatus(order.id, OrderStatus.Processing);
await marketplace.updateOrderStatus(order.id, OrderStatus.Shipped);
```

### Get Statistics

```typescript
const stats = marketplace.getStats();
console.log('Active connections:', stats.connections.active);
console.log('Total listings:', stats.listings.total);
console.log('Pending orders:', stats.orders.byStatus.PENDING);
```

## Supported Marketplaces

- ✅ Amazon
- ✅ eBay
- ✅ Walmart
- ✅ Target Plus

## Key Features

1. **Multi-Marketplace Management** - Connect to multiple marketplaces simultaneously
2. **Automated Sync** - Real-time and scheduled inventory synchronization
3. **Safety Buffers** - Prevent overselling with configurable inventory buffers
4. **Order Tracking** - Complete order lifecycle management
5. **OpenCog Integration** - Full atomspace representation for advanced reasoning

## Next Steps

- 📚 Read the [Complete Guide](MARKETPLACE_CONNECT_GUIDE.md) for detailed information
- 📋 Review [Implementation Summary](IMPLEMENTATION_SUMMARY.md) for feature mapping
- 💻 Run the [Demo Script](examples/marketplace-connect-demo.ts) to see it in action
- 🧪 Check the [Tests](tests/MarketplaceConnectService.test.ts) for usage examples

## Help & Support

- **Help Center:** https://www.shopifymarketplaceconnecthelp.com/hc/en-us
- **OpenCog Docs:** [OPENCOG_MESHQL_IMPLEMENTATION.md](../../OPENCOG_MESHQL_IMPLEMENTATION.md)
- **API Reference:** See [MARKETPLACE_CONNECT_GUIDE.md](MARKETPLACE_CONNECT_GUIDE.md)

## Example: Complete Workflow

```typescript
// 1. Connect to marketplace
const connection = await marketplace.connectMarketplace(
  MarketplacePlatform.Amazon,
  credentials,
  {autoSync: true}
);

// 2. Create listing
const listing = await marketplace.createListing(
  productId,
  connection.id,
  listingData
);

// 3. Configure inventory sync
const syncRule = marketplace.createInventorySyncRule(
  'Realtime Sync',
  [MarketplacePlatform.Amazon],
  {syncMode: 'realtime', buffer: 10}
);

// 4. Sync inventory
await marketplace.syncInventory(productId, 100);

// 5. Import order
const order = await marketplace.importOrder(
  connection.id,
  orderData
);

// 6. Process order
await marketplace.updateOrderStatus(order.id, OrderStatus.Processing);
await marketplace.updateOrderStatus(order.id, OrderStatus.Shipped);

// 7. Monitor
const stats = marketplace.getStats();
console.log('Everything is running!', stats);
```

That's it! You're now ready to manage marketplace integrations with OpenCog. 🎉
