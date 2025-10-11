# Users Test Suite

This directory contains the users test suite, broken down into focused test modules for better maintainability and organization.

## Test Files

### `users.helpers.ts`

Shared utilities and helper functions used across all user tests:

- Database cleanup functions
- Test user creation utilities (admin, manager, regular users)
- Token generation helpers
- Password reset token creation
- Database connection management

### `users.auth.test.ts`

Tests for user authentication functionality:

- User registration
- User login
- Input validation
- Duplicate email handling
- Invalid credentials handling

### `users.profile.test.ts`

Tests for user profile management:

- Get current user profile (`/me` endpoint)
- Password change functionality
- Authentication requirements
- Input validation for password changes

### `users.management.test.ts`

Tests for user management functionality (admin/manager features):

- List users with pagination
- Get user by UUID
- Update user information
- Delete user (soft delete)
- Role-based access control
- Search and filtering

### `users.password.test.ts`

Tests for password reset functionality:

- Forgot password request
- Password reset with token
- Token validation and expiration
- Security considerations (not revealing user existence)

### `users.verification.test.ts`

Tests for email verification functionality:

- Email verification process
- User status updates after verification
- Integration with login process
- Error handling for invalid/already verified users

### `users.security.test.ts`

Tests for security-related functionality:

- Account lockout after failed login attempts
- Permission checking system
- Rate limiting (if configured)
- Input sanitization (XSS prevention)
- SQL injection protection

### `index.test.ts`

Entry point that imports all user test modules for running the complete suite.

## Running Tests

### Run all user tests:

```bash
npm test tests/v1/modules/users/index.test.ts
```

### Run specific test modules:

```bash
# Authentication tests only
npm test tests/v1/modules/users/users.auth.test.ts

# Profile management tests only
npm test tests/v1/modules/users/users.profile.test.ts

# User management tests only
npm test tests/v1/modules/users/users.management.test.ts

# Password reset tests only
npm test tests/v1/modules/users/users.password.test.ts

# Email verification tests only
npm test tests/v1/modules/users/users.verification.test.ts

# Security tests only
npm test tests/v1/modules/users/users.security.test.ts
```

## Test User Setup

The test suite uses different types of users for comprehensive testing:

- **Admin User**: Full system access, can manage all users
- **Manager User**: Can view and manage users but limited delete access
- **Regular User**: Standard user with basic profile access
- **Test Users**: Various users created for specific test scenarios

## Benefits of This Structure

1. **Focused Testing**: Each file tests a specific user feature area
2. **Better Maintainability**: Smaller files are easier to maintain and update
3. **Parallel Testing**: Tests can be run in parallel for faster execution
4. **Reusable Helpers**: Common functionality is centralized in the helpers file
5. **Clear Organization**: Easy to find tests for specific user features
6. **Role-based Testing**: Comprehensive testing of different user roles and permissions
7. **Security Focus**: Dedicated security testing for authentication and authorization

## Migration from Original

The original `users.test.ts` file has been broken down while maintaining all existing test functionality. All test cases have been preserved and organized by feature area with additional security and edge case testing.

## Key Features Tested

- **Authentication**: Registration, login, session management
- **Authorization**: Role-based access control, permissions
- **Profile Management**: User data updates, password changes
- **Security**: Account lockout, rate limiting, input sanitization
- **Email Verification**: Account activation process
- **Password Reset**: Secure password recovery flow
- **User Management**: Admin/manager user operations
