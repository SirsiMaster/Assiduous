import { propertyService } from '../propertyService';
import { firebaseService } from '../firebaseservice';

// Mock Firebase service
jest.mock('../firebaseservice');

describe('Property Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CRUD Operations', () => {
    test('creates a new property listing', async () => {
      const mockProperty = {
        id: 'prop-123',
        title: 'Beautiful Home',
        address: '123 Main St',
        price: 500000,
        bedrooms: 3,
        bathrooms: 2,
        squareFeet: 2000,
        description: 'Lovely home in great neighborhood',
        images: ['image1.jpg', 'image2.jpg'],
        status: 'available',
        createdAt: new Date().toISOString()
      };

      firebaseService.create.mockResolvedValue(mockProperty);

      const result = await propertyService.createProperty({
        title: 'Beautiful Home',
        address: '123 Main St',
        price: 500000,
        bedrooms: 3,
        bathrooms: 2,
        squareFeet: 2000
      });

      expect(firebaseService.create).toHaveBeenCalledWith('properties', expect.objectContaining({
        title: 'Beautiful Home',
        price: 500000,
        status: 'available'
      }));
      expect(result.id).toBe('prop-123');
    });

    test('retrieves property by ID', async () => {
      const mockProperty = {
        id: 'prop-456',
        title: 'Luxury Condo',
        price: 750000
      };

      firebaseService.findById.mockResolvedValue(mockProperty);

      const result = await propertyService.getPropertyById('prop-456');

      expect(firebaseService.findById).toHaveBeenCalledWith('properties', 'prop-456');
      expect(result.title).toBe('Luxury Condo');
    });

    test('updates property information', async () => {
      const updatedProperty = {
        id: 'prop-789',
        title: 'Updated Home',
        price: 525000
      };

      firebaseService.update.mockResolvedValue(updatedProperty);

      const result = await propertyService.updateProperty('prop-789', {
        price: 525000
      });

      expect(firebaseService.update).toHaveBeenCalledWith('properties', 'prop-789', {
        price: 525000,
        updatedAt: expect.any(String)
      });
      expect(result.price).toBe(525000);
    });

    test('deletes property listing', async () => {
      firebaseService.delete.mockResolvedValue(true);

      const result = await propertyService.deleteProperty('prop-999');

      expect(firebaseService.delete).toHaveBeenCalledWith('properties', 'prop-999');
      expect(result).toBe(true);
    });

    test('handles property not found error', async () => {
      firebaseService.findById.mockResolvedValue(null);

      await expect(propertyService.getPropertyById('non-existent'))
        .rejects.toThrow('Property not found');
    });
  });

  describe('Search and Filter', () => {
    test('searches properties by location', async () => {
      const mockResults = [
        { id: '1', title: 'Home 1', location: 'Austin' },
        { id: '2', title: 'Home 2', location: 'Austin' }
      ];

      firebaseService.find.mockResolvedValue(mockResults);

      const results = await propertyService.searchByLocation('Austin');

      expect(firebaseService.find).toHaveBeenCalledWith('properties', {
        where: [['location', '==', 'Austin']],
        orderBy: [['createdAt', 'desc']]
      });
      expect(results).toHaveLength(2);
    });

    test('filters properties by price range', async () => {
      const mockResults = [
        { id: '1', price: 300000 },
        { id: '2', price: 450000 }
      ];

      firebaseService.find.mockResolvedValue(mockResults);

      const results = await propertyService.filterByPriceRange(250000, 500000);

      expect(firebaseService.find).toHaveBeenCalledWith('properties', {
        where: [
          ['price', '>=', 250000],
          ['price', '<=', 500000]
        ],
        orderBy: [['price', 'asc']]
      });
      expect(results).toHaveLength(2);
    });

    test('filters properties by features', async () => {
      const mockResults = [
        { id: '1', bedrooms: 3, bathrooms: 2 }
      ];

      firebaseService.find.mockResolvedValue(mockResults);

      const results = await propertyService.filterByFeatures({
        minBedrooms: 3,
        minBathrooms: 2,
        minSquareFeet: 1500
      });

      expect(firebaseService.find).toHaveBeenCalledWith('properties', expect.objectContaining({
        where: expect.arrayContaining([
          ['bedrooms', '>=', 3],
          ['bathrooms', '>=', 2],
          ['squareFeet', '>=', 1500]
        ])
      }));
      expect(results).toHaveLength(1);
    });

    test('returns empty array when no properties match', async () => {
      firebaseService.find.mockResolvedValue([]);

      const results = await propertyService.searchByLocation('NowhereVille');

      expect(results).toEqual([]);
    });
  });

  describe('Property Analytics', () => {
    test('calculates average price by location', async () => {
      const mockProperties = [
        { id: '1', location: 'Austin', price: 400000 },
        { id: '2', location: 'Austin', price: 500000 },
        { id: '3', location: 'Austin', price: 600000 }
      ];

      firebaseService.find.mockResolvedValue(mockProperties);

      const avgPrice = await propertyService.getAveragePriceByLocation('Austin');

      expect(avgPrice).toBe(500000);
    });

    test('gets property statistics', async () => {
      const mockProperties = [
        { id: '1', price: 300000, daysOnMarket: 10 },
        { id: '2', price: 500000, daysOnMarket: 20 },
        { id: '3', price: 700000, daysOnMarket: 30 }
      ];

      firebaseService.find.mockResolvedValue(mockProperties);

      const stats = await propertyService.getPropertyStatistics();

      expect(stats).toEqual({
        totalListings: 3,
        averagePrice: 500000,
        medianPrice: 500000,
        averageDaysOnMarket: 20,
        priceRange: {
          min: 300000,
          max: 700000
        }
      });
    });

    test('tracks property views', async () => {
      firebaseService.update.mockResolvedValue({ viewCount: 11 });

      const result = await propertyService.incrementViewCount('prop-123');

      expect(firebaseService.update).toHaveBeenCalledWith(
        'properties',
        'prop-123',
        expect.objectContaining({
          viewCount: expect.any(Number),
          lastViewed: expect.any(String)
        })
      );
      expect(result.viewCount).toBe(11);
    });
  });

  describe('Property Validation', () => {
    test('validates required fields', async () => {
      await expect(propertyService.createProperty({
        title: 'Missing Price'
        // price is missing
      })).rejects.toThrow('Price is required');
    });

    test('validates price is positive', async () => {
      await expect(propertyService.createProperty({
        title: 'Invalid Price',
        price: -1000
      })).rejects.toThrow('Price must be positive');
    });

    test('validates bedroom count', async () => {
      await expect(propertyService.createProperty({
        title: 'Invalid Bedrooms',
        price: 300000,
        bedrooms: -1
      })).rejects.toThrow('Invalid bedroom count');
    });

    test('validates image URLs', async () => {
      await expect(propertyService.createProperty({
        title: 'Invalid Images',
        price: 300000,
        images: ['not-a-valid-url']
      })).rejects.toThrow('Invalid image URL');
    });
  });

  describe('Batch Operations', () => {
    test('imports multiple properties', async () => {
      const properties = [
        { title: 'Home 1', price: 300000 },
        { title: 'Home 2', price: 400000 }
      ];

      firebaseService.batchCreate.mockResolvedValue([
        { id: '1', ...properties[0] },
        { id: '2', ...properties[1] }
      ]);

      const results = await propertyService.importProperties(properties);

      expect(firebaseService.batchCreate).toHaveBeenCalledWith('properties', properties);
      expect(results).toHaveLength(2);
    });

    test('updates multiple properties status', async () => {
      const propertyIds = ['prop-1', 'prop-2', 'prop-3'];

      firebaseService.batchUpdate.mockResolvedValue(true);

      const result = await propertyService.updateMultipleStatus(propertyIds, 'sold');

      expect(firebaseService.batchUpdate).toHaveBeenCalledWith(
        'properties',
        propertyIds,
        { status: 'sold', updatedAt: expect.any(String) }
      );
      expect(result).toBe(true);
    });

    test('handles batch operation failures', async () => {
      firebaseService.batchCreate.mockRejectedValue(new Error('Batch failed'));

      await expect(propertyService.importProperties([]))
        .rejects.toThrow('Batch failed');
    });
  });

  describe('Property Images', () => {
    test('uploads property images', async () => {
      const mockImageUrls = [
        'https://storage.example.com/image1.jpg',
        'https://storage.example.com/image2.jpg'
      ];

      propertyService.uploadImages = jest.fn().mockResolvedValue(mockImageUrls);

      const urls = await propertyService.uploadImages('prop-123', ['file1', 'file2']);

      expect(urls).toEqual(mockImageUrls);
    });

    test('deletes property images', async () => {
      propertyService.deleteImages = jest.fn().mockResolvedValue(true);

      const result = await propertyService.deleteImages(['image1.jpg', 'image2.jpg']);

      expect(result).toBe(true);
    });

    test('validates image file size', async () => {
      const largeFile = { size: 10 * 1024 * 1024 }; // 10MB

      await expect(propertyService.validateImageFile(largeFile))
        .rejects.toThrow('Image file too large');
    });
  });
});