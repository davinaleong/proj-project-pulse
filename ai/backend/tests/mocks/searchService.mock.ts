/**
 * Mock Azure Search Service
 * Provides mock implementations for testing
 */

export class MockAzureSearchService {
  private mockDocuments = [
    {
      id: '1',
      title: 'Project Management Best Practices',
      content: 'Effective project management requires clear goals, communication, and regular monitoring.',
      '@search.score': 0.95
    },
    {
      id: '2',
      title: 'Team Collaboration Strategies',
      content: 'Successful teams use modern tools and establish clear communication protocols.',
      '@search.score': 0.87
    },
    {
      id: '3',
      title: 'Agile Development Methods',
      content: 'Agile methodology emphasizes iterative development and continuous feedback.',
      '@search.score': 0.82
    }
  ];

  async search(query: string | any, top: number = 10, enableSemantic: boolean = true) {
    return {
      results: this.mockDocuments
        .filter(doc => 
          typeof query === 'string' 
            ? doc.title.toLowerCase().includes(query.toLowerCase()) || 
              doc.content.toLowerCase().includes(query.toLowerCase())
            : true
        )
        .slice(0, top)
        .map(doc => ({
          document: doc,
          score: doc['@search.score']
        })),
      count: this.mockDocuments.length,
      coverage: 100,
      executionTime: 50
    };
  }

  async semanticSearch(query: string, top: number = 10) {
    return this.search(query, top, true);
  }

  async advancedSearch(request: any) {
    return this.search(request.query, request.top, request.enableSemanticSearch);
  }

  async hybridSearch(query: string, vectorQuery?: number[], maxResults: number = 10) {
    return this.search(query, maxResults, true);
  }

  async getSuggestions(query: string, maxSuggestions: number = 5) {
    const suggestions = [
      'project management',
      'team collaboration',
      'agile development',
      'productivity tips',
      'workflow optimization'
    ];
    
    return suggestions
      .filter(s => s.includes(query.toLowerCase()))
      .slice(0, maxSuggestions);
  }

  async healthCheck() {
    return {
      status: 'healthy' as const,
      indexName: 'test-index',
      documentCount: this.mockDocuments.length,
      lastChecked: new Date().toISOString()
    };
  }

  async getServiceStatus() {
    return this.healthCheck();
  }
}

export const mockAzureSearchService = new MockAzureSearchService();