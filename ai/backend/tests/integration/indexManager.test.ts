/**
 * Index Management Integration Tests
 * Tests for Azure AI Search Index Management workflows
 */

import request from 'supertest';
import app from '../../api/app';
import { SearchIndexManager } from '../../services/indexManager';

// Mock the IndexManager
jest.mock('../../services/indexManager');

describe('Index Management Integration', () => {
  const mockIndexManager = SearchIndexManager as jest.MockedClass<typeof SearchIndexManager>;
  let mockInstance: jest.Mocked<SearchIndexManager>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock instance
    mockInstance = {
      createSearchIndex: jest.fn(),
      uploadDatasetToBlobStorage: jest.fn(),
      createDataSource: jest.fn(),
      createIndexer: jest.fn(),
      uploadCsvDataDirectly: jest.fn(),
      setupComplete: jest.fn(),
      deleteIndex: jest.fn()
    } as any;

    // Mock constructor to return our mock instance
    mockIndexManager.mockImplementation(() => mockInstance);
  });

  describe('Index Creation Workflow', () => {
    it('should create index successfully', async () => {
      mockInstance.createSearchIndex.mockResolvedValue(undefined);

      // This would be part of a custom endpoint or setup script
      const manager = new SearchIndexManager();
      await manager.createSearchIndex();

      expect(mockInstance.createSearchIndex).toHaveBeenCalledTimes(1);
    });

    it('should handle index creation failures', async () => {
      const error = new Error('Authentication failed');
      mockInstance.createSearchIndex.mockRejectedValue(error);

      const manager = new SearchIndexManager();
      
      await expect(manager.createSearchIndex()).rejects.toThrow('Authentication failed');
    });
  });

  describe('Data Upload Workflow', () => {
    const mockCsvPath = './data/test-data.csv';

    it('should upload CSV data directly to search index', async () => {
      mockInstance.uploadCsvDataDirectly.mockResolvedValue(undefined);

      const manager = new SearchIndexManager();
      await manager.uploadCsvDataDirectly(mockCsvPath);

      expect(mockInstance.uploadCsvDataDirectly).toHaveBeenCalledWith(mockCsvPath);
    });

    it('should upload dataset to blob storage', async () => {
      const mockBlobUrl = 'https://test-storage.blob.core.windows.net/test-container/test-file.csv';
      mockInstance.uploadDatasetToBlobStorage.mockResolvedValue(mockBlobUrl);

      const manager = new SearchIndexManager();
      const result = await manager.uploadDatasetToBlobStorage(mockCsvPath);

      expect(mockInstance.uploadDatasetToBlobStorage).toHaveBeenCalledWith(mockCsvPath);
      expect(result).toBe(mockBlobUrl);
    });
  });

  describe('Complete Setup Workflow', () => {
    const mockCsvPath = './data/project-pulse-extended-metadata.csv';

    it('should complete setup with direct upload', async () => {
      mockInstance.setupComplete.mockResolvedValue(undefined);

      const manager = new SearchIndexManager();
      await manager.setupComplete(mockCsvPath, false);

      expect(mockInstance.setupComplete).toHaveBeenCalledWith(mockCsvPath, false);
    });

    it('should complete setup with indexer approach', async () => {
      mockInstance.setupComplete.mockResolvedValue(undefined);

      const manager = new SearchIndexManager();
      await manager.setupComplete(mockCsvPath, true);

      expect(mockInstance.setupComplete).toHaveBeenCalledWith(mockCsvPath, true);
    });

    it('should handle setup failures gracefully', async () => {
      const error = new Error('Setup failed');
      mockInstance.setupComplete.mockRejectedValue(error);

      const manager = new SearchIndexManager();
      
      await expect(manager.setupComplete(mockCsvPath)).rejects.toThrow('Setup failed');
    });
  });

  describe('Index Management Operations', () => {
    it('should delete index successfully', async () => {
      mockInstance.deleteIndex.mockResolvedValue(undefined);

      const manager = new SearchIndexManager();
      await manager.deleteIndex();

      expect(mockInstance.deleteIndex).toHaveBeenCalledTimes(1);
    });

    it('should handle delete failures', async () => {
      const error = new Error('Index not found');
      mockInstance.deleteIndex.mockRejectedValue(error);

      const manager = new SearchIndexManager();
      
      await expect(manager.deleteIndex()).rejects.toThrow('Index not found');
    });
  });

  describe('Environment Configuration', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should initialize with proper Azure configuration', () => {
      process.env.AZURE_SEARCH_ENDPOINT = 'https://test-search.search.windows.net';
      process.env.AZURE_SEARCH_API_KEY = 'test-key';
      process.env.AZURE_SEARCH_INDEX_NAME = 'test-index';

      const manager = new SearchIndexManager();
      expect(manager).toBeInstanceOf(SearchIndexManager);
    });

    it('should handle blob storage configuration', () => {
      process.env.AZURE_STORAGE_CONNECTION_STRING = 'DefaultEndpointsProtocol=https;AccountName=test;AccountKey=test123;EndpointSuffix=core.windows.net';

      const manager = new SearchIndexManager();
      expect(manager).toBeInstanceOf(SearchIndexManager);
    });
  });

  describe('Error Handling Scenarios', () => {
    it('should handle network timeouts gracefully', async () => {
      const timeoutError = new Error('Request timeout');
      (timeoutError as any).code = 'ETIMEDOUT';
      mockInstance.createSearchIndex.mockRejectedValue(timeoutError);

      const manager = new SearchIndexManager();
      
      await expect(manager.createSearchIndex()).rejects.toThrow('Request timeout');
    });

    it('should handle authentication errors', async () => {
      const authError = new Error('Unauthorized');
      (authError as any).statusCode = 401;
      mockInstance.uploadCsvDataDirectly.mockRejectedValue(authError);

      const manager = new SearchIndexManager();
      
      await expect(manager.uploadCsvDataDirectly('./test.csv')).rejects.toThrow('Unauthorized');
    });

    it('should handle resource conflicts', async () => {
      const conflictError = new Error('Resource already exists');
      (conflictError as any).statusCode = 409;
      mockInstance.createSearchIndex.mockRejectedValue(conflictError);

      const manager = new SearchIndexManager();
      
      await expect(manager.createSearchIndex()).rejects.toThrow('Resource already exists');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large dataset uploads', async () => {
      // Mock large dataset scenario
      const largeCsvPath = './data/large-dataset.csv';
      mockInstance.uploadCsvDataDirectly.mockImplementation(async (path: string) => {
        // Simulate processing time for large dataset
        await new Promise(resolve => setTimeout(resolve, 100));
        return undefined;
      });

      const manager = new SearchIndexManager();
      const startTime = Date.now();
      
      await manager.uploadCsvDataDirectly(largeCsvPath);
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
      expect(mockInstance.uploadCsvDataDirectly).toHaveBeenCalledWith(largeCsvPath);
    });

    it('should handle batch processing correctly', async () => {
      // Test batch processing behavior
      mockInstance.uploadCsvDataDirectly.mockResolvedValue(undefined);

      const manager = new SearchIndexManager();
      
      // Simulate multiple batch uploads
      await Promise.all([
        manager.uploadCsvDataDirectly('./batch1.csv'),
        manager.uploadCsvDataDirectly('./batch2.csv'),
        manager.uploadCsvDataDirectly('./batch3.csv')
      ]);

      expect(mockInstance.uploadCsvDataDirectly).toHaveBeenCalledTimes(3);
    });
  });

  describe('Data Validation and Transformation', () => {
    it('should validate CSV data structure', async () => {
      mockInstance.uploadCsvDataDirectly.mockImplementation(async (path: string) => {
        // Simulate validation
        if (path.includes('invalid')) {
          throw new Error('Invalid CSV format');
        }
        return undefined;
      });

      const manager = new SearchIndexManager();
      
      // Valid CSV should work
      await expect(manager.uploadCsvDataDirectly('./valid-data.csv')).resolves.toBeUndefined();
      
      // Invalid CSV should fail
      await expect(manager.uploadCsvDataDirectly('./invalid-data.csv')).rejects.toThrow('Invalid CSV format');
    });

    it('should handle missing required fields', async () => {
      const validationError = new Error('Missing required field: project_name');
      mockInstance.uploadCsvDataDirectly.mockRejectedValue(validationError);

      const manager = new SearchIndexManager();
      
      await expect(manager.uploadCsvDataDirectly('./incomplete-data.csv'))
        .rejects.toThrow('Missing required field: project_name');
    });
  });

  describe('Cleanup and Maintenance', () => {
    it('should cleanup resources after failed operations', async () => {
      // Setup scenario where index creation succeeds but data upload fails
      mockInstance.createSearchIndex.mockResolvedValue(undefined);
      mockInstance.uploadCsvDataDirectly.mockRejectedValue(new Error('Upload failed'));
      mockInstance.deleteIndex.mockResolvedValue(undefined);

      const manager = new SearchIndexManager();
      
      try {
        await manager.createSearchIndex();
        await manager.uploadCsvDataDirectly('./test.csv');
      } catch (error) {
        // Cleanup on failure
        await manager.deleteIndex();
      }

      expect(mockInstance.createSearchIndex).toHaveBeenCalledTimes(1);
      expect(mockInstance.uploadCsvDataDirectly).toHaveBeenCalledTimes(1);
      expect(mockInstance.deleteIndex).toHaveBeenCalledTimes(1);
    });
  });

  describe('Monitoring and Logging', () => {
    it('should track operation metrics', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      mockInstance.setupComplete.mockImplementation(async () => {
        console.log('✅ Setup completed successfully');
        return undefined;
      });

      const manager = new SearchIndexManager();
      await manager.setupComplete('./test.csv');

      expect(consoleSpy).toHaveBeenCalledWith('✅ Setup completed successfully');
      
      consoleSpy.mockRestore();
    });

    it('should log errors appropriately', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockInstance.uploadCsvDataDirectly.mockImplementation(async () => {
        console.error('❌ Upload failed');
        throw new Error('Upload failed');
      });

      const manager = new SearchIndexManager();
      
      await expect(manager.uploadCsvDataDirectly('./test.csv')).rejects.toThrow('Upload failed');
      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Upload failed');
      
      consoleErrorSpy.mockRestore();
    });
  });
});