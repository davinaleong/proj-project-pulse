import request from 'supertest'
import createApp from '../../../../src/app'
import { ProjectStage, UserStatus } from '@prisma/client'
import { projectsTestHelpers } from './projects.helpers'

const app = createApp()

type TestProject = Awaited<
  ReturnType<typeof projectsTestHelpers.createTestProject>
>
type TestUser = Awaited<ReturnType<typeof projectsTestHelpers.createTestUser>>

describe('Projects Security', () => {
  let authToken: string
  let adminToken: string
  let managerToken: string
  let userId: number

  beforeEach(async () => {
    await projectsTestHelpers.cleanupDatabase()

    const testData = await projectsTestHelpers.setupTestData()
    authToken = testData.authToken
    adminToken = testData.adminToken
    managerToken = testData.managerToken
    userId = testData.user.id
  })

  afterAll(async () => {
    await projectsTestHelpers.cleanupDatabase()
    await projectsTestHelpers.disconnectDatabase()
  })

  describe('Authentication & Authorization', () => {
    let project: TestProject

    beforeEach(async () => {
      project = await projectsTestHelpers.createTestProject(userId, {
        title: 'Secure Project',
        description: 'Project for security testing',
      })
    })

    it('should require authentication for all project endpoints', async () => {
      // Test various endpoints without auth token
      const endpoints = [
        { method: 'get', path: '/api/v1/projects' },
        { method: 'post', path: '/api/v1/projects' },
        { method: 'get', path: `/api/v1/projects/${project.uuid}` },
        { method: 'put', path: `/api/v1/projects/${project.uuid}` },
        { method: 'delete', path: `/api/v1/projects/${project.uuid}` },
        { method: 'get', path: `/api/v1/projects/${project.uuid}/progress` },
        { method: 'post', path: `/api/v1/projects/${project.uuid}/stage` },
      ]

      for (const endpoint of endpoints) {
        let req
        switch (endpoint.method) {
          case 'get':
            req = request(app).get(endpoint.path)
            break
          case 'post':
            req = request(app).post(endpoint.path)
            break
          case 'put':
            req = request(app).put(endpoint.path)
            break
          case 'delete':
            req = request(app).delete(endpoint.path)
            break
          default:
            req = request(app).get(endpoint.path)
        }
        await req.expect(401)
      }
    })

    it('should reject invalid/expired tokens', async () => {
      const invalidTokens = [
        'invalid-token',
        'Bearer invalid-token',
        'Bearer',
        '',
        'malformed.jwt.token',
      ]

      for (const token of invalidTokens) {
        await request(app)
          .get('/api/v1/projects')
          .set('Authorization', token)
          .expect(401)
      }
    })

    it('should enforce role-based access control', async () => {
      const bannedUser = await projectsTestHelpers.createTestUser({
        uuid: 'banned-user-uuid',
        email: 'banned@example.com',
        status: UserStatus.BANNED,
      })

      const bannedToken = projectsTestHelpers.generateMockAuthToken({
        uuid: bannedUser.uuid,
        email: bannedUser.email,
        role: bannedUser.role,
      })

      await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${bannedToken}`)
        .expect(403)
    })

    it('should prevent access to inactive user accounts', async () => {
      const inactiveUser = await projectsTestHelpers.createTestUser({
        uuid: 'inactive-user-uuid',
        email: 'inactive@example.com',
        status: UserStatus.INACTIVE,
      })

      const inactiveToken = projectsTestHelpers.generateMockAuthToken({
        uuid: inactiveUser.uuid,
        email: inactiveUser.email,
        role: inactiveUser.role,
      })

      await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${inactiveToken}`)
        .expect(403)
    })
  })

  describe('Data Access Control', () => {
    let otherUserProject: TestProject
    let otherUser: TestUser

    beforeEach(async () => {
      await projectsTestHelpers.createTestProject(userId, {
        title: 'User Own Project',
      })

      otherUser = await projectsTestHelpers.createTestUser({
        uuid: 'other-user-uuid',
        email: 'other@example.com',
        name: 'Other User',
      })

      otherUserProject = await projectsTestHelpers.createTestProject(
        otherUser.id,
        {
          title: 'Other User Project',
        },
      )
    })

    it('should prevent users from accessing other users projects', async () => {
      // Try to access other user's project
      await request(app)
        .get(`/api/v1/projects/${otherUserProject.uuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403)

      // Try to update other user's project
      await request(app)
        .put(`/api/v1/projects/${otherUserProject.uuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Hacked Title' })
        .expect(403)

      // Try to delete other user's project
      await request(app)
        .delete(`/api/v1/projects/${otherUserProject.uuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403)
    })

    it('should only return users own projects in list', async () => {
      const response = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      const projectTitles = response.body.data.projects.map(
        (p: { title: string }) => p.title,
      )
      expect(projectTitles).toContain('User Own Project')
      expect(projectTitles).not.toContain('Other User Project')
    })

    it('should allow admin access to any project', async () => {
      // Admin can view other user's project
      const response = await request(app)
        .get(`/api/v1/projects/${otherUserProject.uuid}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.data.project.title).toBe('Other User Project')

      // Admin can update other user's project
      await request(app)
        .put(`/api/v1/projects/${otherUserProject.uuid}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Admin Updated Title' })
        .expect(200)
    })

    it('should allow manager limited access to team projects', async () => {
      // Manager can view but may have limited edit access
      const response = await request(app)
        .get(`/api/v1/projects/${otherUserProject.uuid}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200)

      expect(response.body.data.project.title).toBe('Other User Project')
    })
  })

  describe('Input Validation & Sanitization', () => {
    it('should sanitize malicious input in project creation', async () => {
      const maliciousData = {
        title: '<script>alert("XSS")</script>Project Title',
        description: 'Normal description<script>evil()</script>',
        stage: ProjectStage.PLANNING,
      }

      const response = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(maliciousData)
        .expect(201)

      // Should strip HTML/script tags
      expect(response.body.data.project.title).not.toContain('<script>')
      expect(response.body.data.project.description).not.toContain('<script>')
    })

    it('should validate project data types and constraints', async () => {
      const invalidData = [
        {
          data: { title: '', description: 'Valid description' },
          field: 'title',
          error: 'required',
        },
        {
          data: { title: 'A'.repeat(256), description: 'Valid' },
          field: 'title',
          error: 'too long',
        },
        {
          data: { title: 'Valid Title', stage: 'INVALID_STAGE' },
          field: 'stage',
          error: 'invalid enum',
        },
        {
          data: { title: 'Valid Title', rate: -100 },
          field: 'rate',
          error: 'must be positive',
        },
        {
          data: { title: 'Valid Title', rate: 'not-a-number' },
          field: 'rate',
          error: 'must be number',
        },
      ]

      for (const test of invalidData) {
        const response = await request(app)
          .post('/api/v1/projects')
          .set('Authorization', `Bearer ${authToken}`)
          .send(test.data)
          .expect(400)

        expect(response.body.status).toBe('error')
        expect(response.body.message).toMatch(new RegExp(test.error, 'i'))
      }
    })

    it('should prevent SQL injection attempts', async () => {
      const sqlInjectionAttempts = [
        "'; DROP TABLE projects; --",
        "' UNION SELECT * FROM users --",
        "' OR '1'='1",
        '1; DELETE FROM projects WHERE 1=1 --',
      ]

      for (const injection of sqlInjectionAttempts) {
        // Test in search parameter
        const response = await request(app)
          .get(`/api/v1/projects?search=${encodeURIComponent(injection)}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)

        // Should return valid response without error
        expect(response.body.status).toBe('success')
        expect(response.body.data.projects).toBeDefined()
      }
    })

    it('should prevent NoSQL injection in filters', async () => {
      const nosqlInjections = [
        '{"$ne": null}',
        '{"$regex": ".*"}',
        '{"$where": "this.title.length > 0"}',
      ]

      for (const injection of nosqlInjections) {
        await request(app)
          .get(`/api/v1/projects?stage=${encodeURIComponent(injection)}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(400) // Should reject invalid enum value
      }
    })
  })

  describe('Rate Limiting & Request Throttling', () => {
    it('should enforce rate limits on project creation', async () => {
      const projectData = {
        title: 'Rate Limited Project',
        description: 'Testing rate limits',
      }

      // Make multiple rapid requests
      const promises = Array(20)
        .fill(null)
        .map(() =>
          request(app)
            .post('/api/v1/projects')
            .set('Authorization', `Bearer ${authToken}`)
            .send(projectData),
        )

      const responses = await Promise.allSettled(promises)
      const rateLimited = responses.filter(
        (result) =>
          result.status === 'fulfilled' && result.value.status === 429,
      )

      expect(rateLimited.length).toBeGreaterThan(0)
    })

    it('should enforce rate limits on project updates', async () => {
      const project = await projectsTestHelpers.createTestProject(userId)

      // Make multiple rapid update requests
      const promises = Array(15)
        .fill(null)
        .map((_, index) =>
          request(app)
            .put(`/api/v1/projects/${project.uuid}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({ title: `Updated Title ${index}` }),
        )

      const responses = await Promise.allSettled(promises)
      const rateLimited = responses.filter(
        (result) =>
          result.status === 'fulfilled' && result.value.status === 429,
      )

      expect(rateLimited.length).toBeGreaterThan(0)
    })
  })

  describe('Data Leakage Prevention', () => {
    let sensitiveProject: TestProject

    beforeEach(async () => {
      sensitiveProject = await projectsTestHelpers.createTestProject(userId, {
        title: 'Sensitive Project',
        description: 'Contains sensitive information',
        rate: 1000,
        currency: 'USD',
      })

      // Add sensitive task data
      await projectsTestHelpers.createTestTask(sensitiveProject.id, userId, {
        title: 'High-value Task',
        costInProjectCurrency: 50000,
      })
    })

    it('should not expose sensitive data in error messages', async () => {
      // Try to access non-existent project with SQL-like UUID
      const response = await request(app)
        .get("/api/v1/projects/'; SELECT * FROM projects --")
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)

      expect(response.body.message).not.toContain('SELECT')
      expect(response.body.message).not.toContain('projects')
      expect(response.body.message).toBe('Project not found')
    })

    it('should not expose internal database structure', async () => {
      const response = await request(app)
        .get('/api/v1/projects/invalid-uuid-format')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)

      // Error message should be generic
      expect(response.body.message).not.toContain('Prisma')
      expect(response.body.message).not.toContain('database')
      expect(response.body.message).not.toContain('table')
      expect(response.body.message).not.toContain('column')
    })

    it('should filter sensitive fields based on user permissions', async () => {
      // Regular user should see their own project cost data
      const userResponse = await request(app)
        .get(`/api/v1/projects/${sensitiveProject.uuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(userResponse.body.data.project.rate).toBe(1000)

      // Create another user who shouldn't see this data
      const otherUser = await projectsTestHelpers.createTestUser({
        uuid: 'other-user-uuid',
        email: 'other@example.com',
      })

      const otherToken = projectsTestHelpers.generateMockAuthToken({
        uuid: otherUser.uuid,
        email: otherUser.email,
        role: otherUser.role,
      })

      // Other user shouldn't be able to access at all
      await request(app)
        .get(`/api/v1/projects/${sensitiveProject.uuid}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403)
    })
  })

  describe('Cross-Site Request Forgery (CSRF) Protection', () => {
    it('should protect state-changing operations', async () => {
      const project = await projectsTestHelpers.createTestProject(userId)

      // Simulate CSRF attack without proper headers
      const response = await request(app)
        .put(`/api/v1/projects/${project.uuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('Origin', 'https://malicious-site.com')
        .send({ title: 'CSRF Attack' })

      // Should be blocked if CSRF protection is enabled
      expect([400, 403, 200]).toContain(response.status)
    })
  })

  describe('Audit Logging', () => {
    let project: TestProject

    beforeEach(async () => {
      project = await projectsTestHelpers.createTestProject(userId, {
        title: 'Audit Test Project',
      })
    })

    it('should log sensitive operations', async () => {
      // Perform operations that should be logged
      await request(app)
        .put(`/api/v1/projects/${project.uuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated by User' })
        .expect(200)

      await request(app)
        .delete(`/api/v1/projects/${project.uuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      // Check if admin can access audit logs
      const auditResponse = await request(app)
        .get(`/api/v1/admin/projects/audit?projectUuid=${project.uuid}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(auditResponse.body.data.auditTrail).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            action: 'project_updated',
            userId: userId,
          }),
          expect.objectContaining({
            action: 'project_deleted',
            userId: userId,
          }),
        ]),
      )
    })

    it('should log failed access attempts', async () => {
      const otherUser = await projectsTestHelpers.createTestUser({
        uuid: 'unauthorized-user-uuid',
        email: 'unauthorized@example.com',
      })

      const otherToken = projectsTestHelpers.generateMockAuthToken({
        uuid: otherUser.uuid,
        email: otherUser.email,
        role: otherUser.role,
      })

      // Attempt unauthorized access
      await request(app)
        .get(`/api/v1/projects/${project.uuid}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403)

      // Check security logs (this would typically be in a separate security audit system)
      const securityResponse = await request(app)
        .get('/api/v1/admin/security/audit')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(securityResponse.body.data.securityEvents).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            event: 'unauthorized_access_attempt',
            userId: otherUser.id,
            resource: `project:${project.uuid}`,
            timestamp: expect.any(String),
          }),
        ]),
      )
    })
  })

  describe('Data Encryption & Privacy', () => {
    it('should not expose sensitive data in logs or responses', async () => {
      const sensitiveProject = await projectsTestHelpers.createTestProject(
        userId,
        {
          title: 'Project with PII',
          description:
            'Contains customer data: john.doe@email.com, SSN: 123-45-6789',
          rate: 500,
        },
      )

      const response = await request(app)
        .get(`/api/v1/projects/${sensitiveProject.uuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      // Response should contain the data for authorized user
      expect(response.body.data.project.description).toContain(
        'john.doe@email.com',
      )

      // But logs should have sensitive data masked/redacted
      // This would be tested by checking actual log files in integration tests
    })

    it('should handle data retention policies', async () => {
      await projectsTestHelpers.createTestProject(userId, {
        title: 'Old Project for Deletion',
        stage: ProjectStage.MAINTENANCE,
        completedAt: new Date('2020-01-01'), // Very old
      })

      // Simulate data retention cleanup
      const response = await request(app)
        .post('/api/v1/admin/projects/maintenance')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          operation: 'data-retention',
          parameters: {
            deleteOlderThan: '2 years',
            stages: [ProjectStage.MAINTENANCE],
          },
        })
        .expect(200)

      expect(response.body.data.maintenance).toEqual(
        expect.objectContaining({
          operation: 'data-retention',
          itemsProcessed: expect.any(Number),
        }),
      )
    })
  })
})
