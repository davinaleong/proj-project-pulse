// Frontend-only mock search client - no Azure dependencies
import config from "./env";

// Mock search client for frontend-only operation
class MockSearchClient {
  private indexName: string;
  
  constructor(endpoint: string, indexName: string, credential: any) {
    this.indexName = indexName;
  }
  
  async search(query: string, options?: any) {
    // Simulate search delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Return mock search results structure
    return {
      results: {
        *[Symbol.asyncIterator]() {
          // Mock documents based on query
          const mockDocs = [
            {
              document: {
                id: "1",
                title: "Project Overview",
                content: `Information related to: ${query}`,
                category: "documentation"
              }
            }
          ];
          
          for (const doc of mockDocs) {
            yield doc;
          }
        }
      }
    };
  }
}

// Create mock search client
const mockSearchClient = new MockSearchClient(
  "mock://search-endpoint",
  "mock-index",
  { key: "mock-key" }
);

export default mockSearchClient;