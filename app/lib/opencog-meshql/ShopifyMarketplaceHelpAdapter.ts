/**
 * ShopifyMarketplaceHelpAdapter
 * 
 * Adapter for integrating Shopify Marketplace Connect Help Center
 * with the OpenCog HyperGraph knowledge base.
 * 
 * This adapter:
 * - Fetches help articles from the Shopify Marketplace Connect Help Center
 * - Structures knowledge as atoms and links in the hypergraph
 * - Enables semantic queries over help content
 * - Provides reasoning capabilities for help documentation
 */

import type {Logger} from 'pino';
import type {
  Atom,
  Link,
  LinkType,
  HelpArticle,
  HelpCategory,
  HelpSection,
  KnowledgeGraphStats,
} from './types';
import {OpenCogMeshQLService} from './OpenCogMeshQLService';

export interface ShopifyMarketplaceHelpConfig {
  /** Base URL for the help center (e.g., https://www.shopifymarketplaceconnecthelp.com) */
  baseUrl: string;
  /** Language/locale (e.g., 'en-us') */
  locale?: string;
  /** Whether to fetch articles automatically on initialization */
  autoFetch?: boolean;
  /** Cache duration in milliseconds */
  cacheDurationMs?: number;
}

export class ShopifyMarketplaceHelpAdapter {
  private config: Required<ShopifyMarketplaceHelpConfig>;
  private meshService: OpenCogMeshQLService;
  private logger: Logger;
  private lastFetchTime?: Date;
  private articleCache: Map<string, HelpArticle> = new Map();

  constructor(
    meshService: OpenCogMeshQLService,
    config: ShopifyMarketplaceHelpConfig,
    logger: Logger,
  ) {
    this.config = {
      baseUrl: config.baseUrl,
      locale: config.locale || 'en-us',
      autoFetch: config.autoFetch ?? false,
      cacheDurationMs: config.cacheDurationMs || 3600000, // 1 hour default
    };
    this.meshService = meshService;
    this.logger = logger;

    if (this.config.autoFetch) {
      this.initialize();
    }
  }

  /**
   * Initialize the adapter and optionally fetch help content
   */
  private async initialize(): Promise<void> {
    this.logger.info(
      {baseUrl: this.config.baseUrl, locale: this.config.locale},
      'Initializing Shopify Marketplace Help adapter',
    );

    try {
      await this.syncHelpCenter();
    } catch (error) {
      this.logger.error(
        {error},
        'Failed to initialize help center adapter',
      );
    }
  }

  /**
   * Sync help center content into the hypergraph
   */
  async syncHelpCenter(): Promise<void> {
    this.logger.info('Starting help center sync');

    try {
      // Create root help center concept
      this.createHelpCenterRoot();

      // Fetch and process categories
      const categories = await this.fetchCategories();
      
      for (const category of categories) {
        await this.processCategory(category);
      }

      this.lastFetchTime = new Date();
      this.logger.info(
        {
          categories: categories.length,
          articles: this.articleCache.size,
        },
        'Help center sync completed',
      );
    } catch (error) {
      this.logger.error({error}, 'Failed to sync help center');
      throw error;
    }
  }

  /**
   * Create root concept for the help center
   */
  private createHelpCenterRoot(): void {
    this.meshService.addAtom({
      id: 'shopify-marketplace-help-root',
      type: 'ConceptNode',
      name: 'ShopifyMarketplaceConnectHelp',
      truthValue: {strength: 1.0, confidence: 1.0},
      attentionValue: {sti: 100, lti: 100, vlti: 50},
    });
  }

  /**
   * Fetch categories from the help center
   * In a real implementation, this would make HTTP requests
   */
  private async fetchCategories(): Promise<HelpCategory[]> {
    // Simulated categories based on common Shopify Marketplace Connect topics
    return [
      {
        id: 'category-setup',
        name: 'Setup and Configuration',
        description: 'Getting started with Shopify Marketplace Connect',
        order: 1,
      },
      {
        id: 'category-products',
        name: 'Product Management',
        description: 'Managing products and listings',
        order: 2,
      },
      {
        id: 'category-orders',
        name: 'Order Management',
        description: 'Processing and fulfilling orders',
        order: 3,
      },
      {
        id: 'category-inventory',
        name: 'Inventory Sync',
        description: 'Synchronizing inventory across marketplaces',
        order: 4,
      },
      {
        id: 'category-troubleshooting',
        name: 'Troubleshooting',
        description: 'Common issues and solutions',
        order: 5,
      },
    ];
  }

  /**
   * Process a category and its articles
   */
  private async processCategory(category: HelpCategory): Promise<void> {
    this.logger.debug({categoryId: category.id}, 'Processing category');

    // Create category atom
    const categoryAtomId = `help-category-${category.id}`;
    this.meshService.addAtom({
      id: categoryAtomId,
      type: 'ConceptNode',
      name: category.name,
      truthValue: {strength: 1.0, confidence: 0.95},
      attentionValue: {sti: 80, lti: 60, vlti: 30},
    });

    // Link category to root
    this.meshService.addLink({
      id: `link-root-${category.id}`,
      type: 'InheritanceLink' as LinkType,
      outgoing: [categoryAtomId, 'shopify-marketplace-help-root'],
      truthValue: {strength: 1.0, confidence: 1.0},
    });

    // Fetch and process articles
    const articles = await this.fetchArticlesForCategory(category.id);
    
    for (const article of articles) {
      await this.processArticle(article, categoryAtomId);
    }
  }

  /**
   * Fetch articles for a specific category
   */
  private async fetchArticlesForCategory(
    categoryId: string,
  ): Promise<HelpArticle[]> {
    // Simulated articles based on category
    const articlesByCategory: Record<string, HelpArticle[]> = {
      'category-setup': [
        {
          id: 'article-setup-install',
          categoryId,
          title: 'Installing Marketplace Connect',
          content: 'Step-by-step guide to install and configure the Marketplace Connect app',
          url: `${this.config.baseUrl}/hc/${this.config.locale}/articles/setup-install`,
          tags: ['setup', 'installation', 'getting-started'],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-06-01'),
        },
        {
          id: 'article-setup-connect',
          categoryId,
          title: 'Connecting to Marketplaces',
          content: 'How to connect your Shopify store to Amazon, eBay, Walmart, and Target Plus',
          url: `${this.config.baseUrl}/hc/${this.config.locale}/articles/setup-connect`,
          tags: ['setup', 'marketplaces', 'connection'],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-06-01'),
        },
      ],
      'category-products': [
        {
          id: 'article-products-listing',
          categoryId,
          title: 'Creating Product Listings',
          content: 'Guide to creating and managing product listings across marketplaces',
          url: `${this.config.baseUrl}/hc/${this.config.locale}/articles/products-listing`,
          tags: ['products', 'listings', 'catalog'],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-06-01'),
        },
        {
          id: 'article-products-sync',
          categoryId,
          title: 'Syncing Product Data',
          content: 'How to synchronize product information between Shopify and marketplaces',
          url: `${this.config.baseUrl}/hc/${this.config.locale}/articles/products-sync`,
          tags: ['products', 'sync', 'data'],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-06-01'),
        },
      ],
      'category-orders': [
        {
          id: 'article-orders-management',
          categoryId,
          title: 'Managing Orders',
          content: 'How to view, process, and fulfill orders from connected marketplaces',
          url: `${this.config.baseUrl}/hc/${this.config.locale}/articles/orders-management`,
          tags: ['orders', 'fulfillment', 'processing'],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-06-01'),
        },
      ],
      'category-inventory': [
        {
          id: 'article-inventory-sync',
          categoryId,
          title: 'Inventory Synchronization',
          content: 'Keep inventory levels in sync across all connected marketplaces',
          url: `${this.config.baseUrl}/hc/${this.config.locale}/articles/inventory-sync`,
          tags: ['inventory', 'sync', 'stock'],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-06-01'),
        },
      ],
      'category-troubleshooting': [
        {
          id: 'article-troubleshooting-errors',
          categoryId,
          title: 'Common Error Messages',
          content: 'Solutions for common error messages and issues',
          url: `${this.config.baseUrl}/hc/${this.config.locale}/articles/troubleshooting-errors`,
          tags: ['troubleshooting', 'errors', 'solutions'],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-06-01'),
        },
      ],
    };

    return articlesByCategory[categoryId] || [];
  }

  /**
   * Process an article and add it to the hypergraph
   */
  private async processArticle(
    article: HelpArticle,
    categoryAtomId: string,
  ): Promise<void> {
    this.logger.debug({articleId: article.id}, 'Processing article');

    // Cache the article
    this.articleCache.set(article.id, article);

    // Create article atom
    const articleAtomId = `help-article-${article.id}`;
    this.meshService.addAtom({
      id: articleAtomId,
      type: 'ConceptNode',
      name: article.title,
      truthValue: {strength: 0.95, confidence: 0.9},
      attentionValue: {sti: 60, lti: 40, vlti: 20},
    });

    // Link article to category
    this.meshService.addLink({
      id: `link-article-category-${article.id}`,
      type: 'InheritanceLink' as LinkType,
      outgoing: [articleAtomId, categoryAtomId],
      truthValue: {strength: 1.0, confidence: 1.0},
    });

    // Create atoms for tags and link them
    for (const tag of article.tags) {
      const tagAtomId = `help-tag-${tag}`;
      
      // Create tag atom if it doesn't exist
      if (!this.meshService.getAtom(tagAtomId)) {
        this.meshService.addAtom({
          id: tagAtomId,
          type: 'ConceptNode',
          name: tag,
          truthValue: {strength: 0.9, confidence: 0.85},
          attentionValue: {sti: 40, lti: 30, vlti: 10},
        });
      }

      // Link article to tag
      this.meshService.addLink({
        id: `link-article-tag-${article.id}-${tag}`,
        type: 'EvaluationLink' as LinkType,
        outgoing: [articleAtomId, tagAtomId],
        truthValue: {strength: 0.9, confidence: 0.85},
      });
    }
  }

  /**
   * Search for help articles by tag
   */
  searchByTag(tag: string): HelpArticle[] {
    const tagAtomId = `help-tag-${tag}`;
    const tagAtom = this.meshService.getAtom(tagAtomId);

    if (!tagAtom) {
      return [];
    }

    // Get all incoming links to the tag
    const links = this.meshService.getIncomingLinks(tagAtomId);
    
    // Extract article atoms from links
    const articleIds: string[] = [];
    for (const link of links) {
      if (link.type === 'EvaluationLink') {
        // First atom in outgoing is the article
        const articleAtomId = link.outgoing[0];
        if (articleAtomId && articleAtomId.startsWith('help-article-')) {
          const articleId = articleAtomId.replace('help-article-', '');
          articleIds.push(articleId);
        }
      }
    }

    // Return articles from cache
    return articleIds
      .map((id) => this.articleCache.get(id))
      .filter((article): article is HelpArticle => article !== undefined);
  }

  /**
   * Search for help articles by keyword in title or content
   */
  searchByKeyword(keyword: string): HelpArticle[] {
    const lowerKeyword = keyword.toLowerCase();
    return Array.from(this.articleCache.values()).filter(
      (article) =>
        article.title.toLowerCase().includes(lowerKeyword) ||
        article.content.toLowerCase().includes(lowerKeyword),
    );
  }

  /**
   * Get article by ID
   */
  getArticle(articleId: string): HelpArticle | undefined {
    return this.articleCache.get(articleId);
  }

  /**
   * Get all articles in a category
   */
  getArticlesByCategory(categoryId: string): HelpArticle[] {
    return Array.from(this.articleCache.values()).filter(
      (article) => article.categoryId === categoryId,
    );
  }

  /**
   * Get knowledge graph statistics
   */
  getKnowledgeGraphStats(): KnowledgeGraphStats {
    const stats = this.meshService.getStats();
    
    return {
      totalAtoms: stats.totalAtoms,
      totalLinks: this.countLinks(),
      categories: this.countCategories(),
      articles: this.articleCache.size,
      tags: this.countTags(),
      lastSync: this.lastFetchTime,
    };
  }

  /**
   * Count total number of links in the hypergraph
   */
  private countLinks(): number {
    // Get all atoms and count their outgoing links
    let linkCount = 0;
    const atoms = this.meshService.queryAtomsByType('ConceptNode');
    
    for (const atom of atoms) {
      const links = this.meshService.getOutgoingLinks(atom.id);
      linkCount += links.length;
    }
    
    return linkCount;
  }

  /**
   * Count number of categories
   */
  private countCategories(): number {
    const atoms = this.meshService.queryAtomsByType('ConceptNode');
    return atoms.filter((atom) => atom.id.startsWith('help-category-')).length;
  }

  /**
   * Count number of unique tags
   */
  private countTags(): number {
    const atoms = this.meshService.queryAtomsByType('ConceptNode');
    return atoms.filter((atom) => atom.id.startsWith('help-tag-')).length;
  }

  /**
   * Invalidate cache and force re-sync
   */
  async invalidateCache(): Promise<void> {
    this.logger.info('Invalidating help center cache');
    this.articleCache.clear();
    this.lastFetchTime = undefined;
    await this.syncHelpCenter();
  }

  /**
   * Check if cache is stale
   */
  isCacheStale(): boolean {
    if (!this.lastFetchTime) {
      return true;
    }
    
    const now = new Date();
    const elapsed = now.getTime() - this.lastFetchTime.getTime();
    return elapsed > this.config.cacheDurationMs;
  }

  /**
   * Get recommended articles based on a query or context
   */
  getRecommendedArticles(context: string): HelpArticle[] {
    // Simple recommendation based on keyword matching
    const keywords = context.toLowerCase().split(/\s+/);
    const articleScores = new Map<string, number>();

    for (const article of this.articleCache.values()) {
      let score = 0;
      const articleText = `${article.title} ${article.content} ${article.tags.join(' ')}`.toLowerCase();

      for (const keyword of keywords) {
        if (articleText.includes(keyword)) {
          score += 1;
        }
      }

      if (score > 0) {
        articleScores.set(article.id, score);
      }
    }

    // Sort by score and return top 5
    return Array.from(articleScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([articleId]) => this.articleCache.get(articleId))
      .filter((article): article is HelpArticle => article !== undefined);
  }
}
