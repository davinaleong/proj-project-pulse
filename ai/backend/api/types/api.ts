/**
 * API Type Definitions
 * Comprehensive type definitions for all AI API endpoints
 */

import { Request } from 'express';

// Base API Response
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any[];
  metadata: {
    timestamp: string;
    requestId?: string;
    processingTime?: number;
    [key: string]: any;
  };
}

// Search Types
export interface SearchRequest {
  query: string;
  maxResults?: number;
  searchType?: 'semantic' | 'basic' | 'hybrid';
  filters?: string;
}

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  score: number;
  category?: string;
  tags?: string[];
  projectId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  facets?: Record<string, any>;
  searchId: string;
}

// RAG Types
export interface RAGRequest {
  question: string;
  context?: string;
  maxSearchResults?: number;
  temperature?: number;
  maxTokens?: number;
  includeReferences?: boolean;
  searchType?: 'semantic' | 'vector' | 'hybrid';
  chatHistory?: ChatMessage[];
}

export interface RAGSource {
  id: string;
  title: string;
  content: string;
  score: number;
  url?: string;
}

export interface RAGResponse {
  answer: string;
  sources: RAGSource[];
  confidence: number;
  searchResultsUsed: number;
  tokensUsed?: number;
  searchResults?: any;
  conversational?: boolean;
}

// Chat Types
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  model?: string;
}

export interface ChatResponse {
  message: {
    role: 'assistant';
    content: string;
  };
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model?: string;
  finishReason?: string;
}

// Analytics Types
export interface AnalyticsRequest {
  question: string;
  dateRange?: {
    start: string;
    end: string;
  };
  projectIds?: string[];
  userIds?: string[];
  analysisType?: 'trend' | 'performance' | 'prediction' | 'comparison' | 'summary';
  includeVisualizations?: boolean;
}

export interface AnalyticsInsight {
  title: string;
  summary: string;
  details: string;
  confidence: number;
  supportingData: Array<{
    metric: string;
    value: number;
    trend?: 'increasing' | 'decreasing' | 'stable';
    comparison?: string;
  }>;
  recommendations?: string[];
  visualizations?: Array<{
    type: 'chart' | 'graph' | 'table';
    data: any;
    title: string;
  }>;
}

export interface AnalyticsResponse {
  insights: AnalyticsInsight[];
  summary: string;
  confidence: number;
  dataPointsAnalyzed: number;
  recommendations: string[];
}

// Error Types
export interface APIError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

// Request Context
export interface RequestContext {
  requestId: string;
  startTime: number;
  user?: {
    id: string;
    email?: string;
    roles?: string[];
  };
  rateLimitInfo?: {
    remaining: number;
    resetTime: Date;
  };
}

// Import Express types
import { Request } from 'express';

// Middleware Types
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    roles?: string[];
  };
  context?: RequestContext;
}

export interface RateLimitInfo {
  remaining: number;
  resetTime: Date;
  limit: number;
}