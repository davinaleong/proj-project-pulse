# Auth Test Suite

This directory contains the authentication test suite, broken down into focused test modules for better maintainability and organization.

## Test Files

### `auth.helpers.ts`

Shared utilities and helper functions used across all auth tests:

- Database cleanup functions
- Test user creation utilities
- Token creation helpers
- Database connection management

### `auth.register.test.ts`

Tests for user registration functionality:

- Successful registration
- Email validation
- Password strength validation
- Password confirmation validation
- Duplicate email handling

### `auth.login.test.ts`

Tests for user login functionality:

- Successful login with valid credentials
- Invalid email/password handling
- Account status validation (banned users)
- Account lockout after failed attempts

### `auth.tokens.test.ts`

Tests for token management and authentication:

- Access token refresh
- User profile retrieval (`/me` endpoint)
- Token validation
- Logout functionality

### `auth.password.test.ts`

Tests for password reset functionality:

- Forgot password request handling
- Reset token validation
- Password reset process
- Invalid token handling

### `auth.verification.test.ts`

Tests for email verification functionality:

- Email verification process
- Verification token validation
- User status updates after verification

### `index.test.ts`

Entry point that imports all auth test modules for running the complete suite.

## Running Tests

### Run all auth tests:

```bash
npm test tests/v1/modules/auth/index.test.ts
```

### Run specific test modules:

```bash
# Registration tests only
npm test tests/v1/modules/auth/auth.register.test.ts

# Login tests only
npm test tests/v1/modules/auth/auth.login.test.ts

# Token tests only
npm test tests/v1/modules/auth/auth.tokens.test.ts

# Password tests only
npm test tests/v1/modules/auth/auth.password.test.ts

# Verification tests only
npm test tests/v1/modules/auth/auth.verification.test.ts
```

## Benefits of This Structure

1. **Focused Testing**: Each file tests a specific auth feature, making it easier to identify and fix issues
2. **Better Maintainability**: Smaller files are easier to maintain and update
3. **Parallel Testing**: Tests can be run in parallel for faster execution
4. **Reusable Helpers**: Common functionality is centralized in the helpers file
5. **Clear Organization**: Easy to find tests for specific authentication features
6. **Modular Development**: New auth features can be tested in isolation

## Migration from Original

The original `auth.test.ts` file has been broken down while maintaining all existing test functionality. All test cases have been preserved and organized by feature area.
