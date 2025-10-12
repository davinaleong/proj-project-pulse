# Projects Module Tests

This directory contains comprehensive test suites for the Projects module, organized into focused test files for better maintainability and clarity. The Projects module is the core feature of Project Pulse, handling project lifecycle management, analytics, and administrative operations.

## Test Structure

### Core Files

- **`projects.helpers.ts`** - Shared test utilities, database setup/cleanup, and helper functions
- **`index.ts`** - Module exports for easy importing

### Test Suites

#### 1. `projects.crud.test.ts`

Tests for basic CRUD (Create, Read, Update, Delete) operations:

- **Project Creation**
  - Valid project data with all fields
  - Minimal required data scenarios
  - Data validation and error handling
  - Default value assignment

- **Project Listing**
  - Pagination controls and metadata
  - Filtering by stage, user, date ranges
  - Search functionality across title/description
  - Sorting by various fields

- **Single Project Retrieval**
  - Project details with related data counts
  - Permission-based access control
  - Related tasks and notes inclusion
  - UUID-based identification

- **Project Updates**
  - Field-level updates and validation
  - Stage transitions with timestamp tracking
  - Billing configuration updates
  - Restricted field protections

- **Project Deletion**
  - Soft delete with cascade operations
  - Related data cleanup (tasks, notes)
  - Permission verification
  - Recovery scenarios

#### 2. `projects.management.test.ts`

Tests for project lifecycle and management operations:

- **Stage Transitions**
  - Sequential stage progression validation
  - Automatic timestamp setting (beganAt, completedAt)
  - Invalid transition prevention
  - Backward movement restrictions

- **Progress Tracking**
  - Task completion percentage calculations
  - Time tracking and velocity metrics
  - Stage-specific progress indicators
  - Estimation algorithms

- **Project Archival**
  - Completion requirements validation
  - Archive reason documentation
  - Status change to MAINTENANCE
  - Manager/admin override capabilities

- **Timeline Management**
  - Event chronology and milestones
  - Stage transition history
  - Task completion tracking
  - Activity logging

- **Cost Analysis**
  - Total project cost calculations
  - Currency handling and conversions
  - Hourly rate applications
  - Budget vs actual reporting
  - Cost projections and estimates

- **Project Duplication**
  - Template creation from existing projects
  - Task copying with status reset
  - Data sanitization for new projects
  - UUID regeneration

#### 3. `projects.analytics.test.ts`

Tests for analytics, reporting, and performance metrics:

- **Portfolio Overview**
  - Project distribution by stage
  - Total project counts and summaries
  - Revenue calculations across currencies
  - Completion rate statistics

- **Performance Metrics**
  - Velocity tracking (tasks/week, hours/task)
  - Bottleneck identification and analysis
  - Efficiency scoring algorithms
  - Benchmark comparisons

- **Trend Analysis**
  - Completion trends over time periods
  - Revenue growth patterns
  - Seasonal pattern detection
  - Custom date range analysis

- **Report Generation**
  - Executive summary reports
  - Detailed project breakdowns
  - Financial reporting with projections
  - Custom metric combinations

- **Team Analytics** (Manager/Admin)
  - Cross-user performance metrics
  - Team productivity analysis
  - Resource utilization tracking
  - Comparative reporting

#### 4. `projects.admin.test.ts`

Tests for administrative operations and system management:

- **System-wide Project Management**
  - Cross-user project visibility
  - Filtering by user status and activity
  - Bulk search and filtering capabilities
  - Administrative statistics

- **Project Ownership Transfer**
  - Ownership change workflows
  - Related data handling (tasks/notes)
  - Transfer logging and audit trails
  - Permission validation

- **Bulk Operations**
  - Mass project updates (stage, status)
  - Bulk archival with criteria
  - Mass deletion (SuperAdmin only)
  - Partial success handling

- **Audit Trail Management**
  - Comprehensive action logging
  - Change tracking with before/after
  - User activity monitoring
  - Security event recording

- **System Maintenance**
  - Data cleanup operations
  - Integrity validation checks
  - Statistics recalculation
  - Performance optimization

#### 5. `projects.security.test.ts`

Tests for security, authentication, and access control:

- **Authentication & Authorization**
  - JWT token validation
  - Role-based access control (User/Manager/Admin/SuperAdmin)
  - Account status verification (active/inactive/banned)
  - Session management

- **Data Access Control**
  - User isolation (own projects only)
  - Admin cross-user access
  - Manager team-level permissions
  - Resource ownership validation

- **Input Validation & Sanitization**
  - XSS prevention and HTML stripping
  - SQL injection protection
  - Data type validation
  - Field length restrictions

- **Rate Limiting & Security**
  - Request throttling by operation type
  - Abuse prevention mechanisms
  - CSRF protection validation
  - Security event logging

- **Data Privacy & Compliance**
  - Sensitive data masking in logs
  - Data retention policy enforcement
  - PII handling and protection
  - Audit log security

## Database Schema Integration

### Project Model

```typescript
Project {
  id: number
  uuid: string (unique)
  title: string
  description: string
  stage: ProjectStage (enum)
  userId: number (foreign key)
  beganAt: Date?
  completedAt: Date?
  billingCycle: string?
  rate: number?
  currency: string (default: 'SGD')
  createdAt: Date
  updatedAt: Date
}
```

### ProjectStage Enum

Sequential lifecycle stages:

1. `PLANNING` - Initial project setup
2. `ANALYSIS` - Requirements and analysis phase
3. `DESIGN` - Design and architecture phase
4. `IMPLEMENTATION` - Active development
5. `TESTING` - Quality assurance and testing
6. `DEPLOYMENT` - Production deployment
7. `MAINTENANCE` - Archived/completed projects

### Relationships

- **User**: One-to-many (user owns multiple projects)
- **Tasks**: One-to-many (project contains multiple tasks)
- **Notes**: One-to-many (project contains multiple notes)

## Testing Patterns

### Shared Utilities

- **Database Cleanup**: Comprehensive cleanup between tests
- **Test Data Factory**: Consistent project/user/task creation
- **Authentication Helpers**: JWT token generation for different roles
- **Date Utilities**: Timeline and timestamp management

### Role-based Testing

- **Regular User**: Own project access only
- **Manager**: Team-level project visibility
- **Admin**: System-wide project access
- **SuperAdmin**: Full system management capabilities

### Error Scenario Coverage

- **Validation Errors**: Field requirements and constraints
- **Permission Errors**: Unauthorized access attempts
- **Not Found Errors**: Non-existent resource access
- **Business Logic Errors**: Invalid state transitions

### Performance Testing

- **Large Dataset Handling**: Pagination and filtering efficiency
- **Concurrent Operations**: Race condition prevention
- **Rate Limiting**: API abuse protection
- **Query Optimization**: Database performance validation

## Running the Tests

```bash
# Run all projects tests
npm test -- --testPathPattern=projects

# Run specific test suite
npm test -- projects.crud.test.ts
npm test -- projects.management.test.ts
npm test -- projects.analytics.test.ts
npm test -- projects.admin.test.ts
npm test -- projects.security.test.ts

# Run with coverage
npm test -- --coverage --testPathPattern=projects

# Run in watch mode
npm test -- --watch projects
```

## Test Data Management

All tests use isolated test data created through the `projectsTestHelpers` utilities:

- **Clean State**: Each test starts with a clean database
- **Realistic Data**: Test data mirrors production scenarios
- **Relationship Integrity**: Proper foreign key relationships
- **Cleanup**: Automatic cleanup after each test

This ensures test reliability and prevents interference between test runs.
