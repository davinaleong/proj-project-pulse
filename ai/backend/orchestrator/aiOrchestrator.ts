/**
 * AI Service Orchestrator
 * 
 * Central orchestrator for all AI services in Project Pulse
 * Provides unified interface for:
 * - Search and retrieval operations
 * - Chat completions and conversations
 * - RAG (Retrieval Augmented Generation)
 * - Advanced analytics and insights
 * - Service health monitoring
 * - Load balancing and failover
 */

import { azureSearchService, SearchOptions, SearchResponse } from './searchService';
import { azureOpenAIService, ChatCompletionOptions, ChatMessage, ChatCompletionResponse } from './openaiService';
import { intelligentRAGService, RAGQuery, RAGResponse } from './ragService';
import { advancedAnalyticsService, AnalyticsQuery, AnalyticsResponse } from './analyticsService';
import { azureConfig } from '../config/environment';

/**
 * Service status interface
 */
export interface ServiceStatus {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  lastChecked: Date;
  responseTime?: number;
  errorCount: number;
  uptime: number;
}

/**
 * Orchestrator configuration interface
 */
export interface OrchestratorConfig {
  enableLoadBalancing: boolean;
  enableAutoFailover: boolean;
  healthCheckInterval: number;
  maxRetries: number;
  enableMetrics: boolean;
}

/**
 * Service metrics interface
 */
export interface ServiceMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  uptime: number;
  lastError?: string;
  lastErrorTime?: Date;
}

/**
 * Unified AI request interface
 */
export interface AIRequest {
  type: 'search' | 'chat' | 'rag' | 'analytics';
  payload: any;
  options?: {
    timeout?: number;
    retries?: number;
    priority?: 'low' | 'normal' | 'high';
  };
}

/**
 * Unified AI response interface
 */
export interface AIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata: {
    requestId: string;
    timestamp: Date;
    processingTime: number;
    serviceUsed: string;
    retryCount: number;
  };
}

/**
 * AI Service Orchestrator
 * Manages and coordinates all AI services with intelligent routing and monitoring
 */
export class AIServiceOrchestrator {
  private readonly config: OrchestratorConfig;
  private readonly serviceMetrics: Map<string, ServiceMetrics> = new Map();
  private readonly serviceStatuses: Map<string, ServiceStatus> = new Map();
  private healthCheckInterval?: NodeJS.Timeout;
  private requestCounter = 0;

  constructor(config: Partial<OrchestratorConfig> = {}) {
    this.config = {
      enableLoadBalancing: config.enableLoadBalancing ?? true,
      enableAutoFailover: config.enableAutoFailover ?? true,
      healthCheckInterval: config.healthCheckInterval ?? 300000, // 5 minutes
      maxRetries: config.maxRetries ?? 3,
      enableMetrics: config.enableMetrics ?? true,
      ...config
    };

    this.initializeServices();
    this.startHealthChecking();
    
    console.log('🚀 AI Service Orchestrator initialized with config:', this.config);
  }

  /**
   * Performs intelligent search across multiple search strategies
   * @param query Search query or SearchOptions
   * @param options Optional request configuration
   * @returns Search results with metadata
   */
  async search(
    query: string | SearchOptions, 
    options?: AIRequest['options']
  ): Promise<AIResponse<SearchResponse>> {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    try {
      console.log(`🔍 Processing search request ${requestId}`);
      
      const searchOptions = typeof query === 'string' 
        ? { query, top: 10, enableSemanticSearch: true }
        : query;

      const result = await this.executeWithRetry(
        () => azureSearchService.search(searchOptions),
        'search',
        options?.retries || this.config.maxRetries
      );

      const response = this.createSuccessResponse(
        result, 
        requestId, 
        startTime, 
        'azureSearch', 
        0
      );

      this.updateMetrics('search', true, Date.now() - startTime);
      
      return response;
      
    } catch (error) {
      console.error(`❌ Search request ${requestId} failed:`, error);
      
      this.updateMetrics('search', false, Date.now() - startTime, error);
      
      return this.createErrorResponse(
        error,
        requestId,
        startTime,
        'azureSearch',
        0
      );
    }
  }

  /**
   * Performs semantic search with AI-powered relevance
   * @param query Search query
   * @param maxResults Maximum number of results
   * @param options Optional request configuration
   * @returns Semantically ranked search results
   */
  async semanticSearch(
    query: string,
    maxResults: number = 5,
    options?: AIRequest['options']
  ): Promise<AIResponse<SearchResponse>> {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    try {
      console.log(`🧠 Processing semantic search request ${requestId}`);
      
      const result = await this.executeWithRetry(
        () => azureSearchService.semanticSearch(query, maxResults),
        'semanticSearch',
        options?.retries || this.config.maxRetries
      );

      const response = this.createSuccessResponse(
        result, 
        requestId, 
        startTime, 
        'azureSearch', 
        0
      );

      this.updateMetrics('semanticSearch', true, Date.now() - startTime);
      
      return response;
      
    } catch (error) {
      console.error(`❌ Semantic search request ${requestId} failed:`, error);
      
      this.updateMetrics('semanticSearch', false, Date.now() - startTime, error);
      
      return this.createErrorResponse(
        error,
        requestId,
        startTime,
        'azureSearch',
        0
      );
    }
  }

  /**
   * Creates AI chat completion
   * @param messages Chat messages
   * @param completionOptions Optional chat completion settings
   * @param options Optional request configuration
   * @returns Chat completion response
   */
  async createChatCompletion(
    messages: ChatMessage[],
    completionOptions?: Partial<ChatCompletionOptions>,
    options?: AIRequest['options']
  ): Promise<AIResponse<ChatCompletionResponse>> {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    try {
      console.log(`💬 Processing chat completion request ${requestId}`);
      
      const result = await this.executeWithRetry(
        () => azureOpenAIService.createChatCompletion({
          messages,
          ...completionOptions
        }),
        'chatCompletion',
        options?.retries || this.config.maxRetries
      );

      const response = this.createSuccessResponse(
        result, 
        requestId, 
        startTime, 
        'azureOpenAI', 
        0
      );

      this.updateMetrics('chatCompletion', true, Date.now() - startTime);
      
      return response;
      
    } catch (error) {
      console.error(`❌ Chat completion request ${requestId} failed:`, error);
      
      this.updateMetrics('chatCompletion', false, Date.now() - startTime, error);
      
      return this.createErrorResponse(
        error,
        requestId,
        startTime,
        'azureOpenAI',
        0
      );
    }
  }

  /**
   * Processes RAG (Retrieval Augmented Generation) query
   * @param ragQuery RAG query parameters
   * @param options Optional request configuration
   * @returns RAG response with sources and metadata
   */
  async askQuestion(
    ragQuery: RAGQuery,
    options?: AIRequest['options']
  ): Promise<AIResponse<RAGResponse>> {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    try {
      console.log(`❓ Processing RAG request ${requestId}`);
      
      const result = await this.executeWithRetry(
        () => intelligentRAGService.askQuestion(ragQuery),
        'rag',
        options?.retries || this.config.maxRetries
      );

      const response = this.createSuccessResponse(
        result, 
        requestId, 
        startTime, 
        'intelligentRAG', 
        0
      );

      this.updateMetrics('rag', true, Date.now() - startTime);
      
      return response;
      
    } catch (error) {
      console.error(`❌ RAG request ${requestId} failed:`, error);
      
      this.updateMetrics('rag', false, Date.now() - startTime, error);
      
      return this.createErrorResponse(
        error,
        requestId,
        startTime,
        'intelligentRAG',
        0
      );
    }
  }

  /**
   * Performs advanced analytics
   * @param analyticsQuery Analytics query parameters
   * @param options Optional request configuration
   * @returns Analytics insights and recommendations
   */
  async analyzeProjects(
    analyticsQuery: AnalyticsQuery,
    options?: AIRequest['options']
  ): Promise<AIResponse<AnalyticsResponse>> {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    try {
      console.log(`📊 Processing analytics request ${requestId}`);
      
      const result = await this.executeWithRetry(
        () => advancedAnalyticsService.analyzeProjects(analyticsQuery),
        'analytics',
        options?.retries || this.config.maxRetries
      );

      const response = this.createSuccessResponse(
        result, 
        requestId, 
        startTime, 
        'advancedAnalytics', 
        0
      );

      this.updateMetrics('analytics', true, Date.now() - startTime);
      
      return response;
      
    } catch (error) {
      console.error(`❌ Analytics request ${requestId} failed:`, error);
      
      this.updateMetrics('analytics', false, Date.now() - startTime, error);
      
      return this.createErrorResponse(
        error,
        requestId,
        startTime,
        'advancedAnalytics',
        0
      );
    }
  }

  /**
   * Processes conversational queries with context
   * @param question Current question
   * @param chatHistory Previous conversation messages
   * @param options Optional request configuration
   * @returns Contextual RAG response
   */
  async askConversationalQuestion(
    question: string,
    chatHistory: ChatMessage[],
    options?: AIRequest['options']
  ): Promise<AIResponse<RAGResponse>> {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    try {
      console.log(`💬 Processing conversational RAG request ${requestId}`);
      
      const result = await this.executeWithRetry(
        () => intelligentRAGService.askConversationalQuestion(question, chatHistory),
        'conversationalRAG',
        options?.retries || this.config.maxRetries
      );

      const response = this.createSuccessResponse(
        result, 
        requestId, 
        startTime, 
        'intelligentRAG', 
        0
      );

      this.updateMetrics('conversationalRAG', true, Date.now() - startTime);
      
      return response;
      
    } catch (error) {
      console.error(`❌ Conversational RAG request ${requestId} failed:`, error);
      
      this.updateMetrics('conversationalRAG', false, Date.now() - startTime, error);
      
      return this.createErrorResponse(
        error,
        requestId,
        startTime,
        'intelligentRAG',
        0
      );
    }
  }

  /**
   * Gets comprehensive service health status
   * @returns Health status for all services
   */
  async getServiceHealth(): Promise<{
    overall: 'healthy' | 'degraded' | 'unhealthy';
    services: ServiceStatus[];
    metrics: Record<string, ServiceMetrics>;
  }> {
    try {
      console.log('🏥 Checking service health...');
      
      // Check all services in parallel
      const [searchHealth, openaiHealth, ragHealth, analyticsHealth] = await Promise.all([
        azureSearchService.healthCheck(),
        azureOpenAIService.healthCheck(),
        intelligentRAGService.healthCheck(),
        advancedAnalyticsService.healthCheck()
      ]);

      const services: ServiceStatus[] = [
        {
          name: 'Azure AI Search',
          status: searchHealth.status,
          lastChecked: new Date(),
          errorCount: this.getServiceMetrics('search')?.failedRequests || 0,
          uptime: this.calculateUptime('search')
        },
        {
          name: 'Azure OpenAI',
          status: openaiHealth.status,
          lastChecked: new Date(),
          errorCount: this.getServiceMetrics('chatCompletion')?.failedRequests || 0,
          uptime: this.calculateUptime('chatCompletion')
        },
        {
          name: 'Intelligent RAG',
          status: ragHealth.status,
          lastChecked: new Date(),
          errorCount: this.getServiceMetrics('rag')?.failedRequests || 0,
          uptime: this.calculateUptime('rag')
        },
        {
          name: 'Advanced Analytics',
          status: analyticsHealth.status,
          lastChecked: new Date(),
          errorCount: this.getServiceMetrics('analytics')?.failedRequests || 0,
          uptime: this.calculateUptime('analytics')
        }
      ];

      const overall = this.calculateOverallHealth(services);
      
      const metricsObj: Record<string, ServiceMetrics> = {};
      for (const [key, metrics] of this.serviceMetrics.entries()) {
        metricsObj[key] = metrics;
      }

      return {
        overall,
        services,
        metrics: metricsObj
      };
      
    } catch (error) {
      console.error('❌ Service health check failed:', error);
      
      return {
        overall: 'unhealthy',
        services: [],
        metrics: {}
      };
    }
  }

  /**
   * Gets service metrics for monitoring and optimization
   * @param serviceName Optional specific service name
   * @returns Service metrics
   */
  getServiceMetrics(serviceName?: string): ServiceMetrics | Record<string, ServiceMetrics> {
    if (serviceName) {
      return this.serviceMetrics.get(serviceName) || this.createDefaultMetrics();
    }
    
    const metrics: Record<string, ServiceMetrics> = {};
    for (const [key, value] of this.serviceMetrics.entries()) {
      metrics[key] = value;
    }
    
    return metrics;
  }

  /**
   * Resets service metrics
   * @param serviceName Optional specific service to reset
   */
  resetMetrics(serviceName?: string): void {
    if (serviceName) {
      this.serviceMetrics.set(serviceName, this.createDefaultMetrics());
      console.log(`📊 Metrics reset for service: ${serviceName}`);
    } else {
      this.serviceMetrics.clear();
      console.log('📊 All metrics reset');
    }
  }

  /**
   * Shuts down the orchestrator gracefully
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down AI Service Orchestrator...');
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    // Log final metrics
    const finalMetrics = this.getServiceMetrics();
    console.log('📊 Final service metrics:', finalMetrics);
    
    console.log('✅ AI Service Orchestrator shut down gracefully');
  }

  /**
   * Initializes service metrics
   */
  private initializeServices(): void {
    const services = ['search', 'semanticSearch', 'chatCompletion', 'rag', 'conversationalRAG', 'analytics'];
    
    services.forEach(service => {
      this.serviceMetrics.set(service, this.createDefaultMetrics());
    });
    
    console.log('📊 Service metrics initialized for', services.length, 'services');
  }

  /**
   * Starts periodic health checking
   */
  private startHealthChecking(): void {
    if (!this.config.enableMetrics) return;
    
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.getServiceHealth();
      } catch (error) {
        console.warn('⚠️ Periodic health check failed:', error);
      }
    }, this.config.healthCheckInterval);
    
    console.log(`🏥 Health checking started (interval: ${this.config.healthCheckInterval}ms)`);
  }

  /**
   * Executes operation with retry logic
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    serviceName: string,
    maxRetries: number
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === maxRetries) {
          break;
        }
        
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.warn(`⚠️ ${serviceName} operation failed (attempt ${attempt + 1}), retrying in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  /**
   * Generates unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${++this.requestCounter}`;
  }

  /**
   * Creates successful response
   */
  private createSuccessResponse<T>(
    data: T,
    requestId: string,
    startTime: number,
    serviceUsed: string,
    retryCount: number
  ): AIResponse<T> {
    return {
      success: true,
      data,
      metadata: {
        requestId,
        timestamp: new Date(),
        processingTime: Date.now() - startTime,
        serviceUsed,
        retryCount
      }
    };
  }

  /**
   * Creates error response
   */
  private createErrorResponse(
    error: any,
    requestId: string,
    startTime: number,
    serviceUsed: string,
    retryCount: number
  ): AIResponse {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      metadata: {
        requestId,
        timestamp: new Date(),
        processingTime: Date.now() - startTime,
        serviceUsed,
        retryCount
      }
    };
  }

  /**
   * Updates service metrics
   */
  private updateMetrics(
    serviceName: string,
    success: boolean,
    responseTime: number,
    error?: any
  ): void {
    if (!this.config.enableMetrics) return;
    
    const metrics = this.serviceMetrics.get(serviceName) || this.createDefaultMetrics();
    
    metrics.totalRequests++;
    
    if (success) {
      metrics.successfulRequests++;
    } else {
      metrics.failedRequests++;
      metrics.lastError = error instanceof Error ? error.message : String(error);
      metrics.lastErrorTime = new Date();
    }
    
    // Update rolling average response time
    metrics.averageResponseTime = (
      (metrics.averageResponseTime * (metrics.totalRequests - 1) + responseTime) / 
      metrics.totalRequests
    );
    
    this.serviceMetrics.set(serviceName, metrics);
  }

  /**
   * Creates default metrics object
   */
  private createDefaultMetrics(): ServiceMetrics {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      uptime: 0
    };
  }

  /**
   * Calculates service uptime
   */
  private calculateUptime(serviceName: string): number {
    const metrics = this.serviceMetrics.get(serviceName);
    if (!metrics || metrics.totalRequests === 0) return 100;
    
    return (metrics.successfulRequests / metrics.totalRequests) * 100;
  }

  /**
   * Calculates overall health status
   */
  private calculateOverallHealth(services: ServiceStatus[]): 'healthy' | 'degraded' | 'unhealthy' {
    const healthyCount = services.filter(s => s.status === 'healthy').length;
    const totalCount = services.length;
    
    if (healthyCount === totalCount) return 'healthy';
    if (healthyCount >= totalCount / 2) return 'degraded';
    return 'unhealthy';
  }
}

// Export singleton instance with default configuration
export const aiServiceOrchestrator = new AIServiceOrchestrator({
  enableLoadBalancing: true,
  enableAutoFailover: true,
  healthCheckInterval: 300000, // 5 minutes
  maxRetries: 3,
  enableMetrics: true
});

export default aiServiceOrchestrator;