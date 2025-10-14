# Shopify Marketplace Connect Infrastructure

Complete implementation of the Shopify Marketplace Connect infrastructure as an adaptation of OpenCog atomspace, with all features detailed in the help center at https://www.shopifymarketplaceconnecthelp.com/hc/en-us.

## Overview

The `MarketplaceConnectService` provides a comprehensive marketplace integration solution using OpenCog's distributed cognitive architecture. It enables seamless connection to multiple marketplace platforms, product listing management, inventory synchronization, and order fulfillment—all represented as atoms and links in the hypergraph.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  OpenCog Atomspace/HyperGraph               │
│                                                             │
│  Root: ShopifyMarketplaceConnect                           │
│    │                                                        │
│    ├─── Platform: Amazon                                   │
│    │      ├─── Connection: Amazon-1                        │
│    │      │      ├─── Listing: Product A                   │
│    │      │      │      └─── Product: Shopify-123          │
│    │      │      └─── Order: AMZ-111-222                   │
│    │      │                                                 │
│    ├─── Platform: eBay                                     │
│    │      ├─── Connection: eBay-1                          │
│    │      │      ├─── Listing: Product A (eBay)            │
│    │      │      │      └─── Product: Shopify-123          │
│    │      │      └─── Order: EBAY-44-555                   │
│    │      │                                                 │
│    ├─── Platform: Walmart                                  │
│    │      └─── Connection: Walmart-1                       │
│    │             └─── Listing: Product B                   │
│    │                                                        │
│    └─── Platform: Target Plus                             │
│           └─── Connection: TargetPlus-1                    │
│                  └─── Listing: Product C                   │
│                                                             │
│  Inventory Sync Rules                                      │
│    ├─── Rule: All Marketplaces Realtime                   │
│    └─── Rule: Scheduled High Volume                       │
└─────────────────────────────────────────────────────────────┘
```

## Core Features

### 1. Multi-Marketplace Connection Management

Connect to and manage multiple marketplace platforms simultaneously:

- **Amazon** - Full marketplace integration
- **eBay** - Complete listing and order management
- **Walmart** - Product and inventory sync
- **Target Plus** - Marketplace API integration

**Features:**
- Secure credential management
- Connection status monitoring
- Auto-sync configuration
- Platform-specific settings

### 2. Product Listing Management

Create, update, and synchronize product listings across marketplaces:

- Cross-platform listing creation
- Automated sync between Shopify and marketplaces
- Price adjustment rules
- Inventory buffer management
- Product attribute mapping
- Image and description synchronization

### 3. Inventory Synchronization

Real-time and scheduled inventory sync with safety buffers:

- **Sync Modes:**
  - Realtime - Immediate sync on inventory changes
  - Scheduled - Periodic sync at configurable intervals
  - Manual - On-demand sync

- **Safety Features:**
  - Configurable inventory buffers (prevent overselling)
  - Platform-specific buffer percentages
  - Automatic adjustment based on sync rules

### 4. Order Management

Comprehensive order processing and fulfillment:

- Import orders from marketplaces
- Order status tracking (Pending → Processing → Shipped → Delivered)
- Automated inventory deduction
- Multi-item order support
- Address and customer information management
- Order fulfillment workflow

### 5. Statistics and Monitoring

Real-time monitoring and analytics:

- Connection health monitoring
- Listing status tracking
- Order metrics by status and platform
- Inventory sync rule status
- HyperGraph statistics (atoms and links)

## Quick Start

### Basic Setup

```typescript
import {
  OpenCogMeshQLService,
  MarketplaceConnectService,
  MarketplacePlatform,
  NodeStatus,
} from '~/lib/opencog-meshql';
import {logger} from '~/utils/logger.server';

// 1. Create mesh service
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

// 2. Create marketplace connect service
const marketplace = new MarketplaceConnectService(
  meshService,
  {
    defaultSyncInterval: 30,      // 30 minutes
    defaultInventoryBuffer: 10,   // 10% buffer
    enableAutoSync: true,
    maxRetries: 3,
  },
  logger,
);
```

### Connect to Marketplaces

```typescript
// Connect to Amazon
const amazonConnection = await marketplace.connectMarketplace(
  MarketplacePlatform.Amazon,
  {
    apiKey: 'your-amazon-api-key',
    secretKey: 'your-amazon-secret',
    merchantId: 'your-merchant-id',
  },
  {
    autoSync: true,
    syncIntervalMinutes: 30,
    inventoryBufferPercent: 10,
    priceAdjustmentPercent: 0,
  },
);

// Connect to eBay
const ebayConnection = await marketplace.connectMarketplace(
  MarketplacePlatform.eBay,
  {
    apiKey: 'your-ebay-api-key',
    token: 'your-ebay-token',
  },
);
```

### Create Product Listings

```typescript
// Create listing on Amazon
const listing = await marketplace.createListing(
  'shopify-product-123',  // Shopify product ID
  amazonConnection.id,
  {
    title: 'Premium Wireless Headphones',
    description: 'High-quality wireless headphones with noise cancellation',
    price: 149.99,
    inventoryQuantity: 100,
    sku: 'WH-PREMIUM-001',
    category: 'Electronics > Audio',
    images: [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
    ],
    attributes: {
      color: 'Black',
      brand: 'TechAudio',
      model: 'TA-WH-2024',
    },
  },
);
```

### Configure Inventory Sync

```typescript
// Create sync rule for realtime inventory updates
const syncRule = marketplace.createInventorySyncRule(
  'All Marketplaces - Realtime',
  [
    MarketplacePlatform.Amazon,
    MarketplacePlatform.eBay,
    MarketplacePlatform.Walmart,
  ],
  {
    syncMode: 'realtime',
    buffer: 10,  // 10% safety buffer
    enabled: true,
  },
);

// Sync inventory across all marketplaces
await marketplace.syncInventory('shopify-product-123', 150);
```

### Import and Manage Orders

```typescript
// Import order from Amazon
const order = await marketplace.importOrder(
  amazonConnection.id,
  {
    marketplaceOrderId: 'AMZ-111-2222222-3333333',
    customerId: 'amazon-customer-12345',
    items: [
      {
        id: 'item-1',
        listingId: listing.id,
        productId: 'shopify-product-123',
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
      city: 'New York',
      province: 'NY',
      country: 'US',
      zip: '10001',
    },
    billingAddress: {
      name: 'John Smith',
      address1: '123 Main Street',
      city: 'New York',
      province: 'NY',
      country: 'US',
      zip: '10001',
    },
  },
);

// Update order status
await marketplace.updateOrderStatus(order.id, OrderStatus.Processing);
await marketplace.updateOrderStatus(order.id, OrderStatus.Shipped);
await marketplace.updateOrderStatus(order.id, OrderStatus.Delivered);
```

### Query and Monitor

```typescript
// Get all connections
const connections = marketplace.getConnections();

// Get listings for a specific product
const productListings = marketplace.getListingsByProduct('shopify-product-123');

// Get listings for a specific marketplace
const amazonListings = marketplace.getListingsByMarketplace(MarketplacePlatform.Amazon);

// Get orders by status
const pendingOrders = marketplace.getOrdersByStatus(OrderStatus.Pending);
const shippedOrders = marketplace.getOrdersByStatus(OrderStatus.Shipped);

// Get comprehensive statistics
const stats = marketplace.getStats();
console.log('Connections:', stats.connections);
console.log('Listings:', stats.listings);
console.log('Orders:', stats.orders);
console.log('Sync Rules:', stats.syncRules);
console.log('HyperGraph:', stats.hypergraph);
```

## API Reference

### MarketplaceConnectService

#### Constructor

```typescript
constructor(
  meshService: OpenCogMeshQLService,
  config: MarketplaceConnectConfig,
  logger: Logger,
)
```

#### Configuration

```typescript
interface MarketplaceConnectConfig {
  meshServiceId?: string;
  defaultSyncInterval: number;      // minutes
  defaultInventoryBuffer: number;   // percentage
  enableAutoSync: boolean;
  maxRetries: number;
}
```

#### Methods

**Connection Management:**

- `connectMarketplace(platform, credentials, settings?)` - Connect to a marketplace
- `disconnectMarketplace(connectionId)` - Disconnect from a marketplace
- `getConnections()` - Get all active connections
- `getConnection(connectionId)` - Get connection by ID

**Listing Management:**

- `createListing(shopifyProductId, connectionId, listingData)` - Create a new listing
- `updateListing(listingId, updates)` - Update an existing listing
- `deleteListing(listingId)` - Delete a listing
- `getListings()` - Get all listings
- `getListingsByProduct(shopifyProductId)` - Get listings for a product
- `getListingsByMarketplace(platform)` - Get listings for a marketplace

**Inventory Sync:**

- `createInventorySyncRule(name, marketplaces, options?)` - Create sync rule
- `syncInventory(shopifyProductId, quantity)` - Sync inventory across marketplaces
- `getSyncRules()` - Get all sync rules

**Order Management:**

- `importOrder(connectionId, orderData)` - Import order from marketplace
- `updateOrderStatus(orderId, status)` - Update order status
- `getOrders()` - Get all orders
- `getOrdersByMarketplace(platform)` - Get orders for a marketplace
- `getOrdersByStatus(status)` - Get orders by status

**Monitoring:**

- `getStats()` - Get comprehensive statistics

### Enums

```typescript
enum MarketplacePlatform {
  Amazon = 'AMAZON',
  eBay = 'EBAY',
  Walmart = 'WALMART',
  TargetPlus = 'TARGET_PLUS',
}

enum ConnectionStatus {
  Connected = 'CONNECTED',
  Disconnected = 'DISCONNECTED',
  Authenticating = 'AUTHENTICATING',
  Error = 'ERROR',
}

enum ListingStatus {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE',
  PendingSync = 'PENDING_SYNC',
  Error = 'ERROR',
}

enum OrderStatus {
  Pending = 'PENDING',
  Processing = 'PROCESSING',
  Shipped = 'SHIPPED',
  Delivered = 'DELIVERED',
  Cancelled = 'CANCELLED',
}
```

## OpenCog Integration

### Atoms and Links

The marketplace infrastructure uses the OpenCog atomspace to represent all entities:

**Atoms:**
- `ConceptNode` for platforms, connections, listings, products, orders, and sync rules
- Each atom has `truthValue` (strength, confidence) for probabilistic reasoning
- Each atom has `attentionValue` (STI, LTI, VLTI) for attention allocation

**Links:**
- `InheritanceLink` - Links platforms to root concept
- `MemberLink` - Links connections to platforms, listings to connections, orders to connections
- `EvaluationLink` - Links listings to Shopify products

### HyperGraph Structure

All marketplace data is stored in a distributed hypergraph, enabling:
- Fast traversal and relationship queries
- Distributed reasoning across mesh nodes
- Graph-based analytics and insights
- Semantic relationship modeling

## Integration Examples

### Remix Loader Integration

```typescript
// app/routes/admin.marketplaces.tsx
import type {LoaderFunctionArgs} from '@remix-run/node';
import {json} from '@remix-run/node';
import {marketplaceService} from '~/services/marketplace.server';

export async function loader({request}: LoaderFunctionArgs) {
  const connections = marketplaceService.getConnections();
  const stats = marketplaceService.getStats();
  
  return json({
    connections,
    stats,
  });
}
```

### Background Sync Job

```typescript
// app/jobs/inventory-sync.ts
import {marketplaceService} from '~/services/marketplace.server';

export async function syncInventoryJob(productId: string, quantity: number) {
  try {
    await marketplaceService.syncInventory(productId, quantity);
    console.log(`Synced inventory for ${productId}: ${quantity} units`);
  } catch (error) {
    console.error('Inventory sync failed:', error);
    throw error;
  }
}
```

### Webhook Handler

```typescript
// app/routes/webhooks.marketplace-orders.tsx
import type {ActionFunctionArgs} from '@remix-run/node';
import {marketplaceService} from '~/services/marketplace.server';

export async function action({request}: ActionFunctionArgs) {
  const orderData = await request.json();
  
  const order = await marketplaceService.importOrder(
    orderData.connectionId,
    orderData,
  );
  
  return json({success: true, orderId: order.id});
}
```

## Best Practices

### 1. Connection Management

- Store credentials securely (use environment variables)
- Monitor connection health regularly
- Implement automatic reconnection on failure
- Use appropriate sync intervals for each marketplace

### 2. Inventory Safety

- Always configure inventory buffers (5-10% recommended)
- Use realtime sync for high-value products
- Use scheduled sync for high-volume products
- Test sync rules before enabling in production

### 3. Order Processing

- Import orders immediately when received
- Update status as soon as fulfillment occurs
- Implement error handling and retry logic
- Log all order status changes

### 4. Performance

- Use connection pooling for API calls
- Cache frequently accessed data
- Batch operations when possible
- Monitor hypergraph size and optimize regularly

### 5. Error Handling

- Implement comprehensive error logging
- Use retry policies for transient failures
- Provide clear error messages to users
- Monitor error rates and alert on anomalies

## Testing

Run tests with:

```bash
npm test app/lib/opencog-meshql/tests/MarketplaceConnectService.test.ts
```

The test suite includes:
- Connection management tests
- Listing creation and updates
- Inventory sync with buffers
- Order import and status updates
- Statistics and monitoring
- HyperGraph integration verification

## Support

For help with the Shopify Marketplace Connect infrastructure:

1. Review the official help center: https://www.shopifymarketplaceconnecthelp.com/hc/en-us
2. Check the OpenCog documentation: `OPENCOG_MESHQL_IMPLEMENTATION.md`
3. See example code: `examples/marketplace-connect-demo.ts`
4. Review test cases: `tests/MarketplaceConnectService.test.ts`

## License

This implementation is part of the Shopify Subscriptions app and follows the same license.
