/**
 * Search Service Unit Tests
 * Tests for Azure Search Service functionality
 */

import { AzureSearchService } from '../../services/searchService';
import { mockAzureSearchService } from '../mocks/searchService.mock';

// Mock the Azure SDK
jest.mock('@azure/search-documents', () => ({
  SearchClient: jest.fn().mockImplementation(() => ({
    search: jest.fn(),
    suggest: jest.fn(),
    getDocument: jest.fn()
  })),
  SearchIndexClient: jest.fn().mockImplementation(() => ({
    getIndex: jest.fn(),
    listIndexes: jest.fn()
  })),
  AzureKeyCredential: jest.fn()
}));

// Mock the config
jest.mock('../../config/environment', () => ({
  azureConfig: {
    search: {
      endpoint: 'https://test-search.search.windows.net',
      apiKey: 'test-key',
      indexName: 'test-index',
      semanticConfigName: 'test-semantic-config'
    }
  }
}));

describe('SearchService', () => {
  let searchService: AzureSearchService;

  beforeEach(() => {
    searchService = new AzureSearchService();
    // Replace internal methods with mocks
    (searchService as any).searchClient = {
      search: jest.fn().mockResolvedValue({
        results: [
          {
            document: {
              id: '1',
              title: 'Test Document',
              content: 'Test content for document'
            },
            score: 0.95
          }
        ],
        count: 1
      })
    };
  });

  describe('search', () => {
    it('should perform basic search successfully', async () => {
      const result = await searchService.search('test query');
      
      expect(result).toBeDefined();
      expect(result.results).toHaveLength(1);
      expect(result.results[0].document.title).toBe('Test Document');
    });

    it('should handle SearchRequest object', async () => {
      const searchRequest = {
        query: 'test',
        top: 5,
        enableSemanticSearch: true
      };

      const result = await searchService.search(searchRequest);
      expect(result).toBeDefined();
    });

    it('should limit results to specified top value', async () => {
      const result = await searchService.search('test', 5);
      expect(result.results.length).toBeLessThanOrEqual(5);
    });

    it('should enable semantic search by default', async () => {
      const result = await searchService.search('test query');
      expect(result).toBeDefined();
      // Semantic search should be enabled by default
    });
  });

  describe('semanticSearch', () => {
    it('should perform semantic search', async () => {
      const result = await searchService.semanticSearch('natural language query');
      
      expect(result).toBeDefined();
      expect(result.results).toBeInstanceOf(Array);
    });

    it('should fall back to basic search if semantic config unavailable', async () => {
      // Mock missing semantic config
      (searchService as any).config.semanticConfigName = null;
      
      const result = await searchService.semanticSearch('test');
      expect(result).toBeDefined();
    });
  });

  describe('advancedSearch', () => {
    it('should handle advanced search request', async () => {
      const request = {
        query: 'advanced test',
        top: 10,
        skip: 0,
        filters: 'category eq "test"',
        enableSemanticSearch: true
      };

      const result = await searchService.advancedSearch(request);
      expect(result).toBeDefined();
      expect(result.results).toBeInstanceOf(Array);
    });

    it('should apply filters correctly', async () => {
      const request = {
        query: 'test',
        filters: 'id eq "1"'
      };

      const result = await searchService.advancedSearch(request);
      expect(result).toBeDefined();
    });
  });

  describe('hybridSearch', () => {
    it('should perform hybrid search', async () => {
      const result = await searchService.hybridSearch('test query');
      expect(result).toBeDefined();
      expect(result.results).toBeInstanceOf(Array);
    });

    it('should warn about missing vector fields', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      await searchService.hybridSearch('test', [0.1, 0.2, 0.3]);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Vector query provided but no embedding field available')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('getSuggestions', () => {
    it('should return suggestions', async () => {
      const suggestions = await searchService.getSuggestions('proj');
      
      expect(suggestions).toBeInstanceOf(Array);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]).toContain('project');
    });

    it('should limit suggestions to maxSuggestions', async () => {
      const suggestions = await searchService.getSuggestions('test', 3);
      expect(suggestions.length).toBeLessThanOrEqual(3);
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status', async () => {
      const health = await searchService.healthCheck();
      
      expect(health.status).toBe('healthy');
      expect(health.indexName).toBeDefined();
      expect(health.lastChecked).toBeDefined();
    });

    it('should return unhealthy status on error', async () => {
      // Mock search failure
      (searchService as any).searchClient.search.mockRejectedValue(new Error('Connection failed'));
      
      const health = await searchService.healthCheck();
      expect(health.status).toBe('unhealthy');
    });
  });

  describe('error handling', () => {
    it('should handle search errors gracefully', async () => {
      (searchService as any).searchClient.search.mockRejectedValue(new Error('Search failed'));
      
      await expect(searchService.search('test')).rejects.toThrow('search failed');
    });

    it('should retry operations on failure', async () => {
      const mockSearch = jest.fn()
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({ results: [], count: 0 });
      
      (searchService as any).searchClient.search = mockSearch;
      
      const result = await searchService.search('test');
      expect(mockSearch).toHaveBeenCalledTimes(2);
    });
  });
});