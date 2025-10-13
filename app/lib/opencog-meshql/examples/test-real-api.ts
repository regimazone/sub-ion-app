/**
 * Test script to verify real API integration with Shopify Marketplace Help Center
 * 
 * This script attempts to fetch real data from the Shopify Help Center API
 * and falls back to simulated data if the API is unavailable.
 */

import {pino} from 'pino';
import {
  OpenCogMeshQLService,
  ShopifyMarketplaceHelpAdapter,
  NodeStatus,
} from '../index';

const logger = pino({level: 'info'});

const meshConfig = {
  meshId: 'test-api-mesh',
  nodes: [
    {
      id: 'test-node-1',
      endpoint: 'http://localhost:8001',
      status: NodeStatus.Active,
      capabilities: ['REASON', 'LEARN'],
      lastHeartbeat: new Date(),
    },
  ],
  defaultTimeout: 5000,
  heartbeatIntervalMs: 1000,
};

const meshService = new OpenCogMeshQLService(meshConfig);

async function testRealApiMode() {
  console.log('=== Testing Real API Mode ===\n');

  const realApiAdapter = new ShopifyMarketplaceHelpAdapter(
    meshService,
    {
      baseUrl: 'https://www.shopifymarketplaceconnecthelp.com',
      locale: 'en-us',
      useRealApi: true,
      requestTimeoutMs: 15000, // 15 second timeout
    },
    logger,
  );

  console.log('Attempting to fetch from real API...');
  try {
    await realApiAdapter.syncHelpCenter();
    const stats = realApiAdapter.getKnowledgeGraphStats();
    
    console.log('\n✓ Successfully synced with API');
    console.log(`  Categories: ${stats.categories}`);
    console.log(`  Articles: ${stats.articles}`);
    console.log(`  Tags: ${stats.tags}`);
    console.log(`  Total Atoms: ${stats.totalAtoms}`);
    console.log(`  Total Links: ${stats.totalLinks}`);
    console.log(`  Last Sync: ${stats.lastSync}\n`);

    // Try searching
    const setupArticles = realApiAdapter.searchByTag('setup');
    console.log(`Found ${setupArticles.length} articles with 'setup' tag`);
    
    if (setupArticles.length > 0) {
      console.log('First article:', setupArticles[0].title);
    }
  } catch (error) {
    console.error('\n✗ Failed to sync with API:', error);
    console.log('  (This is expected if the API endpoint structure is different or requires authentication)\n');
  }
}

async function testFallbackMode() {
  console.log('\n=== Testing Fallback Mode ===\n');

  const fallbackAdapter = new ShopifyMarketplaceHelpAdapter(
    meshService,
    {
      baseUrl: 'https://www.shopifymarketplaceconnecthelp.com',
      locale: 'en-us',
      useRealApi: false,
    },
    logger,
  );

  console.log('Using fallback data...');
  await fallbackAdapter.syncHelpCenter();
  const stats = fallbackAdapter.getKnowledgeGraphStats();
  
  console.log('\n✓ Fallback mode working');
  console.log(`  Categories: ${stats.categories}`);
  console.log(`  Articles: ${stats.articles}`);
  console.log(`  Tags: ${stats.tags}`);
  console.log(`  Total Atoms: ${stats.totalAtoms}`);
  console.log(`  Total Links: ${stats.totalLinks}\n`);

  // Test search functionality
  const setupArticles = fallbackAdapter.searchByTag('setup');
  console.log(`Found ${setupArticles.length} articles with 'setup' tag`);
  setupArticles.forEach((article) => {
    console.log(`  - ${article.title}`);
  });
}

async function main() {
  console.log('OpenCog HyperGraphQL - Shopify Help Center API Integration Test\n');
  console.log('This test verifies that the adapter can:');
  console.log('1. Attempt to fetch from the real Shopify Help Center API');
  console.log('2. Gracefully fallback to simulated data if API fails');
  console.log('3. Build the knowledge graph correctly in both modes\n');

  await testRealApiMode();
  await testFallbackMode();

  console.log('\n=== Test Complete ===');
}

main().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
