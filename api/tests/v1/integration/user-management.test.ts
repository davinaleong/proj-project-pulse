/**
 * User Management Integration Tests
 *
 * Tests comprehensive user management workflows including:
 * - User registration and profile management
 * - Account status changes and permissions
 * - User data privacy and security
 * - Cross-module user interactions
 */

import { afterAll, beforeAll, describe, expect, it } from '@jest/globals'
import request from 'supertest'
import app from '../../../src/app'
import { e2eTestHelpers } from '../e2e/e2e.helpers'
import { UserRole, UserStatus } from '@prisma/client'

describe('User Management Integration Tests', () => {
  beforeAll(async () => {
    await e2eTestHelpers.cleanupDatabase()
  })

  afterAll(async () => {
    await e2eTestHelpers.cleanupDatabase()
    await e2eTestHelpers.disconnectDatabase()
  })

  describe('User Lifecycle Management', () => {
    it('should handle complete user lifecycle from registration to deletion', async () => {
      // Step 1: Register new user
      const registrationData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'SecurePass123!',
      }

      const registrationResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(registrationData)
        .expect(201)

      expect(registrationResponse.body.success).toBe(true)
      expect(registrationResponse.body.data.user.email).toBe(
        registrationData.email,
      )

      // Step 2: Login and get token
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: registrationData.email,
          password: registrationData.password,
        })
        .expect(200)

      const { token } = loginResponse.body.data
      const authHeaders = { Authorization: `Bearer ${token}` }

      // Step 3: Update user profile
      const profileUpdate = {
        bio: 'Software developer passionate about clean code',
        timezone: 'America/New_York',
      }

      await request(app)
        .put('/api/v1/profiles/me')
        .set(authHeaders)
        .send(profileUpdate)
        .expect(200)

      // Step 4: Create user content (project, tasks, notes)
      const projectResponse = await request(app)
        .post('/api/v1/projects')
        .set(authHeaders)
        .send({
          title: 'User Lifecycle Test Project',
          description: 'Testing user content creation',
        })
        .expect(201)

      const projectId = projectResponse.body.data.project.id

      // Create task
      await request(app)
        .post('/api/v1/tasks')
        .set(authHeaders)
        .send({
          projectId,
          title: 'Test Task',
          definitionOfDone: 'Complete the user lifecycle test',
        })
        .expect(201)

      // Create note
      await request(app)
        .post('/api/v1/notes')
        .set(authHeaders)
        .send({
          title: 'Test Note',
          description: 'User lifecycle test note',
          body: 'This note tests the complete user lifecycle',
        })
        .expect(201)

      // Step 5: Verify user data integrity
      const userDataResponse = await request(app)
        .get('/api/v1/users/me')
        .set(authHeaders)
        .expect(200)

      expect(userDataResponse.body.data.user.email).toBe(registrationData.email)

      // Step 6: User account deactivation (soft delete)
      await request(app).delete('/api/v1/users/me').set(authHeaders).expect(200)

      // Step 7: Verify user cannot access after deactivation
      await request(app).get('/api/v1/users/me').set(authHeaders).expect(401)
    })

    it('should handle user role transitions and permissions', async () => {
      // Create admin user
      const { headers: adminHeaders } =
        await e2eTestHelpers.createAuthenticatedAdmin()

      // Create regular user
      const { user: regularUser, headers: userHeaders } =
        await e2eTestHelpers.createAuthenticatedUser()

      // Step 1: Verify regular user cannot access admin endpoints
      await request(app).get('/api/v1/admin/users').set(userHeaders).expect(403)

      // Step 2: Admin promotes user to manager
      await request(app)
        .put(`/api/v1/admin/users/${regularUser.id}/role`)
        .set(adminHeaders)
        .send({ role: UserRole.MANAGER })
        .expect(200)

      // Step 3: Verify new manager can access manager endpoints
      const managerToken = e2eTestHelpers.generateAuthToken({
        ...regularUser,
        role: UserRole.MANAGER,
      })
      const managerHeaders = e2eTestHelpers.getAuthHeaders(managerToken)

      const usersResponse = await request(app)
        .get('/api/v1/manager/users')
        .set(managerHeaders)
        .expect(200)

      expect(Array.isArray(usersResponse.body.data.users)).toBe(true)

      // Step 4: Manager cannot access admin-only endpoints
      await request(app)
        .delete(`/api/v1/admin/users/${regularUser.id}`)
        .set(managerHeaders)
        .expect(403)

      // Step 5: Admin can still access all endpoints
      await request(app)
        .get('/api/v1/admin/users')
        .set(adminHeaders)
        .expect(200)
    })
  })

  describe('User Data Privacy and Security', () => {
    it('should protect user data privacy across modules', async () => {
      // Create two users
      const { user: user1, headers: user1Headers } =
        await e2eTestHelpers.createAuthenticatedUser()
      const { headers: user2Headers } =
        await e2eTestHelpers.createAuthenticatedUser()

      // User 1 creates private content
      const project1Response = await request(app)
        .post('/api/v1/projects')
        .set(user1Headers)
        .send({
          title: 'Private Project',
          description: 'This should not be visible to other users',
        })
        .expect(201)

      const project1Id = project1Response.body.data.project.id

      // User 1 creates private note
      const note1Response = await request(app)
        .post('/api/v1/notes')
        .set(user1Headers)
        .send({
          title: 'Private Note',
          description: 'Private thoughts',
          body: 'This note should only be accessible by the owner',
          status: 'PRIVATE',
        })
        .expect(201)

      const note1Id = note1Response.body.data.note.id

      // Step 1: User 2 should not see User 1's private projects
      const user2ProjectsResponse = await request(app)
        .get('/api/v1/projects')
        .set(user2Headers)
        .expect(200)

      const user2Projects = user2ProjectsResponse.body.data.projects
      expect(
        user2Projects.find((p: { id: number }) => p.id === project1Id),
      ).toBeUndefined()

      // Step 2: User 2 should not access User 1's private notes
      await request(app)
        .get(`/api/v1/notes/${note1Id}`)
        .set(user2Headers)
        .expect(403)

      // Step 3: User 2 cannot access User 1's profile details
      await request(app)
        .get(`/api/v1/profiles/${user1.id}`)
        .set(user2Headers)
        .expect(403)

      // Step 4: User 1 can access their own content
      await request(app)
        .get(`/api/v1/projects/${project1Id}`)
        .set(user1Headers)
        .expect(200)

      await request(app)
        .get(`/api/v1/notes/${note1Id}`)
        .set(user1Headers)
        .expect(200)
    })

    it('should handle user security incidents and lockouts', async () => {
      // Create test user
      const testUser = await e2eTestHelpers.createTestUser({
        email: 'security.test@example.com',
        password: 'SecurePass123!',
      })

      // Step 1: Simulate multiple failed login attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: testUser.email,
            password: 'WrongPassword',
          })
          .expect(401)
      }

      // Step 2: Account should be locked after multiple failures
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'SecurePass123!', // Correct password
        })
        .expect(423) // Account locked

      // Step 3: Admin can unlock the account
      const { headers: adminHeaders } =
        await e2eTestHelpers.createAuthenticatedAdmin()

      await request(app)
        .post(`/api/v1/admin/users/${testUser.id}/unlock`)
        .set(adminHeaders)
        .expect(200)

      // Step 4: User can login again after unlock
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'SecurePass123!',
        })
        .expect(200)
    })
  })

  describe('Cross-Module User Interactions', () => {
    it('should maintain data consistency across user operations', async () => {
      // Create users with cross-module data
      const scenario = await e2eTestHelpers.createMultiUserScenario()

      // Step 1: Verify all users can access their own data
      for (const userType of ['regularUser', 'adminUser']) {
        const user = scenario.users[userType as keyof typeof scenario.users]
        const token = e2eTestHelpers.generateAuthToken(user)
        const headers = e2eTestHelpers.getAuthHeaders(token)

        // Check user can access their projects
        const projectsResponse = await request(app)
          .get('/api/v1/projects')
          .set(headers)
          .expect(200)

        expect(projectsResponse.body.data.projects.length).toBeGreaterThan(0)

        // Check user can access their tasks
        const tasksResponse = await request(app)
          .get('/api/v1/tasks')
          .set(headers)
          .expect(200)

        expect(tasksResponse.body.data.tasks.length).toBeGreaterThan(0)

        // Check user can access their notes
        const notesResponse = await request(app)
          .get('/api/v1/notes')
          .set(headers)
          .expect(200)

        expect(notesResponse.body.data.notes.length).toBeGreaterThan(0)
      }

      // Step 2: Test project collaboration affects all related data
      const adminToken = e2eTestHelpers.generateAuthToken(
        scenario.users.adminUser,
      )
      const adminHeaders = e2eTestHelpers.getAuthHeaders(adminToken)

      // Admin creates shared project
      await request(app)
        .post('/api/v1/projects')
        .set(adminHeaders)
        .send({
          title: 'Shared Collaboration Project',
          description: 'Testing cross-user data consistency',
        })
        .expect(201)

      // Step 3: Verify activity logging across modules
      const activitiesResponse = await request(app)
        .get('/api/v1/activities')
        .set(adminHeaders)
        .expect(200)

      const activities = activitiesResponse.body.data.activities
      expect(
        activities.some(
          (a: { action: string; modelType: string }) =>
            a.action === 'CREATE' && a.modelType === 'Project',
        ),
      ).toBe(true)
    })

    it('should handle user deletion with proper data cleanup', async () => {
      // Create user with associated data
      const { user, headers } = await e2eTestHelpers.createAuthenticatedUser()

      // Create user's content
      const projectResponse = await request(app)
        .post('/api/v1/projects')
        .set(headers)
        .send({
          title: 'User Deletion Test Project',
          description: 'This project will be affected by user deletion',
        })
        .expect(201)

      const projectId = projectResponse.body.data.project.id

      await request(app)
        .post('/api/v1/tasks')
        .set(headers)
        .send({
          projectId,
          title: 'User Deletion Test Task',
          definitionOfDone: 'Complete before user deletion',
        })
        .expect(201)

      await request(app)
        .post('/api/v1/notes')
        .set(headers)
        .send({
          title: 'User Deletion Test Note',
          description: 'Note to be handled during user deletion',
          body: 'Content that needs proper cleanup',
        })
        .expect(201)

      // Create admin to perform deletion
      const { headers: adminHeaders } =
        await e2eTestHelpers.createAuthenticatedAdmin()

      // Step 1: Admin soft deletes user
      await request(app)
        .delete(`/api/v1/admin/users/${user.id}`)
        .set(adminHeaders)
        .expect(200)

      // Step 2: Verify user cannot login
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: 'TestPass123!',
        })
        .expect(401)

      // Step 3: Verify user's projects are archived/hidden
      const publicProjectsResponse = await request(app)
        .get('/api/v1/projects/public')
        .expect(200)

      const publicProjects = publicProjectsResponse.body.data.projects
      expect(
        publicProjects.find((p: { id: number }) => p.id === projectId),
      ).toBeUndefined()

      // Step 4: Admin can still access user data for compliance
      const deletedUserResponse = await request(app)
        .get(`/api/v1/admin/users/${user.id}/details`)
        .set(adminHeaders)
        .expect(200)

      expect(deletedUserResponse.body.data.user.status).toBe(
        UserStatus.INACTIVE,
      )
    })
  })

  describe('User Analytics and Reporting', () => {
    it('should track user engagement metrics across modules', async () => {
      // Create active user
      const { user, headers } = await e2eTestHelpers.createAuthenticatedUser()

      // Simulate user activity across modules
      const projectResponse = await request(app)
        .post('/api/v1/projects')
        .set(headers)
        .send({
          title: 'Analytics Test Project',
          description: 'Project for testing user analytics',
        })
        .expect(201)

      const projectId = projectResponse.body.data.project.id

      // Create multiple tasks
      for (let i = 1; i <= 3; i++) {
        await request(app)
          .post('/api/v1/tasks')
          .set(headers)
          .send({
            projectId,
            title: `Analytics Task ${i}`,
            definitionOfDone: `Complete analytics task ${i}`,
          })
          .expect(201)
      }

      // Create multiple notes
      for (let i = 1; i <= 2; i++) {
        await request(app)
          .post('/api/v1/notes')
          .set(headers)
          .send({
            title: `Analytics Note ${i}`,
            description: `Note ${i} for analytics testing`,
            body: `Content for analytics note ${i}`,
          })
          .expect(201)
      }

      // Create admin to check analytics
      const { headers: adminHeaders } =
        await e2eTestHelpers.createAuthenticatedAdmin()

      // Step 1: Check user activity summary
      const userStatsResponse = await request(app)
        .get(`/api/v1/admin/users/${user.id}/stats`)
        .set(adminHeaders)
        .expect(200)

      const stats = userStatsResponse.body.data.stats
      expect(stats.projectsCreated).toBe(1)
      expect(stats.tasksCreated).toBe(3)
      expect(stats.notesCreated).toBe(2)

      // Step 2: Check activity timeline
      const activitiesResponse = await request(app)
        .get(`/api/v1/admin/users/${user.id}/activities`)
        .set(adminHeaders)
        .expect(200)

      const activities = activitiesResponse.body.data.activities
      expect(activities.length).toBeGreaterThan(0)
      expect(
        activities.some((a: { action: string }) => a.action === 'CREATE'),
      ).toBe(true)

      // Step 3: Check system-wide user metrics
      const systemStatsResponse = await request(app)
        .get('/api/v1/admin/analytics/users')
        .set(adminHeaders)
        .expect(200)

      const systemStats = systemStatsResponse.body.data.analytics
      expect(systemStats.totalUsers).toBeGreaterThan(0)
      expect(systemStats.activeUsers).toBeGreaterThan(0)
    })
  })
})
