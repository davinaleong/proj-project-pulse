/**
 * Intelligent RAG (Retrieval Augmented Generation) Service
 * 
 * Combines Azure AI Search and Azure OpenAI for intelligent question-answering
 * Implements best practices:
 * - Semantic search with AI-powered ranking
 * - Vector similarity search with embeddings
 * - Hybrid search combining multiple techniques
 * - Context-aware response generation
 * - Comprehensive error handling and logging
 * - Performance monitoring and optimization
 */

import { azureSearchService, SearchResponse, ProjectDocument } from './searchService';
import { azureOpenAIService, ChatMessage, ChatCompletionResponse } from './openaiService';
import { azureConfig } from '../config/environment';

/**
 * RAG query interface
 */
export interface RAGQuery {
  question: string;
  context?: string;
  maxSearchResults?: number;
  temperature?: number;
  maxTokens?: number;
  includeReferences?: boolean;
  searchType?: 'semantic' | 'vector' | 'hybrid';
  filters?: string;
}

/**
 * RAG response interface
 */
export interface RAGResponse {
  answer: string;
  sources: Array<{
    id: string;
    title: string;
    content: string;
    score: number;
    url?: string;
  }>;
  searchResults?: SearchResponse;
  metadata: {
    searchTime: number;
    generationTime: number;
    totalTime: number;
    searchResultsCount: number;
    tokensUsed?: number;
  };
}

/**
 * Intelligent RAG Service
 * Orchestrates search and generation for comprehensive AI-powered responses
 */
export class IntelligentRAGService {
  private readonly systemPrompt = `You are an intelligent assistant for Project Pulse, a comprehensive project management and development platform. 

Your role is to provide accurate, helpful, and contextual responses based on the provided search results and context. Follow these guidelines:

1. **Accuracy**: Base your responses primarily on the provided search results and context
2. **Clarity**: Provide clear, well-structured answers that are easy to understand
3. **Completeness**: Include relevant details while being concise
4. **Citations**: Reference the sources when making specific claims
5. **Context**: Consider the user's question in the context of project management, development, and team collaboration

If the search results don't contain enough information to fully answer the question, acknowledge the limitations and provide what information is available.

Always maintain a professional, helpful tone and focus on practical, actionable information.`;

  constructor(
    private searchService = azureSearchService,
    private openaiService = azureOpenAIService
  ) {
    console.log('✅ Intelligent RAG Service initialized');
  }

  /**
   * Processes a question using RAG approach
   * @param query RAG query parameters
   * @returns Comprehensive response with sources and metadata
   */
  async askQuestion(query: RAGQuery): Promise<RAGResponse> {
    const startTime = Date.now();
    
    try {
      console.log(`❓ Processing RAG query: "${query.question}"`);
      
      // Step 1: Search for relevant information
      const searchStartTime = Date.now();
      const searchResults = await this.performSearch(query);
      const searchTime = Date.now() - searchStartTime;

      console.log(`🔍 Search completed in ${searchTime}ms, found ${searchResults.results.length} results`);

      // Step 2: Prepare context for AI generation
      const context = this.prepareContext(searchResults, query);
      
      // Step 3: Generate AI response
      const generationStartTime = Date.now();
      const aiResponse = await this.generateResponse(query.question, context, query);
      const generationTime = Date.now() - generationStartTime;

      console.log(`🤖 AI response generated in ${generationTime}ms`);

      // Step 4: Extract and format sources
      const sources = this.extractSources(searchResults);

      const totalTime = Date.now() - startTime;

      const response: RAGResponse = {
        answer: aiResponse.content,
        sources,
        searchResults: query.includeReferences ? searchResults : undefined,
        metadata: {
          searchTime,
          generationTime,
          totalTime,
          searchResultsCount: searchResults.results.length,
          tokensUsed: aiResponse.usage?.totalTokens
        }
      };

      console.log(`✅ RAG query completed in ${totalTime}ms`);
      
      return response;
      
    } catch (error) {
      console.error('❌ RAG query failed:', error);
      throw new Error(`RAG Query Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Processes a conversational query with chat history
   * @param question Current question
   * @param chatHistory Previous conversation messages
   * @param searchOptions Optional search configuration
   * @returns RAG response with conversation context
   */
  async askConversationalQuestion(
    question: string,
    chatHistory: ChatMessage[],
    searchOptions: Partial<RAGQuery> = {}
  ): Promise<RAGResponse> {
    try {
      console.log('💬 Processing conversational RAG query...');
      
      // Analyze conversation context to enhance search query
      const contextualQuery = await this.enhanceQueryWithContext(question, chatHistory);
      
      // Perform RAG with enhanced query
      const ragQuery: RAGQuery = {
        question: contextualQuery,
        maxSearchResults: searchOptions.maxSearchResults || 5,
        temperature: searchOptions.temperature || 0.7,
        maxTokens: searchOptions.maxTokens || 1000,
        includeReferences: searchOptions.includeReferences || false,
        searchType: searchOptions.searchType || 'semantic'
      };

      const response = await this.askQuestion(ragQuery);

      // Ensure answer considers conversation context
      if (chatHistory.length > 0) {
        response.answer = await this.refineAnswerWithConversationContext(
          response.answer,
          question,
          chatHistory
        );
      }

      return response;
      
    } catch (error) {
      console.error('❌ Conversational RAG query failed:', error);
      throw new Error(`Conversational RAG Query Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Performs the appropriate search based on query type
   */
  private async performSearch(query: RAGQuery): Promise<SearchResponse> {
    const maxResults = query.maxSearchResults || 5;
    
    switch (query.searchType || 'semantic') {
      case 'semantic':
        return await this.searchService.semanticSearch(query.question, maxResults);
      
      case 'hybrid':
        return await this.searchService.hybridSearch(query.question, undefined, maxResults);
      
      case 'vector':
        // Note: This would require generating embeddings from the question
        // For now, fallback to semantic search
        console.warn('Vector search requested but embeddings not implemented, falling back to semantic search');
        return await this.searchService.semanticSearch(query.question, maxResults);
      
      default:
        return await this.searchService.search({
          query: query.question,
          top: maxResults,
          filters: query.filters,
          enableSemanticSearch: true
        });
    }
  }

  /**
   * Prepares context from search results for AI generation
   */
  private prepareContext(searchResults: SearchResponse, query: RAGQuery): string {
    let context = '';

    // Add user-provided context if available
    if (query.context) {
      context += `Additional Context:\n${query.context}\n\n`;
    }

    // Add search results as context
    if (searchResults.results.length > 0) {
      context += 'Relevant Information:\n\n';
      
      searchResults.results.forEach((result, index) => {
        const doc = result.document;
        context += `Source ${index + 1}:\n`;
        context += `Title: ${doc.title || 'Untitled'}\n`;
        
        if (doc.description) {
          context += `Description: ${doc.description}\n`;
        }
        
        context += `Content: ${doc.content || ''}\n`;
        
        if (doc.category) {
          context += `Category: ${doc.category}\n`;
        }
        
        if (doc.tags && doc.tags.length > 0) {
          context += `Tags: ${doc.tags.join(', ')}\n`;
        }
        
        context += `Relevance Score: ${result.score?.toFixed(2) || 'N/A'}\n\n`;
      });
    } else {
      context += 'No specific relevant information found in the knowledge base.\n\n';
    }

    return context;
  }

  /**
   * Generates AI response using prepared context
   */
  private async generateResponse(
    question: string, 
    context: string, 
    query: RAGQuery
  ): Promise<ChatCompletionResponse> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: this.systemPrompt
      },
      {
        role: 'user',
        content: `Context:\n${context}\n\nQuestion: ${question}\n\nPlease provide a comprehensive answer based on the provided context. If the context doesn't contain sufficient information, acknowledge this and provide what information is available.`
      }
    ];

    return await this.openaiService.createChatCompletion({
      messages,
      temperature: query.temperature || 0.7,
      maxTokens: query.maxTokens || 1000
    });
  }

  /**
   * Extracts and formats sources from search results
   */
  private extractSources(searchResults: SearchResponse): RAGResponse['sources'] {
    return searchResults.results.map(result => {
      const doc = result.document;
      return {
        id: doc.id,
        title: doc.title || 'Untitled',
        content: this.truncateContent(doc.content || '', 300),
        score: result.score || 0
      };
    });
  }

  /**
   * Enhances search query with conversation context
   */
  private async enhanceQueryWithContext(
    currentQuestion: string,
    chatHistory: ChatMessage[]
  ): Promise<string> {
    if (chatHistory.length === 0) {
      return currentQuestion;
    }

    try {
      // Use AI to analyze conversation context and enhance the query
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: 'Analyze the conversation history and current question to create an enhanced search query that captures the full context. Return only the enhanced query, nothing else.'
        },
        ...chatHistory.slice(-5), // Include last 5 messages for context
        {
          role: 'user',
          content: `Current question: "${currentQuestion}"\n\nBased on our conversation, create an enhanced search query that captures the full context and intent.`
        }
      ];

      const response = await this.openaiService.createChatCompletion({
        messages,
        temperature: 0.3,
        maxTokens: 100
      });

      const enhancedQuery = response.content.trim();
      console.log(`🔍 Enhanced query: "${enhancedQuery}"`);
      
      return enhancedQuery;
      
    } catch (error) {
      console.warn('⚠️ Failed to enhance query with context, using original:', error);
      return currentQuestion;
    }
  }

  /**
   * Refines answer to consider conversation context
   */
  private async refineAnswerWithConversationContext(
    answer: string,
    currentQuestion: string,
    chatHistory: ChatMessage[]
  ): Promise<string> {
    try {
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: 'Refine the provided answer to better fit the conversation context. Ensure it addresses the current question while being mindful of the conversation history. Keep the same informational content but adjust the tone and references as needed.'
        },
        ...chatHistory.slice(-3), // Include last 3 messages
        {
          role: 'user',
          content: `Current question: "${currentQuestion}"\nProposed answer: "${answer}"\n\nPlease refine this answer to better fit our conversation context.`
        }
      ];

      const response = await this.openaiService.createChatCompletion({
        messages,
        temperature: 0.5,
        maxTokens: 800
      });

      return response.content;
      
    } catch (error) {
      console.warn('⚠️ Failed to refine answer with conversation context:', error);
      return answer;
    }
  }

  /**
   * Truncates content to specified length
   */
  private truncateContent(content: string, maxLength: number): string {
    if (content.length <= maxLength) {
      return content;
    }
    
    return content.substring(0, maxLength - 3) + '...';
  }

  /**
   * Health check for the RAG service
   */
  async healthCheck(): Promise<{ 
    status: 'healthy' | 'unhealthy'; 
    message: string;
    services: {
      search: 'healthy' | 'unhealthy';
      openai: 'healthy' | 'unhealthy';
    };
  }> {
    try {
      // Check both services
      const [searchHealth, openaiHealth] = await Promise.all([
        this.searchService.healthCheck(),
        this.openaiService.healthCheck()
      ]);

      const allHealthy = searchHealth.status === 'healthy' && openaiHealth.status === 'healthy';

      return {
        status: allHealthy ? 'healthy' : 'unhealthy',
        message: allHealthy 
          ? 'RAG service is fully operational' 
          : 'One or more underlying services are unhealthy',
        services: {
          search: searchHealth.status,
          openai: openaiHealth.status
        }
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        services: {
          search: 'unhealthy',
          openai: 'unhealthy'
        }
      };
    }
  }
}

// Export singleton instance
export const intelligentRAGService = new IntelligentRAGService();
export default intelligentRAGService;