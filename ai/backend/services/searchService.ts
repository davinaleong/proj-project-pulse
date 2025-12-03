/**
 * Azure AI Search Service Client
 * 
 * Updated to match actual search index schema:
 * - id: string (key, searchable, filterable, sortable, facetable)  
 * - title: string (searchable, retrievable)
 * - content: string (searchable, retrievable, standard.lucene analyzer)
 * - Semantic search configuration available
 * - No vector/embedding fields in current schema
 */

import { 
  SearchClient, 
  SearchIndexClient,
  SearchDocumentsResult, 
  SearchOptions,
  SearchResult,
  AzureKeyCredential
} from '@azure/search-documents';

import { azureConfig } from '../config/environment';

/**
 * Document interface for Project Pulse search index
 * Based on actual Azure Search index schema
 */
export interface ProjectDocument {
  id: string;          // Key field, searchable, filterable, sortable, facetable
  title: string;       // Searchable, retrievable
  content: string;     // Searchable, retrievable, uses standard.lucene analyzer
  '@search.score'?: number;
  '@search.reranker_score'?: number;
}

/**
 * Search request parameters
 */
export interface SearchRequest {
  query: string;
  top?: number;
  skip?: number;
  filters?: string;
  orderBy?: string[];
  select?: string[];
  facets?: string[];
  enableSemanticSearch?: boolean;
}

/**
 * Search response with enhanced metadata
 */
export interface SearchResponse<T extends object = ProjectDocument> {
  results: SearchResult<T>[];
  count?: number;
  facets?: { [key: string]: any };
  semanticAnswers?: any[];
  coverage?: number;
  executionTime?: number;
}

/**
 * Azure AI Search Service Client
 * Provides comprehensive search capabilities with Azure best practices
 */
export class AzureSearchService {
  private readonly searchClient: SearchClient<ProjectDocument>;
  private readonly indexClient: SearchIndexClient;
  private readonly config = azureConfig.search;
  
  constructor() {
    try {
      // Initialize search client with API key authentication
      const credential = new AzureKeyCredential(this.config.apiKey);
      
      this.searchClient = new SearchClient<ProjectDocument>(
        this.config.endpoint,
        this.config.indexName,
        credential
      );

      // Initialize index management client
      this.indexClient = new SearchIndexClient(
        this.config.endpoint,
        credential
      );

      console.log('✅ Azure Search Service initialized with API key');
      
    } catch (error) {
      console.error('❌ Failed to initialize Azure Search Service:', error);
      throw new Error(`Search Service Initialization Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Performs text-based search with optional semantic ranking
   * @param query Search query string or SearchRequest object
   * @param top Number of results to return (1-100)
   * @param enableSemantic Whether to use semantic search capabilities
   * @returns Search results with relevance scoring
   */
  async search(
    query: string | SearchRequest,
    top: number = 10,
    enableSemantic: boolean = true
  ): Promise<SearchResponse<ProjectDocument>> {
    try {
      // Handle SearchRequest object or string query
      if (typeof query === 'object') {
        return this.advancedSearch(query);
      }
      
      console.log(`🔍 Executing ${enableSemantic ? 'semantic' : 'basic'} search: "${query}"`);
      
      const searchOptions: SearchOptions<ProjectDocument> = {
        top: Math.min(Math.max(top, 1), 100),
        select: ['id', 'title', 'content'] as any,
        includeTotalCount: true
      };

      // Enable semantic search if available and requested
      if (enableSemantic && this.config.semanticConfigName) {
        (searchOptions as any).queryType = 'semantic';
        (searchOptions as any).semanticSearchOptions = {
          configurationName: this.config.semanticConfigName,
          captions: { captionType: 'extractive' },
          answers: { answerType: 'extractive', count: 3 }
        };
      }

      const results = await this.executeWithRetry(
        () => this.searchClient.search(query, searchOptions)
      );

      const searchResults = await this.collectResults(results);
      
      console.log(`✅ Search completed: ${searchResults.length} results found`);
      
      return {
        results: searchResults,
        count: results.count,
        semanticAnswers: (results as any).semanticPartialResponseType ? [] : undefined,
        coverage: 100,
        executionTime: performance.now()
      };
      
    } catch (error) {
      console.error('❌ Search operation failed:', error);
      throw this.enhanceError(error, 'search');
    }
  }

  /**
   * Performs advanced semantic search with enhanced understanding
   * @param query Natural language query
   * @param top Number of results to return
   * @returns Semantically ranked search results
   */
  async semanticSearch(
    query: string,
    top: number = 10
  ): Promise<SearchResponse<ProjectDocument>> {
    try {
      console.log(`🧠 Executing semantic search: "${query}"`);
      
      if (!this.config.semanticConfigName) {
        console.warn('⚠️ Semantic configuration not available, falling back to basic search');
        return this.search(query, top, false);
      }

      const searchOptions: SearchOptions<ProjectDocument> = {
        top: Math.min(Math.max(top, 1), 100),
        select: ['id', 'title', 'content'] as any,
        includeTotalCount: true
      };

      // Enable semantic search
      (searchOptions as any).queryType = 'semantic';
      (searchOptions as any).semanticSearchOptions = {
        configurationName: this.config.semanticConfigName,
        captions: { captionType: 'extractive' },
        answers: { answerType: 'extractive', count: 3 }
      };

      const results = await this.executeWithRetry(
        () => this.searchClient.search(query, searchOptions)
      );

      const searchResults = await this.collectResults(results);
      
      console.log(`✅ Semantic search completed: ${searchResults.length} results found`);
      
      return {
        results: searchResults,
        count: results.count,
        semanticAnswers: (results as any).answers || [],
        coverage: 100,
        executionTime: performance.now()
      };
      
    } catch (error) {
      console.error('❌ Semantic search failed:', error);
      throw this.enhanceError(error, 'semantic search');
    }
  }

  /**
   * Performs advanced search with full customization
   * @param request Comprehensive search request
   * @returns Detailed search response
   */
  async advancedSearch(request: SearchRequest): Promise<SearchResponse<ProjectDocument>> {
    try {
      console.log(`🔧 Executing advanced search: "${request.query}"`);
      
      const searchOptions: SearchOptions<ProjectDocument> = {
        top: request.top || 10,
        skip: request.skip || 0,
        filter: request.filters,
        orderBy: request.orderBy,
        select: (request.select || ['id', 'title', 'content']) as any,
        facets: request.facets,
        includeTotalCount: true
      };

      // Enable semantic search if requested and available
      if (request.enableSemanticSearch && this.config.semanticConfigName) {
        (searchOptions as any).queryType = 'semantic';
        (searchOptions as any).semanticSearchOptions = {
          configurationName: this.config.semanticConfigName,
          captions: { captionType: 'extractive' },
          answers: { answerType: 'extractive', count: 3 }
        };
      }

      const results = await this.executeWithRetry(
        () => this.searchClient.search(request.query, searchOptions)
      );

      const searchResults = await this.collectResults(results);
      
      console.log(`✅ Advanced search completed: ${searchResults.length} results found`);
      
      return {
        results: searchResults,
        count: results.count,
        facets: (results as any).facets,
        semanticAnswers: (results as any).answers || [],
        coverage: 100,
        executionTime: performance.now()
      };
      
    } catch (error) {
      console.error('❌ Advanced search failed:', error);
      throw this.enhanceError(error, 'advanced search');
    }
  }

  /**
   * Hybrid search method for RAG compatibility
   * @param query Search query
   * @param vectorQuery Vector query (ignored in current schema)
   * @param maxResults Maximum results to return
   * @returns Search results
   */
  async hybridSearch(
    query: string,
    vectorQuery?: number[],
    maxResults: number = 10
  ): Promise<SearchResponse<ProjectDocument>> {
    // Since we don't have vector fields, just perform semantic search
    console.log(`🔀 Hybrid search requested, performing semantic search instead`);
    if (vectorQuery) {
      console.warn('Vector query provided but no embedding field available');
    }
    return this.semanticSearch(query, maxResults);
  }

  /**
   * Get search suggestions for autocomplete
   * @param query Partial search query
   * @param maxSuggestions Maximum number of suggestions
   * @returns Array of suggested queries
   */
  async getSuggestions(query: string, maxSuggestions: number = 5): Promise<string[]> {
    try {
      console.log(`💡 Getting suggestions for: "${query}"`);
      
      // Since we don't have a suggester configured in the schema,
      // provide basic suggestions based on common search patterns
      const staticSuggestions = [
        'project management best practices',
        'team collaboration tools',
        'task tracking methods', 
        'productivity improvement',
        'workflow optimization',
        'project planning',
        'team communication',
        'deadline management',
        'resource allocation',
        'performance metrics'
      ];

      const filtered = staticSuggestions
        .filter(suggestion => 
          !query || suggestion.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, maxSuggestions);

      console.log(`✅ Generated ${filtered.length} suggestions`);
      return filtered;
      
    } catch (error) {
      console.error('❌ Suggestions failed:', error);
      return [];
    }
  }

  /**
   * Get search service status and health (alias for healthCheck)
   * @returns Service health information
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    indexName: string;
    documentCount?: number;
    lastChecked: string;
  }> {
    return this.getServiceStatus();
  }

  /**
   * Get search service status and health
   * @returns Service health information
   */
  async getServiceStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    indexName: string;
    documentCount?: number;
    lastChecked: string;
  }> {
    try {
      // Try a simple search to test connectivity
      const testResult = await this.searchClient.search('*', { top: 1 });
      const count = testResult.count;

      return {
        status: 'healthy',
        indexName: this.config.indexName,
        documentCount: count,
        lastChecked: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Service health check failed:', error);
      return {
        status: 'unhealthy',
        indexName: this.config.indexName,
        lastChecked: new Date().toISOString()
      };
    }
  }

  /**
   * Utility method to collect all results from paginated response
   * @param results Search documents result
   * @returns Array of search results
   */
  private async collectResults(
    results: SearchDocumentsResult<ProjectDocument>
  ): Promise<SearchResult<ProjectDocument>[]> {
    const searchResults: SearchResult<ProjectDocument>[] = [];
    
    for await (const result of results.results) {
      searchResults.push(result);
    }
    
    return searchResults;
  }

  /**
   * Execute search operation with retry logic
   * @param operation Search operation to execute
   * @returns Operation result
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️ Search attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) break;
        
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  /**
   * Enhance error with additional context
   * @param error Original error
   * @param operation Operation that failed
   * @returns Enhanced error
   */
  private enhanceError(error: any, operation: string): Error {
    const message = error?.message || 'Unknown error';
    const enhancedMessage = `${operation} failed: ${message}`;
    
    const enhancedError = new Error(enhancedMessage);
    enhancedError.stack = error?.stack;
    
    return enhancedError;
  }
}

// Export singleton instance
export const azureSearchService = new AzureSearchService();