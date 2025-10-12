# Tasks Module Test Suite

A comprehensive test suite for the tasks module of the Project Pulse API, providing complete coverage of CRUD operations, security, edge cases, and search functionality.

## 📁 Test Structure

```
api/tests/v1/modules/tasks/
├── index.ts                 # Test suite exports and metadata
├── tasks.helpers.ts         # Test utilities and helper functions
├── tasks.crud.test.ts       # CRUD operations testing
├── tasks.security.test.ts   # Authentication and authorization
├── tasks.edge-cases.test.ts # Boundary testing and error scenarios
├── tasks.search.test.ts     # Search, filtering, and sorting
└── README.md               # This documentation
```

## 🎯 Test Coverage

### Core Functionality

- ✅ **CRUD Operations** - Complete Create, Read, Update, Delete testing
- ✅ **Data Validation** - Zod schema validation and type checking
- ✅ **Business Logic** - Task status management and workflow
- ✅ **Time Tracking** - Time estimates and actual time logging
- ✅ **Cost Tracking** - Project cost management and tracking

### Security & Access Control

- ✅ **Authentication** - JWT token validation and expiry
- ✅ **Authorization** - Role-based access control (USER/MANAGER/ADMIN)
- ✅ **Project Permissions** - Project ownership and access rights
- ✅ **Task Permissions** - Task modification and viewing rights
- ✅ **Data Isolation** - User data separation and privacy

### Advanced Features

- ✅ **Search & Filtering** - Text search, status filters, date ranges
- ✅ **Sorting** - Multi-field sorting capabilities
- ✅ **Pagination** - Efficient large dataset handling
- ✅ **Soft Deletion** - Proper deletion handling with recovery
- ✅ **Unicode Support** - Multi-language and special character handling

## 🚀 Quick Start

### Import Test Helpers

```typescript
import { tasksTestHelpers, TaskStatus, UserRole } from './index'
```

### Basic Test Setup

```typescript
describe('Your Test', () => {
  let userToken: string
  let userId: number
  let projectId: number

  beforeEach(async () => {
    await tasksTestHelpers.cleanupDatabase()

    // Create test user
    const user = await tasksTestHelpers.createTestUser({
      email: 'test@example.com',
      role: UserRole.USER,
    })
    userId = user.id
    userToken = tasksTestHelpers.generateAuthToken(user)

    // Create test project
    const project = await tasksTestHelpers.createTestProject(userId, {
      title: 'Test Project',
    })
    projectId = project.id
  })

  afterAll(async () => {
    await tasksTestHelpers.cleanupDatabase()
    await tasksTestHelpers.disconnectDatabase()
  })
})
```

### Create Test Task

```typescript
const task = await tasksTestHelpers.createTestTask(projectId, userId, {
  title: 'Test Task',
  definitionOfDone: 'Task completion criteria',
  status: TaskStatus.TODO,
  timeSpent: 2.5,
})
```

## 📋 Test Files Overview

### 1. tasks.crud.test.ts (500+ lines)

**Purpose**: Tests all CRUD operations for tasks

**Key Test Categories**:

- **Task Creation** - Validation, required fields, optional fields
- **Task Retrieval** - Individual tasks, listing, pagination
- **Task Updates** - Partial updates, status changes, validation
- **Task Deletion** - Soft deletion, verification, permissions
- **Statistics** - Counts, aggregations, time tracking metrics

**Example Tests**:

```typescript
it('should create task with all optional fields', async () => { ... })
it('should retrieve task by ID', async () => { ... })
it('should update task status', async () => { ... })
it('should soft delete task', async () => { ... })
it('should get task statistics', async () => { ... })
```

### 2. tasks.security.test.ts (450+ lines)

**Purpose**: Tests authentication and authorization

**Key Test Categories**:

- **Authentication** - Token validation, expiry, missing auth
- **Role-Based Access** - USER/MANAGER/ADMIN permissions
- **Project Access** - Project ownership and access rights
- **Task Access** - Task viewing and modification rights
- **Data Isolation** - User data separation
- **Input Sanitization** - XSS and injection prevention

**Example Tests**:

```typescript
it('should require authentication for all endpoints', async () => { ... })
it('should allow admins to access any task', async () => { ... })
it('should deny users from accessing other users tasks', async () => { ... })
it('should handle malicious input safely', async () => { ... })
```

### 3. tasks.edge-cases.test.ts (520+ lines)

**Purpose**: Tests boundary conditions and error scenarios

**Key Test Categories**:

- **Boundary Values** - Maximum lengths, large numbers, precision
- **Invalid Data** - Wrong types, non-existent IDs, invalid enums
- **Pagination Edge Cases** - Zero pages, oversized limits
- **Deleted Resources** - Soft-deleted task handling
- **Concurrent Operations** - Race conditions, simultaneous updates
- **Unicode Support** - Multi-language text, special characters

**Example Tests**:

```typescript
it('should handle maximum string lengths', async () => { ... })
it('should return 404 for non-existent task ID', async () => { ... })
it('should handle page number exceeding available pages', async () => { ... })
it('should handle unicode characters in task data', async () => { ... })
```

### 4. tasks.search.test.ts (570+ lines)

**Purpose**: Tests search, filtering, and sorting functionality

**Key Test Categories**:

- **Text Search** - Title/description search, case-insensitive
- **Status Filtering** - Single and multiple status filters
- **Time Filtering** - Time tracking, date ranges
- **Project Filtering** - Project-specific tasks
- **Combined Filtering** - Multiple filter combinations
- **Sorting** - Multi-field sorting with directions
- **Performance** - Large dataset handling

**Example Tests**:

```typescript
it('should search tasks by title', async () => { ... })
it('should filter tasks by multiple statuses', async () => { ... })
it('should combine multiple filters', async () => { ... })
it('should sort tasks by creation date', async () => { ... })
```

### 5. tasks.helpers.ts (292 lines)

**Purpose**: Provides test utilities and helper functions

**Key Utilities**:

- `cleanupDatabase()` - Clean test database state
- `createTestUser(overrides?)` - Generate test users with roles
- `createTestProject(userId, overrides?)` - Generate test projects
- `createTestTask(projectId, userId, overrides?)` - Generate test tasks
- `generateAuthToken(user)` - Create valid JWT tokens
- `generateExpiredToken(user)` - Create expired JWT tokens
- `disconnectDatabase()` - Clean database connection

## 🔧 Helper Functions

### Database Management

```typescript
// Clean all test data
await tasksTestHelpers.cleanupDatabase()

// Disconnect from database
await tasksTestHelpers.disconnectDatabase()
```

### Test Data Creation

```typescript
// Create test user with custom properties
const user = await tasksTestHelpers.createTestUser({
  email: 'admin@test.com',
  role: UserRole.ADMIN,
  status: UserStatus.ACTIVE,
})

// Create test project
const project = await tasksTestHelpers.createTestProject(userId, {
  title: 'My Project',
  description: 'Project description',
  stage: ProjectStage.DEVELOPMENT,
})

// Create test task
const task = await tasksTestHelpers.createTestTask(projectId, userId, {
  title: 'Important Task',
  definitionOfDone: 'Completion criteria',
  status: TaskStatus.WIP,
  timeSpent: 3.5,
  costInProjectCurrency: 125.5,
})
```

### Authentication

```typescript
// Generate valid JWT token
const token = tasksTestHelpers.generateAuthToken(user)

// Generate expired token for testing
const expiredToken = tasksTestHelpers
  .generateExpiredToken(user)

  // Use in requests
  .set('Authorization', `Bearer ${token}`)
```

## 🧪 Running Tests

### Run All Tasks Tests

```bash
# Run all tasks module tests
npm test -- tests/v1/modules/tasks/

# Run specific test file
npm test -- tests/v1/modules/tasks/tasks.crud.test.ts

# Run with coverage
npm run test:coverage -- tests/v1/modules/tasks/
```

### Run Individual Test Categories

```bash
# CRUD operations only
npm test -- --testNamePattern="Tasks CRUD"

# Security tests only
npm test -- --testNamePattern="Tasks Security"

# Edge cases only
npm test -- --testNamePattern="Tasks Edge Cases"

# Search and filtering only
npm test -- --testNamePattern="Tasks Search"
```

### Debug Mode

```bash
# Run tests with debugging
npm test -- --testNamePattern="should create task" --verbose

# Watch mode for development
npm test -- --watch tests/v1/modules/tasks/
```

## 📊 Test Metrics

- **Total Test Files**: 5 (4 test files + 1 helper)
- **Total Lines of Code**: ~2,000+ lines
- **Test Cases**: 80+ individual test cases
- **Coverage Areas**: CRUD, Security, Edge Cases, Search, Filtering
- **Helper Functions**: 8+ utility functions
- **TypeScript Types**: Fully typed with TaskResponse interface

## 🎨 Test Patterns

### Consistent Structure

All test files follow the same pattern:

- Import statements and interface definitions
- beforeEach/afterAll database setup
- Grouped describe blocks by functionality
- Descriptive test names with clear expectations
- Proper cleanup and error handling

### Type Safety

```typescript
interface TaskResponse {
  id: number
  title: string
  userId: number
  projectId: number
  status: TaskStatus
  [key: string]: unknown
}
```

### Error Testing

```typescript
// Test for specific error responses
.expect(400)  // Bad Request
.expect(401)  // Unauthorized
.expect(403)  // Forbidden
.expect(404)  // Not Found

// Verify error messages
expect(response.body.message).toContain('expected error text')
```

## 🔍 Best Practices

### Test Isolation

- Each test cleans up after itself
- Database state is reset between tests
- No dependencies between test cases
- Proper transaction handling

### Realistic Test Data

- Uses meaningful test data that reflects real usage
- Tests with various data combinations
- Includes edge cases and boundary values
- Supports multi-language content

### Performance Considerations

- Tests handle large datasets efficiently
- Pagination is properly tested
- Database queries are optimized
- Response times are validated

## 🚨 Common Issues & Solutions

### Database Connection Issues

```typescript
// Always cleanup in afterAll
afterAll(async () => {
  await tasksTestHelpers.cleanupDatabase()
  await tasksTestHelpers.disconnectDatabase()
})
```

### Token Expiry in Tests

```typescript
// Generate fresh tokens in beforeEach
beforeEach(async () => {
  // ... create user
  userToken = tasksTestHelpers.generateAuthToken(user)
})
```

### Async/Await Patterns

```typescript
// Always await async operations
const response = await request(app)
  .post('/api/v1/tasks')
  .set('Authorization', `Bearer ${token}`)
  .send(taskData)
  .expect(201)
```

## 📚 Dependencies

- **Jest** - Testing framework
- **Supertest** - HTTP assertion library
- **Prisma** - Database ORM and client
- **bcrypt** - Password hashing for test users
- **jsonwebtoken** - JWT token generation
- **@prisma/client** - Database types and enums

## 🤝 Contributing

When adding new tests:

1. Follow the existing pattern and structure
2. Add proper TypeScript types
3. Include both positive and negative test cases
4. Test error conditions and edge cases
5. Update this README with new test descriptions
6. Ensure proper cleanup in beforeEach/afterAll

## 📄 License

This test suite is part of the Project Pulse API and follows the same license as the main project.
