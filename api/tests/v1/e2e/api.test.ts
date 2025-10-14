import { describe, it, expect, beforeEach, afterAll } from '@jest/globals'
import request from 'supertest'
import app from '../../../src/app'
import { e2eTestHelpers } from './e2e.helpers'

/**
 * E2E API Tests
 *
 * These tests cover complete user journeys and cross-module functionality.
 * They test the API as a whole system rather than individual components.
 */
describe('E2E API Tests', () => {
  beforeEach(async () => {
    await e2eTestHelpers.setupTestDatabase()
  })

  afterAll(async () => {
    await e2eTestHelpers.cleanupDatabase()
    await e2eTestHelpers.disconnectDatabase()
  })

  describe('Complete User Journey', () => {
    it('should handle complete user registration to project completion workflow', async () => {
      // 1. User Registration
      const registrationData = {
        name: 'E2E Test User',
        email: 'e2euser@example.com',
        password: 'SecurePassword123!',
      }

      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(registrationData)
        .expect(201)

      expect(registerResponse.body.success).toBe(true)
      expect(registerResponse.body.data.user.email).toBe(registrationData.email)

      // 2. User Login
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: registrationData.email,
          password: registrationData.password,
        })
        .expect(200)

      expect(loginResponse.body.success).toBe(true)
      const authToken = loginResponse.body.data.token
      const authHeaders = { Authorization: `Bearer ${authToken}` }

      // 3. Create User Profile
      const profileData = {
        bio: 'E2E test user bio',
        location: 'Test City',
        website: 'https://e2etest.com',
      }

      const profileResponse = await request(app)
        .put('/api/v1/profiles/me')
        .set(authHeaders)
        .send(profileData)
        .expect(200)

      expect(profileResponse.body.success).toBe(true)
      expect(profileResponse.body.data.bio).toBe(profileData.bio)

      // 4. Create a Project
      const projectData = {
        name: 'E2E Test Project',
        description: 'A project created during e2e testing',
        isPublic: true,
      }

      const projectResponse = await request(app)
        .post('/api/v1/projects')
        .set(authHeaders)
        .send(projectData)
        .expect(201)

      expect(projectResponse.body.success).toBe(true)
      const projectId = projectResponse.body.data.id

      // 5. Create Tasks in Project
      const taskData = {
        title: 'E2E Test Task',
        description: 'A task created during e2e testing',
        priority: 1,
        projectId,
      }

      const taskResponse = await request(app)
        .post('/api/v1/tasks')
        .set(authHeaders)
        .send(taskData)
        .expect(201)

      expect(taskResponse.body.success).toBe(true)
      const taskId = taskResponse.body.data.id

      // 6. Create Notes for Project
      const noteData = {
        title: 'E2E Test Note',
        content: 'A note created during e2e testing',
        projectId,
        isPublic: true,
      }

      const noteResponse = await request(app)
        .post('/api/v1/notes')
        .set(authHeaders)
        .send(noteData)
        .expect(201)

      expect(noteResponse.body.success).toBe(true)

      // 7. Update Task Status
      const taskUpdateResponse = await request(app)
        .put(`/api/v1/tasks/${taskId}`)
        .set(authHeaders)
        .send({ status: 'IN_PROGRESS' })
        .expect(200)

      expect(taskUpdateResponse.body.success).toBe(true)
      expect(taskUpdateResponse.body.data.status).toBe('IN_PROGRESS')

      // 8. Search Across Modules
      const searchResponse = await request(app)
        .get('/api/v1/search?q=E2E')
        .set(authHeaders)
        .expect(200)

      expect(searchResponse.body.success).toBe(true)
      // Should find our project, task, and note
      expect(searchResponse.body.data.length).toBeGreaterThan(0)

      // 9. Complete Task
      await request(app)
        .put(`/api/v1/tasks/${taskId}`)
        .set(authHeaders)
        .send({ status: 'DONE' })
        .expect(200)

      // 10. Update Project Stage
      await request(app)
        .put(`/api/v1/projects/${projectId}`)
        .set(authHeaders)
        .send({ stage: 'COMPLETED' })
        .expect(200)

      // 11. Get User Activity Summary
      const activityResponse = await request(app)
        .get('/api/v1/activities/me')
        .set(authHeaders)
        .expect(200)

      expect(activityResponse.body.success).toBe(true)
      expect(activityResponse.body.data.length).toBeGreaterThan(0)
    })

    it('should handle collaborative project workflow', async () => {
      // Create two users
      const { headers: headers1 } =
        await e2eTestHelpers.createAuthenticatedUser({
          name: 'User One',
          email: 'user1@example.com',
        })

      const { headers: headers2 } =
        await e2eTestHelpers.createAuthenticatedUser({
          name: 'User Two',
          email: 'user2@example.com',
        })

      // User 1 creates a public project
      const projectResponse = await request(app)
        .post('/api/v1/projects')
        .set(headers1)
        .send({
          name: 'Collaborative Project',
          description: 'A project for collaboration testing',
          isPublic: true,
        })
        .expect(201)

      const projectId = projectResponse.body.data.id

      // User 1 creates a task
      await request(app)
        .post('/api/v1/tasks')
        .set(headers1)
        .send({
          title: 'Task for User 1',
          description: 'Task assigned to user 1',
          projectId,
        })
        .expect(201)

      // User 2 should be able to see the public project
      const publicProjectsResponse = await request(app)
        .get('/api/v1/projects/public')
        .set(headers2)
        .expect(200)

      expect(
        publicProjectsResponse.body.data.some(
          (p: { id: number }) => p.id === projectId,
        ),
      ).toBe(true)

      // User 2 creates a task in the same project
      await request(app)
        .post('/api/v1/tasks')
        .set(headers2)
        .send({
          title: 'Task for User 2',
          description: 'Task created by user 2',
          projectId,
        })
        .expect(201)

      // Both users should see all tasks in the project
      const projectTasksResponse = await request(app)
        .get(`/api/v1/projects/${projectId}/tasks`)
        .set(headers1)
        .expect(200)

      expect(projectTasksResponse.body.data.length).toBe(2)

      // User 2 should be able to comment on User 1's task (if comments exist)
      // User 1 should be able to see User 2's task updates
      const allProjectTasksResponse = await request(app)
        .get(`/api/v1/tasks?projectId=${projectId}`)
        .set(headers2)
        .expect(200)

      expect(allProjectTasksResponse.body.data.length).toBe(2)
    })
  })

  describe('Authentication and Authorization E2E', () => {
    it('should handle complete authentication flow with edge cases', async () => {
      // 1. Registration with edge case data
      const edgeCaseUser = {
        name: 'Test User With Very Long Name That Approaches Limit',
        email: 'verylongemailaddress@verylongdomainname.com',
        password: 'ComplexPassword123!@#',
      }

      await request(app)
        .post('/api/v1/auth/register')
        .send(edgeCaseUser)
        .expect(201)

      // 2. Login with correct credentials
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: edgeCaseUser.email,
          password: edgeCaseUser.password,
        })
        .expect(200)

      const token = loginResponse.body.data.token

      // 3. Access protected resources
      await request(app)
        .get('/api/v1/users/me')
        .set({ Authorization: `Bearer ${token}` })
        .expect(200)

      // 4. Try to access admin-only resources (should fail)
      await request(app)
        .get('/api/v1/users')
        .set({ Authorization: `Bearer ${token}` })
        .expect(403)

      // 5. Password reset flow
      await request(app)
        .post('/api/v1/auth/password-reset/request')
        .send({ email: edgeCaseUser.email })
        .expect(200)

      // 6. Invalid login attempts
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: edgeCaseUser.email,
          password: 'WrongPassword',
        })
        .expect(401)

      // 7. Token refresh (if implemented)
      const refreshResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .set({ Authorization: `Bearer ${token}` })

      if (refreshResponse.status === 200) {
        expect(refreshResponse.body.data.token).toBeDefined()
      }

      // 8. Logout
      await request(app)
        .post('/api/v1/auth/logout')
        .set({ Authorization: `Bearer ${token}` })
        .expect(200)

      // 9. Try to use logged-out token
      await request(app)
        .get('/api/v1/users/me')
        .set({ Authorization: `Bearer ${token}` })
        .expect(401)
    })

    it('should handle admin authorization scenarios', async () => {
      // Create regular user and admin user
      const { headers: userHeaders } =
        await e2eTestHelpers.createAuthenticatedUser()
      const { headers: adminHeaders } =
        await e2eTestHelpers.createAuthenticatedAdmin()

      // Admin can access admin endpoints
      const usersResponse = await request(app)
        .get('/api/v1/users')
        .set(adminHeaders)
        .expect(200)

      expect(usersResponse.body.success).toBe(true)

      // Regular user cannot access admin endpoints
      await request(app).get('/api/v1/users').set(userHeaders).expect(403)

      // Admin can perform admin actions
      const { user: targetUser } =
        await e2eTestHelpers.createAuthenticatedUser()

      await request(app)
        .put(`/api/v1/users/${targetUser.id}/status`)
        .set(adminHeaders)
        .send({ status: 'INACTIVE' })
        .expect(200)

      // Regular user cannot perform admin actions
      await request(app)
        .put(`/api/v1/users/${targetUser.id}/status`)
        .set(userHeaders)
        .send({ status: 'ACTIVE' })
        .expect(403)
    })
  })

  describe('Cross-Module Data Consistency', () => {
    it('should maintain data consistency across related modules', async () => {
      const { headers } = await e2eTestHelpers.createAuthenticatedUser()

      // Create project
      const projectResponse = await request(app)
        .post('/api/v1/projects')
        .set(headers)
        .send({
          name: 'Consistency Test Project',
          description: 'Testing data consistency',
        })
        .expect(201)

      const projectId = projectResponse.body.data.id

      // Create task in project
      const taskResponse = await request(app)
        .post('/api/v1/tasks')
        .set(headers)
        .send({
          title: 'Consistency Test Task',
          projectId,
        })
        .expect(201)

      const taskId = taskResponse.body.data.id

      // Create note related to project
      const noteResponse = await request(app)
        .post('/api/v1/notes')
        .set(headers)
        .send({
          title: 'Consistency Test Note',
          content: 'Testing consistency',
          projectId,
        })
        .expect(201)

      const noteId = noteResponse.body.data.id

      // Verify relationships exist
      const projectDetailsResponse = await request(app)
        .get(`/api/v1/projects/${projectId}`)
        .set(headers)
        .expect(200)

      expect(projectDetailsResponse.body.data.id).toBe(projectId)

      // Get project's tasks
      const projectTasksResponse = await request(app)
        .get(`/api/v1/projects/${projectId}/tasks`)
        .set(headers)
        .expect(200)

      expect(
        projectTasksResponse.body.data.some(
          (t: { id: number }) => t.id === taskId,
        ),
      ).toBe(true)

      // Get project's notes
      const projectNotesResponse = await request(app)
        .get(`/api/v1/projects/${projectId}/notes`)
        .set(headers)
        .expect(200)

      expect(
        projectNotesResponse.body.data.some(
          (n: { id: number }) => n.id === noteId,
        ),
      ).toBe(true)

      // Delete project should handle cascading properly
      await request(app)
        .delete(`/api/v1/projects/${projectId}`)
        .set(headers)
        .expect(200)

      // Verify related data is handled appropriately
      await request(app).get(`/api/v1/tasks/${taskId}`).set(headers).expect(404)

      await request(app).get(`/api/v1/notes/${noteId}`).set(headers).expect(404)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed requests gracefully', async () => {
      const { headers } = await e2eTestHelpers.createAuthenticatedUser()

      // Invalid JSON
      const invalidJsonResponse = await request(app)
        .post('/api/v1/projects')
        .set(headers)
        .send('invalid json')
        .expect(400)

      expect(invalidJsonResponse.body.success).toBe(false)

      // Missing required fields
      await request(app)
        .post('/api/v1/projects')
        .set(headers)
        .send({})
        .expect(400)

      // Invalid field types
      await request(app)
        .post('/api/v1/projects')
        .set(headers)
        .send({
          name: 123, // Should be string
          description: true, // Should be string
        })
        .expect(400)

      // SQL injection attempts
      await request(app)
        .post('/api/v1/projects')
        .set(headers)
        .send({
          name: "'; DROP TABLE projects; --",
          description: 'Injection attempt',
        })
        .expect(400)

      // XSS attempts
      await request(app)
        .post('/api/v1/projects')
        .set(headers)
        .send({
          name: '<script>alert("xss")</script>',
          description: 'XSS attempt',
        })
        .expect(400)
    })

    it('should handle resource limits and pagination', async () => {
      const { headers } = await e2eTestHelpers.createAuthenticatedUser()

      // Create multiple projects to test pagination
      for (let i = 0; i < 25; i++) {
        await request(app)
          .post('/api/v1/projects')
          .set(headers)
          .send({
            name: `Test Project ${i + 1}`,
            description: `Description ${i + 1}`,
          })
      }

      // Test pagination
      const page1Response = await request(app)
        .get('/api/v1/projects?page=1&limit=10')
        .set(headers)
        .expect(200)

      expect(page1Response.body.data.length).toBe(10)
      expect(page1Response.body.pagination.page).toBe(1)
      expect(page1Response.body.pagination.totalPages).toBeGreaterThan(1)

      const page2Response = await request(app)
        .get('/api/v1/projects?page=2&limit=10')
        .set(headers)
        .expect(200)

      expect(page2Response.body.data.length).toBe(10)
      expect(page2Response.body.pagination.page).toBe(2)

      // Test invalid pagination parameters
      await request(app)
        .get('/api/v1/projects?page=-1&limit=10')
        .set(headers)
        .expect(400)

      await request(app)
        .get('/api/v1/projects?page=1&limit=1001')
        .set(headers)
        .expect(400)
    })

    it('should handle concurrent operations safely', async () => {
      const { headers } = await e2eTestHelpers.createAuthenticatedUser()

      // Create a project
      const projectResponse = await request(app)
        .post('/api/v1/projects')
        .set(headers)
        .send({
          name: 'Concurrent Test Project',
          description: 'Testing concurrent operations',
        })
        .expect(201)

      const projectId = projectResponse.body.data.id

      // Simulate concurrent task creation
      const concurrentPromises = []
      for (let i = 0; i < 10; i++) {
        const promise = request(app)
          .post('/api/v1/tasks')
          .set(headers)
          .send({
            title: `Concurrent Task ${i + 1}`,
            projectId,
          })
        concurrentPromises.push(promise)
      }

      const results = await Promise.allSettled(concurrentPromises)
      const successfulResults = results.filter(
        (r) =>
          r.status === 'fulfilled' &&
          (r.value as { status: number }).status === 201,
      )

      // All requests should succeed
      expect(successfulResults.length).toBe(10)

      // Verify all tasks were created
      const tasksResponse = await request(app)
        .get(`/api/v1/projects/${projectId}/tasks`)
        .set(headers)
        .expect(200)

      expect(tasksResponse.body.data.length).toBe(10)
    })
  })

  describe('Performance and Load', () => {
    it('should handle bulk operations efficiently', async () => {
      const { headers } = await e2eTestHelpers.createAuthenticatedUser()

      const startTime = Date.now()

      // Create 50 projects in batch
      const createPromises = []
      for (let i = 0; i < 50; i++) {
        const promise = request(app)
          .post('/api/v1/projects')
          .set(headers)
          .send({
            name: `Bulk Project ${i + 1}`,
            description: `Bulk creation test ${i + 1}`,
          })
        createPromises.push(promise)
      }

      await Promise.all(createPromises)
      const endTime = Date.now()
      const duration = endTime - startTime

      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(30000) // 30 seconds

      // Verify all projects were created
      const projectsResponse = await request(app)
        .get('/api/v1/projects?limit=100')
        .set(headers)
        .expect(200)

      expect(projectsResponse.body.data.length).toBe(50)
    })
  })
})
