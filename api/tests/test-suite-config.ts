/**
 * Comprehensive Test Suite Runner
 *
 * This file provides a unified entry point for running all tests in the Project Pulse API.
 * It includes comprehensive test coverage across:
 *
 * 1. E2E Tests (End-to-End API Testing)
 * 2. Integration Tests (Cross-Module Integration)
 * 3. Unit Tests (Module-Specific Testing)
 * 4. Security Tests (Authentication & Authorization)
 * 5. Performance Tests (Load & Stress Testing)
 *
 * Test Categories:
 * - Authentication & Authorization
 * - User & Profile Management
 * - Project Management
 * - Task Management
 * - Note Management
 * - Activity Logging
 * - Cross-Module Integration
 * - Data Consistency & Integrity
 * - Security & Privacy
 * - Performance & Scalability
 */

export const testSuiteConfig = {
  // Test environment configuration
  environment: {
    nodeEnv: process.env.NODE_ENV || 'test',
    databaseUrl: process.env.TEST_DATABASE_URL,
    apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
  },

  // Test suite metadata
  metadata: {
    name: 'Project Pulse API Test Suite',
    version: '1.0.0',
    description: 'Comprehensive test suite for Project Pulse API',
    author: 'Project Pulse Team',
    lastUpdated: new Date().toISOString(),
  },

  // Test coverage targets
  coverage: {
    statements: 90,
    branches: 85,
    functions: 90,
    lines: 90,
  },

  // Test timeouts (in milliseconds)
  timeouts: {
    unit: 5000,
    integration: 30000,
    e2e: 60000,
    performance: 120000,
  },

  // Test suite organization
  suites: {
    e2e: {
      description: 'End-to-end API testing with real HTTP requests',
      files: ['api.test.ts'],
      setup: ['database cleanup', 'test data seeding'],
      teardown: ['database cleanup', 'session cleanup'],
    },

    integration: {
      description: 'Cross-module integration testing',
      files: [
        'auth.test.ts',
        'project-lifecycle.test.ts',
        'user-management.test.ts',
        'cross-module.test.ts',
      ],
      dependencies: ['e2eTestHelpers'],
    },

    unit: {
      description: 'Module-specific unit testing',
      files: [
        'auth.test.ts',
        'notes.test.ts',
        'projects.test.ts',
        'sessions.controller.test.ts',
        'sessions.model.test.ts',
        'sessions.service.test.ts',
        'tasks.test.ts',
        'users.test.ts',
      ],
      isolated: true,
    },

    security: {
      description: 'Security and authorization testing',
      focus: [
        'Authentication flows',
        'Authorization enforcement',
        'Data privacy',
        'Attack prevention',
        'Input validation',
      ],
    },

    performance: {
      description: 'Performance and scalability testing',
      metrics: [
        'Response times',
        'Throughput',
        'Concurrent users',
        'Memory usage',
        'Database performance',
      ],
    },
  },

  // Test data management
  testData: {
    users: {
      regular: { count: 10, role: 'USER' },
      admins: { count: 2, role: 'ADMIN' },
      managers: { count: 3, role: 'MANAGER' },
    },
    projects: {
      small: { count: 5, tasksPerProject: 3 },
      medium: { count: 3, tasksPerProject: 10 },
      large: { count: 1, tasksPerProject: 50 },
    },
    tasks: {
      total: 100,
      statusDistribution: {
        BACKLOG: 30,
        TODO: 25,
        WIP: 20,
        DONE: 20,
        BLOCKED: 5,
      },
    },
    notes: {
      total: 50,
      statusDistribution: {
        DRAFT: 40,
        PUBLISHED: 50,
        PRIVATE: 10,
      },
    },
  },

  // Test execution patterns
  execution: {
    parallel: {
      enabled: true,
      maxWorkers: 4,
      suitesInParallel: ['unit', 'integration'],
      suitesInSequence: ['e2e', 'performance'],
    },
    retry: {
      enabled: true,
      maxRetries: 2,
      retryOnlyFlaky: true,
    },
    reporting: {
      formats: ['console', 'junit', 'coverage'],
      verbose: true,
      showPassedTests: false,
    },
  },

  // Database testing configuration
  database: {
    isolation: 'transaction', // 'transaction' | 'truncate' | 'migrate'
    cleanup: {
      afterEach: true,
      afterAll: true,
      preserveSchema: true,
    },
    seeding: {
      beforeAll: true,
      customSeeders: ['users', 'projects', 'tasks', 'notes'],
    },
  },

  // API testing configuration
  api: {
    baseURL: 'http://localhost:3000/api/v1',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    timeout: 30000,
    validateStatus: (status: number) => status < 500,
  },

  // Security testing configuration
  security: {
    authenticationTests: {
      validCredentials: true,
      invalidCredentials: true,
      expiredTokens: true,
      malformedTokens: true,
      bruteForceProtection: true,
    },
    authorizationTests: {
      resourceOwnership: true,
      roleBasedAccess: true,
      crossUserAccess: true,
      adminPrivileges: true,
    },
    inputValidation: {
      sqlInjection: true,
      xssAttacks: true,
      invalidDataTypes: true,
      boundaryValues: true,
    },
  },

  // Performance testing configuration
  performance: {
    loadTesting: {
      concurrentUsers: [1, 5, 10, 25, 50],
      duration: 60, // seconds
      rampUpTime: 10, // seconds
    },
    stressTesting: {
      maxUsers: 100,
      duration: 300, // seconds
      expectedFailureRate: 0.01, // 1%
    },
    endpointPerformance: {
      acceptableResponseTime: 500, // milliseconds
      p95ResponseTime: 1000, // milliseconds
      p99ResponseTime: 2000, // milliseconds
    },
  },

  // Test utilities and helpers
  utilities: {
    dataGenerators: {
      users: 'e2eTestHelpers.createTestUser',
      projects: 'e2eTestHelpers.createTestProject',
      tasks: 'e2eTestHelpers.createTestTask',
      notes: 'e2eTestHelpers.createTestNote',
      sessions: 'e2eTestHelpers.createTestSession',
    },
    authentication: {
      login: 'e2eTestHelpers.createAuthenticatedUser',
      adminLogin: 'e2eTestHelpers.createAuthenticatedAdmin',
      tokenGeneration: 'e2eTestHelpers.generateAuthToken',
      headers: 'e2eTestHelpers.getAuthHeaders',
    },
    database: {
      cleanup: 'e2eTestHelpers.cleanupDatabase',
      seeding: 'e2eTestHelpers.createBulkData',
      scenarios: 'e2eTestHelpers.createMultiUserScenario',
    },
  },

  // Test validation rules
  validation: {
    responseStructure: {
      success: 'boolean',
      data: 'object',
      message: 'string',
      timestamp: 'string',
    },
    errorHandling: {
      statusCodes: [400, 401, 403, 404, 422, 429, 500],
      errorFormat: {
        success: false,
        error: 'object',
        message: 'string',
      },
    },
    dataIntegrity: {
      foreignKeys: true,
      requiredFields: true,
      dataTypes: true,
      constraints: true,
    },
  },

  // Monitoring and observability
  monitoring: {
    testMetrics: {
      executionTime: true,
      memoryUsage: true,
      databaseQueries: true,
      apiCallsCount: true,
    },
    alerts: {
      testFailureThreshold: 0.05, // 5%
      performanceDegradation: 0.2, // 20%
      coverageDropThreshold: 0.1, // 10%
    },
  },
} as const

// Test suite status and health
export const testSuiteStatus = {
  lastRun: null as Date | null,
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  skippedTests: 0,
  coverage: {
    statements: 0,
    branches: 0,
    functions: 0,
    lines: 0,
  },
  performance: {
    averageResponseTime: 0,
    slowestEndpoint: '',
    fastestEndpoint: '',
  },
  health: 'unknown' as 'healthy' | 'warning' | 'critical' | 'unknown',
}

// Export test categories for selective running
export const testCategories = {
  smoke: ['basic authentication', 'health checks', 'core CRUD operations'],
  regression: [
    'all integration tests',
    'security tests',
    'data integrity tests',
  ],
  full: ['all test suites', 'performance tests', 'edge cases'],
} as const

/**
 * Test execution summary and reporting
 */
export const generateTestSummary = () => {
  return {
    suiteInfo: testSuiteConfig.metadata,
    configuration: {
      environment: testSuiteConfig.environment,
      coverage: testSuiteConfig.coverage,
      timeouts: testSuiteConfig.timeouts,
    },
    testCoverage: {
      e2eTests: 'Comprehensive API testing with real HTTP requests',
      integrationTests: 'Cross-module functionality and data flow',
      authenticationTests: 'User registration, login, and security',
      projectLifecycleTests: 'Complete project management workflows',
      userManagementTests: 'User lifecycle and permission management',
      crossModuleTests: 'Inter-module data consistency and integrity',
      securityTests: 'Authorization, privacy, and attack prevention',
      performanceTests: 'Load testing and scalability validation',
    },
    testInfrastructure: {
      helpers: 'Comprehensive e2e test helpers for data creation',
      database: 'Automated cleanup and seeding capabilities',
      authentication: 'Token generation and auth header management',
      scenarios: 'Multi-user and collaborative testing scenarios',
    },
    qualityAssurance: {
      codeQuality: 'TypeScript strict mode with comprehensive error handling',
      testIsolation: 'Independent test execution with proper cleanup',
      dataIntegrity: 'Schema validation and referential integrity',
      security: 'Authorization enforcement and input validation',
    },
  }
}

// Export for test runner usage
export default testSuiteConfig
