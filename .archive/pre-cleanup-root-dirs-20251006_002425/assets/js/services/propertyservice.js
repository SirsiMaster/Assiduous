/**
 * Property Service
 * Handles all property-related API calls to Firebase Cloud Functions
 */

const API_BASE_URL = 'https://us-central1-assiduous-prod.cloudfunctions.net/api';

export class PropertyService {
  constructor() {
    this.apiUrl = API_BASE_URL;
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
      const queryParams = new URLSearchParams();
      
      // Add filters to query string
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });

      const url = `${this.apiUrl}/properties${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching properties:', error);
      throw error;
    }
  }

  /**
   * Get a single property by ID
   * @param {string} propertyId - Property document ID
   * @returns {Promise<Object>} Property data
   */
  async getPropertyById(propertyId) {
    try {
      const response = await fetch(`${this.apiUrl}/properties/${propertyId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.property;
    } catch (error) {
      console.error('Error fetching property:', error);
      throw error;
    }
  }

  /**
   * Get a single property by ID (alias for getPropertyById)
   * @param {string} propertyId - Property document ID
   * @returns {Promise<Object>} Property data
   */
  async getProperty(propertyId) {
    return this.getPropertyById(propertyId);
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
        body: JSON.stringify(propertyData)
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
        body: JSON.stringify(updates)
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
        method: 'DELETE'
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
        averagePrice: 0
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
      const neighborhoods = [...new Set(response.properties.map(p => p.neighborhood))];
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
    const holdingCosts = arv * 0.10; // 10% holding costs
    const profit = arv - totalInvestment - holdingCosts;
    const roi = (profit / totalInvestment) * 100;

    return {
      profit: Math.round(profit),
      roi: Math.round(roi * 10) / 10,
      totalInvestment: Math.round(totalInvestment),
      holdingCosts: Math.round(holdingCosts)
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
      maximumFractionDigits: 0
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
      fullAddress: `${property.address?.street}, ${property.address?.city}, ${property.address?.state} ${property.address?.zip}`
    };
  }
}

// Export singleton instance
export const propertyService = new PropertyService();
