import {describe, it, expect, beforeEach, vi} from 'vitest';
import {pino} from 'pino';
import {
  OpenCogMeshQLService,
  ShopifyMarketplaceHelpAdapter,
  NodeStatus,
} from '../index';

describe('ShopifyMarketplaceHelpAdapter', () => {
  let meshService: OpenCogMeshQLService;
  let helpAdapter: ShopifyMarketplaceHelpAdapter;
  let logger: any;

  beforeEach(() => {
    logger = pino({level: 'silent'});

    const config = {
      meshId: 'test-help-mesh',
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

    meshService = new OpenCogMeshQLService(config);

    helpAdapter = new ShopifyMarketplaceHelpAdapter(
      meshService,
      {
        baseUrl: 'https://www.shopifymarketplaceconnecthelp.com',
        locale: 'en-us',
        autoFetch: false,
      },
      logger,
    );
  });

  describe('Initialization', () => {
    it('should create adapter with default configuration', () => {
      expect(helpAdapter).toBeDefined();
    });

    it('should use default locale if not provided', () => {
      const adapter = new ShopifyMarketplaceHelpAdapter(
        meshService,
        {
          baseUrl: 'https://example.com',
        },
        logger,
      );
      expect(adapter).toBeDefined();
    });

    it('should normalize baseUrl with /hc/{locale} suffix', async () => {
      const adapter = new ShopifyMarketplaceHelpAdapter(
        meshService,
        {
          baseUrl: 'https://www.shopifymarketplaceconnecthelp.com/hc/en-us',
        },
        logger,
      );
      
      await adapter.syncHelpCenter();
      
      // Check that article URLs are constructed correctly without duplication
      const article = adapter.getArticle('article-setup-install');
      expect(article).toBeDefined();
      expect(article?.url).toBe(
        'https://www.shopifymarketplaceconnecthelp.com/hc/en-us/articles/setup-install',
      );
      // Ensure no double /hc/en-us in the URL
      expect(article?.url).not.toContain('/hc/en-us/hc/en-us');
    });

    it('should extract locale from baseUrl if not explicitly provided', async () => {
      const adapter = new ShopifyMarketplaceHelpAdapter(
        meshService,
        {
          baseUrl: 'https://www.shopifymarketplaceconnecthelp.com/hc/fr-fr',
        },
        logger,
      );
      
      await adapter.syncHelpCenter();
      
      // Check that the extracted locale is used
      const article = adapter.getArticle('article-setup-install');
      expect(article).toBeDefined();
      expect(article?.url).toContain('/hc/fr-fr/articles/');
    });

    it('should prefer explicit locale over extracted locale from URL', async () => {
      const adapter = new ShopifyMarketplaceHelpAdapter(
        meshService,
        {
          baseUrl: 'https://www.shopifymarketplaceconnecthelp.com/hc/fr-fr',
          locale: 'de-de',
        },
        logger,
      );
      
      await adapter.syncHelpCenter();
      
      // Check that explicit locale takes precedence
      const article = adapter.getArticle('article-setup-install');
      expect(article).toBeDefined();
      expect(article?.url).toContain('/hc/de-de/articles/');
    });

    it('should handle baseUrl with trailing slash', () => {
      const adapter = new ShopifyMarketplaceHelpAdapter(
        meshService,
        {
          baseUrl: 'https://example.com/',
          locale: 'en-us',
        },
        logger,
      );
      expect(adapter).toBeDefined();
    });

    it('should handle baseUrl with /hc/{locale} and trailing slash', async () => {
      const adapter = new ShopifyMarketplaceHelpAdapter(
        meshService,
        {
          baseUrl: 'https://www.shopifymarketplaceconnecthelp.com/hc/en-us/',
        },
        logger,
      );
      
      await adapter.syncHelpCenter();
      
      const article = adapter.getArticle('article-setup-install');
      expect(article).toBeDefined();
      expect(article?.url).toBe(
        'https://www.shopifymarketplaceconnecthelp.com/hc/en-us/articles/setup-install',
      );
    });
  });

  describe('syncHelpCenter', () => {
    it('should sync help center content into hypergraph', async () => {
      await helpAdapter.syncHelpCenter();

      // Check that root concept was created
      const rootAtom = meshService.getAtom('shopify-marketplace-help-root');
      expect(rootAtom).toBeDefined();
      expect(rootAtom?.name).toBe('ShopifyMarketplaceConnectHelp');
    });

    it('should create category atoms', async () => {
      await helpAdapter.syncHelpCenter();

      // Check for setup category
      const categoryAtom = meshService.getAtom('help-category-category-setup');
      expect(categoryAtom).toBeDefined();
      expect(categoryAtom?.type).toBe('ConceptNode');
    });

    it('should create article atoms', async () => {
      await helpAdapter.syncHelpCenter();

      // Check for an article
      const articleAtom = meshService.getAtom(
        'help-article-article-setup-install',
      );
      expect(articleAtom).toBeDefined();
      expect(articleAtom?.type).toBe('ConceptNode');
    });

    it('should create tag atoms', async () => {
      await helpAdapter.syncHelpCenter();

      // Check for a tag
      const tagAtom = meshService.getAtom('help-tag-setup');
      expect(tagAtom).toBeDefined();
      expect(tagAtom?.type).toBe('ConceptNode');
    });

    it('should create links between categories and root', async () => {
      await helpAdapter.syncHelpCenter();

      const rootLinks = meshService.getIncomingLinks(
        'shopify-marketplace-help-root',
      );
      expect(rootLinks.length).toBeGreaterThan(0);
    });

    it('should create links between articles and categories', async () => {
      await helpAdapter.syncHelpCenter();

      const categoryLinks = meshService.getIncomingLinks(
        'help-category-category-setup',
      );
      expect(categoryLinks.length).toBeGreaterThan(0);
    });

    it('should create links between articles and tags', async () => {
      await helpAdapter.syncHelpCenter();

      const tagLinks = meshService.getIncomingLinks('help-tag-setup');
      expect(tagLinks.length).toBeGreaterThan(0);
    });
  });

  describe('searchByTag', () => {
    beforeEach(async () => {
      await helpAdapter.syncHelpCenter();
    });

    it('should find articles by tag', () => {
      const articles = helpAdapter.searchByTag('setup');
      expect(articles.length).toBeGreaterThan(0);
      expect(articles[0].tags).toContain('setup');
    });

    it('should return empty array for non-existent tag', () => {
      const articles = helpAdapter.searchByTag('non-existent-tag');
      expect(articles).toEqual([]);
    });

    it('should find all articles with products tag', () => {
      const articles = helpAdapter.searchByTag('products');
      expect(articles.length).toBeGreaterThan(0);
      articles.forEach((article) => {
        expect(article.tags).toContain('products');
      });
    });
  });

  describe('searchByKeyword', () => {
    beforeEach(async () => {
      await helpAdapter.syncHelpCenter();
    });

    it('should find articles by keyword in title', () => {
      const articles = helpAdapter.searchByKeyword('Installing');
      expect(articles.length).toBeGreaterThan(0);
      expect(
        articles.some((a) => a.title.toLowerCase().includes('installing')),
      ).toBe(true);
    });

    it('should find articles by keyword in content', () => {
      const articles = helpAdapter.searchByKeyword('synchronize');
      expect(articles.length).toBeGreaterThan(0);
    });

    it('should be case-insensitive', () => {
      const lowerCase = helpAdapter.searchByKeyword('inventory');
      const upperCase = helpAdapter.searchByKeyword('INVENTORY');
      const mixedCase = helpAdapter.searchByKeyword('InVeNtOrY');

      expect(lowerCase.length).toBe(upperCase.length);
      expect(lowerCase.length).toBe(mixedCase.length);
    });

    it('should return empty array for non-matching keyword', () => {
      const articles = helpAdapter.searchByKeyword('xyz123nonexistent');
      expect(articles).toEqual([]);
    });
  });

  describe('getArticle', () => {
    beforeEach(async () => {
      await helpAdapter.syncHelpCenter();
    });

    it('should get article by ID', () => {
      const article = helpAdapter.getArticle('article-setup-install');
      expect(article).toBeDefined();
      expect(article?.id).toBe('article-setup-install');
      expect(article?.title).toBe('Installing Marketplace Connect');
    });

    it('should return undefined for non-existent article', () => {
      const article = helpAdapter.getArticle('non-existent-article');
      expect(article).toBeUndefined();
    });
  });

  describe('getArticlesByCategory', () => {
    beforeEach(async () => {
      await helpAdapter.syncHelpCenter();
    });

    it('should get all articles in a category', () => {
      const articles = helpAdapter.getArticlesByCategory('category-setup');
      expect(articles.length).toBeGreaterThan(0);
      articles.forEach((article) => {
        expect(article.categoryId).toBe('category-setup');
      });
    });

    it('should return empty array for non-existent category', () => {
      const articles = helpAdapter.getArticlesByCategory('non-existent');
      expect(articles).toEqual([]);
    });

    it('should get articles from products category', () => {
      const articles = helpAdapter.getArticlesByCategory('category-products');
      expect(articles.length).toBeGreaterThan(0);
    });
  });

  describe('getKnowledgeGraphStats', () => {
    it('should return stats before sync', () => {
      const stats = helpAdapter.getKnowledgeGraphStats();
      expect(stats).toBeDefined();
      expect(stats.totalAtoms).toBeGreaterThanOrEqual(0);
      expect(stats.articles).toBe(0);
    });

    it('should return correct stats after sync', async () => {
      await helpAdapter.syncHelpCenter();
      const stats = helpAdapter.getKnowledgeGraphStats();

      expect(stats.totalAtoms).toBeGreaterThan(0);
      expect(stats.categories).toBeGreaterThan(0);
      expect(stats.articles).toBeGreaterThan(0);
      expect(stats.tags).toBeGreaterThan(0);
      expect(stats.lastSync).toBeDefined();
    });
  });

  describe('isCacheStale', () => {
    it('should return true before first sync', () => {
      expect(helpAdapter.isCacheStale()).toBe(true);
    });

    it('should return false after recent sync', async () => {
      await helpAdapter.syncHelpCenter();
      expect(helpAdapter.isCacheStale()).toBe(false);
    });
  });

  describe('invalidateCache', () => {
    it('should clear cache and re-sync', async () => {
      await helpAdapter.syncHelpCenter();
      const statsBeforeInvalidate = helpAdapter.getKnowledgeGraphStats();

      await helpAdapter.invalidateCache();
      const statsAfterInvalidate = helpAdapter.getKnowledgeGraphStats();

      expect(statsAfterInvalidate.articles).toBeGreaterThan(0);
      expect(statsAfterInvalidate.lastSync).toBeDefined();
    });
  });

  describe('getRecommendedArticles', () => {
    beforeEach(async () => {
      await helpAdapter.syncHelpCenter();
    });

    it('should return recommended articles based on context', () => {
      const recommended = helpAdapter.getRecommendedArticles(
        'setup and installation',
      );
      expect(recommended.length).toBeGreaterThan(0);
      expect(recommended.length).toBeLessThanOrEqual(5);
    });

    it('should score articles by keyword matching', () => {
      const recommended = helpAdapter.getRecommendedArticles('product listing');
      expect(recommended.length).toBeGreaterThan(0);

      // First result should be most relevant
      const firstArticle = recommended[0];
      expect(
        firstArticle.title.toLowerCase().includes('product') ||
          firstArticle.content.toLowerCase().includes('product') ||
          firstArticle.tags.some((tag) => tag.includes('product')),
      ).toBe(true);
    });

    it('should return empty array for completely irrelevant context', () => {
      const recommended = helpAdapter.getRecommendedArticles(
        'xyz123nonexistent blahblah',
      );
      expect(recommended).toEqual([]);
    });

    it('should limit results to 5', () => {
      const recommended = helpAdapter.getRecommendedArticles(
        'setup products orders inventory',
      );
      expect(recommended.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Hypergraph Integration', () => {
    beforeEach(async () => {
      await helpAdapter.syncHelpCenter();
    });

    it('should allow traversal of help content graph', () => {
      // Get a category atom
      const categoryAtom = meshService.getAtom('help-category-category-setup');
      expect(categoryAtom).toBeDefined();

      // Get incoming links (articles in this category)
      const articleLinks = meshService.getIncomingLinks(
        'help-category-category-setup',
      );
      expect(articleLinks.length).toBeGreaterThan(0);
    });

    it('should link articles to multiple tags', () => {
      // Get all tag atoms
      const setupTagLinks = meshService.getIncomingLinks('help-tag-setup');
      const installationTagLinks = meshService.getIncomingLinks(
        'help-tag-installation',
      );

      expect(setupTagLinks.length).toBeGreaterThan(0);
      expect(installationTagLinks.length).toBeGreaterThan(0);
    });

    it('should maintain truth values on links', () => {
      const links = meshService.getOutgoingLinks(
        'help-article-article-setup-install',
      );
      expect(links.length).toBeGreaterThan(0);

      // Check that links have truth values
      links.forEach((link) => {
        expect(link.truthValue).toBeDefined();
        expect(link.truthValue?.strength).toBeGreaterThan(0);
        expect(link.truthValue?.confidence).toBeGreaterThan(0);
      });
    });
  });
});
