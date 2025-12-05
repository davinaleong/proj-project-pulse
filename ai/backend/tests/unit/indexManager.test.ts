/**
 * Index Manager Unit Tests
 * Tests for Azure AI Search Index Management functionality
 */

import { SearchIndexManager } from '../../services/indexManager';
import { readFileSync } from 'fs';

// Mock the Azure SDK
jest.mock('@azure/search-documents', () => {
  const mockSearchClient = {
    uploadDocuments: jest.fn(),
    search: jest.fn(),
    getDocument: jest.fn()
  };

  const mockIndexClient = {
    createIndex: jest.fn(),
    deleteIndex: jest.fn(),
    getIndex: jest.fn(),
    listIndexes: jest.fn()
  };

  return {
    SearchIndexClient: jest.fn().mockImplementation(() => mockIndexClient),
    SearchClient: jest.fn().mockImplementation(() => mockSearchClient),
    AzureKeyCredential: jest.fn(),
    KnownAnalyzerNames: {
      EnLucene: 'en.lucene',
      Keyword: 'keyword'
    }
  };
});

jest.mock('@azure/storage-blob', () => {
  const mockBlobServiceClient = {
    getContainerClient: jest.fn().mockReturnValue({
      createIfNotExists: jest.fn(),
      getBlockBlobClient: jest.fn().mockReturnValue({
        upload: jest.fn(),
        url: 'https://test-storage.blob.core.windows.net/test-container/test-file.csv'
      })
    })
  };

  return {
    BlobServiceClient: {
      fromConnectionString: jest.fn().mockImplementation(() => mockBlobServiceClient)
    }
  };
});

jest.mock('fs', () => ({
  readFileSync: jest.fn()
}));

jest.mock('csv-parse/sync', () => ({
  parse: jest.fn()
}));

// Mock the config
jest.mock('../../config/environment', () => ({
  azureConfig: {
    search: {
      endpoint: 'https://test-search.search.windows.net',
      apiKey: 'test-key',
      indexName: 'test-index',
      semanticConfigName: 'test-semantic-config',
      apiVersion: '2024-07-01'
    }
  }
}));

describe('SearchIndexManager', () => {
  let indexManager: SearchIndexManager;
  let mockSearchClient: any;
  let mockIndexClient: any;
  let mockBlobServiceClient: any;
  const mockCsvPath = './test-data.csv';
  const mockCsvContent = `project_id,project_name,stage,description,tech_stack
1,Test Project,Implementation,A test project,React TypeScript
2,Another Project,Planning,Another test,Vue.js`;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Setup environment variables
    process.env.AZURE_STORAGE_CONNECTION_STRING = 'DefaultEndpointsProtocol=https;AccountName=test;AccountKey=test123;EndpointSuffix=core.windows.net';
    
    // Get references to the mocked clients
    const { SearchIndexClient, SearchClient } = require('@azure/search-documents');
    const { BlobServiceClient } = require('@azure/storage-blob');
    
    indexManager = new SearchIndexManager();
    
    // Access the mocked instances
    mockIndexClient = (SearchIndexClient as jest.Mock).mock.results[0].value;
    mockSearchClient = (SearchClient as jest.Mock).mock.results[0].value;
    mockBlobServiceClient = (BlobServiceClient.fromConnectionString as jest.Mock).mock.results[0].value;
    
    // Mock CSV file reading
    (readFileSync as jest.Mock).mockReturnValue(mockCsvContent);
    
    // Mock CSV parsing
    const { parse } = require('csv-parse/sync');
    (parse as jest.Mock).mockReturnValue([
      {
        project_id: '1',
        project_name: 'Test Project',
        stage: 'Implementation',
        description: 'A test project',
        tech_stack: 'React TypeScript',
        started_at: '2024-01-01',
        ended_at: '2024-12-01',
        duration_h: '100',
        cost: '5000',
        completed: 'true',
        embeddings: '[0.1, 0.2, 0.3]'
      },
      {
        project_id: '2',
        project_name: 'Another Project',
        stage: 'Planning',
        description: 'Another test',
        tech_stack: 'Vue.js',
        started_at: '2024-06-01',
        ended_at: '',
        duration_h: '50',
        cost: '2500',
        completed: 'false',
        embeddings: ''
      }
    ]);
  });

  afterEach(() => {
    delete process.env.AZURE_STORAGE_CONNECTION_STRING;
  });

  describe('Constructor', () => {
    it('should initialize with Azure credentials', () => {
      expect(indexManager).toBeInstanceOf(SearchIndexManager);
    });

    it('should initialize blob service client when connection string is available', () => {
      const { BlobServiceClient } = require('@azure/storage-blob');
      expect(BlobServiceClient.fromConnectionString).toHaveBeenCalledWith(
        process.env.AZURE_STORAGE_CONNECTION_STRING
      );
    });

    it('should not initialize blob service client when connection string is not available', () => {
      delete process.env.AZURE_STORAGE_CONNECTION_STRING;
      const { BlobServiceClient } = require('@azure/storage-blob');
      jest.clearAllMocks();
      
      new SearchIndexManager();
      expect(BlobServiceClient.fromConnectionString).not.toHaveBeenCalled();
    });
  });

  describe('createSearchIndex', () => {
    it('should create search index successfully', async () => {
      mockIndexClient.createIndex.mockResolvedValue({ name: 'test-index' });

      await indexManager.createSearchIndex();

      expect(mockIndexClient.createIndex).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'test-index',
          fields: expect.arrayContaining([
            expect.objectContaining({
              name: 'id',
              type: 'Edm.String',
              key: true
            }),
            expect.objectContaining({
              name: 'project_name',
              type: 'Edm.String',
              searchable: true
            })
          ]),
          semanticSearch: expect.objectContaining({
            configurations: expect.arrayContaining([
              expect.objectContaining({
                name: 'test-semantic-config'
              })
            ])
          }),
          vectorSearch: expect.objectContaining({
            profiles: expect.any(Array),
            algorithms: expect.any(Array)
          })
        })
      );
    });

    it('should handle index already exists error gracefully', async () => {
      const error = new Error('Index already exists');
      (error as any).statusCode = 409;
      mockIndexClient.createIndex.mockRejectedValue(error);

      // Should not throw
      await expect(indexManager.createSearchIndex()).resolves.toBeUndefined();
    });

    it('should propagate other errors', async () => {
      const error = new Error('Authentication failed');
      (error as any).statusCode = 401;
      mockIndexClient.createIndex.mockRejectedValue(error);

      await expect(indexManager.createSearchIndex()).rejects.toThrow('Authentication failed');
    });
  });

  describe('uploadDatasetToBlobStorage', () => {
    it('should upload CSV file to blob storage successfully', async () => {
      const result = await indexManager.uploadDatasetToBlobStorage(mockCsvPath);

      expect(mockBlobServiceClient.getContainerClient).toHaveBeenCalledWith('project-pulse-data');
      expect(readFileSync).toHaveBeenCalledWith(mockCsvPath);
      expect(result).toBe('https://test-storage.blob.core.windows.net/test-container/test-file.csv');
    });

    it('should throw error when blob service client is not initialized', async () => {
      delete process.env.AZURE_STORAGE_CONNECTION_STRING;
      const newIndexManager = new SearchIndexManager();

      await expect(newIndexManager.uploadDatasetToBlobStorage(mockCsvPath))
        .rejects.toThrow('Azure Blob Storage client not initialized');
    });

    it('should use custom container name', async () => {
      await indexManager.uploadDatasetToBlobStorage(mockCsvPath, 'custom-container');

      expect(mockBlobServiceClient.getContainerClient).toHaveBeenCalledWith('custom-container');
    });
  });

  describe('uploadCsvDataDirectly', () => {
    it('should parse and upload CSV data successfully', async () => {
      mockSearchClient.uploadDocuments.mockResolvedValue({
        results: [
          { key: '1', succeeded: true, errorMessage: null as string | null as string | null },
          { key: '2', succeeded: true, errorMessage: null as string | null as string | null }
        ]
      });

      await indexManager.uploadCsvDataDirectly(mockCsvPath);

      expect(readFileSync).toHaveBeenCalledWith(mockCsvPath, 'utf-8');
      expect(mockSearchClient.uploadDocuments).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.stringContaining('1_Implementation_'),
            project_id: '1',
            project_name: 'Test Project',
            stage: 'Implementation',
            description: 'A test project',
            tech_stack: 'React TypeScript',
            completed: true,
            embeddings: [0.1, 0.2, 0.3]
          }),
          expect.objectContaining({
            id: expect.stringContaining('2_Planning_'),
            project_id: '2',
            project_name: 'Another Project',
            stage: 'Planning',
            description: 'Another test',
            tech_stack: 'Vue.js',
            completed: false,
            embeddings: undefined
          })
        ])
      );
    });

    it('should handle upload failures gracefully', async () => {
      mockSearchClient.uploadDocuments.mockResolvedValue({
        results: [
          { key: '1', succeeded: true, errorMessage: null as string | null as string | null },
          { key: '2', succeeded: false, errorMessage: 'Invalid document format' }
        ]
      });

      // Should not throw, but log errors
      await expect(indexManager.uploadCsvDataDirectly(mockCsvPath)).resolves.toBeUndefined();
    });

    it('should handle batch upload errors', async () => {
      mockSearchClient.uploadDocuments.mockRejectedValue(new Error('Network error'));

      // Should not throw, but log the error
      await expect(indexManager.uploadCsvDataDirectly(mockCsvPath)).resolves.toBeUndefined();
    });

    it('should process large datasets in batches', async () => {
      // Mock a large dataset
      const largeDataset = Array.from({ length: 150 }, (_, index) => ({
        project_id: `${index + 1}`,
        project_name: `Project ${index + 1}`,
        stage: 'Implementation',
        description: `Description ${index + 1}`,
        tech_stack: 'React',
        started_at: '2024-01-01',
        ended_at: '2024-12-01',
        duration_h: '100',
        cost: '5000',
        completed: 'true'
      }));

      const { parse } = require('csv-parse/sync');
      (parse as jest.Mock).mockReturnValue(largeDataset);

      mockSearchClient.uploadDocuments.mockResolvedValue({
        results: Array.from({ length: 50 }, (_, i) => ({ 
          key: `${i}`, 
          succeeded: true, 
          errorMessage: null as string | null as string | null 
        }))
      });

      await indexManager.uploadCsvDataDirectly(mockCsvPath);

      // Should be called 3 times (150 records / 50 batch size)
      expect(mockSearchClient.uploadDocuments).toHaveBeenCalledTimes(3);
    });

    it('should handle invalid date formats gracefully', async () => {
      const { parse } = require('csv-parse/sync');
      (parse as jest.Mock).mockReturnValue([
        {
          project_id: '1',
          project_name: 'Test Project',
          started_at: 'invalid-date',
          ended_at: '2024-12-01',
          duration_h: 'invalid-number',
          cost: 'invalid-cost'
        }
      ]);

      mockSearchClient.uploadDocuments.mockResolvedValue({
        results: [{ key: '1', succeeded: true, errorMessage: null as string | null }]
      });

      await expect(indexManager.uploadCsvDataDirectly(mockCsvPath)).resolves.toBeUndefined();

      expect(mockSearchClient.uploadDocuments).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            duration_h: 0,
            cost: 0
          })
        ])
      );
    });

    it('should handle invalid embeddings format gracefully', async () => {
      const { parse } = require('csv-parse/sync');
      (parse as jest.Mock).mockReturnValue([
        {
          project_id: '1',
          project_name: 'Test Project',
          embeddings: 'invalid-embeddings-format'
        }
      ]);

      mockSearchClient.uploadDocuments.mockResolvedValue({
        results: [{ key: '1', succeeded: true, errorMessage: null as string | null }]
      });

      await indexManager.uploadCsvDataDirectly(mockCsvPath);

      expect(mockSearchClient.uploadDocuments).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            embeddings: undefined
          })
        ])
      );
    });
  });

  describe('setupComplete', () => {
    beforeEach(() => {
      mockIndexClient.createIndex.mockResolvedValue({ name: 'test-index' });
      mockSearchClient.uploadDocuments.mockResolvedValue({
        results: [
          { key: '1', succeeded: true, errorMessage: null as string | null },
          { key: '2', succeeded: true, errorMessage: null as string | null }
        ]
      });
    });

    it('should complete setup with direct upload (default)', async () => {
      await indexManager.setupComplete(mockCsvPath);

      expect(mockIndexClient.createIndex).toHaveBeenCalled();
      expect(mockSearchClient.uploadDocuments).toHaveBeenCalled();
    });

    it('should complete setup with indexer approach', async () => {
      await indexManager.setupComplete(mockCsvPath, true);

      expect(mockIndexClient.createIndex).toHaveBeenCalled();
      expect(mockBlobServiceClient.getContainerClient).toHaveBeenCalled();
    });

    it('should propagate errors from index creation', async () => {
      const error = new Error('Index creation failed');
      mockIndexClient.createIndex.mockRejectedValue(error);

      await expect(indexManager.setupComplete(mockCsvPath)).rejects.toThrow('Index creation failed');
    });

    it('should propagate errors from data upload', async () => {
      const error = new Error('Data upload failed');
      mockSearchClient.uploadDocuments.mockRejectedValue(error);
      
      // Mock CSV parsing to avoid other errors
      (readFileSync as jest.Mock).mockReturnValue('project_id,project_name\n1,Test');
      const { parse } = require('csv-parse/sync');
      (parse as jest.Mock).mockReturnValue([{ project_id: '1', project_name: 'Test' }]);

      await expect(indexManager.uploadCsvDataDirectly(mockCsvPath)).rejects.toThrow('Data upload failed');
    });
  });

  describe('deleteIndex', () => {
    it('should delete index successfully', async () => {
      mockIndexClient.deleteIndex.mockResolvedValue({});

      await indexManager.deleteIndex();

      expect(mockIndexClient.deleteIndex).toHaveBeenCalledWith('test-index');
    });

    it('should propagate deletion errors', async () => {
      const error = new Error('Index not found');
      mockIndexClient.deleteIndex.mockRejectedValue(error);

      await expect(indexManager.deleteIndex()).rejects.toThrow('Index not found');
    });
  });

  describe('createDataSource', () => {
    it('should throw error indicating REST API requirement', async () => {
      await expect(indexManager.createDataSource()).rejects.toThrow(
        'Data source creation requires SearchIndexerClient'
      );
    });

    it('should throw error when storage connection string is not set', async () => {
      delete process.env.AZURE_STORAGE_CONNECTION_STRING;

      await expect(indexManager.createDataSource()).rejects.toThrow(
        'AZURE_STORAGE_CONNECTION_STRING environment variable not set'
      );
    });
  });

  describe('createIndexer', () => {
    it('should throw error indicating REST API requirement', async () => {
      await expect(indexManager.createIndexer()).rejects.toThrow(
        'Indexer creation requires SearchIndexerClient'
      );
    });
  });

  describe('Data Transformation', () => {
    it('should handle boolean conversion correctly', async () => {
      const { parse } = require('csv-parse/sync');
      (parse as jest.Mock).mockReturnValue([
        { project_id: '1', completed: '1' },
        { project_id: '2', completed: 'true' },
        { project_id: '3', completed: 'false' },
        { project_id: '4', completed: '0' },
        { project_id: '5', completed: '' }
      ]);

      mockSearchClient.uploadDocuments.mockResolvedValue({
        results: Array.from({ length: 5 }, (_, i) => ({ 
          key: `${i + 1}`, 
          succeeded: true, 
          errorMessage: null as string | null 
        }))
      });

      await indexManager.uploadCsvDataDirectly(mockCsvPath);

      const uploadedDocs = mockSearchClient.uploadDocuments.mock.calls[0][0];
      expect(uploadedDocs[0].completed).toBe(true);  // '1'
      expect(uploadedDocs[1].completed).toBe(true);  // 'true'
      expect(uploadedDocs[2].completed).toBe(false); // 'false'
      expect(uploadedDocs[3].completed).toBe(false); // '0'
      expect(uploadedDocs[4].completed).toBe(false); // ''
    });

    it('should handle numeric conversion with invalid values', async () => {
      const { parse } = require('csv-parse/sync');
      (parse as jest.Mock).mockReturnValue([
        { project_id: '1', duration_h: '100.5', cost: '5000.25' },
        { project_id: '2', duration_h: 'invalid', cost: 'NaN' },
        { project_id: '3', duration_h: '', cost: '' }
      ]);

      mockSearchClient.uploadDocuments.mockResolvedValue({
        results: Array.from({ length: 3 }, (_, i) => ({ 
          key: `${i + 1}`, 
          succeeded: true, 
          errorMessage: null as string | null 
        }))
      });

      await indexManager.uploadCsvDataDirectly(mockCsvPath);

      const uploadedDocs = mockSearchClient.uploadDocuments.mock.calls[0][0];
      expect(uploadedDocs[0].duration_h).toBe(100.5);
      expect(uploadedDocs[0].cost).toBe(5000.25);
      expect(uploadedDocs[1].duration_h).toBe(0); // Invalid -> 0
      expect(uploadedDocs[1].cost).toBe(0);       // Invalid -> 0
      expect(uploadedDocs[2].duration_h).toBe(0); // Empty -> 0
      expect(uploadedDocs[2].cost).toBe(0);       // Empty -> 0
    });

    it('should generate unique document IDs', async () => {
      const { parse } = require('csv-parse/sync');
      (parse as jest.Mock).mockReturnValue([
        { project_id: '1', stage: 'Planning' },
        { project_id: '1', stage: 'Implementation' },
        { project_id: '2', stage: 'Planning' }
      ]);

      mockSearchClient.uploadDocuments.mockResolvedValue({
        results: Array.from({ length: 3 }, (_, i) => ({ 
          key: `${i + 1}`, 
          succeeded: true, 
          errorMessage: null as string | null 
        }))
      });

      await indexManager.uploadCsvDataDirectly(mockCsvPath);

      const uploadedDocs = mockSearchClient.uploadDocuments.mock.calls[0][0];
      const ids = uploadedDocs.map((doc: any) => doc.id);
      
      // All IDs should be unique
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids[0]).toMatch(/1_Planning_0/);
      expect(ids[1]).toMatch(/1_Implementation_1/);
      expect(ids[2]).toMatch(/2_Planning_2/);
    });
  });
});
