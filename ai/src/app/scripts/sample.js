// Frontend-only demo - Mock AI interaction example
// This file demonstrates how the original Azure OpenAI integration worked
// Now converted to use mock responses for frontend-only operation

// Original configuration (now mocked)
const mockConfig = {
  endpoint: "mock://project-pulse-ai",
  deployment_name: "mock-gpt-model",
  api_key: "frontend-only-no-key-needed"
};

// Mock client that simulates OpenAI responses
class MockAIClient {
  constructor(config) {
    this.config = config;
  }
  
  async chat() {
    return {
      completions: {
        create: async (params) => {
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Generate mock response based on messages
          const userMessage = params.messages.find(m => m.role === 'user')?.content || 'Hello';
          
          return {
            choices: [{
              message: {
                content: `🤖 Mock AI Response: I received "${userMessage}". This is a demo response from the frontend-only version. The full version would connect to Azure OpenAI for real AI capabilities.`
              }
            }]
          };
        }
      }
    };
  }
}

const client = new MockAIClient(mockConfig);

// Demo function showing mock AI interaction
export async function runDemo() {
  console.log('🚀 Running Project Pulse AI Demo (Frontend-Only Version)');
  
  const chatAPI = await client.chat();
  const completion = await chatAPI.completions.create({
    messages: [
      { role: "system", content: "You are a helpful Project Pulse AI assistant." },
      { role: "user", content: "Can you help me understand this project?" }
    ],
    model: mockConfig.deployment_name,
  });

  console.log('Demo Response:', completion.choices[0]);
  return completion.choices[0].message.content;
}

// Uncomment to run demo:
// runDemo();