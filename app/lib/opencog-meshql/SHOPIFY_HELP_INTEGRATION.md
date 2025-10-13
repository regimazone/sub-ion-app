# Shopify Marketplace Connect Help Integration

This guide explains how to integrate the Shopify Marketplace Connect Help Center with the OpenCog HyperGraph knowledge base for intelligent help article discovery and semantic search.

## Overview

The `ShopifyMarketplaceHelpAdapter` provides a bridge between the Shopify Marketplace Connect Help Center and the OpenCog atomspace/hypergraph. It enables:

- **Knowledge Ingestion**: Automatic fetching and structuring of help articles
- **Semantic Organization**: Articles, categories, and tags as atoms and links
- **Intelligent Search**: Tag-based and keyword-based article discovery
- **Context-Aware Recommendations**: Smart article suggestions based on user queries
- **Graph Traversal**: Navigate relationships between help content
- **Caching**: Efficient content caching with automatic refresh

## Architecture

```
┌──────────────────────────────────────────────────┐
│  Shopify Marketplace Connect Help Center        │
│  (https://shopifymarketplaceconnecthelp.com)    │
└────────────────────┬─────────────────────────────┘
                     │
                     │ Fetch & Structure
                     │
┌────────────────────▼─────────────────────────────┐
│  ShopifyMarketplaceHelpAdapter                   │
│  - Fetch categories and articles                 │
│  - Create atoms and links                        │
│  - Manage cache and sync                         │
└────────────────────┬─────────────────────────────┘
                     │
                     │ Store in HyperGraph
                     │
┌────────────────────▼─────────────────────────────┐
│  OpenCog HyperGraph (Atomspace)                  │
│                                                   │
│  Root: ShopifyMarketplaceConnectHelp             │
│    │                                              │
│    ├─── Category: Setup                          │
│    │      ├─── Article: Installing                │
│    │      │       └─── Tags: setup, install       │
│    │      └─── Article: Connecting                │
│    │            └─── Tags: setup, marketplaces    │
│    │                                              │
│    ├─── Category: Products                       │
│    │      └─── Article: Creating Listings        │
│    │            └─── Tags: products, listings     │
│    └─── ...                                       │
└──────────────────────────────────────────────────┘
```

## Quick Start

### 1. Basic Setup

```typescript
import {
  OpenCogMeshQLService,
  ShopifyMarketplaceHelpAdapter,
  NodeStatus,
} from '~/lib/opencog-meshql';
import {logger} from '~/utils/logger.server';

// Create mesh service
const meshService = new OpenCogMeshQLService({
  meshId: 'help-knowledge-mesh',
  nodes: [{
    id: 'knowledge-node-1',
    endpoint: 'http://localhost:8001',
    status: NodeStatus.Active,
    capabilities: ['REASON', 'LEARN'],
    lastHeartbeat: new Date(),
  }],
  defaultTimeout: 5000,
  heartbeatIntervalMs: 1000,
});

// Create help adapter
const helpAdapter = new ShopifyMarketplaceHelpAdapter(
  meshService,
  {
    baseUrl: 'https://www.shopifymarketplaceconnecthelp.com',
    locale: 'en-us',
    autoFetch: true, // Automatically sync on initialization
    cacheDurationMs: 3600000, // 1 hour
    useRealApi: true, // Fetch from real API (set to false for fallback data)
    requestTimeoutMs: 10000, // Request timeout in milliseconds
  },
  logger,
);
```

### 2. Manual Sync

```typescript
// Manually sync help center content
await helpAdapter.syncHelpCenter();

// Check sync status
const stats = helpAdapter.getKnowledgeGraphStats();
console.log(`Synced ${stats.articles} articles`);
console.log(`Last sync: ${stats.lastSync}`);
```

### 3. Search for Articles

#### By Tag

```typescript
// Find all articles tagged with 'setup'
const setupArticles = helpAdapter.searchByTag('setup');

setupArticles.forEach(article => {
  console.log(`${article.title} - ${article.url}`);
});
```

#### By Keyword

```typescript
// Find articles containing 'inventory'
const inventoryArticles = helpAdapter.searchByKeyword('inventory');

inventoryArticles.forEach(article => {
  console.log(`${article.title}`);
  console.log(`${article.content.substring(0, 100)}...`);
});
```

#### By Category

```typescript
// Get all articles in the 'Products' category
const productArticles = helpAdapter.getArticlesByCategory('category-products');
```

### 4. Get Recommendations

```typescript
// Get recommended articles based on user query
const recommendations = helpAdapter.getRecommendedArticles(
  'how to sync product inventory across marketplaces'
);

recommendations.forEach((article, index) => {
  console.log(`${index + 1}. ${article.title}`);
  console.log(`   Category: ${article.categoryId}`);
  console.log(`   Tags: ${article.tags.join(', ')}`);
});
```

### 5. Retrieve Specific Article

```typescript
// Get article by ID
const article = helpAdapter.getArticle('article-setup-install');

if (article) {
  console.log(`Title: ${article.title}`);
  console.log(`URL: ${article.url}`);
  console.log(`Content: ${article.content}`);
  console.log(`Tags: ${article.tags.join(', ')}`);
}
```

## Knowledge Graph Structure

### Atoms

The adapter creates three types of atoms:

1. **Root Concept**: `shopify-marketplace-help-root`
   - Represents the entire help center

2. **Category Atoms**: `help-category-{categoryId}`
   - Represents help categories (Setup, Products, Orders, etc.)

3. **Article Atoms**: `help-article-{articleId}`
   - Represents individual help articles

4. **Tag Atoms**: `help-tag-{tag}`
   - Represents article tags

### Links

Links connect atoms to form the knowledge graph:

1. **InheritanceLink**: Category → Root
   - Links categories to the root concept

2. **InheritanceLink**: Article → Category
   - Links articles to their categories

3. **EvaluationLink**: Article → Tag
   - Links articles to their tags

### Truth Values

All atoms and links have truth values for probabilistic reasoning:

- **Strength**: How true/certain the relationship is (0-1)
- **Confidence**: How confident we are in the strength (0-1)

Example:
```typescript
// Article with high certainty
truthValue: { strength: 0.95, confidence: 0.9 }

// Tag relationship
truthValue: { strength: 0.9, confidence: 0.85 }
```

### Attention Values

Atoms have attention values for focus management:

- **STI** (Short-term Importance): 0-100
- **LTI** (Long-term Importance): 0-100
- **VLTI** (Very Long-term Importance): 0-100

Example:
```typescript
// Root concept - highest importance
attentionValue: { sti: 100, lti: 100, vlti: 50 }

// Category - high importance
attentionValue: { sti: 80, lti: 60, vlti: 30 }

// Article - medium importance
attentionValue: { sti: 60, lti: 40, vlti: 20 }

// Tag - lower importance
attentionValue: { sti: 40, lti: 30, vlti: 10 }
```

## Advanced Usage

### Cache Management

```typescript
// Check if cache is stale
if (helpAdapter.isCacheStale()) {
  console.log('Cache is stale, refreshing...');
  await helpAdapter.syncHelpCenter();
}

// Force cache invalidation and re-sync
await helpAdapter.invalidateCache();
```

### Graph Traversal

```typescript
// Get a tag atom
const tagAtom = meshService.getAtom('help-tag-setup');

// Get all articles with this tag (incoming links)
const incomingLinks = meshService.getIncomingLinks(tagAtom.id);

console.log(`Found ${incomingLinks.length} articles with tag 'setup'`);

for (const link of incomingLinks) {
  // First atom in outgoing is the article
  const articleAtomId = link.outgoing[0];
  const articleAtom = meshService.getAtom(articleAtomId);
  
  if (articleAtom) {
    console.log(`- ${articleAtom.name}`);
  }
}
```

### Statistics and Monitoring

```typescript
// Get comprehensive statistics
const stats = helpAdapter.getKnowledgeGraphStats();

console.log('Knowledge Graph Statistics:');
console.log(`- Total Atoms: ${stats.totalAtoms}`);
console.log(`- Total Links: ${stats.totalLinks}`);
console.log(`- Categories: ${stats.categories}`);
console.log(`- Articles: ${stats.articles}`);
console.log(`- Tags: ${stats.tags}`);
console.log(`- Last Sync: ${stats.lastSync}`);
```

## Integration with Shopify App

### 1. Help Widget in Admin

```typescript
// app/routes/admin.help.tsx
import {json, LoaderFunctionArgs} from '@remix-run/node';
import {useLoaderData} from '@remix-run/react';
import {helpAdapter} from '~/services/help.server';

export async function loader({request}: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || '';
  
  // Get recommended articles based on query
  const articles = query
    ? helpAdapter.getRecommendedArticles(query)
    : helpAdapter.searchByTag('getting-started');
  
  return json({articles});
}

export default function HelpPage() {
  const {articles} = useLoaderData<typeof loader>();
  
  return (
    <div>
      <h1>Help & Support</h1>
      <div>
        {articles.map(article => (
          <div key={article.id}>
            <h3>{article.title}</h3>
            <p>{article.content}</p>
            <a href={article.url} target="_blank">Read more →</a>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 2. Contextual Help

```typescript
// Show relevant help based on current page
function useContextualHelp(context: string) {
  const [articles, setArticles] = useState([]);
  
  useEffect(() => {
    fetch(`/api/help/recommendations?context=${context}`)
      .then(res => res.json())
      .then(data => setArticles(data.articles));
  }, [context]);
  
  return articles;
}

// In your component
function ProductsPage() {
  const helpArticles = useContextualHelp('products');
  
  return (
    <div>
      <h1>Products</h1>
      {/* Show help sidebar */}
      <aside>
        <h3>Need help?</h3>
        {helpArticles.map(article => (
          <a key={article.id} href={article.url}>
            {article.title}
          </a>
        ))}
      </aside>
    </div>
  );
}
```

### 3. Error Recovery

```typescript
// Show relevant help when errors occur
async function handleMarketplaceError(error: Error) {
  // Search for troubleshooting articles
  const troubleshootingArticles = helpAdapter.searchByTag('troubleshooting');
  
  // Get context-aware recommendations
  const recommendations = helpAdapter.getRecommendedArticles(
    `error ${error.message}`
  );
  
  return {
    error: error.message,
    helpArticles: [...troubleshootingArticles, ...recommendations].slice(0, 3),
  };
}
```

## Configuration Options

```typescript
interface ShopifyMarketplaceHelpConfig {
  /** Base URL for the help center */
  baseUrl: string;
  
  /** Language/locale (default: 'en-us') */
  locale?: string;
  
  /** Auto-fetch on initialization (default: false) */
  autoFetch?: boolean;
  
  /** Cache duration in milliseconds (default: 1 hour) */
  cacheDurationMs?: number;
  
  /** Whether to use real API calls or fallback data (default: true) */
  useRealApi?: boolean;
  
  /** Request timeout in milliseconds (default: 10000) */
  requestTimeoutMs?: number;
}
```

### URL Normalization

The adapter automatically handles different URL formats:

```typescript
// Both of these work the same way:

// Format 1: Base URL without locale path
const adapter1 = new ShopifyMarketplaceHelpAdapter(
  meshService,
  {
    baseUrl: 'https://www.shopifymarketplaceconnecthelp.com',
    locale: 'en-us',
  },
  logger,
);

// Format 2: Base URL with locale path (locale is extracted)
const adapter2 = new ShopifyMarketplaceHelpAdapter(
  meshService,
  {
    baseUrl: 'https://www.shopifymarketplaceconnecthelp.com/hc/en-us',
  },
  logger,
);

// Both generate the same article URLs:
// https://www.shopifymarketplaceconnecthelp.com/hc/en-us/articles/...
```

**Note**: If the base URL includes `/hc/{locale}`, the adapter will:
1. Extract the locale from the URL
2. Remove `/hc/{locale}` from the base URL
3. Use the extracted locale unless explicitly provided in the config

## API Reference

### ShopifyMarketplaceHelpAdapter

#### Methods

- **`syncHelpCenter(): Promise<void>`**
  - Sync help center content into the hypergraph

- **`searchByTag(tag: string): HelpArticle[]`**
  - Search for articles by tag

- **`searchByKeyword(keyword: string): HelpArticle[]`**
  - Search for articles by keyword

- **`getArticle(articleId: string): HelpArticle | undefined`**
  - Get a specific article by ID

- **`getArticlesByCategory(categoryId: string): HelpArticle[]`**
  - Get all articles in a category

- **`getRecommendedArticles(context: string): HelpArticle[]`**
  - Get recommended articles based on context (max 5)

- **`getKnowledgeGraphStats(): KnowledgeGraphStats`**
  - Get statistics about the knowledge graph

- **`isCacheStale(): boolean`**
  - Check if cache needs refreshing

- **`invalidateCache(): Promise<void>`**
  - Clear cache and force re-sync

### Types

```typescript
interface HelpArticle {
  id: string;
  categoryId: string;
  title: string;
  content: string;
  url: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface HelpCategory {
  id: string;
  name: string;
  description: string;
  order: number;
}

interface KnowledgeGraphStats {
  totalAtoms: number;
  totalLinks: number;
  categories: number;
  articles: number;
  tags: number;
  lastSync?: Date;
}
```

## Testing

Run the test suite:

```bash
npm run test app/lib/opencog-meshql/tests/ShopifyMarketplaceHelpAdapter.test.ts
```

Run the example:

```bash
npm run tsx app/lib/opencog-meshql/examples/shopify-help-integration.ts
```

## API Integration

The adapter now supports **real-time fetching** from the Shopify Marketplace Connect Help Center API:

### Real API Mode

When `useRealApi: true` (default), the adapter fetches live data from the Zendesk API:

```typescript
const helpAdapter = new ShopifyMarketplaceHelpAdapter(
  meshService,
  {
    baseUrl: 'https://www.shopifymarketplaceconnecthelp.com',
    locale: 'en-us',
    useRealApi: true, // Fetch from real API
    requestTimeoutMs: 10000, // 10 second timeout
  },
  logger,
);
```

**API Endpoints Used:**
- Categories: `${baseUrl}/api/v2/help_center/${locale}/categories.json`
- Articles: `${baseUrl}/api/v2/help_center/${locale}/categories/${categoryId}/articles.json`

### Fallback Mode

When `useRealApi: false`, the adapter uses simulated data for testing:

```typescript
const helpAdapter = new ShopifyMarketplaceHelpAdapter(
  meshService,
  {
    baseUrl: 'https://www.shopifymarketplaceconnecthelp.com',
    useRealApi: false, // Use fallback data
  },
  logger,
);
```

### Error Handling

The adapter gracefully handles API failures:
- Network timeouts (configurable via `requestTimeoutMs`)
- HTTP errors (4xx, 5xx)
- Malformed responses
- Connection failures

In all error cases, the adapter automatically falls back to simulated data and logs the error.

## Future Enhancements

1. **Pagination Support**: Handle paginated API responses for large help centers
2. **Full-Text Search**: Add Elasticsearch or similar for advanced search
3. **Machine Learning**: Use ML for better article recommendations
4. **Enhanced Caching**: Add Redis or similar for distributed caching
5. **Analytics**: Track which articles are most helpful
6. **Auto-Sync**: Background job to keep content fresh
7. **Webhooks**: Real-time updates when help content changes
8. **Rate Limiting**: Implement exponential backoff for API requests

## Best Practices

1. **Cache Management**: Set appropriate cache duration based on help center update frequency
2. **Error Handling**: Always handle sync failures gracefully
3. **Performance**: Use tag-based search for faster results
4. **Relevance**: Combine multiple search methods for best recommendations
5. **Monitoring**: Track cache hit rates and sync performance
6. **Fallbacks**: Provide default articles when search returns no results

## Troubleshooting

### Articles not appearing

```typescript
// Check if sync completed successfully
const stats = helpAdapter.getKnowledgeGraphStats();
console.log('Articles synced:', stats.articles);

// Force re-sync if needed
await helpAdapter.invalidateCache();
```

### Stale content

```typescript
// Check cache status
if (helpAdapter.isCacheStale()) {
  await helpAdapter.syncHelpCenter();
}
```

### Poor search results

```typescript
// Combine multiple search methods
const tag = helpAdapter.searchByTag('products');
const keyword = helpAdapter.searchByKeyword('listing');
const recommendations = helpAdapter.getRecommendedArticles('product listings');

// Merge and deduplicate results
const allArticles = [...new Set([...tag, ...keyword, ...recommendations])];
```

## License

See LICENSE.md in the repository root.
