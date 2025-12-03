/**
 * Mock Azure OpenAI Service
 * Provides mock implementations for testing
 */

export class MockAzureOpenAIService {
  async createChatCompletion(request: any) {
    const mockResponse = {
      id: 'chatcmpl-test',
      object: 'chat.completion',
      created: Date.now(),
      model: 'gpt-4.1-mini',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant' as const,
            content: 'This is a mock response for testing purposes.'
          },
          finish_reason: 'stop'
        }
      ],
      usage: {
        prompt_tokens: 20,
        completion_tokens: 10,
        total_tokens: 30
      }
    };

    return mockResponse;
  }

  async createStreamingCompletion(request: any) {
    // Mock streaming response
    return {
      [Symbol.asyncIterator]: async function* () {
        yield {
          choices: [
            {
              delta: { content: 'Mock ' },
              finish_reason: null
            }
          ]
        };
        yield {
          choices: [
            {
              delta: { content: 'streaming ' },
              finish_reason: null
            }
          ]
        };
        yield {
          choices: [
            {
              delta: { content: 'response' },
              finish_reason: 'stop'
            }
          ]
        };
      }
    };
  }

  async healthCheck() {
    return {
      status: 'healthy' as const,
      model: 'gpt-4.1-mini',
      endpoint: 'test-endpoint',
      lastChecked: new Date().toISOString()
    };
  }

  async getServiceStatus() {
    return this.healthCheck();
  }
}

export const mockAzureOpenAIService = new MockAzureOpenAIService();