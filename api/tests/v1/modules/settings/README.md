# Settings Module Test Suite

This directory contains a comprehensive test suite for the Settings module, following the same conventions used in the Notes module. The test suite provides thorough coverage of all functionality, security, and edge cases.

## Test Structure

### Core Test Files

1. **`settings.helpers.ts`** - Shared test utilities and database helpers
2. **`settings.crud.test.ts`** - Basic CRUD operations testing
3. **`settings.security.test.ts`** - Authentication, authorization, and security testing
4. **`settings.edge-cases.test.ts`** - Edge cases, error handling, and boundary testing
5. **`settings.management.test.ts`** - Admin features and bulk operations testing
6. **`settings.search.test.ts`** - Search functionality and advanced queries testing
7. **`../integration/settings.test.ts`** - End-to-end integration testing

### Test Coverage Areas

#### CRUD Operations (`settings.crud.test.ts`)

- ✅ Create settings with different visibility levels
- ✅ Read settings by ID, with proper access control
- ✅ Update settings with validation
- ✅ Delete settings with permission checks
- ✅ List settings with pagination and filtering
- ✅ Role-based creation permissions (USER/ADMIN/SYSTEM)

#### Security & Validation (`settings.security.test.ts`)

- ✅ Authentication requirements for all endpoints
- ✅ Role-based access control (USER/ADMIN/SUPERADMIN)
- ✅ Permission validation for different visibility levels
- ✅ Data validation and sanitization
- ✅ Privacy and data protection checks
- ✅ Input sanitization (XSS, SQL injection protection)

#### Edge Cases (`settings.edge-cases.test.ts`)

- ✅ Invalid parameter handling
- ✅ Malformed request bodies
- ✅ Boundary value testing
- ✅ Concurrent operations
- ✅ Database constraints and integrity
- ✅ Performance and resource limits
- ✅ Error recovery and resilience

#### Management Features (`settings.management.test.ts`)

- ✅ Admin user settings access (`/api/v1/settings/users/:userId`)
- ✅ System settings management (`/api/v1/settings/system`)
- ✅ Settings statistics (`/api/v1/settings/stats`)
- ✅ Bulk operations and batch processing
- ✅ Settings search and filtering
- ✅ Performance and scalability testing
- ✅ Data integrity and consistency

#### Search & Queries (`settings.search.test.ts`)

- ✅ Basic search by key, value, category, type, visibility
- ✅ Advanced search combinations and filters
- ✅ Search with pagination
- ✅ Search edge cases (special characters, unicode, etc.)
- ✅ Search performance testing
- ✅ Admin search capabilities
- ✅ Search result formatting and validation

#### Integration Testing (`../integration/settings.test.ts`)

- ✅ End-to-end workflows for different user roles
- ✅ Cross-module authentication integration
- ✅ User context and ownership validation
- ✅ Performance and scalability under load
- ✅ Error handling and recovery scenarios
- ✅ Real-world usage scenarios

## Role-Based Testing

### Regular User (USER role)

- Can create/read/update/delete own USER visibility settings
- Cannot access ADMIN or SYSTEM visibility settings
- Cannot view other users' settings
- Cannot access admin endpoints (stats, system settings)

### Admin User (ADMIN role)

- Can create/read/update/delete ADMIN visibility settings
- Can access settings statistics
- Can view other users' settings via admin endpoints
- Cannot access SYSTEM visibility settings
- Cannot create SYSTEM settings

### Super Admin (SUPERADMIN role)

- Can create/read/update/delete SYSTEM visibility settings
- Can access all admin functionality
- Can view system settings
- Has highest level of access

## Test Data Setup

The test helpers create realistic test scenarios:

```typescript
// Test users with different roles
const regularUser = { role: UserRole.USER }
const adminUser = { role: UserRole.ADMIN }
const superAdminUser = { role: UserRole.SUPERADMIN }

// Test settings with different visibility levels
const userSetting = { visibility: SettingVisibility.USER }
const adminSetting = { visibility: SettingVisibility.ADMIN }
const systemSetting = { visibility: SettingVisibility.SYSTEM }
```

## Running the Tests

### Run All Settings Tests

```bash
# Using the test script (Linux/Mac)
./run-settings-tests.sh

# Using the batch file (Windows)
run-settings-tests.bat

# Using npm directly
npm test -- tests/v1/modules/settings/
npm test -- tests/v1/integration/settings.test.ts
```

### Run Individual Test Suites

```bash
# CRUD tests
npm test -- tests/v1/modules/settings/settings.crud.test.ts

# Security tests
npm test -- tests/v1/modules/settings/settings.security.test.ts

# Edge cases
npm test -- tests/v1/modules/settings/settings.edge-cases.test.ts

# Management features
npm test -- tests/v1/modules/settings/settings.management.test.ts

# Search functionality
npm test -- tests/v1/modules/settings/settings.search.test.ts

# Integration tests
npm test -- tests/v1/integration/settings.test.ts
```

### Run with Coverage

```bash
npm run test:coverage -- tests/v1/modules/settings/
```

## Test Environment Setup

Tests use a separate test database and clean up after themselves:

```typescript
beforeAll(async () => {
  await settingsTestHelpers.cleanupDatabase()
  // Setup test data
})

afterAll(async () => {
  await settingsTestHelpers.disconnectDatabase()
})
```

## Expected Test Results

The test suite should achieve:

- **100% endpoint coverage** - All API endpoints tested
- **Role-based security coverage** - All permission combinations tested
- **Error scenario coverage** - All error paths tested
- **Performance testing** - Load and concurrency testing
- **Real-world scenarios** - Practical usage workflows tested

## Test Conventions Followed

Following the Notes module conventions:

1. **Descriptive test names** - Clear description of what's being tested
2. **Proper setup/teardown** - Clean database state for each test
3. **Comprehensive assertions** - Testing both success and error responses
4. **Role-based organization** - Tests grouped by user permissions
5. **Realistic test data** - Using meaningful test values
6. **Security-first testing** - Extensive security and permission testing

## Dependencies

The test suite requires:

- Jest testing framework
- Supertest for HTTP testing
- Prisma test client
- JWT for authentication tokens
- bcrypt for password hashing

## Maintenance

When adding new features to the Settings module:

1. Add corresponding tests to the appropriate test file
2. Update test helpers if new utilities are needed
3. Ensure all permission levels are tested
4. Add integration tests for cross-module functionality
5. Update this documentation
