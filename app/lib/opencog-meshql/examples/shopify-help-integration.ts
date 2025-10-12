/**
 * Example: Shopify Marketplace Connect Help Integration
 * 
 * This example demonstrates how to integrate the Shopify Marketplace Connect
 * Help Center with the OpenCog HyperGraph knowledge base for intelligent
 * help article discovery and recommendations.
 */

import {pino} from 'pino';
import {
  OpenCogMeshQLService,
  ShopifyMarketplaceHelpAdapter,
  NodeStatus,
} from '../index';

// Create logger
const logger = pino({level: 'info'});

// 1. Configure and create the mesh service
const meshConfig = {
  meshId: 'help-knowledge-mesh',
  nodes: [
    {
      id: 'knowledge-node-1',
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

// 2. Create the Shopify Marketplace Help adapter
const helpAdapter = new ShopifyMarketplaceHelpAdapter(
  meshService,
  {
    baseUrl: 'https://www.shopifymarketplaceconnecthelp.com',
    locale: 'en-us',
    autoFetch: false, // We'll manually sync
    cacheDurationMs: 3600000, // 1 hour
  },
  logger,
);

async function demonstrateHelpIntegration() {
  console.log('=== Shopify Marketplace Connect Help Integration Demo ===\n');

  // 3. Sync help center content into the knowledge graph
  console.log('1. Syncing help center content...');
  await helpAdapter.syncHelpCenter();
  console.log('   ✓ Help center synced\n');

  // 4. Get knowledge graph statistics
  console.log('2. Knowledge Graph Statistics:');
  const stats = helpAdapter.getKnowledgeGraphStats();
  console.log(`   - Total Atoms: ${stats.totalAtoms}`);
  console.log(`   - Total Links: ${stats.totalLinks}`);
  console.log(`   - Categories: ${stats.categories}`);
  console.log(`   - Articles: ${stats.articles}`);
  console.log(`   - Tags: ${stats.tags}`);
  console.log(`   - Last Sync: ${stats.lastSync}\n`);

  // 5. Search for articles by tag
  console.log('3. Searching articles by tag "setup":');
  const setupArticles = helpAdapter.searchByTag('setup');
  setupArticles.forEach((article) => {
    console.log(`   - ${article.title}`);
    console.log(`     URL: ${article.url}`);
    console.log(`     Tags: ${article.tags.join(', ')}`);
  });
  console.log('');

  // 6. Search by keyword
  console.log('4. Searching articles by keyword "inventory":');
  const inventoryArticles = helpAdapter.searchByKeyword('inventory');
  inventoryArticles.forEach((article) => {
    console.log(`   - ${article.title}`);
    console.log(`     ${article.content.substring(0, 80)}...`);
  });
  console.log('');

  // 7. Get articles by category
  console.log('5. Getting articles in category "category-products":');
  const productArticles = helpAdapter.getArticlesByCategory('category-products');
  productArticles.forEach((article) => {
    console.log(`   - ${article.title}`);
  });
  console.log('');

  // 8. Get recommended articles based on context
  console.log('6. Getting recommended articles for "order fulfillment issues":');
  const recommended = helpAdapter.getRecommendedArticles(
    'order fulfillment issues',
  );
  recommended.forEach((article, index) => {
    console.log(`   ${index + 1}. ${article.title}`);
    console.log(`      Category: ${article.categoryId}`);
    console.log(`      Tags: ${article.tags.join(', ')}`);
  });
  console.log('');

  // 9. Demonstrate hypergraph traversal for related articles
  console.log('7. Traversing knowledge graph from a tag:');
  const tagAtom = meshService.getAtom('help-tag-setup');
  if (tagAtom) {
    console.log(`   Starting from tag: ${tagAtom.name}`);
    const incomingLinks = meshService.getIncomingLinks(tagAtom.id);
    console.log(`   Found ${incomingLinks.length} articles with this tag`);
    
    // Show first few articles
    const articleLinks = incomingLinks.slice(0, 3);
    for (const link of articleLinks) {
      const articleAtomId = link.outgoing[0];
      const articleAtom = meshService.getAtom(articleAtomId);
      if (articleAtom) {
        console.log(`   - ${articleAtom.name}`);
      }
    }
  }
  console.log('');

  // 10. Check cache status
  console.log('8. Cache Status:');
  console.log(`   Cache is stale: ${helpAdapter.isCacheStale()}`);
  console.log('');

  // 11. Demonstrate article lookup
  console.log('9. Looking up specific article:');
  const article = helpAdapter.getArticle('article-setup-install');
  if (article) {
    console.log(`   Title: ${article.title}`);
    console.log(`   Content: ${article.content}`);
    console.log(`   URL: ${article.url}`);
    console.log(`   Tags: ${article.tags.join(', ')}`);
    console.log(`   Created: ${article.createdAt.toISOString()}`);
    console.log(`   Updated: ${article.updatedAt.toISOString()}`);
  }
  console.log('');

  console.log('=== Demo Complete ===');
}

// Run the demonstration
demonstrateHelpIntegration().catch((error) => {
  console.error('Error running demonstration:', error);
  process.exit(1);
});
