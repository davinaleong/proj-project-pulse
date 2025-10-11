# Sessions Module Tests

This directory contains comprehensive test suites for the Sessions module, organized into focused test files for better maintainability and clarity.

## Test Structure

### Core Files

- **`sessions.helpers.ts`** - Shared test utilities, database setup/cleanup, and helper functions
- **`index.ts`** - Module exports for easy importing

### Test Suites

#### 1. `sessions.crud.test.ts`

Tests for basic CRUD (Create, Read, Update, Delete) operations:

- Session listing with pagination and filtering
- Individual session retrieval and validation
- Session activity updates
- Authentication requirements for all endpoints
- Input validation and error handling

#### 2. `sessions.management.test.ts`

Tests for session lifecycle and management operations:

- Individual session revocation
- Bulk session revocation (revoke all except current)
- Session state management and transitions
- Concurrent operation handling
- Error handling for malformed requests

#### 3. `sessions.analytics.test.ts`

Tests for analytics and statistics functionality:

- Session statistics (total, active, revoked, unique devices/IPs)
- Session analytics with hourly activity tracking
- Top devices and usage patterns
- Security alerts and monitoring
- Performance testing for large datasets

#### 4. `sessions.admin.test.ts`

Tests for administrative operations:

- Session cleanup operations (removing old sessions)
- Bulk revocation operations for administrators
- Admin-only endpoint authorization
- Performance testing for admin operations
- Error handling for admin-specific scenarios

#### 5. `sessions.security.test.ts`

Tests for security, authentication, and edge cases:

- JWT token validation and security
- Rate limiting and concurrent request handling
- Input validation edge cases
- Session hijacking prevention
- Data consistency and referential integrity
- Performance with large datasets and deep pagination

## Usage

### Running All Sessions Tests

```bash
npm test -- tests/v1/modules/sessions
```

### Running Specific Test Suites

```bash
# CRUD operations only
npm test -- tests/v1/modules/sessions/sessions.crud.test.ts

# Management operations only
npm test -- tests/v1/modules/sessions/sessions.management.test.ts

# Analytics functionality only
npm test -- tests/v1/modules/sessions/sessions.analytics.test.ts

# Admin operations only
npm test -- tests/v1/modules/sessions/sessions.admin.test.ts

# Security and edge cases only
npm test -- tests/v1/modules/sessions/sessions.security.test.ts
```

### Running with Coverage

```bash
npm run test:coverage -- tests/v1/modules/sessions
```

## Test Data Setup

All test files use the shared helpers from `sessions.helpers.ts` which provide:

- **Database cleanup** - Ensures clean state between tests
- **Test user creation** - Creates authenticated users with different roles
- **Test session creation** - Creates sessions with various configurations
- **Multiple session creation** - Bulk creation for testing scenarios
- **JWT token generation** - Provides authentication tokens for users and admins
- **Database disconnection** - Clean shutdown

## Authentication & Authorization

Tests cover multiple user roles and scenarios:

- **Regular Users** - Can only access their own sessions
- **Admin Users** - Can perform administrative operations
- **JWT Validation** - Comprehensive token validation and security testing
- **Role-based Access** - Proper authorization for different endpoints

## Test Scenarios Covered

### Security Testing

- ✅ JWT token format validation
- ✅ Expired token handling
- ✅ Session hijacking prevention
- ✅ Rate limiting validation
- ✅ Input sanitization
- ✅ SQL injection prevention

### Performance Testing

- ✅ Large dataset handling
- ✅ Concurrent operations
- ✅ Deep pagination
- ✅ Admin operations at scale
- ✅ Analytics with many sessions

### Edge Cases

- ✅ Orphaned sessions
- ✅ Concurrent revocations
- ✅ Malformed input data
- ✅ Database constraint violations
- ✅ Various session states
- ✅ Referential integrity

## Database State

- Tests use the configured test database
- Each test file performs cleanup before and after execution
- Shared helpers ensure consistent data setup across all tests
- Session data includes proper user associations and timestamps
- Soft deletes and revocations are properly handled

## Coverage Goals

These tests aim to provide comprehensive coverage of:

- ✅ All API endpoints and HTTP methods
- ✅ Authentication and authorization flows
- ✅ Input validation and error handling
- ✅ Database operations and data integrity
- ✅ Business logic and session workflows
- ✅ Analytics and statistics calculations
- ✅ Admin operations and bulk processing
- ✅ Security vulnerabilities and protections
- ✅ Performance under various load conditions

## API Endpoints Tested

### User Endpoints

- `GET /api/v1/sessions` - List user sessions with filtering/pagination
- `GET /api/v1/sessions/:id` - Get specific session details
- `PUT /api/v1/sessions/:id/activity` - Update session activity timestamp
- `DELETE /api/v1/sessions/:id` - Revoke specific session
- `DELETE /api/v1/sessions` - Revoke all sessions except current

### Analytics Endpoints

- `GET /api/v1/sessions/stats` - Get session statistics
- `GET /api/v1/sessions/analytics` - Get detailed analytics with hourly data
- `GET /api/v1/sessions/security/alerts` - Get security alerts

### Admin Endpoints

- `DELETE /api/v1/sessions/admin/cleanup` - Cleanup old sessions
- `POST /api/v1/sessions/admin/bulk-revoke` - Bulk revoke sessions

## Maintenance

When adding new features to the Sessions module:

1. Add corresponding tests to the appropriate test file
2. Update shared helpers if new setup utilities are needed
3. Ensure new tests follow the established patterns
4. Update this README if new test files are added
5. Consider security implications and add appropriate security tests

## Dependencies

- **Jest** - Testing framework
- **Supertest** - HTTP endpoint testing
- **Prisma** - Database operations and types
- **jsonwebtoken** - JWT token generation and validation for authentication
- **Node.js** - Runtime environment with proper async/await support
