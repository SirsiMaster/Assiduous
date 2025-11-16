/**
 * Property Service
 * Handles all property-related API calls using authenticated Firebase
 * Uses DatabaseService from firebase-init.js for Firestore access
 */

const API_BASE_URL = 'https://us-central1-assiduous-prod.cloudfunctions.net/api';

// Import DatabaseService from firebase-init.js
let DatabaseService;

class PropertyService {
  constructor() {
    this.apiUrl = API_BASE_URL;
  }
  
  /**
   * Initialize DatabaseService on first use
   */
  async initDatabaseService() {
    if (!DatabaseService && window.Firebase?.DatabaseService) {
      DatabaseService = window.Firebase.DatabaseService;
    }
    if (!DatabaseService) {
      throw new Error('DatabaseService not initialized. Make sure firebase-init.js is loaded.');
    }
  }
  
  /**
   * Get user's saved/favorite properties from Firestore
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of complete property objects with ALL data sources
   */
  async getSavedProperties(userId) {
    try {
      if (!userId) {
        const user = firebase.auth().currentUser;
        userId = user?.uid;
      }
      
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      // Get user document with saved property IDs
      const userDoc = await this.getDb().collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        throw new Error('User profile not found');
      }
      
      const userData = userDoc.data();
      const savedPropertyIds = userData.savedProperties || [];
      
      if (savedPropertyIds.length === 0) {
        return [];
      }
      
      // Fetch complete property data for each saved ID
      const propertyPromises = savedPropertyIds.map(propId => 
        this.getCompletePropertyData(propId)
      );
      
      const properties = await Promise.all(propertyPromises);
      
      // Filter out any null results (deleted properties)
      return properties.filter(p => p !== null);
      
    } catch (error) {
      console.error('Error fetching saved properties:', error);
      throw error;
    }
  }
  
  /**
   * Get complete property data from ALL sources:
   * - Firestore base data
   * - MLS data
   * - Public records
   * - Private notes/analysis
   * @param {string} propertyId - Property ID
   * @returns {Promise<Object>} Complete property object
   */
  async getCompletePropertyData(propertyId) {
    try {
      const propertyDoc = await this.getDb().collection('properties').doc(propertyId).get();
      
      if (!propertyDoc.exists) {
        console.warn(`Property ${propertyId} not found`);
        return null;
      }
      
      const baseData = propertyDoc.data();
      
      // Fetch MLS data if available
      const mlsData = baseData.mlsId ? await this.getMLSData(baseData.mlsId) : {};
      
      // Fetch public records if available
      const publicRecords = baseData.parcelId ? await this.getPublicRecords(baseData.parcelId) : {};
      
      // Combine all data sources
      return {
        id: propertyDoc.id,
        ...baseData,
        mls: mlsData,
        publicRecords: publicRecords,
        // Computed fields
        estimatedARV: this.calculateARV(baseData, mlsData, publicRecords),
        estimatedRepairs: this.estimateRepairs(baseData, publicRecords)
      };
      
    } catch (error) {
      console.error(`Error fetching property ${propertyId}:`, error);
      return null;
    }
  }
  
  /**
   * Fetch MLS data for property
   */
  async getMLSData(mlsId) {
    try {
      const mlsDoc = await this.getDb().collection('mls_data').doc(mlsId).get();
      return mlsDoc.exists ? mlsDoc.data() : {};
    } catch (error) {
      console.error('Error fetching MLS data:', error);
      return {};
    }
  }
  
  /**
   * Fetch public records data
   */
  async getPublicRecords(parcelId) {
    try {
      const recordDoc = await this.getDb().collection('public_records').doc(parcelId).get();
      return recordDoc.exists ? recordDoc.data() : {};
    } catch (error) {
      console.error('Error fetching public records:', error);
      return {};
    }
  }
  
  /**
   * Calculate ARV from multiple data sources
   */
  calculateARV(baseData, mlsData, publicRecords) {
    // Use explicit ARV if provided
    if (baseData.arv) return baseData.arv;
    if (mlsData.estimatedValue) return mlsData.estimatedValue;
    
    // Otherwise calculate from comparable sales
    const listPrice = baseData.price || mlsData.listPrice || publicRecords.assessedValue || 0;
    const appreciation = 1.2; // 20% default appreciation
    
    return Math.round(listPrice * appreciation);
  }
  
  /**
   * Estimate repair costs from property condition
   */
  estimateRepairs(baseData, publicRecords) {
    if (baseData.repairCosts) return baseData.repairCosts;
    
    const sqft = baseData.sqft || publicRecords.sqft || 0;
    const condition = baseData.condition || 'fair';
    
    // Cost per sqft based on condition
    const costPerSqft = {
      excellent: 0,
      good: 15,
      fair: 35,
      poor: 60,
      'needs work': 80
    };
    
    return Math.round(sqft * (costPerSqft[condition.toLowerCase()] || 35));
  }

  /**
   * Fetch properties with optional filters
   * @param {Object} filters - Query parameters
   * @param {number} filters.limit - Number of results (default: 20)
   * @param {number} filters.offset - Offset for pagination
   * @param {string} filters.neighborhood - Filter by neighborhood
   * @param {number} filters.minPrice - Minimum price filter
   * @param {number} filters.maxPrice - Maximum price filter
   * @param {number} filters.minBedrooms - Minimum bedrooms
   * @param {string} filters.type - Property type (single_family, townhouse, condo, multi_family)
   * @param {string} filters.status - Property status (available, pending, sold)
   * @returns {Promise<Object>} Properties data with pagination info
   */
  async getProperties(filters = {}) {
    try {
      await this.initDatabaseService();
      
      // Use authenticated DatabaseService for Firestore access
      const result = await DatabaseService.getProperties(filters);
      
      if (result.success) {
        return { 
          properties: result.data || [], 
          total: result.data?.length || 0, 
          hasMore: false 
        };
      } else {
        throw new Error(result.error || 'Failed to fetch properties');
      }
    } catch (error) {
      console.error('Error fetching properties from DatabaseService:', error);
      // Don't try REST API - authentication is required
      return { properties: [], total: 0, hasMore: false };
    }
  }


  /**
   * Get a single property by ID
   * @param {string} propertyId - Property document ID
   * @returns {Promise<Object>} Property data
   */
  async getPropertyById(propertyId) {
    try {
      await this.initDatabaseService();
      
      // Use authenticated DatabaseService for Firestore access
      const result = await DatabaseService.getProperty(propertyId);
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || 'Property not found');
      }
    } catch (error) {
      console.error('Error fetching property:', error);
      throw error;
    }
  }

  /**
   * Create a new property
   * @param {Object} propertyData - Property information
   * @returns {Promise<Object>} Created property with ID
   */
  async createProperty(propertyData) {
    try {
      const response = await fetch(`${this.apiUrl}/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(propertyData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating property:', error);
      throw error;
    }
  }

  /**
   * Update an existing property
   * @param {string} propertyId - Property document ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Update confirmation
   */
  async updateProperty(propertyId, updates) {
    try {
      const response = await fetch(`${this.apiUrl}/properties/${propertyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating property:', error);
      throw error;
    }
  }

  /**
   * Delete a property
   * @param {string} propertyId - Property document ID
   * @returns {Promise<Object>} Deletion confirmation
   */
  async deleteProperty(propertyId) {
    try {
      const response = await fetch(`${this.apiUrl}/properties/${propertyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting property:', error);
      throw error;
    }
  }

  /**
   * Search properties by criteria
   * @param {Object} searchCriteria - Advanced search parameters
   * @returns {Promise<Object>} Matching properties
   */
  async searchProperties(searchCriteria) {
    return this.getProperties(searchCriteria);
  }

  /**
   * Get property statistics
   * @returns {Promise<Object>} Aggregated property stats
   */
  async getPropertyStats() {
    try {
      const response = await fetch(`${this.apiUrl}/properties/stats`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching property stats:', error);
      // Return default stats if API fails
      return {
        total: 0,
        available: 0,
        pending: 0,
        sold: 0,
        averagePrice: 0,
      };
    }
  }

  /**
   * Get neighborhoods list
   * @returns {Promise<Array>} List of neighborhoods
   */
  async getNeighborhoods() {
    try {
      const response = await this.getProperties({ limit: 1000 });
      if (!response || !response.properties) return [];
      const neighborhoods = [...new Set(response.properties.map(p => p.neighborhood).filter(Boolean))];
      return neighborhoods.sort();
    } catch (error) {
      console.error('Error fetching neighborhoods:', error);
      return [];
    }
  }

  /**
   * Calculate flip estimate for a property
   * @param {Object} params - Calculation parameters
   * @param {number} params.listPrice - Current listing price
   * @param {number} params.repairCost - Estimated repair costs
   * @param {number} params.arv - After repair value
   * @returns {Object} Flip estimate calculations
   */
  calculateFlipEstimate(params) {
    const { listPrice, repairCost, arv } = params;
    const totalInvestment = listPrice + repairCost;
    const holdingCosts = arv * 0.1; // 10% holding costs
    const profit = arv - totalInvestment - holdingCosts;
    const roi = (profit / totalInvestment) * 100;

    return {
      profit: Math.round(profit),
      roi: Math.round(roi * 10) / 10,
      totalInvestment: Math.round(totalInvestment),
      holdingCosts: Math.round(holdingCosts),
    };
  }

  /**
   * Format currency for display
   * @param {number} amount - Dollar amount
   * @returns {string} Formatted currency string
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Format property data for display
   * @param {Object} property - Raw property data
   * @returns {Object} Formatted property
   */
  formatProperty(property) {
    return {
      ...property,
      priceFormatted: this.formatCurrency(property.price?.list || 0),
      arvFormatted: this.formatCurrency(property.price?.arv || 0),
      repairFormatted: this.formatCurrency(property.price?.repair || 0),
      profitFormatted: this.formatCurrency(property.flipEstimate?.profit || 0),
      fullAddress: `${property.address?.street}, ${property.address?.city}, ${property.address?.state} ${property.address?.zip}`,
    };
  }
}

export { PropertyService };
