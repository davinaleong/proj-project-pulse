/**
 * OpenAI Service Unit Tests - Simplified Version
 */

import { AzureOpenAIService } from '../../services/openaiService';

// Mock the OpenAI SDK
jest.mock('openai');

// Mock config
jest.mock('../../config/environment', () => ({
  azureConfig: {
    openai: {
      endpoint: 'https://test-openai.openai.azure.com/',
      apiKey: 'test-key',
      deploymentName: 'gpt-4.1-mini'
    },
    app: {
      retryOptions: {
        maxRetries: 3,
        retryDelayMs: 1000,
        maxRetryDelayMs: 10000
      }
    }
  }
}));

describe('OpenAI Service', () => {
  let openaiService: AzureOpenAIService;

  beforeEach(() => {
    openaiService = new AzureOpenAIService();
    
    // Mock methods directly
    jest.spyOn(openaiService, 'createChatCompletion').mockResolvedValue({
      id: 'chatcmpl-test',
      object: 'chat.completion',
      created: Date.now(),
      model: 'gpt-4.1-mini',
      content: 'Test response from OpenAI',
      role: 'assistant',
      finishReason: 'stop',
      usage: {
        promptTokens: 25,
        completionTokens: 15,
        totalTokens: 40
      }
    });
    
    jest.spyOn(openaiService, 'healthCheck').mockResolvedValue({
      status: 'healthy',
      message: 'OpenAI service operational'
    });
  });

  describe('createChatCompletion', () => {
    it('should create chat completion successfully', async () => {
      const request = {
        messages: [
          { role: 'user' as const, content: 'Hello, how are you?' }
        ],
        temperature: 0.7,
        maxTokens: 150
      };

      const result = await openaiService.createChatCompletion(request);

      expect(result).toBeDefined();
      expect(result.content).toBe('Test response from OpenAI');
      expect(result.role).toBe('assistant');
      expect(result.usage?.totalTokens).toBe(40);
    });

    it('should handle system messages', async () => {
      const request = {
        messages: [
          { role: 'system' as const, content: 'You are a helpful assistant.' },
          { role: 'user' as const, content: 'Hello!' }
        ]
      };

      const result = await openaiService.createChatCompletion(request);
      
      expect(result).toBeDefined();
      expect(result.content).toBe('Test response from OpenAI');
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status', async () => {
      const health = await openaiService.healthCheck();

      expect(health.status).toBe('healthy');
      expect(health.message).toBeDefined();
    });
  });
});