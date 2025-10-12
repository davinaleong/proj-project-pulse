# Profile Module Tests

This directory contains comprehensive tests for the Profile module, following the same testing conventions as the notes module.

## Test Structure

### Test Files

- **`profiles.helpers.ts`** - Test utilities and helper functions
- **`profiles.crud.test.ts`** - CRUD operation tests
- **`profiles.management.test.ts`** - Profile management and settings tests
- **`profiles.security.test.ts`** - Security and authorization tests
- **`profiles.edge-cases.test.ts`** - Edge cases and boundary value tests
- **`index.ts`** - Test suite exports

### Test Categories

#### CRUD Operations (`profiles.crud.test.ts`)

- ✅ Profile creation with validation
- ✅ Profile retrieval (own, public, private)
- ✅ Profile updates with authorization
- ✅ Profile deletion with cascading
- ✅ Public profile discovery with filtering
- ✅ Authentication and authorization checks

#### Management Features (`profiles.management.test.ts`)

- ✅ Profile statistics calculation
- ✅ Settings management (get/update)
- ✅ Privacy controls and visibility
- ✅ Social links management
- ✅ Notification preferences
- ✅ Theme and localization settings

#### Security Tests (`profiles.security.test.ts`)

- ✅ Authentication token validation
- ✅ Authorization checks (owner/admin)
- ✅ Privacy enforcement
- ✅ Cross-user access prevention
- ✅ Input validation and sanitization
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ Rate limiting behavior

#### Edge Cases (`profiles.edge-cases.test.ts`)

- ✅ Boundary value testing (max lengths)
- ✅ Special character handling
- ✅ Unicode support
- ✅ Concurrent operations
- ✅ Invalid data handling
- ✅ Timezone validation
- ✅ URL format validation
- ✅ Pagination edge cases

## Test Helpers

### Database Setup

```typescript
// Clean database before tests
await profilesTestHelpers.cleanupDatabase()

// Create test data
const { user, profile, authToken } = await profilesTestHelpers.setupTestData()
```

### User Creation

```typescript
// Create test user
const user = await profilesTestHelpers.createTestUser({
  name: 'Test User',
  email: 'test@example.com',
  role: UserRole.USER,
})

// Generate JWT token
const token = profilesTestHelpers.generateValidJWT(user.id)
```

### Profile Creation

```typescript
// Create test profile
const profile = await profilesTestHelpers.createTestProfile(userId, {
  bio: 'Test bio',
  visibility: Visibility.PUBLIC,
  theme: Theme.LIGHT,
})

// Create multiple profiles
const { users, profiles } =
  await profilesTestHelpers.createMultipleTestProfiles()
```

### Validation Data

```typescript
// Valid profile data
const validData = profilesTestHelpers.createValidProfileData()

// Invalid profile data
const invalidData = profilesTestHelpers.createInvalidProfileData()
```

## Test Coverage

### API Endpoints Tested

- `POST /api/v1/profiles` - Create profile
- `GET /api/v1/profiles/me` - Get own profile
- `GET /api/v1/profiles/:uuid` - Get profile by UUID
- `PUT /api/v1/profiles/:uuid` - Update profile
- `DELETE /api/v1/profiles/:uuid` - Delete profile
- `GET /api/v1/profiles/public` - List public profiles
- `GET /api/v1/profiles/:uuid/stats` - Get profile statistics
- `GET /api/v1/profiles/settings` - Get profile settings
- `PUT /api/v1/profiles/settings` - Update profile settings

### Security Scenarios

- ✅ Unauthenticated requests
- ✅ Invalid/expired tokens
- ✅ Cross-user access attempts
- ✅ Privilege escalation attempts
- ✅ Private profile access
- ✅ Admin privilege verification
- ✅ Malicious input handling

### Data Validation

- ✅ Bio length validation (0-500 characters)
- ✅ URL format validation for social links
- ✅ Enum validation (Theme, Visibility)
- ✅ Timezone validation
- ✅ Language code validation
- ✅ Social platform validation
- ✅ Notification settings structure

### Error Handling

- ✅ 400 Bad Request (validation errors)
- ✅ 401 Unauthorized (missing/invalid auth)
- ✅ 403 Forbidden (insufficient permissions)
- ✅ 404 Not Found (profile doesn't exist)
- ✅ 500 Internal Server Error (server issues)

## Running Tests

### All Profile Tests

```bash
npm test -- tests/v1/modules/profiles
```

### Individual Test Files

```bash
# CRUD tests
npm test -- tests/v1/modules/profiles/profiles.crud.test.ts

# Management tests
npm test -- tests/v1/modules/profiles/profiles.management.test.ts

# Security tests
npm test -- tests/v1/modules/profiles/profiles.security.test.ts

# Edge cases
npm test -- tests/v1/modules/profiles/profiles.edge-cases.test.ts
```

### With Coverage

```bash
npm run test:coverage -- tests/v1/modules/profiles
```

## Test Data

### Default Test User

```typescript
{
  name: 'Test User',
  email: 'test@example.com',
  role: 'USER',
  status: 'ACTIVE'
}
```

### Default Test Profile

```typescript
{
  bio: 'Test bio for user profile',
  timezone: 'UTC',
  language: 'en',
  theme: 'LIGHT',
  visibility: 'PUBLIC',
  socialLinks: {
    website: 'https://example.com',
    github: 'https://github.com/testuser'
  },
  notifications: {
    email: { projects: true, tasks: true, notes: true, mentions: true },
    push: { projects: false, tasks: true, notes: false, mentions: true },
    frequency: 'immediate'
  }
}
```

## Database Cleanup

Tests use proper cleanup to ensure isolation:

```typescript
beforeAll(async () => {
  await profilesTestHelpers.cleanupDatabase()
  // Setup test data
})

afterAll(async () => {
  await profilesTestHelpers.disconnectDatabase()
})
```

## Assertions Patterns

### Success Response

```typescript
expect(response.body.success).toBe(true)
expect(response.body.data).toBeDefined()
expect(response.body.message).toContain('successfully')
```

### Error Response

```typescript
expect(response.body.success).toBe(false)
expect(response.body.message).toContain('error description')
```

### Profile Data Validation

```typescript
expect(response.body.data.uuid).toBeDefined()
expect(response.body.data.userId).toBe(expectedUserId)
expect(response.body.data.user).toBeDefined()
expect(response.body.data.visibility).toBe('PUBLIC')
```

## Performance Considerations

- Tests use database transactions for speed
- Concurrent operation testing
- Large data handling validation
- Rate limiting behavior verification
- Memory usage edge cases

## Future Enhancements

- Integration with CI/CD pipelines
- Performance benchmarking
- Load testing scenarios
- Database migration testing
- API versioning compatibility tests
