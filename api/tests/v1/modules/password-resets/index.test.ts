/**
 * Password Reset Module Test Suite
 *
 * This file imports and runs all password reset related tests.
 *
 * Test Structure:
 * - passwordResets.crud.test.ts: Basic CRUD operations testing
 * - passwordResets.security.test.ts: Security features and vulnerabilities
 * - passwordResets.edge-cases.test.ts: Edge cases and error handling
 * - passwordResets.integration.test.ts: Full workflow and integration testing
 *
 * Run with: npm test -- --testPathPattern=password-resets
 */

// Import all test files to ensure they run together
import './passwordResets.crud.test'
import './passwordResets.security.test'
import './passwordResets.edge-cases.test'
import './passwordResets.integration.test'

describe('Password Reset Module - Complete Test Suite', () => {
  it('should run all password reset tests', () => {
    // This is a placeholder test to ensure the test suite runs
    expect(true).toBe(true)
  })
})
