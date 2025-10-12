import request from 'supertest'
import { createApp } from '../../../../src/app'
import { profilesTestHelpers } from './profiles.helpers'
import { Theme, Visibility } from '@prisma/client'

const app = createApp()

describe('Profiles Edge Cases', () => {
  let authToken: string
  let userId: number
  let profileUuid: string

  beforeAll(async () => {
    await profilesTestHelpers.cleanupDatabase()
    const {
      user,
      profile,
      authToken: token,
    } = await profilesTestHelpers.setupTestData()
    userId = user.id
    profileUuid = profile.uuid
    authToken = token
  })

  afterAll(async () => {
    await profilesTestHelpers.disconnectDatabase()
  })

  describe('Boundary Value Testing', () => {
    it('should handle maximum length bio', async () => {
      const maxBio = 'A'.repeat(500) // Maximum allowed length

      const response = await request(app)
        .put(`/api/v1/profiles/${profileUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ bio: maxBio })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.bio).toBe(maxBio)
    })

    it('should reject bio exceeding maximum length', async () => {
      const oversizedBio = 'A'.repeat(501) // Exceeds maximum

      await request(app)
        .put(`/api/v1/profiles/${profileUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ bio: oversizedBio })
        .expect(400)
    })

    it('should handle empty bio', async () => {
      const response = await request(app)
        .put(`/api/v1/profiles/${profileUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ bio: '' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.bio).toBe('')
    })

    it('should handle maximum number of social links', async () => {
      const maxSocialLinks = {
        website: 'https://example.com',
        linkedin: 'https://linkedin.com/in/user',
        github: 'https://github.com/user',
        twitter: 'https://twitter.com/user',
        instagram: 'https://instagram.com/user',
      }

      const response = await request(app)
        .put(`/api/v1/profiles/${profileUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ socialLinks: maxSocialLinks })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(Object.keys(response.body.data.socialLinks)).toHaveLength(5)
    })
  })

  describe('Data Type Edge Cases', () => {
    it('should handle null values in optional fields', async () => {
      const response = await request(app)
        .put(`/api/v1/profiles/${profileUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bio: null,
          avatarUrl: null,
          coverUrl: null,
        })
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    it('should handle undefined values in optional fields', async () => {
      const response = await request(app)
        .put(`/api/v1/profiles/${profileUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          bio: undefined,
          avatarUrl: undefined,
          coverUrl: undefined,
        })
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    it('should handle special characters in bio', async () => {
      const specialCharBio =
        '🚀 Full-stack developer! @work #coding $money %done (2024) [skills] "quotes" \'apostrophes\' & ampersand'

      const response = await request(app)
        .put(`/api/v1/profiles/${profileUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ bio: specialCharBio })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.bio).toBe(specialCharBio)
    })

    it('should handle unicode characters in bio', async () => {
      const unicodeBio = '开发者 こんにちは مطور Разработчик 👨‍💻'

      const response = await request(app)
        .put(`/api/v1/profiles/${profileUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ bio: unicodeBio })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.bio).toBe(unicodeBio)
    })

    it('should handle empty social links object', async () => {
      const response = await request(app)
        .put(`/api/v1/profiles/${profileUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ socialLinks: {} })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.socialLinks).toEqual({})
    })
  })

  describe('Concurrent Operations', () => {
    it('should handle simultaneous profile updates', async () => {
      const updates = [
        { bio: 'Update 1' },
        { bio: 'Update 2' },
        { bio: 'Update 3' },
      ]

      const promises = updates.map((update) =>
        request(app)
          .put(`/api/v1/profiles/${profileUuid}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(update),
      )

      const responses = await Promise.all(promises)

      // All should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200)
      })

      // Final state should be one of the updates
      const finalProfile = await request(app)
        .get(`/api/v1/profiles/${profileUuid}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(['Update 1', 'Update 2', 'Update 3']).toContain(
        finalProfile.body.data.bio,
      )
    })

    it('should handle concurrent settings updates', async () => {
      const settingsUpdates = [
        { theme: Theme.DARK },
        { visibility: Visibility.PRIVATE },
        { language: 'es' },
      ]

      const promises = settingsUpdates.map((settings) =>
        request(app)
          .put('/api/v1/profiles/settings')
          .set('Authorization', `Bearer ${authToken}`)
          .send(settings),
      )

      const responses = await Promise.all(promises)

      // All should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200)
      })
    })
  })

  describe('Database Constraints', () => {
    it('should handle profile deletion with foreign key constraints', async () => {
      // Create a user with associated data
      const userWithData = await profilesTestHelpers.createTestUser({
        email: 'withdata@example.com',
      })
      const profileWithData = await profilesTestHelpers.createTestProfile(
        userWithData.id,
      )
      const tokenWithData = profilesTestHelpers.generateValidJWT(
        userWithData.id,
      )

      // Delete the profile
      await request(app)
        .delete(`/api/v1/profiles/${profileWithData.uuid}`)
        .set('Authorization', `Bearer ${tokenWithData}`)
        .expect(200)

      // Verify profile is deleted
      await request(app)
        .get(`/api/v1/profiles/${profileWithData.uuid}`)
        .set('Authorization', `Bearer ${tokenWithData}`)
        .expect(404)
    })

    it('should prevent duplicate profiles for same user', async () => {
      const newUser = await profilesTestHelpers.createTestUser({
        email: 'duplicate@example.com',
      })
      const newToken = profilesTestHelpers.generateValidJWT(newUser.id)

      // Create first profile
      await request(app)
        .post('/api/v1/profiles')
        .set('Authorization', `Bearer ${newToken}`)
        .send(profilesTestHelpers.createValidProfileData())
        .expect(201)

      // Try to create second profile for same user
      await request(app)
        .post('/api/v1/profiles')
        .set('Authorization', `Bearer ${newToken}`)
        .send(profilesTestHelpers.createValidProfileData())
        .expect(400)
    })
  })

  describe('Invalid UUID Handling', () => {
    it('should handle malformed UUIDs gracefully', async () => {
      const malformedUuids = [
        'not-a-uuid',
        '123',
        'uuid-but-wrong-format',
        '00000000-0000-0000-0000-000000000000',
        '',
        ' ',
      ]

      for (const uuid of malformedUuids) {
        const response = await request(app)
          .get(`/api/v1/profiles/${uuid}`)
          .set('Authorization', `Bearer ${authToken}`)

        expect([400, 404]).toContain(response.status)
      }
    })

    it('should handle very long UUID strings', async () => {
      const longUuid = 'a'.repeat(1000)

      const response = await request(app)
        .get(`/api/v1/profiles/${longUuid}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect([400, 404]).toContain(response.status)
    })
  })

  describe('Timezone Edge Cases', () => {
    it('should handle various valid timezone formats', async () => {
      const validTimezones = [
        'UTC',
        'America/New_York',
        'Europe/London',
        'Asia/Tokyo',
        'Australia/Sydney',
        'Africa/Cairo',
        'GMT',
        'GMT+5',
        'GMT-8',
      ]

      for (const timezone of validTimezones) {
        const response = await request(app)
          .put(`/api/v1/profiles/${profileUuid}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ timezone })

        expect([200, 400]).toContain(response.status)

        if (response.status === 200) {
          expect(response.body.data.timezone).toBe(timezone)
        }
      }
    })

    it('should reject invalid timezone formats', async () => {
      const invalidTimezones = [
        'Invalid/Timezone',
        'NotReal/Zone',
        'America/FakeCity',
        'GMT+25',
        'UTC+15',
        '',
      ]

      for (const timezone of invalidTimezones) {
        await request(app)
          .put(`/api/v1/profiles/${profileUuid}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ timezone })
          .expect(400)
      }
    })
  })

  describe('Language Code Edge Cases', () => {
    it('should handle valid language codes', async () => {
      const validLanguages = [
        'en',
        'es',
        'fr',
        'de',
        'it',
        'pt',
        'ru',
        'ja',
        'ko',
        'zh',
      ]

      for (const language of validLanguages) {
        const response = await request(app)
          .put('/api/v1/profiles/settings')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ language })
          .expect(200)

        expect(response.body.data.language).toBe(language)
      }
    })

    it('should reject invalid language codes', async () => {
      const invalidLanguages = [
        'invalid',
        'toolong',
        'x',
        '',
        '123',
        'en-US-EXTRA',
      ]

      for (const language of invalidLanguages) {
        await request(app)
          .put('/api/v1/profiles/settings')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ language })
          .expect(400)
      }
    })
  })

  describe('URL Validation Edge Cases', () => {
    it('should handle various valid URL formats', async () => {
      const validUrls = {
        website: 'https://example.com',
        linkedin: 'https://www.linkedin.com/in/username',
        github: 'https://github.com/username',
        twitter: 'https://twitter.com/username',
        instagram: 'https://www.instagram.com/username/',
      }

      const response = await request(app)
        .put(`/api/v1/profiles/${profileUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ socialLinks: validUrls })
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    it('should reject invalid URL formats', async () => {
      const invalidUrls = {
        website: 'not-a-url',
        github: 'ftp://github.com/user', // Wrong protocol
        linkedin: 'javascript:alert("xss")', // Dangerous protocol
      }

      await request(app)
        .put(`/api/v1/profiles/${profileUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ socialLinks: invalidUrls })
        .expect(400)
    })

    it('should handle URLs with special characters', async () => {
      const specialUrls = {
        website: 'https://example.com/path?param=value&other=123#section',
        github: 'https://github.com/user-name_123',
      }

      const response = await request(app)
        .put(`/api/v1/profiles/${profileUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ socialLinks: specialUrls })
        .expect(200)

      expect(response.body.success).toBe(true)
    })
  })

  describe('Pagination Edge Cases', () => {
    beforeAll(async () => {
      await profilesTestHelpers.cleanupDatabase()
      await profilesTestHelpers.createMultipleTestProfiles()
    })

    it('should handle page 0', async () => {
      const response = await request(app)
        .get('/api/v1/profiles/public?page=0')
        .set('Authorization', `Bearer ${authToken}`)

      expect([200, 400]).toContain(response.status)
    })

    it('should handle negative page numbers', async () => {
      const response = await request(app)
        .get('/api/v1/profiles/public?page=-1')
        .set('Authorization', `Bearer ${authToken}`)

      expect([200, 400]).toContain(response.status)
    })

    it('should handle very large page numbers', async () => {
      const response = await request(app)
        .get('/api/v1/profiles/public?page=999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.data.profiles).toHaveLength(0)
    })

    it('should handle very large limit values', async () => {
      const response = await request(app)
        .get('/api/v1/profiles/public?limit=999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      // Should be capped at maximum allowed limit
      expect(response.body.data.pagination.limit).toBeLessThanOrEqual(100)
    })

    it('should handle zero limit', async () => {
      const response = await request(app)
        .get('/api/v1/profiles/public?limit=0')
        .set('Authorization', `Bearer ${authToken}`)

      expect([200, 400]).toContain(response.status)
    })
  })

  describe('Memory and Performance Edge Cases', () => {
    it('should handle large notification settings objects', async () => {
      const largeNotifications = {
        email: {
          projects: true,
          tasks: true,
          notes: true,
          mentions: true,
        },
        push: {
          projects: false,
          tasks: true,
          notes: false,
          mentions: true,
        },
        frequency: 'daily',
        // Add extra properties to test size limits
        customSetting1: true,
        customSetting2: false,
        customSetting3: 'value',
      }

      const response = await request(app)
        .put('/api/v1/profiles/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ notifications: largeNotifications })
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    it('should handle rapid sequential requests', async () => {
      const rapidRequests = Array(10)
        .fill(null)
        .map((_, index) =>
          request(app)
            .put(`/api/v1/profiles/${profileUuid}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({ bio: `Rapid update ${index}` }),
        )

      const responses = await Promise.all(rapidRequests)

      // Most should succeed, some might be rate limited
      const successCount = responses.filter((r) => r.status === 200).length
      expect(successCount).toBeGreaterThan(0)
    })
  })
})
