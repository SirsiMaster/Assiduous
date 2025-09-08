import { dataService } from './dataservice';

/**
 * Search service with full-text search capabilities
 */
export class searchservice {
  constructor() {
    this.searchIndex = new Map();
    this.initialized = false;
  }

  /**
   * Initialize search index
   */
  async initialize() {
    if (this.initialized) return;

    // Load and index all searchable content
    await Promise.all([
      this.indexCollection('properties'),
      this.indexCollection('users')
    ]);

    this.initialized = true;
  }

  /**
   * Index a collection for searching
   */
  async indexCollection(collection) {
    const items = await dataService.find(collection);
    
    for (const item of items) {
      const searchableContent = this.extractSearchableContent(collection, item);
      const tokens = this.tokenize(searchableContent);
      
      tokens.forEach(token => {
        if (!this.searchIndex.has(token)) {
          this.searchIndex.set(token, new Map());
        }
        
        const tokenIndex = this.searchIndex.get(token);
        if (!tokenIndex.has(collection)) {
          tokenIndex.set(collection, new Set());
        }
        
        tokenIndex.get(collection).add(item._id);
      });
    }
  }

  /**
   * Extract searchable content based on collection type
   */
  extractSearchableContent(collection, item) {
    switch (collection) {
      case 'properties':
        return [
          item.basic?.address,
          item.basic?.type,
          item.details?.amenities?.join(' '),
          String(item.basic?.price),
          String(item.details?.bedrooms),
          String(item.details?.bathrooms),
          item.details?.description
        ].filter(Boolean).join(' ').toLowerCase();

      case 'users':
        return [
          item.profile?.name,
          item.profile?.email,
          item.role,
          item.profile?.specialties?.join(' ')
        ].filter(Boolean).join(' ').toLowerCase();

      default:
        return '';
    }
  }

  /**
   * Tokenize text into searchable terms
   */
  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(token => token.length > 2);
  }

  /**
   * Search across all collections or specific ones
   */
  async search(query, options = {}) {
    await this.initialize();

    const {
      collections = ['properties', 'users'],
      limit = 10,
      offset = 0,
      filters = {}
    } = options;

    const tokens = this.tokenize(query);
    const results = new Map();

    // Search for each token
    for (const token of tokens) {
      const tokenIndex = this.searchIndex.get(token);
      if (!tokenIndex) continue;

      // Search in specified collections
      for (const collection of collections) {
        const ids = tokenIndex.get(collection);
        if (!ids) continue;

        // Initialize collection results if needed
        if (!results.has(collection)) {
          results.set(collection, new Map());
        }

        // Update match scores
        for (const id of ids) {
          const currentScore = results.get(collection).get(id) || 0;
          results.get(collection).set(id, currentScore + 1);
        }
      }
    }

    // Fetch full documents and sort by relevance
    const searchResults = {};
    
    for (const [collection, scores] of results) {
      const sortedIds = Array.from(scores.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([id]) => id)
        .slice(offset, offset + limit);

      if (sortedIds.length > 0) {
        const documents = await dataService.find(collection, {
          _id: { $in: sortedIds },
          ...filters[collection]
        });

        // Sort documents by relevance score
        searchResults[collection] = documents
          .sort((a, b) => {
            return scores.get(b._id) - scores.get(a._id);
          });
      }
    }

    return searchResults;
  }

  /**
   * Suggest completions for partial search terms
   */
  async suggest(partial, collection, field, limit = 5) {
    await this.initialize();

    const pattern = new RegExp(`^${partial}`, 'i');
    const suggestions = new Set();

    this.searchIndex.forEach((collections, token) => {
      if (pattern.test(token) && collections.has(collection)) {
        suggestions.add(token);
      }
    });

    return Array.from(suggestions).slice(0, limit);
  }

  /**
   * Update search index for a single item
   */
  async updateIndex(collection, item) {
    const searchableContent = this.extractSearchableContent(collection, item);
    const tokens = this.tokenize(searchableContent);

    // Remove old tokens for this item
    this.searchIndex.forEach((collections, token) => {
      const collectionSet = collections.get(collection);
      if (collectionSet) {
        collectionSet.delete(item._id);
      }
    });

    // Add new tokens
    tokens.forEach(token => {
      if (!this.searchIndex.has(token)) {
        this.searchIndex.set(token, new Map());
      }

      const tokenIndex = this.searchIndex.get(token);
      if (!tokenIndex.has(collection)) {
        tokenIndex.set(collection, new Set());
      }

      tokenIndex.get(collection).add(item._id);
    });
  }
}

// Export singleton instance
export const searchService = new searchservice();
