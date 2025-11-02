/**
 * Analytics Data Loader
 * Loads real-time analytics data from Firestore
 */

class AnalyticsLoader {
  constructor() {
    this.db = window.db;
    this.cache = {};
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get all analytics data at once
   */
  async getAnalytics() {
    try {
      const [properties, users, transactions, leads] = await Promise.all([
        this.getProperties(),
        this.getUsers(),
        this.getTransactions(),
        this.getLeads()
      ]);

      // Calculate metrics
      const totalSalesVolume = transactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const propertiesSold = properties.filter(p => p.status === 'sold').length;
      const activeUsers = users.filter(u => u.accountStatus === 'active').length;

      // Calculate conversion rate
      const convertedLeads = leads.filter(l => l.status === 'converted').length;
      const conversionRate = leads.length > 0 ? (convertedLeads / leads.length) * 100 : 0;

      return {
        totalSalesVolume,
        propertiesSold,
        activeUsers,
        conversionRate,
        properties,
        users,
        transactions,
        leads,
        metrics: {
          avgPrice: properties.length > 0 
            ? properties.reduce((sum, p) => sum + (p.price?.list || 0), 0) / properties.length 
            : 0,
          totalAgents: users.filter(u => u.role === 'agent').length,
          totalClients: users.filter(u => u.role === 'client').length,
          pendingTransactions: transactions.filter(t => t.status === 'pending').length
        }
      };
    } catch (error) {
      console.error('[AnalyticsLoader] Failed to load analytics:', error);
      throw error;
    }
  }

  /**
   * Get properties from Firestore
   */
  async getProperties() {
    if (this.isCached('properties')) {
      return this.cache.properties.data;
    }

    const snapshot = await this.db.collection('properties').get();
    const properties = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    this.setCached('properties', properties);
    return properties;
  }

  /**
   * Get users from Firestore
   */
  async getUsers() {
    if (this.isCached('users')) {
      return this.cache.users.data;
    }

    const snapshot = await this.db.collection('users').get();
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    this.setCached('users', users);
    return users;
  }

  /**
   * Get transactions from Firestore
   */
  async getTransactions() {
    if (this.isCached('transactions')) {
      return this.cache.transactions.data;
    }

    const snapshot = await this.db.collection('transactions').get();
    const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    this.setCached('transactions', transactions);
    return transactions;
  }

  /**
   * Get leads from Firestore
   */
  async getLeads() {
    if (this.isCached('leads')) {
      return this.cache.leads.data;
    }

    const snapshot = await this.db.collection('leads').get();
    const leads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    this.setCached('leads', leads);
    return leads;
  }

  /**
   * Get agent performance data
   */
  async getAgentPerformance() {
    const [users, transactions] = await Promise.all([
      this.getUsers(),
      this.getTransactions()
    ]);

    const agents = users.filter(u => u.role === 'agent');
    
    return agents.map(agent => {
      const agentTransactions = transactions.filter(t => t.agentId === agent.id);
      const completedTransactions = agentTransactions.filter(t => t.status === 'completed');
      const totalSales = completedTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalCommission = completedTransactions.reduce((sum, t) => sum + (t.commission || 0), 0);

      return {
        id: agent.id,
        name: `${agent.firstName} ${agent.lastName}`,
        email: agent.email,
        transactions: completedTransactions.length,
        totalSales,
        commission: totalCommission,
        avgDealSize: completedTransactions.length > 0 ? totalSales / completedTransactions.length : 0
      };
    }).sort((a, b) => b.totalSales - a.totalSales);
  }

  /**
   * Get property type performance
   */
  async getPropertyTypePerformance() {
    const properties = await this.getProperties();
    const typeStats = {};

    properties.forEach(property => {
      const type = property.details?.type || 'Unknown';
      if (!typeStats[type]) {
        typeStats[type] = { count: 0, totalValue: 0, sold: 0 };
      }
      typeStats[type].count++;
      typeStats[type].totalValue += property.price?.list || 0;
      if (property.status === 'sold') {
        typeStats[type].sold++;
      }
    });

    return Object.entries(typeStats).map(([type, stats]) => ({
      type,
      count: stats.count,
      avgPrice: stats.totalValue / stats.count,
      sold: stats.sold,
      sellThroughRate: (stats.sold / stats.count) * 100
    })).sort((a, b) => b.count - a.count);
  }

  /**
   * Check if data is cached and not expired
   */
  isCached(key) {
    if (!this.cache[key]) return false;
    const age = Date.now() - this.cache[key].timestamp;
    return age < this.cacheExpiry;
  }

  /**
   * Set cached data with timestamp
   */
  setCached(key, data) {
    this.cache[key] = {
      data,
      timestamp: Date.now()
    };
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.cache = {};
  }

  /**
   * Format currency
   */
  formatCurrency(amount) {
    if (amount >= 1000000) {
      return '$' + (amount / 1000000).toFixed(1) + 'M';
    } else if (amount >= 1000) {
      return '$' + (amount / 1000).toFixed(0) + 'K';
    }
    return '$' + amount.toLocaleString();
  }

  /**
   * Format number with K/M suffixes
   */
  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  }
}

// Export singleton
window.analyticsLoader = new AnalyticsLoader();
