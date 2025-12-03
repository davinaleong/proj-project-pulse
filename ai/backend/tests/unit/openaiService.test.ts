/**
 * OpenAI Service Unit Tests
 * Tests for Azure OpenAI integration
 */

import { AzureOpenAIService, type ChatMessage } from '../../services/openaiService';
import { mockAzureOpenAIService } from '../mocks/openaiService.mock';

// Mock the OpenAI SDK
jest.mock('openai', () => ({
  AzureOpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  }))
}));

// Mock config
jest.mock('../../config/environment', () => ({
  azureConfig: {
    openai: {
      endpoint: 'https://test-openai.openai.azure.com/',
      apiKey: 'test-key',
      deploymentName: 'gpt-4.1-mini'
    }
  }
}));

describe('OpenAI Service', () => {
  let openaiService: AzureOpenAIService;

  beforeEach(() => {
    openaiService = new AzureOpenAIService();
    
    // Mock the internal client
    (openaiService as any).client = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
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
          })
        }
      }
    };
  });

  describe('createChatCompletion', () => {
    it('should create chat completion successfully', async () => {
      const request = {
        messages: [
          { role: 'user' as const, content: 'What is project management?' }
        ],
        temperature: 0.7,
        maxTokens: 100
      };

      const result = await openaiService.createChatCompletion(request);

      expect(result).toBeDefined();
      expect(result.role).toBe('assistant');
      expect(result.content).toBeDefined();
      expect(result.usage?.totalTokens).toBeGreaterThan(0);
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
    });

    it('should apply temperature and token limits', async () => {
      const createSpy = jest.spyOn((openaiService as any).client.chat.completions, 'create');

      const request = {
        messages: [{ role: 'user' as const, content: 'Test message' }],
        temperature: 0.9,
        maxTokens: 200
      };

      await openaiService.createChatCompletion(request);

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.9,
          max_tokens: 200
        })
      );
    });

    it('should use default values when not specified', async () => {
      const createSpy = jest.spyOn((openaiService as any).client.chat.completions, 'create');

      const request = {
        messages: [{ role: 'user' as const, content: 'Test message' }]
      };

      await openaiService.createChatCompletion(request);

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.7,
          max_tokens: 1000
        })
      );
    });
  });

  describe('createStreamingChatCompletion', () => {
    it('should create streaming completion', async () => {
      // Mock streaming response
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield {
            choices: [{ delta: { content: 'Hello ' }, finish_reason: null }]
          };
          yield {
            choices: [{ delta: { content: 'world!' }, finish_reason: 'stop' }]
          };
        }
      };

      (openaiService as any).client.chat.completions.create = jest.fn().mockResolvedValue(mockStream);

      const request = {
        messages: [{ role: 'user' as const, content: 'Say hello' }],
        stream: true
      };

      const result = await openaiService.createStreamingChatCompletion(request);
      expect(result).toBeDefined();

      // Test streaming
      let content = '';
      for await (const chunk of result) {
        if (chunk && typeof chunk === 'object' && 'choices' in (chunk as object)) {
          const choices = (chunk as any).choices;
          if (choices && Array.isArray(choices) && choices[0]?.delta?.content) {
            content += choices[0].delta.content;
          }
        }
      }
      
      expect(content).toBe('Hello world!');
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status', async () => {
      const health = await openaiService.healthCheck();

      expect(health.status).toBe('healthy');
      expect(health.message).toBeDefined();
    });

    it('should return unhealthy status on error', async () => {
      // Mock service failure
      (openaiService as any).client.chat.completions.create.mockRejectedValue(
        new Error('Service unavailable')
      );

      const health = await openaiService.healthCheck();
      expect(health.status).toBe('unhealthy');
    });
  });

  describe('error handling', () => {
    it('should handle rate limiting errors', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      (rateLimitError as any).status = 429;
      
      (openaiService as any).client.chat.completions.create.mockRejectedValue(rateLimitError);

      await expect(openaiService.createChatCompletion({
        messages: [{ role: 'user' as const, content: 'test' }]
      })).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle content filtering errors', async () => {
      const contentError = new Error('Content filtered');
      (contentError as any).status = 400;
      (contentError as any).code = 'content_filter';
      
      (openaiService as any).client.chat.completions.create.mockRejectedValue(contentError);

      await expect(openaiService.createChatCompletion({
        messages: [{ role: 'user' as const, content: 'inappropriate content' }]
      })).rejects.toThrow('Content filtered');
    });

    it('should handle authentication errors', async () => {
      const authError = new Error('Unauthorized');
      (authError as any).status = 401;
      
      (openaiService as any).client.chat.completions.create.mockRejectedValue(authError);

      await expect(openaiService.createChatCompletion({
        messages: [{ role: 'user' as const, content: 'test' }]
      })).rejects.toThrow('Unauthorized');
    });

    it('should retry on transient failures', async () => {
      const createMock = jest.fn()
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockRejectedValueOnce(new Error('Another temporary failure'))
        .mockResolvedValueOnce({
          content: 'Success',
          role: 'assistant'
        });

      (openaiService as any).client.chat.completions.create = createMock;

      const result = await openaiService.createChatCompletion({
        messages: [{ role: 'user' as const, content: 'test' }]
      });

      expect(createMock).toHaveBeenCalledTimes(3);
      expect(result.content).toBe('Success');
    });
  });

  describe('input validation', () => {
    it('should validate message array', async () => {
      await expect(openaiService.createChatCompletion({
        messages: []
      })).rejects.toThrow('Messages array cannot be empty');
    });

    it('should validate temperature range', async () => {
      await expect(openaiService.createChatCompletion({
        messages: [{ role: 'user' as const, content: 'test' }],
        temperature: 2.5 // Invalid temperature
      })).rejects.toThrow('Temperature must be between 0 and 2');
    });

    it('should validate token limits', async () => {
      await expect(openaiService.createChatCompletion({
        messages: [{ role: 'user' as const, content: 'test' }],
        maxTokens: -1 // Invalid token count
      })).rejects.toThrow('Max tokens must be positive');
    });

    it('should validate message roles', async () => {
      await expect(openaiService.createChatCompletion({
        messages: [{ role: 'invalid' as any, content: 'test' }]
      })).rejects.toThrow('Invalid message role');
    });
  });
});