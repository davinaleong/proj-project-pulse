/**
 * Auth Module Test Suite Index
 *
 * This file exports all test utilities and helpers for the auth module.
 * It provides a centralized point for importing test utilities across
 * different test files and external test suites.
 */

// Export test helpers and utilities
export { testHelpers, prisma } from './auth.helpers'

// Re-export common types and enums for test convenience
export { UserRole, UserStatus } from '@prisma/client'

// Test suite metadata
export const testSuiteInfo = {
  module: 'auth',
  version: '1.0.0',
  description: 'Comprehensive test suite for the authentication module',
  testFiles: [
    'auth.register.test.ts',
    'auth.login.test.ts',
    'auth.tokens.test.ts',
    'auth.password.test.ts',
    'auth.verification.test.ts',
  ],
  helpers: ['auth.helpers.ts'],
  coverage: {
    register: 'User registration and account creation',
    login: 'User authentication and login flows',
    tokens: 'JWT token management and validation',
    password: 'Password management and reset workflows',
    verification: 'Email verification and account activation',
  },
}

/**
 * Test file descriptions for documentation
 */
export const testDescriptions = {
  'auth.register.test.ts': {
    purpose: 'Tests user registration and account creation',
    coverage: [
      'User registration workflows',
      'Account creation validation',
      'Duplicate account prevention',
      'Registration security controls',
    ],
    keyTests: [
      'REGISTER: User registration flows',
      'VALIDATION: Input validation and sanitization',
      'DUPLICATES: Duplicate account handling',
      'SECURITY: Registration security measures',
    ],
  },

  'auth.login.test.ts': {
    purpose: 'Tests user authentication and login flows',
    coverage: [
      'User login authentication',
      'Password validation',
      'Account status checking',
      'Login security measures',
    ],
    keyTests: [
      'LOGIN: User authentication flows',
      'PASSWORD: Password verification',
      'STATUS: Account status validation',
      'SECURITY: Login security controls',
    ],
  },

  'auth.tokens.test.ts': {
    purpose: 'Tests JWT token management and validation',
    coverage: [
      'Token generation and signing',
      'Token validation and verification',
      'Token expiration handling',
      'Token refresh mechanisms',
    ],
    keyTests: [
      'TOKENS: JWT token operations',
      'VALIDATION: Token verification',
      'EXPIRATION: Token lifecycle',
      'REFRESH: Token renewal',
    ],
  },

  'auth.password.test.ts': {
    purpose: 'Tests password management and reset workflows',
    coverage: [
      'Password hashing and storage',
      'Password reset workflows',
      'Password security validation',
      'Password policy enforcement',
    ],
    keyTests: [
      'PASSWORD: Password management',
      'RESET: Password reset flows',
      'SECURITY: Password validation',
      'POLICY: Password requirements',
    ],
  },

  'auth.verification.test.ts': {
    purpose: 'Tests email verification and account activation',
    coverage: [
      'Email verification workflows',
      'Account activation processes',
      'Verification token management',
      'Email verification security',
    ],
    keyTests: [
      'VERIFICATION: Email verification',
      'ACTIVATION: Account activation',
      'TOKENS: Verification tokens',
      'SECURITY: Verification security',
    ],
  },
}

/**
 * Quick Start Guide
 *
 * To run auth tests:
 * ```bash
 * # Run all auth tests
 * npm test -- --testPathPattern=auth
 *
 * # Run specific test file
 * npm test auth.register.test.ts
 * npm test auth.login.test.ts
 * npm test auth.tokens.test.ts
 * npm test auth.password.test.ts
 * npm test auth.verification.test.ts
 *
 * # Run with coverage
 * npm test -- --coverage --testPathPattern=auth
 * ```
 *
 * Test Environment Setup:
 * - Database: Clean test database instance
 * - JWT: Test JWT secret configuration
 * - Email: Mock email service for verification
 * - Security: Rate limiting and security controls
 */

// Import all test files to ensure they run together
import './auth.register.test'
import './auth.login.test'
import './auth.tokens.test'
import './auth.password.test'
import './auth.verification.test'
