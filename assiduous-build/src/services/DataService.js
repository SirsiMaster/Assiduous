/**
 * DataService - Database abstraction layer that works with both
 * GitHub-based JSON storage and future MongoDB implementation
 */
class DataService {
  constructor() {
    this.baseUrl = window.location.hostname.includes('github.io') 
      ? 'https://api.github.com/repos/SirsiMaster/Assiduous/dispatches'
      : 'http://localhost:3000';
    this.token = localStorage.getItem('auth_token');
  }

  /**
   * Creates headers with authentication
   */
  #getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    };
  }

  /**
   * Dispatches database operation via GitHub Actions
   */
  async #dispatchOperation(operation, collection, query = {}, data = {}) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.#getHeaders(),
        body: JSON.stringify({
          event_type: 'db_operation',
          client_payload: {
            operation,
            collection,
            query: JSON.stringify(query),
            data: JSON.stringify(data)
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Database operation failed:', error);
      throw error;
    }
  }

  /**
   * Cache management
   */
  #cache = {
    data: new Map(),
    timeouts: new Map(),

    set(key, value, ttl = 300000) { // 5 minutes default TTL
      this.data.set(key, value);
      const timeout = setTimeout(() => this.data.delete(key), ttl);
      this.timeouts.set(key, timeout);
    },

    get(key) {
      return this.data.get(key);
    },

    clear(key) {
      if (this.timeouts.has(key)) {
        clearTimeout(this.timeouts.get(key));
        this.timeouts.delete(key);
      }
      this.data.delete(key);
    }
  };

  /**
   * Reads documents from collection
   */
  async find(collection, query = {}) {
    const cacheKey = `${collection}:${JSON.stringify(query)}`;
    const cached = this.#cache.get(cacheKey);
    if (cached) return cached;

    const result = await this.#dispatchOperation('read', collection, query);
    this.#cache.set(cacheKey, result);
    return result;
  }

  /**
   * Creates a new document
   */
  async create(collection, data) {
    const result = await this.#dispatchOperation('create', collection, {}, data);
    // Clear collection cache
    this.#cache.clear(`${collection}:`);
    return result;
  }

  /**
   * Updates documents matching query
   */
  async update(collection, query, data) {
    const result = await this.#dispatchOperation('update', collection, query, data);
    // Clear related caches
    this.#cache.clear(`${collection}:`);
    this.#cache.clear(`${collection}:${JSON.stringify(query)}`);
    return result;
  }

  /**
   * Deletes documents matching query
   */
  async delete(collection, query) {
    const result = await this.#dispatchOperation('delete', collection, query);
    // Clear related caches
    this.#cache.clear(`${collection}:`);
    this.#cache.clear(`${collection}:${JSON.stringify(query)}`);
    return result;
  }

  /**
   * Handles offline data
   */
  async syncOfflineData() {
    const offlineData = JSON.parse(localStorage.getItem('offlineData') || '[]');
    
    for (const operation of offlineData) {
      try {
        await this.#dispatchOperation(
          operation.type,
          operation.collection,
          operation.query,
          operation.data
        );
      } catch (error) {
        console.error('Sync failed for operation:', operation, error);
      }
    }
    
    localStorage.removeItem('offlineData');
  }

  /**
   * Queues operation for offline processing
   */
  queueOfflineOperation(type, collection, query, data) {
    const offlineData = JSON.parse(localStorage.getItem('offlineData') || '[]');
    offlineData.push({ type, collection, query, data });
    localStorage.setItem('offlineData', JSON.stringify(offlineData));
  }
}

// Export singleton instance
export const dataService = new DataService();
