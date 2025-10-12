/**
 * Profiles Module Test Suite Index
 *
 * This file exports all test utilities and helpers for the profiles module.
 * It provides a centralized point for importing test utilities across
 * different test files and external test suites.
 */

// Export test helpers and utilities
export { profilesTestHelpers } from './profiles.helpers'

// Re-export common types and enums for test convenience
export { UserStatus, UserRole } from '@prisma/client'

// Test suite metadata
export const testSuiteInfo = {
  module: 'profiles',
  version: '1.0.0',
  description: 'Comprehensive test suite for the user profiles module',
  testFiles: [
    'profiles.crud.test.ts',
    'profiles.security.test.ts',
    'profiles.management.test.ts',
    'profiles.edge-cases.test.ts',
  ],
  helpers: ['profiles.helpers.ts'],
  coverage: {
    crud: 'Profile CRUD operations and data management',
    security: 'Profile security and privacy controls',
    management: 'Profile management and user controls',
    edgeCases: 'Edge cases and error handling',
  },
}

/**
 * Test file descriptions for documentation
 */
export const testDescriptions = {
  'profiles.crud.test.ts': {
    purpose: 'Tests profile CRUD operations and data management',
    coverage: [
      'Profile creation and initialization',
      'Profile data retrieval and validation',
      'Profile updates and modifications',
      'Profile deletion and cleanup',
    ],
    keyTests: [
      'CREATE: Profile creation workflows',
      'READ: Profile data retrieval',
      'UPDATE: Profile modification',
      'DELETE: Profile deletion',
    ],
  },

  'profiles.security.test.ts': {
    purpose: 'Tests profile security and privacy controls',
    coverage: [
      'Profile access controls',
      'Privacy setting validation',
      'Data protection measures',
      'Unauthorized access prevention',
    ],
    keyTests: [
      'SECURITY: Access control validation',
      'PRIVACY: Privacy settings',
      'PROTECTION: Data security',
      'UNAUTHORIZED: Access prevention',
    ],
  },

  'profiles.management.test.ts': {
    purpose: 'Tests profile management and user controls',
    coverage: [
      'User profile management',
      'Profile setting controls',
      'Profile customization features',
      'Profile visibility controls',
    ],
    keyTests: [
      'MANAGEMENT: Profile controls',
      'SETTINGS: Configuration management',
      'CUSTOMIZATION: User customization',
      'VISIBILITY: Profile visibility',
    ],
  },

  'profiles.edge-cases.test.ts': {
    purpose: 'Tests edge cases and error handling',
    coverage: [
      'Invalid profile data handling',
      'Missing profile scenarios',
      'Malformed request handling',
      'Boundary condition testing',
    ],
    keyTests: [
      'EDGE_CASES: Invalid data handling',
      'MISSING: Missing profile scenarios',
      'MALFORMED: Request validation',
      'BOUNDARY: Boundary conditions',
    ],
  },
}

/**
 * Quick Start Guide
 *
 * To run profile tests:
 * ```bash
 * # Run all profile tests
 * npm test -- --testPathPattern=profiles
 *
 * # Run specific test file
 * npm test profiles.crud.test.ts
 * npm test profiles.security.test.ts
 * npm test profiles.management.test.ts
 * npm test profiles.edge-cases.test.ts
 *
 * # Run with coverage
 * npm test -- --coverage --testPathPattern=profiles
 * ```
 *
 * Test Environment Setup:
 * - Database: Clean test database instance
 * - Authentication: Test user accounts
 * - Files: Mock file upload service
 * - Privacy: Privacy setting validation
 */

// Import all test files to ensure they run together
import './profiles.crud.test'
import './profiles.security.test'
import './profiles.management.test'
import './profiles.edge-cases.test'
