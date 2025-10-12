import request from 'supertest'
import { createApp } from '../../../../src/app'
import { profilesTestHelpers, prisma } from './profiles.helpers'
import { Theme, Visibility } from '@prisma/client'

const app = createApp()

describe('Profiles CRUD Operations', () => {
  let authToken: string
  let adminToken: string
  let userId: number
  let adminUserId: number
  let profileUuid: string

  beforeAll(async () => {
    await profilesTestHelpers.cleanupDatabase()
    const {
      user,
      adminUser,
      profile,
      authToken: token,
      adminToken: adminTokenValue,
    } = await profilesTestHelpers.setupTestData()
    userId = user.id
    adminUserId = adminUser.id
    profileUuid = profile.uuid
    authToken = token
    adminToken = adminTokenValue
  })

  afterAll(async () => {
    await profilesTestHelpers.disconnectDatabase()
  })

  describe('POST /api/v1/profiles', () => {
    it('should create a new profile successfully', async () => {
      // Create a new user without a profile
      const newUser = await profilesTestHelpers.createTestUser({
        email: 'newuser@example.com',
      })
      const newUserToken = profilesTestHelpers.generateValidJWT(newUser.id)

      const profileData = profilesTestHelpers.createValidProfileData()

      const response = await request(app)
        .post('/api/v1/profiles')
        .set('Authorization', `Bearer ${newUserToken}`)
        .send(profileData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.bio).toBe(profileData.bio)
      expect(response.body.data.timezone).toBe(profileData.timezone)
      expect(response.body.data.language).toBe(profileData.language)
      expect(response.body.data.theme).toBe(profileData.theme)
      expect(response.body.data.visibility).toBe(profileData.visibility)
      expect(response.body.data.userId).toBe(newUser.id)
      expect(response.body.data.uuid).toBeDefined()
    })

    it('should fail to create profile with invalid data', async () => {
      const newUser = await profilesTestHelpers.createTestUser({
        email: 'invaliduser@example.com',
      })
      const newUserToken = profilesTestHelpers.generateValidJWT(newUser.id)

      const invalidData = profilesTestHelpers.createInvalidProfileData()

      const response = await request(app)
        .post('/api/v1/profiles')
        .set('Authorization', `Bearer ${newUserToken}`)
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('Validation failed')
    })

    it('should fail to create duplicate profile', async () => {
      const profileData = profilesTestHelpers.createValidProfileData()

      const response = await request(app)
        .post('/api/v1/profiles')
        .set('Authorization', `Bearer ${authToken}`)
        .send(profileData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('Profile already exists')
    })

    it('should fail without authentication', async () => {
      const profileData = profilesTestHelpers.createValidProfileData()

      await request(app).post('/api/v1/profiles').send(profileData).expect(401)
    })
  })

  describe('GET /api/v1/profiles/me', () => {
    it('should get current user profile', async () => {
      const response = await request(app)
        .get('/api/v1/profiles/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.userId).toBe(userId)
      expect(response.body.data.user).toBeDefined()
      expect(response.body.data.user.email).toBeDefined()
    })

    it('should fail without authentication', async () => {
      await request(app).get('/api/v1/profiles/me').expect(401)
    })

    it('should return 404 if user has no profile', async () => {
      const userWithoutProfile = await profilesTestHelpers.createTestUser({
        email: 'noprofile@example.com',
      })
      const token = profilesTestHelpers.generateValidJWT(userWithoutProfile.id)

      const response = await request(app)
        .get('/api/v1/profiles/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('Profile not found')
    })
  })

  describe('GET /api/v1/profiles/:uuid', () => {
    it('should get public profile by UUID', async () => {
      const response = await request(app)
        .get(`/api/v1/profiles/${profileUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.uuid).toBe(profileUuid)
      expect(response.body.data.user).toBeDefined()
    })

    it('should get own profile by UUID', async () => {
      const response = await request(app)
        .get(`/api/v1/profiles/${profileUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.uuid).toBe(profileUuid)
    })

    it('should fail to get private profile as different user', async () => {
      // Create a private profile
      const privateUser = await profilesTestHelpers.createTestUser({
        email: 'private@example.com',
      })
      const privateProfile = await profilesTestHelpers.createTestProfile(
        privateUser.id,
        { visibility: Visibility.PRIVATE },
      )

      const response = await request(app)
        .get(`/api/v1/profiles/${privateProfile.uuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('Profile is private')
    })

    it('should allow admin to view private profiles', async () => {
      // Create a private profile
      const privateUser = await profilesTestHelpers.createTestUser({
        email: 'privatefromadmin@example.com',
      })
      const privateProfile = await profilesTestHelpers.createTestProfile(
        privateUser.id,
        { visibility: Visibility.PRIVATE },
      )

      const response = await request(app)
        .get(`/api/v1/profiles/${privateProfile.uuid}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.uuid).toBe(privateProfile.uuid)
    })

    it('should return 404 for non-existent profile', async () => {
      const response = await request(app)
        .get('/api/v1/profiles/non-existent-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('Profile not found')
    })
  })

  describe('GET /api/v1/profiles/public', () => {
    beforeAll(async () => {
      // Clean up and create multiple test profiles
      await profilesTestHelpers.cleanupDatabase()
      await profilesTestHelpers.createMultipleTestProfiles()
    })

    it('should get public profiles with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/profiles/public?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.profiles).toHaveLength(2)
      expect(response.body.data.pagination).toBeDefined()
      expect(response.body.data.pagination.page).toBe(1)
      expect(response.body.data.pagination.limit).toBe(2)
      expect(response.body.data.pagination.total).toBeGreaterThanOrEqual(2)
    })

    it('should filter profiles by search term', async () => {
      const response = await request(app)
        .get('/api/v1/profiles/public?search=Frontend')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.profiles.length).toBeGreaterThan(0)
      expect(
        response.body.data.profiles.some((profile: any) =>
          profile.bio.includes('Frontend'),
        ),
      ).toBe(true)
    })

    it('should filter profiles by theme', async () => {
      const response = await request(app)
        .get('/api/v1/profiles/public?theme=DARK')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      if (response.body.data.profiles.length > 0) {
        expect(
          response.body.data.profiles.every(
            (profile: any) => profile.theme === 'DARK',
          ),
        ).toBe(true)
      }
    })

    it('should only return public profiles', async () => {
      const response = await request(app)
        .get('/api/v1/profiles/public')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(
        response.body.data.profiles.every(
          (profile: any) => profile.visibility === 'PUBLIC',
        ),
      ).toBe(true)
    })
  })

  describe('PUT /api/v1/profiles/:uuid', () => {
    it('should update own profile successfully', async () => {
      const updateData = {
        bio: 'Updated bio for testing',
        theme: 'DARK',
        socialLinks: {
          website: 'https://updated.example.com',
          github: 'https://github.com/updated',
        },
      }

      const response = await request(app)
        .put(`/api/v1/profiles/${profileUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.bio).toBe(updateData.bio)
      expect(response.body.data.theme).toBe(updateData.theme)
    })

    it('should allow admin to update any profile', async () => {
      const updateData = {
        bio: 'Admin updated this profile',
      }

      const response = await request(app)
        .put(`/api/v1/profiles/${profileUuid}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.bio).toBe(updateData.bio)
    })

    it('should fail to update other user profile as regular user', async () => {
      const otherUser = await profilesTestHelpers.createTestUser({
        email: 'other@example.com',
      })
      const otherProfile = await profilesTestHelpers.createTestProfile(
        otherUser.id,
      )

      const updateData = { bio: 'Unauthorized update' }

      const response = await request(app)
        .put(`/api/v1/profiles/${otherProfile.uuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('Unauthorized')
    })

    it('should fail with invalid data', async () => {
      const invalidData = {
        theme: 'INVALID_THEME',
        visibility: 'INVALID_VISIBILITY',
      }

      const response = await request(app)
        .put(`/api/v1/profiles/${profileUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('should return 404 for non-existent profile', async () => {
      const updateData = { bio: 'Updated bio' }

      const response = await request(app)
        .put('/api/v1/profiles/non-existent-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('Profile not found')
    })
  })

  describe('DELETE /api/v1/profiles/:uuid', () => {
    it('should delete own profile successfully', async () => {
      // Create a new user and profile for deletion
      const userToDelete = await profilesTestHelpers.createTestUser({
        email: 'delete@example.com',
      })
      const profileToDelete = await profilesTestHelpers.createTestProfile(
        userToDelete.id,
      )
      const deleteToken = profilesTestHelpers.generateValidJWT(userToDelete.id)

      const response = await request(app)
        .delete(`/api/v1/profiles/${profileToDelete.uuid}`)
        .set('Authorization', `Bearer ${deleteToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('deleted successfully')

      // Verify profile is deleted
      const deletedProfile = await prisma.profile.findUnique({
        where: { uuid: profileToDelete.uuid },
      })
      expect(deletedProfile).toBeNull()
    })

    it('should allow admin to delete any profile', async () => {
      // Create a new user and profile for admin deletion
      const userToDelete = await profilesTestHelpers.createTestUser({
        email: 'admindelete@example.com',
      })
      const profileToDelete = await profilesTestHelpers.createTestProfile(
        userToDelete.id,
      )

      const response = await request(app)
        .delete(`/api/v1/profiles/${profileToDelete.uuid}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    it('should fail to delete other user profile as regular user', async () => {
      const otherUser = await profilesTestHelpers.createTestUser({
        email: 'cantdelete@example.com',
      })
      const otherProfile = await profilesTestHelpers.createTestProfile(
        otherUser.id,
      )

      const response = await request(app)
        .delete(`/api/v1/profiles/${otherProfile.uuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('Unauthorized')
    })

    it('should return 404 for non-existent profile', async () => {
      const response = await request(app)
        .delete('/api/v1/profiles/non-existent-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('Profile not found')
    })
  })
})
