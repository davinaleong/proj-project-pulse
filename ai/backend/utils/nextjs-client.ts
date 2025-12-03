/**
 * Next.js Integration Utilities
 * Helper functions and configurations for seamless Next.js integration
 */

/**
 * Configuration for Next.js API client
 * Use this in your Next.js API routes or client-side code
 */
export const aiApiConfig = {
  // Base URL for the AI backend (adjust for your deployment)
  baseUrl: process.env.NEXT_PUBLIC_AI_API_URL || 'http://localhost:3001/api/v1',
  
  // Shared secret for authentication (use environment variable in Next.js)
  sharedSecret: process.env.AI_BACKEND_SHARED_SECRET || 'your-shared-secret-here',
  
  // Default headers for API requests
  getHeaders: () => ({
    'Content-Type': 'application/json',
    'X-Shared-Secret': process.env.AI_BACKEND_SHARED_SECRET || 'your-shared-secret-here'
  })
};

/**
 * AI API Client for Next.js
 * Simple client for making requests to the AI backend
 */
export class AIApiClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(baseUrl?: string, sharedSecret?: string) {
    this.baseUrl = baseUrl || aiApiConfig.baseUrl;
    this.headers = {
      'Content-Type': 'application/json',
      'X-Shared-Secret': sharedSecret || aiApiConfig.sharedSecret
    };
  }

  /**
   * Search for information
   */
  async search(query: string, options?: {
    maxResults?: number;
    searchType?: 'semantic' | 'basic' | 'hybrid';
    filters?: string;
  }) {
    const response = await fetch(`${this.baseUrl}/search`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        query,
        ...options
      })
    });

    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Ask a question using RAG
   */
  async askQuestion(question: string, options?: {
    maxSearchResults?: number;
    temperature?: number;
    includeSearchResults?: boolean;
  }) {
    const response = await fetch(`${this.baseUrl}/rag/ask`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        question,
        ...options
      })
    });

    if (!response.ok) {
      throw new Error(`RAG question failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Chat completions
   */
  async chatCompletion(messages: Array<{role: string, content: string}>, options?: {
    temperature?: number;
    maxTokens?: number;
  }) {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        messages,
        ...options
      })
    });

    if (!response.ok) {
      throw new Error(`Chat completion failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Check service health
   */
  async healthCheck() {
    const response = await fetch(`${this.baseUrl}/health`, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }

    return response.json();
  }
}

/**
 * Utility functions for Next.js API routes
 */
export const nextjsUtils = {
  /**
   * Create headers for AI backend requests
   */
  createHeaders: (sharedSecret?: string) => ({
    'Content-Type': 'application/json',
    'X-Shared-Secret': sharedSecret || process.env.AI_BACKEND_SHARED_SECRET || ''
  }),

  /**
   * Handle AI backend responses in Next.js API routes
   */
  handleAIResponse: async (response: Response) => {
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error((error as any)?.message || `AI Backend Error: ${response.statusText}`);
    }
    return response.json();
  },

  /**
   * Validate shared secret (for middleware)
   */
  validateSharedSecret: (providedSecret: string) => {
    const expectedSecret = process.env.AI_BACKEND_SHARED_SECRET;
    if (!expectedSecret) {
      throw new Error('AI_BACKEND_SHARED_SECRET not configured');
    }
    return providedSecret === expectedSecret;
  }
};

/**
 * Example Next.js API route using the AI backend
 * Save this as pages/api/ai/search.ts or app/api/ai/search/route.ts
 */
export const exampleNextjsApiRoute = `
// Example: pages/api/ai/search.ts or app/api/ai/search/route.ts
import { AIApiClient } from '../../../lib/ai-client';

const aiClient = new AIApiClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, maxResults = 5 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const searchResults = await aiClient.search(query, { maxResults });
    
    res.status(200).json(searchResults);
  } catch (error) {
    console.error('AI search error:', error);
    res.status(500).json({ 
      error: 'Search failed', 
      message: error.message 
    });
  }
}
`;

export default AIApiClient;