/**
 * Azure AI Search Service Client
 * 
 * Implements API key authentication:
 * - Uses API key authentication to Azure AI Search
 * - Implements retry logic with exponential backoff
 * - Comprehensive error handling and logging
 * - Type-safe search operations
 * - Performance optimizations
 */

import { 
  SearchClient, 
  SearchIndexClient,
  SearchDocumentsResult, 
  VectorQuery, 
  SearchOptions,
  SearchResult,
  AzureKeyCredential
} from '@azure/search-documents';

import { azureConfig } from '../config/environment';

/**
 * Document interface for Project Pulse search index
 * Customize this based on your actual search index schema
 */
export interface ProjectDocument {
  id: string;
  title: string;
  content: string;
  description?: string;
  category?: string;
  tags?: string[];
  lastModified?: string;
  embedding?: number[]; // Vector field for semantic search
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
  enableVectorSearch?: boolean;
  vectorQuery?: number[];
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
   * Performs a comprehensive search with semantic and vector capabilities
   * @param request Search request parameters
   * @returns Enhanced search results
   */
  async search(request: SearchRequest): Promise<SearchResponse> {
    const startTime = Date.now();
    
    try {
      console.log(`🔍 Executing search query: "${request.query}"`);
      
      const searchOptions = this.buildSearchOptions(request);
      
      const results: SearchDocumentsResult<ProjectDocument> = await this.executeWithRetry(
        () => this.searchClient.search(request.query, searchOptions)
      );

      const executionTime = Date.now() - startTime;
      
      console.log(`✅ Search completed in ${executionTime}ms, found ${results.count || 'unknown'} results`);

      return {
        results: await this.collectResults(results),
        count: results.count,
        facets: results.facets,
        semanticAnswers: results.answers,
        coverage: results.coverage,
        executionTime
      };
      
    } catch (error) {
      console.error('❌ Search operation failed:', error);
      throw this.enhanceError(error, 'search');
    }
  }

  /**
   * Performs semantic search with AI-powered ranking and captions
   * @param query Natural language query
   * @param top Number of results to return
   * @returns Semantic search results with captions and answers
   */
  async semanticSearch(query: string, top: number = 5): Promise<SearchResponse> {
    try {
      console.log(`🧠 Executing semantic search: "${query}"`);
      
      const searchOptions: SearchOptions<ProjectDocument> = {
        top,
        queryType: 'semantic',
        semanticSearchOptions: {
          configurationName: this.config.semanticConfigName,
          captions: {
            captionType: 'extractive',
            highlight: true
          },
          answers: {
            answerType: 'extractive'
          }
        },
        select: ['id', 'title', 'content', 'description', 'category', 'tags']
      };

      const results = await this.executeWithRetry(
        () => this.searchClient.search(query, searchOptions)
      );

      return {
        results: await this.collectResults(results),
        count: results.count,
        semanticAnswers: results.answers,
        coverage: results.coverage
      };
      
    } catch (error) {
      console.error('❌ Semantic search failed:', error);
      throw this.enhanceError(error, 'semantic search');
    }
  }

  /**
   * Performs vector similarity search using embeddings
   * @param vectorQuery Embedding vector for similarity search
   * @param k Number of nearest neighbors to return
   * @returns Vector search results
   */
  async vectorSearch(vectorQuery: number[], k: number = 5): Promise<SearchResponse> {
    try {
      console.log(`🎯 Executing vector search with ${vectorQuery.length}-dimensional vector`);
      
      const vector: VectorQuery<ProjectDocument> = {
        vector: vectorQuery,
        kNearestNeighborsCount: k,
        fields: ['embedding'], // Adjust based on your vector field name
        kind: 'vector',
        exhaustive: true
      };

      const searchOptions: SearchOptions<ProjectDocument> = {
        top: k,
        vectorSearchOptions: {
          queries: [vector],
          filterMode: 'postFilter'
        },
        select: ['id', 'title', 'content', 'description', 'category']
      };

      const results = await this.executeWithRetry(
        () => this.searchClient.search('*', searchOptions)
      );

      return {
        results: await this.collectResults(results),
        count: results.count
      };
      
    } catch (error) {
      console.error('❌ Vector search failed:', error);
      throw this.enhanceError(error, 'vector search');
    }
  }

  /**
   * Performs hybrid search combining keyword, semantic, and vector search
   * @param query Text query
   * @param vectorQuery Optional embedding vector
   * @param top Number of results
   * @returns Hybrid search results
   */
  async hybridSearch(query: string, vectorQuery?: number[], top: number = 5): Promise<SearchResponse> {
    try {
      console.log(`🔄 Executing hybrid search: "${query}"`);
      
      const searchOptions: SearchOptions<ProjectDocument> = {
        top,
        queryType: 'semantic',
        semanticSearchOptions: {
          configurationName: this.config.semanticConfigName,
          captions: { captionType: 'extractive' }
        },
        select: ['id', 'title', 'content', 'description', 'category', 'tags']
      };

      // Add vector search if embedding provided
      if (vectorQuery && vectorQuery.length > 0) {
        const vector: VectorQuery<ProjectDocument> = {
          vector: vectorQuery,
          kNearestNeighborsCount: top,
          fields: ['embedding'],
          kind: 'vector',
          exhaustive: true
        };

        searchOptions.vectorSearchOptions = {
          queries: [vector],
          filterMode: 'postFilter'
        };
      }

      const results = await this.executeWithRetry(
        () => this.searchClient.search(query, searchOptions)
      );

      return {
        results: await this.collectResults(results),
        count: results.count,
        semanticAnswers: results.answers
      };
      
    } catch (error) {
      console.error('❌ Hybrid search failed:', error);
      throw this.enhanceError(error, 'hybrid search');
    }
  }

  /**
   * Gets a specific document by ID
   * @param documentId The document ID to retrieve
   * @returns The document or null if not found
   */
  async getDocument(documentId: string): Promise<ProjectDocument | null> {
    try {
      console.log(`📄 Retrieving document: ${documentId}`);
      
      const document = await this.executeWithRetry(
        // @ts-ignore
        () => this.searchClient.getDocument<ProjectDocument>(documentId)
      );

      // @ts-ignore
      return document;
      
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        console.log(`📄 Document not found: ${documentId}`);
        return null;
      }
      
      console.error('❌ Failed to retrieve document:', error);
      throw this.enhanceError(error, 'document retrieval');
    }
  }

  /**
   * Builds search options from request parameters
   */
  private buildSearchOptions(request: SearchRequest): SearchOptions<ProjectDocument> {
    const options: SearchOptions<ProjectDocument> = {
      top: request.top || 10,
      skip: request.skip || 0,
      includeTotalCount: true
    };

    if (request.select && request.select.length > 0) {
      // @ts-ignore
      options.select = request.select;
    }

    if (request.filters) {
      options.filter = request.filters;
    }

    if (request.orderBy && request.orderBy.length > 0) {
      options.orderBy = request.orderBy;
    }

    if (request.facets && request.facets.length > 0) {
      options.facets = request.facets;
    }

    if (request.enableSemanticSearch) {
      // @ts-ignore
      options.queryType = 'semantic';
      // @ts-ignore
      options.semanticSearchOptions = {
        configurationName: this.config.semanticConfigName
      };
    }

    if (request.enableVectorSearch && request.vectorQuery) {
      const vector: VectorQuery<ProjectDocument> = {
        vector: request.vectorQuery,
        kNearestNeighborsCount: request.top || 10,
        fields: ['embedding'],
        kind: 'vector'
      };

      options.vectorSearchOptions = {
        queries: [vector],
        filterMode: 'postFilter'
      };
    }

    return options;
  }

  /**
   * Collects all results from the search response
   */
  private async collectResults(results: SearchDocumentsResult<ProjectDocument>): Promise<SearchResult<ProjectDocument>[]> {
    const collectedResults: SearchResult<ProjectDocument>[] = [];
    
    for await (const result of results.results) {
      collectedResults.push(result);
    }
    
    return collectedResults;
  }

  /**
   * Executes operations with retry logic and exponential backoff
   */
  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    const { maxRetries, retryDelayMs, maxRetryDelayMs } = azureConfig.app.retryOptions;
    
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt === maxRetries) {
          break;
        }

        // Calculate exponential backoff delay
        const delay = Math.min(retryDelayMs * Math.pow(2, attempt), maxRetryDelayMs);
        
        console.warn(`⚠️ Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, lastError.message);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  /**
   * Enhances error messages with context
   */
  private enhanceError(error: unknown, operation: string): Error {
    const originalMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Error(
      `Azure Search ${operation} failed: ${originalMessage}. ` +
      `Please check your Azure Search configuration and credentials.`
    );
  }

  /**
   * Health check for the search service
   * @returns Service health status
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; message: string }> {
    try {
      // Try to get the index statistics
      const index = await this.indexClient.getIndex(this.config.indexName);
      
      return {
        status: 'healthy',
        message: `Connected to index "${index.name}" successfully`
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

// Export singleton instance
export const azureSearchService = new AzureSearchService();
export default azureSearchService;