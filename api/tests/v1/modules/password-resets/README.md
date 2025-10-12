# Password Reset Module Tests

This directory contains comprehensive test suites for the Password Reset module, organized into focused test files for better maintainability and clarity.

## Test Structure

### Core Files

- **`passwordResets.helpers.ts`** - Shared test utilities, database setup/cleanup, and helper functions
- **`index.ts`** - Module exports for easy importing

### Test Suites

#### 1. `passwordResets.crud.test.ts`

Tests for basic CRUD (Create, Read, Update, Delete) operations:

- Password reset request creation and validation
- Token verification functionality
- Password reset completion and token consumption
- Token expiration and cleanup
- Input validation for email addresses and passwords
- Database integrity checks

#### 2. `passwordResets.security.test.ts`

Tests for security features and vulnerability protection:

- Rate limiting enforcement (3 attempts per hour per user)
- Token security (cryptographic generation, secure hashing, proper storage)
- Password strength validation and enforcement
- User enumeration protection (consistent responses)
- Token expiration and one-time use validation
- Input sanitization and injection prevention
- Data leakage prevention in API responses

#### 3. `passwordResets.edge-cases.test.ts`

Tests for edge cases and error scenarios:

- Database connection issues and graceful degradation
- Concurrent token creation and race conditions
- Malformed token handling and validation
- User state changes during reset process (deletion, status changes)
- Boundary conditions and extreme inputs
- Token manipulation and attack attempts
- System cleanup and maintenance operations

#### 4. `passwordResets.integration.test.ts`

Tests for complete workflows and integration scenarios:

- End-to-end password reset flow testing
- Multi-user scenarios and proper isolation
- Security integration under simulated attacks
- Error recovery and system resilience
- Data consistency during concurrent operations
- Load testing and performance validation
- Workflow interruption and recovery testing

## Usage

### Running All Password Reset Tests

```bash
npm test -- tests/v1/modules/password-resets
```

### Running Specific Test Suites

```bash
# CRUD operations only
npm test -- tests/v1/modules/password-resets/passwordResets.crud.test.ts

# Security features only
npm test -- tests/v1/modules/password-resets/passwordResets.security.test.ts

# Edge cases only
npm test -- tests/v1/modules/password-resets/passwordResets.edge-cases.test.ts

# Integration tests only
npm test -- tests/v1/modules/password-resets/passwordResets.integration.test.ts
```

### Running with Coverage

```bash
npm run test:coverage -- tests/v1/modules/password-resets
```

## Test Data Setup

All test files use the shared helpers from `passwordResets.helpers.ts` which provide:

- **Database cleanup** - Ensures clean state between tests
- **Test user creation** - Creates users with various configurations and statuses
- **Password reset token creation** - Creates tokens with different states (active, expired, used)
- **Token manipulation utilities** - Creates tokens for edge case testing
- **Email and password validation helpers** - Consistent validation across tests
- **Rate limiting simulation** - Creates multiple attempts for testing limits
- **Database state verification** - Validates data integrity and cleanup

## Security Features Tested

### Rate Limiting

- 3 password reset attempts per hour per user
- Proper time window calculation and enforcement
- Cross-user isolation (user A's attempts don't affect user B)
- Rate limit reset after time window expires

### Token Security

- Cryptographically secure token generation (32 bytes)
- Secure token hashing before database storage
- 24-hour token expiration enforcement
- One-time use token validation
- Token invalidation after successful reset

### Password Security

- Strong password requirements enforcement
- Secure password hashing with bcrypt
- Password change verification
- Unicode and special character support

### Data Protection

- User enumeration prevention
- Consistent API responses for security
- Input sanitization and validation
- No sensitive data exposure in responses

## Database State

- Tests use the configured test database
- Each test file performs cleanup before and after execution
- Shared helpers ensure consistent data setup across all tests
- Password reset tokens are properly managed and cleaned up
- User account states are properly handled (active, inactive, suspended)

## Coverage Goals

These tests aim to provide comprehensive coverage of:

- ✅ All password reset API endpoints and HTTP methods
- ✅ Security features and vulnerability protections
- ✅ Rate limiting and abuse prevention
- ✅ Token lifecycle management and validation
- ✅ Input validation and error handling
- ✅ Database operations and data integrity
- ✅ Edge cases and error scenarios
- ✅ Complete workflow integration testing
- ✅ Concurrent operations and race conditions
- ✅ System resilience and recovery

## Maintenance

When adding new features to the Password Reset module:

1. Add corresponding tests to the appropriate test file based on functionality
2. Update shared helpers if new setup utilities are needed
3. Ensure new tests follow the established security testing patterns
4. Test both positive and negative scenarios
5. Update this README if new test files are added
6. Verify security implications of changes

## Dependencies

- **Jest** - Testing framework
- **Supertest** - HTTP endpoint testing
- **Prisma** - Database operations and types
- **bcrypt** - Password hashing for users and token security
- **crypto** - Cryptographically secure token generation
- **Express** - Application framework for endpoint testing

## Security Testing Best Practices

- Always test both valid and invalid scenarios
- Verify proper error messages that don't leak information
- Test rate limiting boundaries and edge cases
- Validate token security at multiple levels
- Ensure consistent behavior across different user states
- Test concurrent operations for race conditions
- Verify cleanup and maintenance operations
