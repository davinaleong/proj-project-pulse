# API Test Modules Documentation

This directory contains comprehensive test suites for all API modules in the Project Pulse application. Each module follows a standardized testing pattern with consistent structure, documentation, and utilities.

## 📁 Module Structure

Each test module contains:

- **index.test.ts**: Centralized exports and metadata
- **{module}.helpers.ts**: Test utilities and helper functions
- **{module}.crud.test.ts**: CRUD operations testing
- **{module}.security.test.ts**: Security and authentication testing
- **{module}.edge-cases.test.ts**: Edge cases and error handling
- **Additional specialized test files**: Module-specific functionality
- **README.md**: Module-specific documentation

## 🧪 Available Test Modules

| Module              | Description                    | Test Files | Key Features                                     |
| ------------------- | ------------------------------ | ---------- | ------------------------------------------------ |
| **auth**            | Authentication & authorization | 5 files    | Registration, login, tokens, password management |
| **notes**           | Note management system         | 4 files    | CRUD, search, security, real-time features       |
| **password-resets** | Password reset workflows       | 4 files    | Token generation, security, workflows            |
| **profiles**        | User profile management        | 4 files    | Profile CRUD, privacy, customization             |
| **projects**        | Project management             | 4 files    | Project lifecycle, collaboration, security       |
| **sessions**        | Session management             | 5 files    | Session lifecycle, security, analytics           |
| **settings**        | Application settings           | 5 files    | Configuration, search, validation                |
| **tasks**           | Task management                | 4 files    | Task CRUD, assignment, real-time updates         |
| **users**           | User management                | 4 files    | User lifecycle, roles, administration            |

## 🚀 Quick Start Guide

### Running All Tests

```bash
# Run all module tests
npm test

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

### Running Module-Specific Tests

```bash
# Run specific module
npm test -- --testPathPattern=auth
npm test -- --testPathPattern=notes
npm test -- --testPathPattern=tasks

# Run specific test file
npm test auth.crud.test.ts
npm test notes.security.test.ts
npm test tasks.real-time.test.ts
```

### Running Test Categories

```bash
# Run all CRUD tests across modules
npm test -- --testNamePattern="CRUD"

# Run all security tests
npm test -- --testNamePattern="SECURITY"

# Run all edge case tests
npm test -- --testNamePattern="EDGE_CASES"
```

## 📊 Test Categories & Coverage

### Core Test Categories

- **CRUD**: Create, Read, Update, Delete operations
- **SECURITY**: Authentication, authorization, data protection
- **EDGE_CASES**: Error handling, boundary conditions
- **INTEGRATION**: Cross-module functionality
- **REAL_TIME**: WebSocket and real-time features
- **SEARCH**: Search and filtering capabilities

### Coverage Areas

- ✅ **Functional Testing**: Core business logic
- ✅ **Security Testing**: Authentication and authorization
- ✅ **Integration Testing**: Module interactions
- ✅ **Error Handling**: Edge cases and error scenarios
- ✅ **Performance Testing**: Load and stress testing
- ✅ **Real-time Testing**: WebSocket functionality

## 🛠️ Test Environment Setup

### Prerequisites

```bash
# Install dependencies
npm install

# Setup test database
npm run test:db:setup

# Run database migrations
npm run test:db:migrate
```

### Environment Variables

```env
# Test Database
TEST_DATABASE_URL="postgresql://user:pass@localhost:5432/test_db"

# JWT Configuration
JWT_SECRET_KEY="test-secret-key"
JWT_EXPIRES_IN="1h"

# Email Configuration (for testing)
EMAIL_SERVICE="mock"
EMAIL_FROM="test@example.com"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Database Setup

```bash
# Create test database
createdb project_pulse_test

# Run migrations
npx prisma migrate deploy

# Seed test data
npx prisma db seed
```

## 📈 Test Metrics & Standards

### Code Coverage Targets

- **Lines**: > 90%
- **Functions**: > 90%
- **Branches**: > 85%
- **Statements**: > 90%

### Test Quality Standards

- ✅ Descriptive test names with clear intent
- ✅ Comprehensive edge case coverage
- ✅ Security vulnerability testing
- ✅ Performance benchmarking
- ✅ Documentation and examples

### Test Naming Convention

```typescript
// Pattern: [MODULE]_[OPERATION]_[SCENARIO]_[EXPECTED_RESULT]
describe('AUTH_LOGIN_VALID_CREDENTIALS_SUCCESS', () => {
  it('should authenticate user with valid credentials', async () => {
    // Test implementation
  })
})
```

## 🔧 Test Utilities & Helpers

### Common Test Helpers

Each module provides standardized helpers:

- **Database cleanup**: Clean test data between tests
- **Test user creation**: Generate test users with various roles
- **Authentication**: Generate tokens and authentication headers
- **Mock data**: Create realistic test data
- **Assertions**: Custom assertion helpers

### Example Usage

```typescript
import { testHelpers } from './auth/index.test'

beforeEach(async () => {
  await testHelpers.cleanupDatabase()
})

const testUser = await testHelpers.createTestUser({
  role: UserRole.ADMIN,
  status: UserStatus.ACTIVE,
})
```

## 📝 Contributing to Tests

### Adding New Tests

1. Follow the established module structure
2. Use descriptive test names and categories
3. Include comprehensive edge case coverage
4. Add security and performance considerations
5. Update module documentation

### Test File Structure

```typescript
/**
 * Module Test File
 * Description of test file purpose
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { testHelpers } from './module.helpers'

describe('MODULE_OPERATION_SCENARIO', () => {
  beforeEach(async () => {
    await testHelpers.cleanupDatabase()
  })

  it('should handle specific scenario correctly', async () => {
    // Test implementation
  })
})
```

## 🐛 Debugging Tests

### Common Issues

- **Database state**: Ensure proper cleanup between tests
- **Authentication**: Verify token generation and validation
- **Async operations**: Handle promises and async/await correctly
- **Mock data**: Ensure realistic and consistent test data

### Debug Commands

```bash
# Run tests with debug output
npm test -- --verbose

# Run specific test with debugging
npm test -- --testNamePattern="specific test" --detectOpenHandles

# Run tests with coverage report
npm test -- --coverage --coverageReporters=html
```

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)
- [Node.js Testing Best Practices](https://github.com/goldbergyoni/nodebestpractices#-6-testing-and-overall-quality-practices)

---

**Last Updated**: December 2024  
**Maintained By**: Project Pulse Development Team
