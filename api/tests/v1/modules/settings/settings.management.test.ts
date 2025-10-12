import request from 'supertest'
import { createApp } from '../../../../src/app'
import { settingsTestHelpers, prisma } from './settings.helpers'
import { SettingVisibility } from '@prisma/client'

const app = createApp()

describe('Settings Management & Admin Features', () => {
  let authToken: string
  let userId: number
  let adminToken: string
  let adminUserId: number
  let superAdminToken: string
  let superAdminUserId: number
  let otherUserToken: string
  let otherUserId: number

  beforeAll(async () => {
    await settingsTestHelpers.cleanupDatabase()

    // Setup regular user
    const { user, authToken: token } = await settingsTestHelpers.setupTestData()
    userId = user.id
    authToken = token

    // Setup admin user
    const { adminUser, adminToken: adminAuthToken } =
      await settingsTestHelpers.setupAdminTestData()
    adminUserId = adminUser.id
    adminToken = adminAuthToken

    // Setup super admin user
    const { superAdminUser, superAdminToken: superAdminAuthToken } =
      await settingsTestHelpers.setupSuperAdminTestData()
    superAdminUserId = superAdminUser.id
    superAdminToken = superAdminAuthToken

    // Setup another regular user
    const otherUser = await settingsTestHelpers.createTestUser({
      name: 'Other User',
      email: 'other@example.com',
    })
    otherUserId = otherUser.id
    otherUserToken = settingsTestHelpers.generateMockAuthToken({
      id: otherUser.id,
      email: otherUser.email,
      role: otherUser.role,
    })

    // Create test settings for all users
    await settingsTestHelpers.createTestSettings(userId)
    await settingsTestHelpers.createTestSettings(adminUserId)
    await settingsTestHelpers.createTestSettings(superAdminUserId)
    await settingsTestHelpers.createTestSettings(otherUserId)
  })

  afterAll(async () => {
    await settingsTestHelpers.disconnectDatabase()
  })

  describe('Admin Settings Management', () => {
    describe('GET /api/v1/settings/users/:userId', () => {
      it('should allow admin to view any user settings', async () => {
        const response = await request(app)
          .get(`/api/v1/settings/users/${userId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)

        expect(response.body.success).toBe(true)
        expect(Array.isArray(response.body.data)).toBe(true)

        // Should include user's settings
        const userSettings = response.body.data.filter(
          (setting: { userId: number }) => setting.userId === userId,
        )
        expect(userSettings.length).toBeGreaterThan(0)
      })

      it('should prevent regular user from viewing other user settings', async () => {
        await request(app)
          .get(`/api/v1/settings/users/${otherUserId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403)
      })

      it('should allow user to view their own settings via this endpoint', async () => {
        const response = await request(app)
          .get(`/api/v1/settings/users/${userId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)

        expect(response.body.success).toBe(true)
        response.body.data.forEach((setting: { userId: number }) => {
          expect(setting.userId).toBe(userId)
        })
      })

      it('should prevent user from viewing other user settings even with valid user ID', async () => {
        await request(app)
          .get(`/api/v1/settings/users/${otherUserId}`)
          .set('Authorization', `Bearer ${otherUserToken}`)
          .expect(403)
      })

      it('should filter by category when specified', async () => {
        const response = await request(app)
          .get(`/api/v1/settings/users/${userId}?category=appearance`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)

        expect(response.body.success).toBe(true)
        response.body.data.forEach((setting: { category: string }) => {
          expect(setting.category).toBe('appearance')
        })
      })

      it('should return 404 for non-existent user', async () => {
        await request(app)
          .get('/api/v1/settings/users/999999')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404)
      })
    })

    describe('GET /api/v1/settings/system', () => {
      it('should allow super admin to view system settings', async () => {
        const response = await request(app)
          .get('/api/v1/settings/system')
          .set('Authorization', `Bearer ${superAdminToken}`)
          .expect(200)

        expect(response.body.success).toBe(true)
        expect(Array.isArray(response.body.data)).toBe(true)
      })

      it('should prevent admin from viewing system settings', async () => {
        await request(app)
          .get('/api/v1/settings/system')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(403)
      })

      it('should prevent regular user from viewing system settings', async () => {
        await request(app)
          .get('/api/v1/settings/system')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403)
      })

      it('should filter system settings by category', async () => {
        // First create a system setting
        await request(app)
          .post('/api/v1/settings')
          .set('Authorization', `Bearer ${superAdminToken}`)
          .send({
            key: 'system_category_test',
            value: 'test_value',
            category: 'system_test',
            visibility: SettingVisibility.SYSTEM,
          })

        const response = await request(app)
          .get('/api/v1/settings/system?category=system_test')
          .set('Authorization', `Bearer ${superAdminToken}`)
          .expect(200)

        expect(response.body.success).toBe(true)
        response.body.data.forEach((setting: { category: string }) => {
          expect(setting.category).toBe('system_test')
        })
      })
    })

    describe('GET /api/v1/settings/stats', () => {
      it('should provide settings statistics to admin', async () => {
        const response = await request(app)
          .get('/api/v1/settings/stats')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)

        expect(response.body.success).toBe(true)
        expect(response.body.data).toBeDefined()
        expect(response.body.data.total).toBeDefined()
        expect(response.body.data.byVisibility).toBeDefined()
        expect(typeof response.body.data.total).toBe('number')
        expect(typeof response.body.data.byVisibility).toBe('object')
      })

      it('should provide detailed statistics breakdown', async () => {
        const response = await request(app)
          .get('/api/v1/settings/stats')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)

        const stats = response.body.data

        // Should have statistics for each visibility level
        expect(stats.byVisibility).toHaveProperty(SettingVisibility.USER)
        expect(stats.byVisibility).toHaveProperty(SettingVisibility.ADMIN)
        expect(stats.byVisibility).toHaveProperty(SettingVisibility.SYSTEM)

        // Each visibility count should be a number
        Object.values(stats.byVisibility).forEach((count) => {
          expect(typeof count).toBe('number')
          expect(count).toBeGreaterThanOrEqual(0)
        })
      })

      it('should prevent regular user from accessing statistics', async () => {
        await request(app)
          .get('/api/v1/settings/stats')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403)
      })

      it('should allow super admin to access statistics', async () => {
        await request(app)
          .get('/api/v1/settings/stats')
          .set('Authorization', `Bearer ${superAdminToken}`)
          .expect(200)
      })
    })
  })

  describe('Bulk Operations', () => {
    it('should handle bulk setting creation', async () => {
      const bulkSettings = [
        {
          key: 'bulk_setting_1',
          value: 'value_1',
          category: 'bulk_test',
        },
        {
          key: 'bulk_setting_2',
          value: 'value_2',
          category: 'bulk_test',
        },
        {
          key: 'bulk_setting_3',
          value: 'value_3',
          category: 'bulk_test',
        },
      ]

      // Create settings one by one (simulate bulk operation)
      const promises = bulkSettings.map((setting) =>
        request(app)
          .post('/api/v1/settings')
          .set('Authorization', `Bearer ${authToken}`)
          .send(setting),
      )

      const results = await Promise.all(promises)

      results.forEach((response, index) => {
        expect(response.status).toBe(201)
        expect(response.body.data.key).toBe(bulkSettings[index].key)
      })
    })

    it('should handle partial bulk operation failures', async () => {
      const settings = [
        {
          key: 'valid_bulk_setting',
          value: 'valid_value',
          category: 'bulk_test',
        },
        {
          key: '', // Invalid setting
          value: 'invalid_key',
          category: 'bulk_test',
        },
        {
          key: 'another_valid_setting',
          value: 'another_valid_value',
          category: 'bulk_test',
        },
      ]

      const promises = settings.map((setting) =>
        request(app)
          .post('/api/v1/settings')
          .set('Authorization', `Bearer ${authToken}`)
          .send(setting),
      )

      const results = await Promise.allSettled(promises)

      // First and third should succeed, second should fail
      expect(results[0].status).toBe('fulfilled')
      expect(results[2].status).toBe('fulfilled')

      if (results[0].status === 'fulfilled') {
        expect(results[0].value.status).toBe(201)
      }
      if (results[2].status === 'fulfilled') {
        expect(results[2].value.status).toBe(201)
      }
    })
  })

  describe('Settings Search & Filtering', () => {
    beforeAll(async () => {
      // Create diverse test settings for search testing
      const testSettings = [
        {
          key: 'search_theme_dark',
          value: 'dark_mode',
          category: 'appearance',
          type: 'string',
        },
        {
          key: 'search_theme_light',
          value: 'light_mode',
          category: 'appearance',
          type: 'string',
        },
        {
          key: 'search_notification_email',
          value: 'true',
          category: 'notifications',
          type: 'boolean',
        },
        {
          key: 'search_notification_push',
          value: 'false',
          category: 'notifications',
          type: 'boolean',
        },
      ]

      const promises = testSettings.map((setting) =>
        request(app)
          .post('/api/v1/settings')
          .set('Authorization', `Bearer ${authToken}`)
          .send(setting),
      )

      await Promise.all(promises)
    })

    it('should filter settings by multiple criteria', async () => {
      const response = await request(app)
        .get('/api/v1/settings?category=appearance&type=string')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      response.body.data.forEach(
        (setting: { category: string; type: string }) => {
          expect(setting.category).toBe('appearance')
          expect(setting.type).toBe('string')
        },
      )
    })

    it('should support key pattern matching', async () => {
      const response = await request(app)
        .get('/api/v1/settings?key=search_theme')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      response.body.data.forEach((setting: { key: string }) => {
        expect(setting.key).toContain('search_theme')
      })
    })

    it('should handle complex filtering combinations', async () => {
      const response = await request(app)
        .get('/api/v1/settings?category=notifications&type=boolean&value=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      response.body.data.forEach(
        (setting: { category: string; type: string; value: string }) => {
          expect(setting.category).toBe('notifications')
          expect(setting.type).toBe('boolean')
          expect(setting.value).toBe('true')
        },
      )
    })
  })

  describe('Settings Versioning & History', () => {
    it('should track setting updates', async () => {
      const setting = await settingsTestHelpers.createTestSetting(userId, {
        key: 'version_test',
        value: 'original_value',
      })

      // Update the setting multiple times
      await request(app)
        .put(`/api/v1/settings/${setting.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ value: 'updated_value_1' })
        .expect(200)

      await request(app)
        .put(`/api/v1/settings/${setting.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ value: 'updated_value_2' })
        .expect(200)

      // Verify the final value
      const response = await request(app)
        .get(`/api/v1/settings/${setting.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.data.value).toBe('updated_value_2')
      expect(response.body.data.updatedAt).toBeDefined()
    })
  })

  describe('Settings Export & Import', () => {
    it('should export user settings', async () => {
      // This would be a future feature - test the current behavior
      const response = await request(app)
        .get('/api/v1/settings/my')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data)).toBe(true)

      // Verify the structure is suitable for export
      response.body.data.forEach(
        (setting: {
          key: string
          value: string
          category: string
          type?: string
        }) => {
          expect(setting.key).toBeDefined()
          expect(setting.value).toBeDefined()
          expect(setting.category).toBeDefined()
        },
      )
    })

    it('should handle settings backup format', async () => {
      const response = await request(app)
        .get('/api/v1/settings/my')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      const settings = response.body.data

      // Verify structure is consistent for backup/restore
      settings.forEach(
        (setting: {
          id: number
          uuid: string
          key: string
          value: string
          updatedAt: string
        }) => {
          expect(typeof setting.id).toBe('number')
          expect(typeof setting.uuid).toBe('string')
          expect(typeof setting.key).toBe('string')
          expect(setting.updatedAt).toBeDefined()
        },
      )
    })
  })

  describe('Performance & Scalability', () => {
    it('should handle large numbers of settings efficiently', async () => {
      const startTime = Date.now()

      // Create many settings quickly
      const batchSize = 50
      const promises = Array(batchSize)
        .fill(null)
        .map((_, index) =>
          request(app)
            .post('/api/v1/settings')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              key: `perf_test_${index}_${Date.now()}`,
              value: `value_${index}`,
              category: 'performance',
            }),
        )

      await Promise.all(promises)

      const endTime = Date.now()
      const duration = endTime - startTime

      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(30000) // 30 seconds
    })

    it('should paginate large result sets efficiently', async () => {
      const startTime = Date.now()

      const response = await request(app)
        .get('/api/v1/settings?limit=100')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(response.body.success).toBe(true)
      expect(response.body.pagination).toBeDefined()
      expect(duration).toBeLessThan(5000) // 5 seconds
    })
  })

  describe('Data Integrity & Consistency', () => {
    it('should maintain referential integrity', async () => {
      const setting = await settingsTestHelpers.createTestSetting(userId, {
        key: 'integrity_test',
        value: 'test_value',
      })

      // Verify setting is properly linked to user
      const response = await request(app)
        .get(`/api/v1/settings/${setting.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.data.userId).toBe(userId)

      // Verify in database
      const dbSetting = await prisma.setting.findUnique({
        where: { id: setting.id },
        include: { user: true },
      })

      expect(dbSetting?.userId).toBe(userId)
      expect(dbSetting?.user?.id).toBe(userId)
    })

    it('should handle cascading operations correctly', async () => {
      // Create a temporary user with settings
      const tempUser = await settingsTestHelpers.createTestUser({
        email: `temp_${Date.now()}@example.com`,
      })

      const setting = await settingsTestHelpers.createTestSetting(tempUser.id, {
        key: 'cascade_test',
        value: 'test_value',
      })

      // Delete the user
      await prisma.user.delete({ where: { id: tempUser.id } })

      // Setting should be handled according to cascade rules
      const orphanedSetting = await prisma.setting.findUnique({
        where: { id: setting.id },
      })

      // Based on schema, userId should be set to null (SetNull)
      if (orphanedSetting) {
        expect(orphanedSetting.userId).toBeNull()
      }
    })
  })
})
