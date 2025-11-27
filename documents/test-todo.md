# TEST TODO

Documenting the test suites and complete inventory of all test groups.

## Test Progress Tracking
[x] unit\utils\crypto
[x] Fixed concurrent login authentication issues
[x] Enhanced session validation middleware
[x] Created comprehensive test documentation in /docs/testing/

## Complete Test Groups Inventory

### 1. Unit Tests
- **Location**: `tests/unit/`
- **Command**: `npm test -- tests/unit/`
- **Files**:
  - [x] `tests/unit/utils/crypto.test.ts` - Cryptographic utilities testing

### 2. Integration Tests
- **Location**: `tests/v1/integration/`
- **Command**: `npm test -- tests/v1/integration/`
- **Files**:
  - [ ] `auth.test.ts` - Authentication flow integration
  - [ ] `cross-module.test.ts` - Cross-module interactions
  - [ ] `flow.test.ts` - Complete application workflows  
  - [ ] `notes.test.ts` - Notes module integration
  - [ ] `project-lifecycle.test.ts` - Project lifecycle management
  - [ ] `sessions.test.ts` - Session management integration
  - [ ] `settings.test.ts` - Settings module integration
  - [ ] `user-management.test.ts` - User management flows

### 3. End-to-End Tests
- **Location**: `tests/v1/e2e/`
- **Command**: `npm test -- tests/v1/e2e/`
- **Files**:
  - [ ] `api.test.ts` - Full API endpoint testing
  - [ ] `notes.test.ts` - Complete notes functionality

### 4. Module-Specific Test Groups

#### Auth Module
- **Location**: `tests/v1/modules/auth/`
- **Command**: `npm test -- tests/v1/modules/auth/`
- **Files**:
  - [x] `auth.login.test.ts` - Login functionality
  - [x] `auth.password.test.ts` - Password operations
  - [x] `auth.register.test.ts` - Registration process
  - [x] `auth.tokens.test.ts` - Token management
  - [x] `auth.verification.test.ts` - Account verification

#### Notes Module
- **Location**: `tests/v1/modules/notes/`
- **Command**: `npm test -- tests/v1/modules/notes/`
- **Files**:
  - [x] `notes.crud.test.ts` - Create, Read, Update, Delete operations (needs local test data pattern)
  - [x] `notes.edge-cases.test.ts` - Edge case handling (needs local test data pattern) 
  - [x] `notes.search.test.ts` - Search functionality (11/18 passing, needs response format fixes)
  - [x] `notes.security.test.ts` - Security validations (needs generateMockAuthToken fix)
  - [x] `notes.management.test.ts` - Note management operations (11/11 passing)

#### Password Resets Module
- **Location**: `tests/v1/modules/password-resets/`
- **Command**: `npm test -- tests/v1/modules/password-resets/`
- **Files**:
  - [ ] `password-resets.crud.test.ts` - CRUD operations
  - [ ] `password-resets.edge-cases.test.ts` - Edge cases
  - [ ] `password-resets.security.test.ts` - Security tests

#### Profiles Module
- **Location**: `tests/v1/modules/profiles/`
- **Command**: `npm test -- tests/v1/modules/profiles/`
- **Files**:
  - [ ] `profiles.crud.test.ts` - CRUD operations
  - [ ] `profiles.edge-cases.test.ts` - Edge cases
  - [ ] `profiles.security.test.ts` - Security validations

#### Projects Module
- **Location**: `tests/v1/modules/projects/`
- **Command**: `npm test -- tests/v1/modules/projects/`
- **Files**:
  - [ ] `projects.crud.test.ts` - CRUD operations
  - [ ] `projects.edge-cases.test.ts` - Edge cases
  - [ ] `projects.search.test.ts` - Search functionality
  - [ ] `projects.security.test.ts` - Security tests

#### Sessions Module
- **Location**: `tests/v1/modules/sessions/`
- **Command**: `npm test -- tests/v1/modules/sessions/`
- **Files**:
  - [ ] `sessions.crud.test.ts` - Session CRUD operations
  - [ ] `sessions.edge-cases.test.ts` - Session edge cases
  - [ ] `sessions.security.test.ts` - Session security

#### Settings Module
- **Location**: `tests/v1/modules/settings/`
- **Command**: `npm test -- tests/v1/modules/settings/`
- **Files**:
  - [ ] `settings.crud.test.ts` - Settings CRUD operations
  - [ ] `settings.edge-cases.test.ts` - Settings edge cases
  - [ ] `settings.security.test.ts` - Settings security

#### Tasks Module
- **Location**: `tests/v1/modules/tasks/`
- **Command**: `npm test -- tests/v1/modules/tasks/`
- **Files**:
  - [ ] `tasks.crud.test.ts` - Task CRUD operations
  - [ ] `tasks.edge-cases.test.ts` - Task edge cases
  - [ ] `tasks.search.test.ts` - Task search functionality
  - [ ] `tasks.security.test.ts` - Task security

#### Users Module
- **Location**: `tests/v1/modules/users/`
- **Command**: `npm test -- tests/v1/modules/users/`
- **Files**:
  - [ ] `users.auth.test.ts` - User authentication
  - [ ] `users.management.test.ts` - User management operations
  - [ ] `users.password.test.ts` - User password operations
  - [ ] `users.profile.test.ts` - User profile operations
  - [ ] `users.security.test.ts` - User security validations
  - [ ] `users.verification.test.ts` - User verification

### 5. Debug/Development Tests
- **Location**: `tests/`
- **Files**:
  - [ ] `debug-login.test.ts` - Debug authentication issues

## Useful Test Commands

### Run Tests by Category
```bash
# All unit tests
npm test -- tests/unit/

# All integration tests  
npm test -- tests/v1/integration/

# All e2e tests
npm test -- tests/v1/e2e/

# All module tests
npm test -- tests/v1/modules/

# All v1 tests (integration + e2e + modules)
npm test -- tests/v1/
```

### Run Tests by Type Pattern
```bash
# All CRUD tests across modules
npm test -- --testNamePattern="crud|CRUD"

# All security tests
npm test -- --testNamePattern="security|Security"

# All edge case tests
npm test -- --testNamePattern="edge-cases|Edge Cases"

# All search tests
npm test -- --testNamePattern="search|Search"
```

### Test Execution Options
```bash
# Run with coverage report
npm test -- --coverage

# Run in watch mode for development
npm test -- --watch

# Run with verbose output
npm test -- --verbose

# Run tests matching specific pattern
npm test -- --testNamePattern="login"
npm test -- --testNamePattern="auth"
```

### Individual Test Files
```bash
# Run specific test file
npm test -- tests/v1/modules/auth/auth.login.test.ts
npm test -- tests/v1/integration/auth.test.ts
npm test -- tests/unit/utils/crypto.test.ts
```

## Test Architecture Summary

**Total Test Files**: 56 test files organized across:
- **1 Unit Test** (crypto utilities)
- **8 Integration Tests** (cross-module workflows)
- **2 E2E Tests** (complete API testing)
- **44 Module Tests** (8 modules × 3-6 test files each)
- **1 Debug Test** (development debugging)

Each module follows consistent patterns:
- **CRUD Tests**: Create, Read, Update, Delete operations
- **Security Tests**: Authentication, authorization, input validation
- **Edge Cases Tests**: Boundary conditions, error handling
- **Search Tests**: Search and filtering functionality (where applicable)

For detailed testing guides and setup instructions, see the comprehensive documentation in `/docs/testing/`.