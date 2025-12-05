/**
 * Test Utilities
 * Common utilities and helpers for testing
 */

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../../api/types/api';
import { ProjectPulseDocument } from '../../services/indexManager';

/**
 * Create mock Express Request object
 */
export function createMockRequest(overrides: Partial<Request> = {}): Partial<Request> {
  return {
    method: 'GET',
    url: '/test',
    path: '/test',
    headers: {},
    body: {},
    query: {},
    params: {},
    ip: '127.0.0.1',
    ...overrides
  };
}

/**
 * Create mock Express Response object
 */
export function createMockResponse(): Partial<Response> {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
    header: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
    sendStatus: jest.fn().mockReturnThis(),
    locals: {}
  };
  return res;
}

/**
 * Create mock Authenticated Request object
 */
export function createMockAuthRequest(overrides: Partial<AuthenticatedRequest> = {}): Partial<AuthenticatedRequest> {
  return {
    ...createMockRequest(),
    user: {
      id: 'test-user',
      client_id: 'test-client',
      source: 'jwt-token'
    },
    context: {
      requestId: 'test-request-id',
      startTime: Date.now()
    },
    ...overrides
  };
}

/**
 * Create mock Next function
 */
export function createMockNext() {
  return jest.fn();
}

/**
 * Wait for specified time (for async testing)
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate test JWT token
 */
export function generateTestJWT(payload: any = { id: 'test-user', source: 'test' }): string {
  // Use the same secret as the application
  const testSecret = process.env.JWT_SECRET || 'test-jwt-secret';
  return jwt.sign(payload, testSecret, { expiresIn: '1h' });
}

/**
 * Mock environment variables
 */
export function mockEnv(env: Record<string, string>) {
  const originalEnv = process.env;
  
  beforeEach(() => {
    process.env = { ...originalEnv, ...env };
  });
  
  afterEach(() => {
    process.env = originalEnv;
  });
}

/**
 * Index Management Test Utilities
 */

/**
 * Generate mock project pulse document
 */
export function createMockProjectPulseDocument(overrides: Partial<ProjectPulseDocument> = {}): ProjectPulseDocument {
  return {
    id: 'test-project-1',
    project_id: 'proj-001',
    project_name: 'Test Project',
    uuid: '550e8400-e29b-41d4-a716-446655440000',
    stage: 'Implementation',
    started_at: '2024-01-01T00:00:00Z',
    ended_at: '2024-06-01T00:00:00Z',
    duration_h: 800,
    cost: 25000,
    remarks: 'Test project remarks',
    tech_stack: 'React, TypeScript, Node.js',
    frontend: 'React',
    backend: 'Node.js',
    database: 'PostgreSQL',
    auth: 'JWT',
    cloud: 'Azure',
    tools: 'VS Code, Git',
    framework_versions: 'React 18, Node.js 20',
    description: 'A comprehensive test project for validation',
    completed: true,
    notes: 'Additional project notes',
    features: 'Authentication, Dashboard, API',
    project_type: 'Web Application',
    deployment_type: 'Cloud',
    dependencies_prod: 'react, express, prisma',
    dependencies_dev: 'typescript, jest, eslint',
    testing_framework: 'Jest',
    bundler: 'Vite',
    styling_framework: 'Tailwind CSS',
    content_management: 'Headless CMS',
    performance_features: 'Lazy loading, Caching',
    security_features: 'HTTPS, Input validation',
    accessibility_features: 'ARIA labels, Keyboard navigation',
    development_experience: 'Hot reload, TypeScript',
    api_type: 'REST',
    data_persistence: 'PostgreSQL',
    scaling_approach: 'Horizontal',
    target_audience: 'Business users',
    business_domain: 'E-commerce',
    technical_complexity: 'Medium',
    maintenance_status: 'Active',
    documentation_quality: 'Good',
    code_quality_tools: 'ESLint, Prettier',
    deployment_platforms: 'Azure App Service',
    keywords: 'react, typescript, ecommerce',
    primary_category: 'Web Development',
    secondary_categories: 'E-commerce, SaaS',
    technology_tags: 'React, TypeScript, Node.js',
    skill_level_tags: 'Intermediate',
    use_case_tags: 'Business, E-commerce',
    domain_tags: 'Web, Cloud',
    architecture_patterns: 'MVC, REST API',
    development_methodologies: 'Agile, TDD',
    embeddings: [0.1, 0.2, 0.3, 0.4, 0.5],
    ...overrides
  };
}

/**
 * Generate mock CSV data for testing
 */
export function createMockCsvData(): string {
  return `project_id,project_name,stage,description,tech_stack,started_at,ended_at,duration_h,cost,completed
proj-001,Test Project 1,Implementation,First test project,React TypeScript,2024-01-01,2024-06-01,800,25000,true
proj-002,Test Project 2,Planning,Second test project,Vue.js Python,2024-03-01,,200,8000,false
proj-003,Test Project 3,Testing,Third test project,Angular Java,2024-02-01,2024-05-01,600,15000,true`;
}

/**
 * Create mock Azure Search upload result
 */
export function createMockUploadResult(successes: number = 2, failures: number = 0) {
  const results = [];
  
  // Add successful uploads
  for (let i = 1; i <= successes; i++) {
    results.push({
      key: `test-doc-${i}`,
      succeeded: true,
      errorMessage: null
    });
  }
  
  // Add failed uploads
  for (let i = 1; i <= failures; i++) {
    results.push({
      key: `failed-doc-${i}`,
      succeeded: false,
      errorMessage: `Upload failed for document ${i}`
    });
  }
  
  return { results };
}

/**
 * Mock Azure Search Index schema for testing
 */
export function createMockSearchIndexSchema() {
  return {
    name: 'test-index',
    fields: [
      {
        name: 'id',
        type: 'Edm.String',
        key: true,
        searchable: true,
        filterable: true
      },
      {
        name: 'project_name',
        type: 'Edm.String',
        searchable: true,
        filterable: true
      },
      {
        name: 'description',
        type: 'Edm.String',
        searchable: true
      }
    ],
    semanticSearch: {
      configurations: [{
        name: 'default',
        prioritizedFields: {
          titleField: { name: 'project_name' },
          contentFields: [{ name: 'description' }]
        }
      }]
    }
  };
}

/**
 * Create mock environment for Azure services testing
 */
export function setupMockAzureEnvironment() {
  return {
    AZURE_SEARCH_ENDPOINT: 'https://test-search.search.windows.net',
    AZURE_SEARCH_API_KEY: 'test-search-key',
    AZURE_SEARCH_INDEX_NAME: 'test-index',
    AZURE_SEARCH_API_VERSION: '2024-07-01',
    AZURE_SEMANTIC_CONFIG_NAME: 'test-semantic-config',
    AZURE_STORAGE_CONNECTION_STRING: 'DefaultEndpointsProtocol=https;AccountName=test;AccountKey=testkey123;EndpointSuffix=core.windows.net'
  };
}