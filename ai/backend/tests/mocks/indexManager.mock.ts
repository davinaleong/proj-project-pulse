/**
 * Mock for SearchIndexManager
 * Provides test doubles for Azure AI Search Index Management operations
 */

export const mockSearchIndexManager = {
  createSearchIndex: jest.fn().mockResolvedValue(undefined),
  uploadDatasetToBlobStorage: jest.fn().mockResolvedValue('https://test-storage.blob.core.windows.net/test-container/test-file.csv'),
  createDataSource: jest.fn().mockResolvedValue(undefined),
  createIndexer: jest.fn().mockResolvedValue(undefined),
  uploadCsvDataDirectly: jest.fn().mockResolvedValue(undefined),
  setupComplete: jest.fn().mockResolvedValue(undefined),
  deleteIndex: jest.fn().mockResolvedValue(undefined)
};

// Mock factory function
export const createMockSearchIndexManager = () => ({
  ...mockSearchIndexManager,
  // Reset all mocks
  resetMocks: () => {
    Object.values(mockSearchIndexManager).forEach(mock => {
      if (jest.isMockFunction(mock)) {
        mock.mockClear();
      }
    });
  }
});

// Mock successful index creation response
export const mockIndexCreationSuccess = {
  name: 'project-pulse-index',
  fields: [
    { name: 'id', type: 'Edm.String', key: true },
    { name: 'project_name', type: 'Edm.String', searchable: true }
  ]
};

// Mock CSV upload success response
export const mockUploadSuccess = {
  results: [
    { key: '1', succeeded: true, errorMessage: null },
    { key: '2', succeeded: true, errorMessage: null }
  ]
};

// Mock CSV upload with failures response
export const mockUploadWithFailures = {
  results: [
    { key: '1', succeeded: true, errorMessage: null },
    { key: '2', succeeded: false, errorMessage: 'Invalid document format' },
    { key: '3', succeeded: true, errorMessage: null }
  ]
};

// Mock sample CSV data
export const mockCsvData = [
  {
    project_id: '1',
    project_name: 'React E-commerce App',
    stage: 'Implementation',
    description: 'Modern e-commerce platform built with React and TypeScript',
    tech_stack: 'React, TypeScript, Node.js, PostgreSQL',
    frontend: 'React',
    backend: 'Node.js',
    database: 'PostgreSQL',
    started_at: '2024-01-15T00:00:00Z',
    ended_at: '2024-06-15T00:00:00Z',
    duration_h: 800,
    cost: 25000,
    completed: true,
    features: 'Shopping cart, Payment processing, User authentication, Admin dashboard',
    project_type: 'Web Application',
    business_domain: 'E-commerce',
    keywords: 'react, typescript, ecommerce, shopping',
    technology_tags: 'React, TypeScript, PostgreSQL',
    embeddings: [0.1, 0.2, 0.3, 0.4, 0.5]
  },
  {
    project_id: '2',
    project_name: 'Vue.js Dashboard',
    stage: 'Planning',
    description: 'Analytics dashboard for business intelligence',
    tech_stack: 'Vue.js, Python, MongoDB',
    frontend: 'Vue.js',
    backend: 'Python',
    database: 'MongoDB',
    started_at: '2024-03-01T00:00:00Z',
    ended_at: '',
    duration_h: 200,
    cost: 8000,
    completed: false,
    features: 'Charts, Data visualization, Real-time updates',
    project_type: 'Dashboard',
    business_domain: 'Analytics',
    keywords: 'vue, dashboard, analytics, charts',
    technology_tags: 'Vue.js, Python, MongoDB',
    embeddings: undefined
  }
];

// Mock search index schema
export const mockIndexSchema = {
  name: 'project-pulse-index',
  fields: [
    {
      name: 'id',
      type: 'Edm.String',
      key: true,
      searchable: true,
      filterable: true,
      sortable: true,
      facetable: false
    },
    {
      name: 'project_name',
      type: 'Edm.String',
      searchable: true,
      filterable: true,
      sortable: true,
      facetable: false,
      analyzerName: 'en.lucene'
    },
    {
      name: 'description',
      type: 'Edm.String',
      searchable: true,
      filterable: false,
      sortable: false,
      facetable: false,
      analyzerName: 'en.lucene'
    },
    {
      name: 'embeddings',
      type: 'Collection(Edm.Single)',
      searchable: true,
      vectorSearchDimensions: 1536,
      vectorSearchProfileName: 'default-vector-profile'
    }
  ],
  semanticSearch: {
    configurations: [
      {
        name: 'default',
        prioritizedFields: {
          titleField: { name: 'project_name' },
          contentFields: [
            { name: 'description' },
            { name: 'features' }
          ],
          keywordsFields: [
            { name: 'keywords' },
            { name: 'technology_tags' }
          ]
        }
      }
    ]
  }
};

// Error mocks
export const mockIndexAlreadyExistsError = {
  message: 'Index already exists',
  statusCode: 409
};

export const mockAuthenticationError = {
  message: 'Authentication failed',
  statusCode: 401
};

export const mockNetworkError = {
  message: 'Network timeout',
  code: 'ETIMEDOUT'
};