/**
 * Projects Module Test Suite Index
 *
 * This file exports all test utilities and helpers for the projects module.
 * It provides a centralized point for importing test utilities across
 * different test files and external test suites.
 */

// Export test helpers and utilities
export { projectsTestHelpers, prisma } from './projects.helpers'

// Re-export common types and enums for test convenience
export { ProjectStage, UserRole, UserStatus, TaskStatus } from '@prisma/client'

// Test suite metadata
export const testSuiteInfo = {
  module: 'projects',
  version: '1.0.0',
  description: 'Comprehensive test suite for the projects module',
  testFiles: [
    'projects.crud.test.ts',
    'projects.security.test.ts',
    'projects.management.test.ts',
    'projects.analytics.test.ts',
    'projects.admin.test.ts',
  ],
  helpers: ['projects.helpers.ts'],
  coverage: {
    crud: 'Complete CRUD operations testing',
    security: 'Role-based access control and authentication',
    management: 'Project lifecycle and status management',
    analytics: 'Advanced analytics and reporting',
    admin: 'Administrative operations and oversight',
  },
}

/**
 * Test file descriptions for documentation
 */
export const testDescriptions = {
  'projects.crud.test.ts': {
    purpose: 'Tests all CRUD operations for projects',
    coverage: [
      'Project creation with validation',
      'Project retrieval and listing',
      'Project updates and stage changes',
      'Project deletion (soft delete)',
      'Statistics and aggregations',
      'Pagination and sorting',
    ],
    keyTests: [
      'CREATE: Project creation with all fields',
      'READ: Individual and bulk project retrieval',
      'UPDATE: Partial and complete updates',
      'DELETE: Soft deletion verification',
      'STATS: Project statistics and metrics',
    ],
  },

  'projects.security.test.ts': {
    purpose: 'Tests authentication and authorization for projects',
    coverage: [
      'Authentication requirements',
      'Role-based access control',
      'Project ownership permissions',
      'Data isolation between users',
      'Input sanitization',
    ],
    keyTests: [
      'AUTH: Token validation and expiry',
      'RBAC: USER/MANAGER/ADMIN permissions',
      'OWNERSHIP: Project access control',
      'ISOLATION: User data separation',
    ],
  },

  'projects.management.test.ts': {
    purpose: 'Tests project lifecycle and management functionality',
    coverage: [
      'Project stage transitions',
      'Project status management',
      'Bulk operations on projects',
      'Project archiving and completion',
    ],
    keyTests: [
      'LIFECYCLE: Stage transition management',
      'BULK: Bulk project operations',
      'ARCHIVE: Project archiving functionality',
      'COMPLETION: Project completion workflows',
    ],
  },

  'projects.analytics.test.ts': {
    purpose: 'Tests advanced analytics and reporting functionality',
    coverage: [
      'Portfolio overview analytics',
      'Performance metrics and KPIs',
      'Financial reporting',
      'Time tracking analytics',
      'Custom reporting queries',
    ],
    keyTests: [
      'OVERVIEW: Portfolio analytics dashboard',
      'METRICS: Performance and efficiency metrics',
      'FINANCIAL: Revenue and cost analytics',
      'TIME: Time tracking and productivity',
      'CUSTOM: Custom report generation',
    ],
  },

  'projects.admin.test.ts': {
    purpose: 'Tests administrative operations and oversight',
    coverage: [
      'Administrative project management',
      'Cross-user project operations',
      'System-wide project analytics',
      'Administrative permissions',
    ],
    keyTests: [
      'ADMIN: Administrative project operations',
      'CROSS_USER: Multi-user project management',
      'SYSTEM: System-wide analytics',
      'PERMISSIONS: Administrative access control',
    ],
  },

  'projects.helpers.ts': {
    purpose: 'Provides test utilities and helper functions',
    coverage: [
      'Database setup and cleanup',
      'Test data generation',
      'Authentication token generation',
      'Common test utilities',
    ],
    utilities: [
      'cleanupDatabase(): Clean test database',
      'createTestUser(): Generate test users',
      'createTestProject(): Generate test projects',
      'createMultipleProjects(): Generate project portfolios',
      'generateAuthToken(): Create JWT tokens',
      'setupTestData(): Create comprehensive test setup',
    ],
  },
}

/**
 * Quick start guide for using the test suite
 */
export const quickStartGuide = {
  setup: [
    '1. Import helpers: import { projectsTestHelpers } from "./projects.helpers"',
    '2. Setup database: await projectsTestHelpers.cleanupDatabase()',
    '3. Create test data: const user = await projectsTestHelpers.createTestUser()',
    '4. Generate token: const token = projectsTestHelpers.generateAuthToken(user)',
  ],
  cleanup: [
    '1. Clean database: await projectsTestHelpers.cleanupDatabase()',
    '2. Disconnect: await projectsTestHelpers.disconnectDatabase()',
  ],
  examples: [
    'See individual test files for usage examples',
    'Each test file includes comprehensive beforeEach/afterAll setup',
    'Helper functions handle all common test data creation patterns',
  ],
}
