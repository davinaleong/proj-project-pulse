// Frontend-only mock AI client - no actual OpenAI integration
import config from "./env";

// Mock AI client for frontend-only operation
class MockOpenAIClient {
  private config: any;
  
  constructor(options: any) {
    this.config = options;
  }
  
  async chat() {
    // Return mock chat interface
    return {
      completions: {
        create: async (params: any) => {
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, config.RESPONSE_DELAY_MS));
          
          // Return mock response structure
          return {
            choices: [{
              message: {
                content: "This is a mock response. The frontend-only version doesn't connect to real AI services."
              }
            }]
          };
        }
      }
    };
  }
}

// Mock configuration
const deployment_name = "mock-gpt-model";
const mockClient = new MockOpenAIClient({
  baseURL: "mock://localhost",
  apiKey: "mock-key"
});

export { mockClient as openAiClient, deployment_name };
export default mockClient;