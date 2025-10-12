import request from 'supertest'
import { createApp } from '../../../../src/app'
import { settingsTestHelpers, prisma } from './settings.helpers'
import { SettingVisibility } from '@prisma/client'

const app = createApp()

describe('Settings Edge Cases & Error Handling', () => {
  let authToken: string
  let userId: number
  let adminToken: string
  let adminUserId: number

  beforeAll(async () => {
    await settingsTestHelpers.cleanupDatabase()

    const { user, authToken: token } = await settingsTestHelpers.setupTestData()
    userId = user.id
    authToken = token

    const { adminUser, adminToken: adminAuthToken } =
      await settingsTestHelpers.setupAdminTestData()
    adminUserId = adminUser.id
    adminToken = adminAuthToken
  })

  afterAll(async () => {
    await settingsTestHelpers.disconnectDatabase()
  })

  describe('Invalid Parameters & IDs', () => {
    it('should handle invalid setting ID formats', async () => {
      await request(app)
        .get('/api/v1/settings/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)

      await request(app)
        .get('/api/v1/settings/0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)

      await request(app)
        .get('/api/v1/settings/-1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)
    })

    it('should handle non-existent setting IDs', async () => {
      await request(app)
        .get('/api/v1/settings/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)

      await request(app)
        .put('/api/v1/settings/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ value: 'test' })
        .expect(404)

      await request(app)
        .delete('/api/v1/settings/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)
    })
  })

  describe('Malformed Request Bodies', () => {
    it('should handle empty request bodies', async () => {
      await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400)

      const setting = await settingsTestHelpers.createTestSetting(userId)

      await request(app)
        .put(`/api/v1/settings/${setting.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400)
    })

    it('should handle malformed JSON', async () => {
      await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400)
    })

    it('should handle wrong content types', async () => {
      await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'text/plain')
        .send('not json')
        .expect(400)
    })
  })

  describe('Boundary Value Testing', () => {
    it('should handle minimum valid values', async () => {
      const response = await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          key: 'a', // Single character key
          value: '', // Empty value
          category: '',
        })
        .expect(201)

      expect(response.body.data.key).toBe('a')
      expect(response.body.data.value).toBe('')
    })

    it('should handle edge case pagination parameters', async () => {
      // Page 0
      await request(app)
        .get('/api/v1/settings?page=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)

      // Negative page
      await request(app)
        .get('/api/v1/settings?page=-1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)

      // Limit 0
      await request(app)
        .get('/api/v1/settings?limit=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)

      // Very large limit
      await request(app)
        .get('/api/v1/settings?limit=1000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)
    })

    it('should handle special characters in keys and values', async () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?'

      const response = await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          key: `special_chars_${Date.now()}`,
          value: specialChars,
          category: 'test',
        })
        .expect(201)

      expect(response.body.data.value).toBe(specialChars)
    })

    it('should handle unicode characters', async () => {
      const unicodeValue = '测试 🚀 العربية ñáéíóú'

      const response = await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          key: `unicode_test_${Date.now()}`,
          value: unicodeValue,
          category: 'unicode',
        })
        .expect(201)

      expect(response.body.data.value).toBe(unicodeValue)
    })
  })

  describe('Concurrent Operations', () => {
    it('should handle concurrent setting creation attempts', async () => {
      const settingData = {
        key: `concurrent_test_${Date.now()}`,
        value: 'test',
        category: 'concurrent',
      }

      // Make multiple concurrent requests
      const promises = Array(5)
        .fill(null)
        .map(() =>
          request(app)
            .post('/api/v1/settings')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              ...settingData,
              key: `${settingData.key}_${Math.random()}`,
            }),
        )

      const results = await Promise.allSettled(promises)

      // All should succeed since they have different keys
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          expect(result.value.status).toBe(201)
        }
      })
    })

    it('should handle concurrent updates to same setting', async () => {
      const setting = await settingsTestHelpers.createTestSetting(userId, {
        key: 'concurrent_update_test',
        value: 'original',
      })

      // Make multiple concurrent update requests
      const promises = Array(3)
        .fill(null)
        .map((_, index) =>
          request(app)
            .put(`/api/v1/settings/${setting.id}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({ value: `updated_${index}` }),
        )

      const results = await Promise.allSettled(promises)

      // At least one should succeed
      const successful = results.filter(
        (result) =>
          result.status === 'fulfilled' && result.value.status === 200,
      )
      expect(successful.length).toBeGreaterThan(0)
    })
  })

  describe('Database Constraints & Integrity', () => {
    it('should handle duplicate key attempts properly', async () => {
      const key = `duplicate_key_${Date.now()}`

      // First creation should succeed
      await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          key,
          value: 'first',
          category: 'test',
        })
        .expect(201)

      // Second creation with same key should fail
      await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          key,
          value: 'second',
          category: 'test',
        })
        .expect(400)
    })

    it('should handle orphaned settings gracefully', async () => {
      // Create a setting and then delete the user (simulate orphaned data)
      const tempUser = await settingsTestHelpers.createTestUser({
        email: 'temp@example.com',
      })
      const setting = await settingsTestHelpers.createTestSetting(tempUser.id)

      // Delete the user (setting should become orphaned or cascade delete)
      await prisma.user.delete({ where: { id: tempUser.id } })

      // Try to access the setting - should handle gracefully
      await request(app)
        .get(`/api/v1/settings/${setting.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404) // Should not find it or handle the orphaned case
    })
  })

  describe('Performance & Resource Limits', () => {
    it('should handle large batch operations', async () => {
      // Create multiple settings quickly
      const promises = Array(20)
        .fill(null)
        .map((_, index) =>
          request(app)
            .post('/api/v1/settings')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              key: `batch_test_${index}_${Date.now()}`,
              value: `value_${index}`,
              category: 'batch',
            }),
        )

      const results = await Promise.allSettled(promises)

      // Most should succeed (rate limiting might kick in)
      const successful = results.filter(
        (result) =>
          result.status === 'fulfilled' && result.value.status === 201,
      )
      expect(successful.length).toBeGreaterThan(15) // Allow for some rate limiting
    })

    it('should handle pagination with large offsets', async () => {
      // Test very high page numbers
      const response = await request(app)
        .get('/api/v1/settings?page=1000&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.data).toEqual([])
      expect(response.body.pagination.page).toBe(1000)
    })
  })

  describe('Error Recovery & Resilience', () => {
    it('should handle database connection issues gracefully', async () => {
      // This is difficult to test without actually disconnecting the database
      // For now, we'll test with invalid operations that might cause DB errors

      // Try to create a setting with null required field (if not handled by validation)
      const response = await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          key: null,
          value: 'test',
        })

      // Should return proper error, not crash
      expect([400, 500]).toContain(response.status)
    })

    it('should maintain data consistency during failed operations', async () => {
      const setting = await settingsTestHelpers.createTestSetting(userId, {
        key: 'consistency_test',
        value: 'original',
      })

      // Try an invalid update
      await request(app)
        .put(`/api/v1/settings/${setting.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          key: '', // Invalid key
          value: 'should_not_update',
        })
        .expect(400)

      // Verify original data is unchanged
      const unchanged = await prisma.setting.findUnique({
        where: { id: setting.id },
      })
      expect(unchanged?.value).toBe('original')
    })
  })

  describe('Type Coercion & Validation', () => {
    it('should handle type mismatches in input', async () => {
      // Send numbers as strings, booleans as strings, etc.
      const response = await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          key: 123, // Number instead of string
          value: true, // Boolean instead of string
          category: ['array'], // Array instead of string
        })

      // Should either convert types or reject with proper error
      expect([201, 400]).toContain(response.status)
    })

    it('should handle null and undefined values', async () => {
      await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          key: 'null_test',
          value: null,
          category: undefined,
        })
        .expect(201) // Should handle null/undefined gracefully or reject properly
    })
  })

  describe('Visibility Edge Cases', () => {
    it('should handle visibility changes correctly', async () => {
      const setting = await settingsTestHelpers.createTestSetting(userId, {
        key: 'visibility_change_test',
        value: 'test',
        visibility: SettingVisibility.USER,
      })

      // Regular user trying to change to ADMIN visibility
      await request(app)
        .put(`/api/v1/settings/${setting.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          visibility: SettingVisibility.ADMIN,
        })
        .expect(403)

      // Admin changing user setting to ADMIN visibility
      await request(app)
        .put(`/api/v1/settings/${setting.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          visibility: SettingVisibility.ADMIN,
        })
        .expect(403) // Admin shouldn't be able to modify user's setting
    })

    it('should handle cross-visibility setting access', async () => {
      // Create settings with different visibilities owned by admin
      const adminUserSetting = await settingsTestHelpers.createTestSetting(
        adminUserId,
        {
          key: 'admin_user_setting',
          visibility: SettingVisibility.USER,
        },
      )

      const adminAdminSetting = await settingsTestHelpers.createTestSetting(
        adminUserId,
        {
          key: 'admin_admin_setting',
          visibility: SettingVisibility.ADMIN,
        },
      )

      // Regular user should not access admin's USER setting
      await request(app)
        .get(`/api/v1/settings/${adminUserSetting.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403)

      // Regular user should not access admin's ADMIN setting
      await request(app)
        .get(`/api/v1/settings/${adminAdminSetting.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403)
    })
  })
})
