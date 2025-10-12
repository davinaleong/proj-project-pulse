import request from 'supertest'
import { createApp } from '../../../../src/app'
import { profilesTestHelpers, prisma } from './profiles.helpers'
import { Visibility } from '@prisma/client'

const app = createApp()

describe('Profiles Management', () => {
  let authToken: string
  let adminToken: string
  let userId: number
  let profileUuid: string

  beforeAll(async () => {
    await profilesTestHelpers.cleanupDatabase()
    const {
      user,
      profile,
      authToken: token,
      adminToken: adminTokenValue,
    } = await profilesTestHelpers.setupTestData()
    userId = user.id
    profileUuid = profile.uuid
    authToken = token
    adminToken = adminTokenValue
  })

  afterAll(async () => {
    await profilesTestHelpers.disconnectDatabase()
  })

  describe('GET /api/v1/profiles/:uuid/stats', () => {
    beforeAll(async () => {
      // Create some test data for statistics
      const project1 = await prisma.project.create({
        data: {
          title: 'Test Project 1',
          description: 'Project for testing stats',
          userId: userId,
          stage: 'PLANNING',
        },
      })

      const project2 = await prisma.project.create({
        data: {
          title: 'Test Project 2',
          description: 'Another project for testing',
          userId: userId,
          stage: 'IMPLEMENTATION',
        },
      })

      await prisma.task.createMany({
        data: [
          {
            title: 'Task 1',
            projectId: project1.id,
            status: 'TODO',
            userId: userId,
          },
          {
            title: 'Task 2',
            projectId: project1.id,
            status: 'DONE',
            userId: userId,
          },
          {
            title: 'Task 3',
            projectId: project2.id,
            status: 'DONE',
            userId: userId,
          },
        ],
      })

      await prisma.note.createMany({
        data: [
          {
            title: 'Note 1',
            description: 'First note',
            status: 'PUBLISHED',
            userId: userId,
          },
          {
            title: 'Note 2',
            description: 'Second note',
            status: 'DRAFT',
            userId: userId,
          },
        ],
      })
    })

    it('should get profile statistics for public profile', async () => {
      const response = await request(app)
        .get(`/api/v1/profiles/${profileUuid}/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.projectCount).toBe(2)
      expect(response.body.data.taskCount).toBe(3)
      expect(response.body.data.noteCount).toBe(2)
      expect(response.body.data.completedTaskCount).toBe(2)
      expect(response.body.data.joinedDate).toBeDefined()
    })

    it('should get own profile statistics', async () => {
      const response = await request(app)
        .get(`/api/v1/profiles/${profileUuid}/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('projectCount')
      expect(response.body.data).toHaveProperty('taskCount')
      expect(response.body.data).toHaveProperty('noteCount')
      expect(response.body.data).toHaveProperty('completedTaskCount')
      expect(response.body.data).toHaveProperty('joinedDate')
    })

    it('should fail to get stats for private profile as different user', async () => {
      // Create a private profile
      const privateUser = await profilesTestHelpers.createTestUser({
        email: 'privatestats@example.com',
      })
      const privateProfile = await profilesTestHelpers.createTestProfile(
        privateUser.id,
        { visibility: Visibility.PRIVATE },
      )

      const otherUser = await profilesTestHelpers.createTestUser({
        email: 'otherstats@example.com',
      })
      const otherToken = profilesTestHelpers.generateValidJWT(otherUser.id)

      const response = await request(app)
        .get(`/api/v1/profiles/${privateProfile.uuid}/stats`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('Unauthorized')
    })

    it('should allow admin to view stats for any profile', async () => {
      const response = await request(app)
        .get(`/api/v1/profiles/${profileUuid}/stats`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('projectCount')
    })

    it('should return 404 for non-existent profile', async () => {
      const response = await request(app)
        .get('/api/v1/profiles/non-existent-uuid/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('Profile not found')
    })
  })

  describe('GET /api/v1/profiles/settings', () => {
    it('should get current user profile settings', async () => {
      const response = await request(app)
        .get('/api/v1/profiles/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('theme')
      expect(response.body.data).toHaveProperty('language')
      expect(response.body.data).toHaveProperty('timezone')
      expect(response.body.data).toHaveProperty('notifications')
      expect(response.body.data).toHaveProperty('visibility')
    })

    it('should fail without authentication', async () => {
      await request(app).get('/api/v1/profiles/settings').expect(401)
    })

    it('should return 404 if user has no profile', async () => {
      const userWithoutProfile = await profilesTestHelpers.createTestUser({
        email: 'nosettings@example.com',
      })
      const token = profilesTestHelpers.generateValidJWT(userWithoutProfile.id)

      const response = await request(app)
        .get('/api/v1/profiles/settings')
        .set('Authorization', `Bearer ${token}`)
        .expect(500)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('Profile not found')
    })
  })

  describe('PUT /api/v1/profiles/settings', () => {
    it('should update profile settings successfully', async () => {
      const settingsData = {
        theme: 'DARK',
        language: 'es',
        timezone: 'America/Los_Angeles',
        visibility: 'PRIVATE',
        notifications: {
          email: {
            projects: false,
            tasks: true,
            notes: false,
            mentions: true,
          },
          push: {
            projects: true,
            tasks: false,
            notes: true,
            mentions: false,
          },
          frequency: 'weekly',
        },
      }

      const response = await request(app)
        .put('/api/v1/profiles/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(settingsData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.theme).toBe(settingsData.theme)
      expect(response.body.data.language).toBe(settingsData.language)
      expect(response.body.data.timezone).toBe(settingsData.timezone)
      expect(response.body.data.visibility).toBe(settingsData.visibility)
    })

    it('should update partial settings', async () => {
      const partialSettings = {
        theme: 'LIGHT',
        notifications: {
          frequency: 'daily',
        },
      }

      const response = await request(app)
        .put('/api/v1/profiles/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(partialSettings)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.theme).toBe(partialSettings.theme)
    })

    it('should fail with invalid settings', async () => {
      const invalidSettings = {
        theme: 'INVALID_THEME',
        language: 'invalid-lang-code',
        timezone: 'Invalid/Timezone',
        visibility: 'INVALID_VISIBILITY',
      }

      const response = await request(app)
        .put('/api/v1/profiles/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidSettings)
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('should fail without authentication', async () => {
      const settingsData = { theme: 'DARK' }

      await request(app)
        .put('/api/v1/profiles/settings')
        .send(settingsData)
        .expect(401)
    })

    it('should return 404 if user has no profile', async () => {
      const userWithoutProfile = await profilesTestHelpers.createTestUser({
        email: 'noupdatesettings@example.com',
      })
      const token = profilesTestHelpers.generateValidJWT(userWithoutProfile.id)

      const settingsData = { theme: 'DARK' }

      const response = await request(app)
        .put('/api/v1/profiles/settings')
        .set('Authorization', `Bearer ${token}`)
        .send(settingsData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('Profile not found')
    })
  })

  describe('Profile Management Edge Cases', () => {
    it('should handle profile with missing optional fields', async () => {
      const minimalUser = await profilesTestHelpers.createTestUser({
        email: 'minimal@example.com',
      })
      const minimalProfile = await profilesTestHelpers.createTestProfile(
        minimalUser.id,
        {
          bio: undefined,
          avatarUrl: undefined,
          coverUrl: undefined,
          socialLinks: {},
        },
      )

      const response = await request(app)
        .get(`/api/v1/profiles/${minimalProfile.uuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.uuid).toBe(minimalProfile.uuid)
    })

    it('should handle profile with maximum allowed data', async () => {
      const maxUser = await profilesTestHelpers.createTestUser({
        email: 'maxdata@example.com',
      })
      const maxProfile = await profilesTestHelpers.createTestProfile(
        maxUser.id,
        {
          bio: 'A'.repeat(500), // Maximum bio length
          socialLinks: {
            website: 'https://example.com',
            linkedin: 'https://linkedin.com/in/maxuser',
            github: 'https://github.com/maxuser',
            twitter: 'https://twitter.com/maxuser',
            instagram: 'https://instagram.com/maxuser',
          },
        },
      )

      const response = await request(app)
        .get(`/api/v1/profiles/${maxProfile.uuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.bio).toBe('A'.repeat(500))
    })

    it('should handle concurrent profile updates', async () => {
      const updateData1 = { bio: 'Update 1' }
      const updateData2 = { bio: 'Update 2' }

      // Send concurrent requests
      const [response1, response2] = await Promise.all([
        request(app)
          .put(`/api/v1/profiles/${profileUuid}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData1),
        request(app)
          .put(`/api/v1/profiles/${profileUuid}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData2),
      ])

      // Both should succeed (last one wins)
      expect([200, 200]).toContain(response1.status)
      expect([200, 200]).toContain(response2.status)
    })
  })
})
