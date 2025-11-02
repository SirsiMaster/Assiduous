/**
 * Analytics Data Loader - Firestore Integration
 * Replaces hardcoded mock data with real Firestore queries
 */

import { DatabaseService } from '../../assets/js/firebase-init.js';

export const AnalyticsDataLoader = {
  /**
   * Load and calculate all analytics KPIs
   */
  async loadAnalyticsData() {
    try {
      const [properties, transactions, users, leads] = await Promise.all([
        DatabaseService.getDocuments('properties'),
        DatabaseService.getDocuments('transactions'),
        DatabaseService.getDocuments('users'),
        DatabaseService.getDocuments('leads')
      ]);

      return {
        properties,
        transactions,
        users,
        leads,
        kpis: this.calculateKPIs(properties, transactions, users, leads)
      };
    } catch (error) {
      console.error('Error loading analytics data:', error);
      throw error;
    }
  },

  /**
   * Calculate KPI metrics from Firestore data
   */
  calculateKPIs(properties, transactions, users, leads) {
    // Total Sales Volume
    const totalSalesVolume = transactions
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    // Properties Sold
    const propertiesSold = properties.filter(p => p.status === 'sold').length;

    // Active Users (users with activity in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeUsers = users.filter(u => {
      if (u.lastLoginAt) {
        const lastLogin = u.lastLoginAt.toDate ? u.lastLoginAt.toDate() : new Date(u.lastLoginAt);
        return lastLogin >= thirtyDaysAgo;
      }
      return false;
    }).length;

    // Conversion Rate (leads to transactions)
    const conversionRate = leads.length > 0 
      ? ((transactions.length / leads.length) * 100).toFixed(1)
      : 0;

    // Average Time to Close (in days)
    const completedTransactions = transactions.filter(t => t.status === 'completed' && t.closedAt && t.createdAt);
    const avgTimeToClose = completedTransactions.length > 0
      ? Math.round(
          completedTransactions.reduce((sum, t) => {
            const created = t.createdAt.toDate ? t.createdAt.toDate() : new Date(t.createdAt);
            const closed = t.closedAt.toDate ? t.closedAt.toDate() : new Date(t.closedAt);
            const days = (closed - created) / (1000 * 60 * 60 * 24);
            return sum + days;
          }, 0) / completedTransactions.length
        )
      : 0;

    // Client Satisfaction (average rating from completed transactions)
    const ratedTransactions = transactions.filter(t => t.clientRating);
    const clientSatisfaction = ratedTransactions.length > 0
      ? (ratedTransactions.reduce((sum, t) => sum + t.clientRating, 0) / ratedTransactions.length).toFixed(1)
      : 4.5; // Default

    return {
      totalSalesVolume,
      propertiesSold,
      activeUsers,
      conversionRate,
      avgTimeToClose,
      clientSatisfaction
    };
  },

  /**
   * Update KPI cards on the page
   */
  updateKPICards(kpis) {
    // Sales Volume
    const salesVolumeEl = document.querySelector('.kpi-card:nth-child(1) .kpi-value');
    if (salesVolumeEl) {
      salesVolumeEl.textContent = '$' + (kpis.totalSalesVolume / 1000000).toFixed(1) + 'M';
    }

    // Properties Sold
    const propertiesSoldEl = document.querySelector('.kpi-card:nth-child(2) .kpi-value');
    if (propertiesSoldEl) {
      propertiesSoldEl.textContent = kpis.propertiesSold.toLocaleString();
    }

    // Active Users
    const activeUsersEl = document.querySelector('.kpi-card:nth-child(3) .kpi-value');
    if (activeUsersEl) {
      activeUsersEl.textContent = kpis.activeUsers.toLocaleString();
    }

    // Conversion Rate
    const conversionRateEl = document.querySelector('.kpi-card:nth-child(4) .kpi-value');
    if (conversionRateEl) {
      conversionRateEl.textContent = kpis.conversionRate + '%';
    }

    // Avg Time to Close
    const avgTimeEl = document.querySelector('.kpi-card:nth-child(5) .kpi-value');
    if (avgTimeEl) {
      avgTimeEl.textContent = kpis.avgTimeToClose + ' days';
    }

    // Client Satisfaction
    const satisfactionEl = document.querySelector('.kpi-card:nth-child(6) .kpi-value');
    if (satisfactionEl) {
      satisfactionEl.textContent = kpis.clientSatisfaction;
    }
  },

  /**
   * Generate sales funnel data from real data
   */
  generateSalesFunnel(leads, properties, transactions) {
    // Calculate funnel stages
    const websiteVisitors = leads.length * 4; // Estimate: 4 visitors per lead
    const propertyInquiries = leads.length;
    const propertyViewings = Math.round(leads.length * 0.3); // 30% conversion to viewings
    const offersMade = transactions.filter(t => t.status !== 'cancelled').length;
    const dealsClosed = transactions.filter(t => t.status === 'completed').length;

    return {
      websiteVisitors,
      propertyInquiries,
      propertyViewings,
      offersMade,
      dealsClosed
    };
  },

  /**
   * Generate agent performance data
   */
  async generateAgentPerformance() {
    try {
      const [agents, transactions] = await Promise.all([
        DatabaseService.getDocuments('users', [
          { field: 'role', operator: '==', value: 'agent' }
        ]),
        DatabaseService.getDocuments('transactions')
      ]);

      return agents.map(agent => {
        const agentTransactions = transactions.filter(t => t.agentId === agent.id && t.status === 'completed');
        const totalSales = agentTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
        const avgCommission = agentTransactions.length > 0 ? totalSales * 0.03 : 0; // 3% commission

        return {
          id: agent.id,
          name: agent.displayName || 'Unknown Agent',
          avatar: (agent.displayName || 'UA').substring(0, 2).toUpperCase(),
          properties: agentTransactions.length,
          totalSales: totalSales,
          avgCommission: avgCommission,
          performanceScore: Math.min(100, (agentTransactions.length / (agents.length > 0 ? 35 : 1)) * 100)
        };
      }).sort((a, b) => b.totalSales - a.totalSales).slice(0, 5); // Top 5 agents
    } catch (error) {
      console.error('Error generating agent performance:', error);
      return [];
    }
  },

  /**
   * Generate property type performance data
   */
  generatePropertyTypePerformance(properties, transactions) {
    const types = ['single_family', 'condo', 'townhouse', 'multi_family'];
    const typeNames = {
      single_family: 'Single Family',
      condo: 'Condos',
      townhouse: 'Townhouses',
      multi_family: 'Multi-Family'
    };

    return types.map(type => {
      const typeProperties = properties.filter(p => p.details?.type === type);
      const soldProperties = typeProperties.filter(p => p.status === 'sold');
      const avgPrice = typeProperties.length > 0
        ? typeProperties.reduce((sum, p) => sum + (p.price?.list || 0), 0) / typeProperties.length
        : 0;
      
      // Calculate average days on market
      const propertiesWithDates = soldProperties.filter(p => p.listedAt && p.soldAt);
      const avgDOM = propertiesWithDates.length > 0
        ? Math.round(
            propertiesWithDates.reduce((sum, p) => {
              const listed = p.listedAt.toDate ? p.listedAt.toDate() : new Date(p.listedAt);
              const sold = p.soldAt.toDate ? p.soldAt.toDate() : new Date(p.soldAt);
              return sum + ((sold - listed) / (1000 * 60 * 60 * 24));
            }, 0) / propertiesWithDates.length
          )
        : 0;

      return {
        type: typeNames[type] || type,
        listed: typeProperties.length,
        sold: soldProperties.length,
        avgPrice: '$' + Math.round(avgPrice / 1000) + 'K',
        avgDOM: avgDOM + ' days'
      };
    });
  }
};
