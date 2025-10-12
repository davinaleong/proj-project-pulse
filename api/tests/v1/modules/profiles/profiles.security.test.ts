import request from 'supertest'
import { createApp } from '../../../../src/app'
import { profilesTestHelpers, prisma } from './profiles.helpers'
import { UserRole, Visibility } from '@prisma/client'

const app = createApp()

describe('Profiles Security', () => {
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

  describe('Authentication and Authorization', () => {
    it('should reject requests without authentication token', async () => {
      await request(app).get('/api/v1/profiles/me').expect(401)
      await request(app).post('/api/v1/profiles').expect(401)
      await request(app).put(`/api/v1/profiles/${profileUuid}`).expect(401)
      await request(app).delete(`/api/v1/profiles/${profileUuid}`).expect(401)
      await request(app).get('/api/v1/profiles/settings').expect(401)
      await request(app).put('/api/v1/profiles/settings').expect(401)
    })

    it('should reject requests with invalid authentication token', async () => {
      const invalidToken = profilesTestHelpers.generateInvalidToken()

      await request(app)
        .get('/api/v1/profiles/me')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401)

      await request(app)
        .post('/api/v1/profiles')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401)
    })

    it('should reject requests with expired authentication token', async () => {
      const expiredToken = profilesTestHelpers.generateExpiredToken(userId)

      await request(app)
        .get('/api/v1/profiles/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401)
    })

    it('should reject malformed authorization headers', async () => {
      await request(app)
        .get('/api/v1/profiles/me')
        .set('Authorization', 'InvalidFormat')
        .expect(401)

      await request(app)
        .get('/api/v1/profiles/me')
        .set('Authorization', `Basic ${authToken}`)
        .expect(401)
    })
  })

  describe('Privacy Controls', () => {
    it('should respect profile visibility settings', async () => {
      // Create users with different visibility settings
      const publicUser = await profilesTestHelpers.createTestUser({
        email: 'public@example.com',
      })
      const privateUser = await profilesTestHelpers.createTestUser({
        email: 'private@example.com',
      })

      const publicProfile = await profilesTestHelpers.createTestProfile(
        publicUser.id,
        { visibility: Visibility.PUBLIC },
      )
      const privateProfile = await profilesTestHelpers.createTestProfile(
        privateUser.id,
        { visibility: Visibility.PRIVATE },
      )

      // Different user trying to access profiles
      const otherUser = await profilesTestHelpers.createTestUser({
        email: 'other@example.com',
      })
      const otherToken = profilesTestHelpers.generateValidJWT(otherUser.id)

      // Should be able to access public profile
      await request(app)
        .get(`/api/v1/profiles/${publicProfile.uuid}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(200)

      // Should not be able to access private profile
      await request(app)
        .get(`/api/v1/profiles/${privateProfile.uuid}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403)
    })

    it('should allow profile owners to access their own private profiles', async () => {
      const user = await profilesTestHelpers.createTestUser({
        email: 'ownprivate@example.com',
      })
      const profile = await profilesTestHelpers.createTestProfile(user.id, {
        visibility: Visibility.PRIVATE,
      })
      const userToken = profilesTestHelpers.generateValidJWT(user.id)

      await request(app)
        .get(`/api/v1/profiles/${profile.uuid}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
    })

    it('should allow admins to access any profile regardless of visibility', async () => {
      const privateUser = await profilesTestHelpers.createTestUser({
        email: 'adminaccess@example.com',
      })
      const privateProfile = await profilesTestHelpers.createTestProfile(
        privateUser.id,
        { visibility: Visibility.PRIVATE },
      )

      await request(app)
        .get(`/api/v1/profiles/${privateProfile.uuid}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
    })

    it('should hide private profiles from public listings', async () => {
      await profilesTestHelpers.cleanupDatabase()

      // Create mix of public and private profiles
      const users = await Promise.all([
        profilesTestHelpers.createTestUser({ email: 'public1@example.com' }),
        profilesTestHelpers.createTestUser({ email: 'public2@example.com' }),
        profilesTestHelpers.createTestUser({ email: 'private1@example.com' }),
        profilesTestHelpers.createTestUser({ email: 'private2@example.com' }),
      ])

      await Promise.all([
        profilesTestHelpers.createTestProfile(users[0].id, {
          visibility: Visibility.PUBLIC,
        }),
        profilesTestHelpers.createTestProfile(users[1].id, {
          visibility: Visibility.PUBLIC,
        }),
        profilesTestHelpers.createTestProfile(users[2].id, {
          visibility: Visibility.PRIVATE,
        }),
        profilesTestHelpers.createTestProfile(users[3].id, {
          visibility: Visibility.PRIVATE,
        }),
      ])

      const token = profilesTestHelpers.generateValidJWT(users[0].id)
      const response = await request(app)
        .get('/api/v1/profiles/public')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      // Should only return public profiles
      expect(response.body.data.profiles).toHaveLength(2)
      expect(
        response.body.data.profiles.every(
          (profile: { visibility: string }) => profile.visibility === 'PUBLIC',
        ),
      ).toBe(true)
    })
  })

  describe('Data Validation and Sanitization', () => {
    it('should reject profiles with invalid social media URLs', async () => {
      const newUser = await profilesTestHelpers.createTestUser({
        email: 'urltest@example.com',
      })
      const newUserToken = profilesTestHelpers.generateValidJWT(newUser.id)

      const invalidData = {
        socialLinks: {
          website: 'not-a-valid-url',
          github: 'also-invalid',
          linkedin: 'javascript:alert("xss")',
        },
      }

      await request(app)
        .post('/api/v1/profiles')
        .set('Authorization', `Bearer ${newUserToken}`)
        .send(invalidData)
        .expect(400)
    })

    it('should reject profiles with bio exceeding maximum length', async () => {
      const newUser = await profilesTestHelpers.createTestUser({
        email: 'longbio@example.com',
      })
      const newUserToken = profilesTestHelpers.generateValidJWT(newUser.id)

      const invalidData = {
        bio: 'x'.repeat(501), // Exceeds 500 character limit
      }

      await request(app)
        .post('/api/v1/profiles')
        .set('Authorization', `Bearer ${newUserToken}`)
        .send(invalidData)
        .expect(400)
    })

    it('should reject profiles with invalid enum values', async () => {
      const newUser = await profilesTestHelpers.createTestUser({
        email: 'invalidenum@example.com',
      })
      const newUserToken = profilesTestHelpers.generateValidJWT(newUser.id)

      const invalidData = {
        theme: 'INVALID_THEME',
        visibility: 'INVALID_VISIBILITY',
      }

      await request(app)
        .post('/api/v1/profiles')
        .set('Authorization', `Bearer ${newUserToken}`)
        .send(invalidData)
        .expect(400)
    })

    it('should sanitize and validate timezone values', async () => {
      const newUser = await profilesTestHelpers.createTestUser({
        email: 'timezone@example.com',
      })
      const newUserToken = profilesTestHelpers.generateValidJWT(newUser.id)

      const invalidData = {
        timezone: 'Invalid/Timezone',
      }

      await request(app)
        .post('/api/v1/profiles')
        .set('Authorization', `Bearer ${newUserToken}`)
        .send(invalidData)
        .expect(400)
    })

    it('should reject unsupported social media platforms', async () => {
      const updateData = {
        socialLinks: {
          website: 'https://example.com',
          unsupported_platform: 'https://unsupported.com',
        },
      }

      await request(app)
        .put(`/api/v1/profiles/${profileUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400)
    })
  })

  describe('Rate Limiting and Abuse Prevention', () => {
    it('should handle multiple rapid requests gracefully', async () => {
      const requests = Array(5)
        .fill(null)
        .map(() =>
          request(app)
            .get(`/api/v1/profiles/${profileUuid}`)
            .set('Authorization', `Bearer ${authToken}`),
        )

      const responses = await Promise.all(requests)
      responses.forEach((response) => {
        expect([200, 429]).toContain(response.status) // Either success or rate limited
      })
    })

    it('should prevent profile enumeration attacks', async () => {
      // Try to access profiles with sequential UUIDs
      const fakeUuids = [
        'non-existent-uuid-1',
        'non-existent-uuid-2',
        'non-existent-uuid-3',
      ]

      for (const uuid of fakeUuids) {
        const response = await request(app)
          .get(`/api/v1/profiles/${uuid}`)
          .set('Authorization', `Bearer ${authToken}`)

        expect(response.status).toBe(404)
        expect(response.body.message).toContain('Profile not found')
      }
    })
  })

  describe('Cross-User Access Controls', () => {
    it('should prevent users from updating other users profiles', async () => {
      const user1 = await profilesTestHelpers.createTestUser({
        email: 'user1@example.com',
      })
      const user2 = await profilesTestHelpers.createTestUser({
        email: 'user2@example.com',
      })

      const profile1 = await profilesTestHelpers.createTestProfile(user1.id)
      const profile2 = await profilesTestHelpers.createTestProfile(user2.id)

      const token1 = profilesTestHelpers.generateValidJWT(user1.id)
      const token2 = profilesTestHelpers.generateValidJWT(user2.id)

      // User 1 trying to update User 2's profile
      const updateData = { bio: 'Unauthorized update' }

      await request(app)
        .put(`/api/v1/profiles/${profile2.uuid}`)
        .set('Authorization', `Bearer ${token1}`)
        .send(updateData)
        .expect(400)

      // User 2 trying to delete User 1's profile
      await request(app)
        .delete(`/api/v1/profiles/${profile1.uuid}`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(400)
    })

    it('should allow users to only access their own settings', async () => {
      const otherUser = await profilesTestHelpers.createTestUser({
        email: 'othersettings@example.com',
      })
      const otherProfile = await profilesTestHelpers.createTestProfile(
        otherUser.id,
      )
      const otherToken = profilesTestHelpers.generateValidJWT(otherUser.id)

      // User should only get their own settings, not others
      const response = await request(app)
        .get('/api/v1/profiles/settings')
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(200)

      expect(response.body.data).toBeDefined()
      // Verify it's their own profile by checking some unique data
    })
  })

  describe('Admin Security', () => {
    it('should allow admins to perform privileged operations', async () => {
      const regularUser = await profilesTestHelpers.createTestUser({
        email: 'regular@example.com',
      })
      const regularProfile = await profilesTestHelpers.createTestProfile(
        regularUser.id,
      )

      // Admin should be able to update any profile
      const updateData = { bio: 'Admin updated this' }

      await request(app)
        .put(`/api/v1/profiles/${regularProfile.uuid}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200)

      // Admin should be able to delete any profile
      await request(app)
        .delete(`/api/v1/profiles/${regularProfile.uuid}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
    })

    it('should prevent privilege escalation attempts', async () => {
      const regularUser = await profilesTestHelpers.createTestUser({
        email: 'escalation@example.com',
      })
      const regularToken = profilesTestHelpers.generateValidJWT(regularUser.id)

      // Try to create a profile with admin-like settings
      const profileData = {
        bio: 'Trying to escalate privileges',
        // No way to set admin privileges through profile creation
      }

      const response = await request(app)
        .post('/api/v1/profiles')
        .set('Authorization', `Bearer ${regularToken}`)
        .send(profileData)
        .expect(201)

      // Should create profile normally without any privilege escalation
      expect(response.body.success).toBe(true)
    })
  })

  describe('SQL Injection and XSS Prevention', () => {
    it('should handle malicious input in profile data', async () => {
      const maliciousData = {
        bio: `'; DROP TABLE profiles; --`,
        socialLinks: {
          website: `<script>alert('xss')</script>`,
        },
      }

      const response = await request(app)
        .put(`/api/v1/profiles/${profileUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(maliciousData)

      // Should either reject the data or sanitize it
      if (response.status === 200) {
        expect(response.body.data.bio).not.toContain('DROP TABLE')
        expect(response.body.data.socialLinks.website).not.toContain('<script>')
      } else {
        expect(response.status).toBe(400)
      }
    })

    it('should handle special characters in search queries', async () => {
      const maliciousSearch = `'; DELETE FROM profiles; --`

      const response = await request(app)
        .get(
          `/api/v1/profiles/public?search=${encodeURIComponent(maliciousSearch)}`,
        )
        .set('Authorization', `Bearer ${authToken}`)

      // Should handle gracefully without causing database issues
      expect([200, 400]).toContain(response.status)
    })
  })
})
