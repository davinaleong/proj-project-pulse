/**
 * Projects Module Test Suite
 *
 * Comprehensive testing for project management functionality including:
 * - CRUD operations (Create, Read, Update, Delete)
 * - Project lifecycle management and stage transitions
 * - Analytics and reporting capabilities
 * - Administrative operations and bulk actions
 * - Security and access control
 *
 * Test Structure:
 * - projects.helpers.ts - Shared test utilities and database setup
 * - projects.crud.test.ts - Basic CRUD operations and data validation
 * - projects.management.test.ts - Lifecycle, progress tracking, cost analysis
 * - projects.analytics.test.ts - Portfolio analytics, performance metrics, trends
 * - projects.admin.test.ts - Administrative operations, bulk actions, audit trails
 * - projects.security.test.ts - Authentication, authorization, input validation
 */

// Import all test suites to ensure they run as part of the projects module
import './projects.crud.test'
import './projects.management.test'
import './projects.analytics.test'
import './projects.admin.test'
import './projects.security.test'

export { projectsTestHelpers } from './projects.helpers'

/**
 * Test Coverage Summary:
 *
 * 1. CRUD Operations (projects.crud.test.ts):
 *    - Project creation with validation
 *    - Listing with pagination, filtering, and search
 *    - Single project retrieval with related data
 *    - Project updates and field validation
 *    - Project deletion with cascade cleanup
 *    - Permission-based access control
 *
 * 2. Management Operations (projects.management.test.ts):
 *    - Stage transitions and lifecycle management
 *    - Progress tracking and velocity calculations
 *    - Project archival and completion workflows
 *    - Timeline tracking and milestone management
 *    - Cost analysis and budget projections
 *    - Project duplication and templating
 *
 * 3. Analytics (projects.analytics.test.ts):
 *    - Portfolio overview and distribution metrics
 *    - Performance analysis and bottleneck identification
 *    - Trend analysis and seasonal patterns
 *    - Executive and detailed reporting
 *    - Team and system-wide analytics (admin/manager)
 *
 * 4. Admin Operations (projects.admin.test.ts):
 *    - Cross-user project management
 *    - Project ownership transfers
 *    - Bulk operations (update, archive, delete)
 *    - Comprehensive audit trails
 *    - System maintenance and data integrity
 *
 * 5. Security (projects.security.test.ts):
 *    - Authentication and authorization testing
 *    - Data access control and isolation
 *    - Input validation and sanitization
 *    - Rate limiting and throttling
 *    - Data leakage prevention
 *    - CSRF protection and audit logging
 *
 * Database Schema Integration:
 * - Project model with ProjectStage enum lifecycle
 * - Relationships with User, Task, and Note entities
 * - Support for billing (rate, currency, billingCycle)
 * - Temporal data (beganAt, completedAt, timestamps)
 * - UUID-based identification for security
 *
 * Testing Patterns:
 * - Shared helpers for database setup/cleanup
 * - Role-based test scenarios (user, manager, admin, superadmin)
 * - Comprehensive error scenario coverage
 * - Integration with authentication middleware
 * - Performance and security testing
 */
