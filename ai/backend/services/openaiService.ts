/**
 * Azure OpenAI Service Client
 * 
 * Implements Azure best practices:
 * - Uses DefaultAzureCredential for keyless authentication
 * - Implements retry logic with exponential backoff
 * - Comprehensive error handling and logging
 * - Type-safe chat completions
 * - Performance monitoring and optimization
 * - Content filtering and safety
 * 
 * Reference: https://learn.microsoft.com/en-us/azure/ai-foundry/openai/use-your-data-quickstart?pivots=programming-language-typescript
 */

import { AzureOpenAI } from 'openai';
import { getBearerTokenProvider } from '@azure/identity';
import '@azure/openai/types'; // Required for Azure-specific types
import type { 
  ChatCompletion, 
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionCreateParamsStreaming,
  ChatCompletionMessageParam,
  ChatCompletionChunk
} from 'openai/resources/chat/completions';

import { azureConfig, azureCredential } from '../config/environment';

/**
 * Chat message interface
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
  function_call?: any;
}

/**
 * Chat completion request parameters
 */
export interface ChatCompletionRequest {
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stream?: boolean;
  functions?: any[];
  functionCall?: string | object;
  stop?: string | string[];
  user?: string;
}

/**
 * Chat completion response with metadata
 */
export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  content: string;
  role: string;
  finishReason: string | null;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  contentFilterResults?: any;
  executionTime?: number;
}

/**
 * Grounded chat parameters for RAG (Retrieval Augmented Generation)
 */
export interface GroundedChatRequest extends ChatCompletionRequest {
  dataSources?: {
    type: 'azure_search';
    parameters: {
      endpoint: string;
      indexName: string;
      semanticConfiguration?: string;
      queryType?: 'simple' | 'semantic' | 'vector';
      fieldsMapping?: {
        contentFields?: string[];
        filepathField?: string;
        titleField?: string;
        urlField?: string;
      };
      filter?: string;
      strictness?: number;
      topNDocuments?: number;
      inScope?: boolean;
      roleInformation?: string;
    };
  }[];
}

/**
 * Azure OpenAI Service Client
 * Provides comprehensive chat completion capabilities with Azure best practices
 */
export class AzureOpenAIService {
  private readonly client: AzureOpenAI;
  private readonly config = azureConfig.openai;
  
  constructor() {
    try {
      // Create token provider for keyless authentication
      const scope = 'https://cognitiveservices.azure.com/.default';
      const azureADTokenProvider = getBearerTokenProvider(azureCredential, scope);

      // Initialize OpenAI client with Azure configuration
      this.client = new AzureOpenAI({
        endpoint: this.config.endpoint,
        azureADTokenProvider,
        apiVersion: this.config.apiVersion,
        deployment: this.config.deploymentName
      });

      console.log('✅ Azure OpenAI Service initialized with managed identity');
      console.log(`🤖 Model deployment: ${this.config.deploymentName}`);
      
    } catch (error) {
      console.error('❌ Failed to initialize Azure OpenAI Service:', error);
      throw new Error(`OpenAI Service Initialization Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Creates a chat completion with comprehensive error handling and logging
   * @param request Chat completion request parameters
   * @returns Chat completion response with metadata
   */
  async createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const startTime = Date.now();
    
    try {
      console.log('🤖 Creating chat completion...');
      console.log(`📝 Messages count: ${request.messages.length}`);
      console.log(`🌡️ Temperature: ${request.temperature || 0.7}`);
      
      const params = this.buildCompletionParams(request);
      
      const completion = await this.executeWithRetry(
        () => this.client.chat.completions.create(params as ChatCompletionCreateParamsNonStreaming)
      ) as ChatCompletion;

      const executionTime = Date.now() - startTime;
      
      const response: ChatCompletionResponse = {
        id: completion.id,
        object: completion.object,
        created: completion.created,
        model: completion.model,
        content: completion.choices[0]?.message?.content || '',
        role: completion.choices[0]?.message?.role || 'assistant',
        finishReason: completion.choices[0]?.finish_reason || null,
        usage: completion.usage ? {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens
        } : undefined,
        contentFilterResults: (completion.choices[0] as any)?.content_filter_results,
        executionTime
      };

      console.log(`✅ Chat completion created in ${executionTime}ms`);
      console.log(`📊 Tokens used: ${response.usage?.totalTokens || 'unknown'}`);
      
      // Log content filtering results if present
      if (response.contentFilterResults) {
        this.logContentFilterResults(response.contentFilterResults);
      }

      return response;
      
    } catch (error) {
      console.error('❌ Chat completion failed:', error);
      throw this.enhanceError(error, 'chat completion');
    }
  }

  /**
   * Creates a streaming chat completion
   * @param request Chat completion request parameters
   * @returns Async generator yielding chat completion chunks
   */
  async *createStreamingChatCompletion(
    request: ChatCompletionRequest
  ): AsyncGenerator<string, void, unknown> {
    try {
      console.log('🌊 Creating streaming chat completion...');
      
      const params = this.buildCompletionParams({ ...request, stream: true });
      
      const stream = await this.executeWithRetry(
        () => this.client.chat.completions.create(params as ChatCompletionCreateParamsStreaming)
      );

      let totalContent = '';
      
      for await (const chunk of stream as AsyncIterable<ChatCompletionChunk>) {
        const delta = chunk.choices[0]?.delta;
        
        if (delta?.content) {
          totalContent += delta.content;
          yield delta.content;
        }
        
        // Handle function calls if present
        if (delta?.function_call) {
          console.log('🔧 Function call detected:', delta.function_call);
        }
        
        // Log content filtering for chunks if present
        const filterResults = (chunk.choices[0] as any)?.content_filter_results;
        if (filterResults) {
          this.logContentFilterResults(filterResults);
        }
      }
      
      console.log(`✅ Streaming completed. Total content length: ${totalContent.length}`);
      
    } catch (error) {
      console.error('❌ Streaming chat completion failed:', error);
      throw this.enhanceError(error, 'streaming chat completion');
    }
  }

  /**
   * Creates a grounded chat completion using Azure AI Search as data source
   * Implements Retrieval Augmented Generation (RAG) pattern
   * @param request Grounded chat request with data sources
   * @returns Chat completion response with citations
   */
  async createGroundedChatCompletion(request: GroundedChatRequest): Promise<ChatCompletionResponse> {
    const startTime = Date.now();
    
    try {
      console.log('🔍 Creating grounded chat completion with data sources...');
      
      const params: any = {
        model: this.config.deploymentName,
        messages: request.messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        max_tokens: request.maxTokens || 1000,
        temperature: request.temperature || 0.7,
        stream: request.stream || false
      };

      // Add data sources for grounding
      if (request.dataSources) {
        params.data_sources = request.dataSources.map(ds => ({
          type: ds.type,
          parameters: {
            endpoint: ds.parameters.endpoint,
            index_name: ds.parameters.indexName,
            semantic_configuration: ds.parameters.semanticConfiguration,
            query_type: ds.parameters.queryType || 'semantic',
            fields_mapping: ds.parameters.fieldsMapping,
            filter: ds.parameters.filter,
            strictness: ds.parameters.strictness || 3,
            top_n_documents: ds.parameters.topNDocuments || 5,
            in_scope: ds.parameters.inScope !== false,
            role_information: ds.parameters.roleInformation,
            authentication: {
              type: 'system_assigned_managed_identity'
            }
          }
        }));
      }

      const completion = await this.executeWithRetry(
        () => this.client.chat.completions.create(params)
      ) as ChatCompletion;

      const executionTime = Date.now() - startTime;
      
      const response: ChatCompletionResponse = {
        id: completion.id,
        object: completion.object,
        created: completion.created,
        model: completion.model,
        content: completion.choices[0]?.message?.content || '',
        role: completion.choices[0]?.message?.role || 'assistant',
        finishReason: completion.choices[0]?.finish_reason || null,
        usage: completion.usage ? {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens
        } : undefined,
        executionTime
      };

      console.log(`✅ Grounded chat completion created in ${executionTime}ms`);
      console.log(`🔍 Used ${request.dataSources?.length || 0} data sources`);

      return response;
      
    } catch (error) {
      console.error('❌ Grounded chat completion failed:', error);
      throw this.enhanceError(error, 'grounded chat completion');
    }
  }

  /**
   * Analyzes conversation context and generates contextual responses
   * @param conversation Array of conversation messages
   * @param systemPrompt Optional system prompt for context
   * @returns Contextual response
   */
  async generateContextualResponse(
    conversation: ChatMessage[], 
    systemPrompt?: string
  ): Promise<ChatCompletionResponse> {
    try {
      const messages: ChatMessage[] = [];
      
      // Add system prompt if provided
      if (systemPrompt) {
        messages.push({
          role: 'system',
          content: systemPrompt
        });
      }
      
      // Add conversation history
      messages.push(...conversation);
      
      return await this.createChatCompletion({
        messages,
        temperature: 0.7,
        maxTokens: 1000
      });
      
    } catch (error) {
      console.error('❌ Contextual response generation failed:', error);
      throw this.enhanceError(error, 'contextual response generation');
    }
  }

  /**
   * Builds completion parameters from request
   */
  private buildCompletionParams(request: ChatCompletionRequest): any {
    const params: any = {
      model: this.config.deploymentName, // Note: This will be ignored in favor of deployment
      messages: request.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        name: msg.name,
        function_call: msg.function_call
      })),
      max_tokens: request.maxTokens || 1000,
      temperature: request.temperature || 0.7,
      stream: request.stream || false
    };

    // Add optional parameters if provided
    if (request.topP !== undefined) params.top_p = request.topP;
    if (request.frequencyPenalty !== undefined) params.frequency_penalty = request.frequencyPenalty;
    if (request.presencePenalty !== undefined) params.presence_penalty = request.presencePenalty;
    if (request.stop) params.stop = request.stop;
    if (request.user) params.user = request.user;
    if (request.functions) params.functions = request.functions;
    if (request.functionCall) params.function_call = request.functionCall;

    return params;
  }

  /**
   * Logs content filtering results for compliance monitoring
   */
  private logContentFilterResults(filterResults: any): void {
    if (!filterResults) return;
    
    if (filterResults.error) {
      console.warn('⚠️ Content filter error:', filterResults.error);
      return;
    }

    const categories = ['hate', 'sexual', 'self_harm', 'violence'];
    let hasFiltering = false;

    categories.forEach(category => {
      const result = filterResults[category];
      if (result && result.filtered) {
        console.warn(`🚫 Content filtered - ${category}: ${result.severity}`);
        hasFiltering = true;
      }
    });

    if (!hasFiltering) {
      console.log('✅ Content passed all safety filters');
    }
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

        // Check if error is retryable
        if (!this.isRetryableError(lastError)) {
          throw lastError;
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
   * Determines if an error is retryable
   */
  private isRetryableError(error: Error): boolean {
    const retryableErrors = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      '429', // Too Many Requests
      '500', // Internal Server Error
      '502', // Bad Gateway
      '503', // Service Unavailable
      '504'  // Gateway Timeout
    ];

    return retryableErrors.some(errorCode => 
      error.message.includes(errorCode) || error.name.includes(errorCode)
    );
  }

  /**
   * Enhances error messages with context
   */
  private enhanceError(error: unknown, operation: string): Error {
    const originalMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Error(
      `Azure OpenAI ${operation} failed: ${originalMessage}. ` +
      `Please check your Azure OpenAI configuration and credentials.`
    );
  }

  /**
   * Health check for the OpenAI service
   * @returns Service health status
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; message: string }> {
    try {
      // Test with a simple completion
      const testResponse = await this.createChatCompletion({
        messages: [{
          role: 'user',
          content: 'Hello, this is a health check. Please respond with "OK".'
        }],
        maxTokens: 10,
        temperature: 0
      });

      return {
        status: 'healthy',
        message: `Service is healthy. Response: ${testResponse.content.slice(0, 50)}...`
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
export const azureOpenAIService = new AzureOpenAIService();
export default azureOpenAIService;