import request from 'supertest'
import { createApp } from '../../../src/app'
import { settingsTestHelpers } from '../modules/settings/settings.helpers'
import { SettingVisibility } from '@prisma/client'

const app = createApp()

describe('Settings Integration Tests', () => {
  let userToken: string
  let userId: number
  let adminToken: string
  let superAdminToken: string

  beforeAll(async () => {
    await settingsTestHelpers.cleanupDatabase()

    // Setup test users
    const { user, authToken } = await settingsTestHelpers.setupTestData()
    userId = user.id
    userToken = authToken

    const { adminToken: adminAuthToken } =
      await settingsTestHelpers.setupAdminTestData()
    adminToken = adminAuthToken

    const { superAdminToken: superAdminAuthToken } =
      await settingsTestHelpers.setupSuperAdminTestData()
    superAdminToken = superAdminAuthToken
  })

  afterAll(async () => {
    await settingsTestHelpers.disconnectDatabase()
  })

  describe('End-to-End Settings Workflow', () => {
    it('should complete full settings lifecycle as regular user', async () => {
      // 1. Create a user setting
      const createResponse = await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          key: 'e2e_user_setting',
          value: 'initial_value',
          type: 'string',
          category: 'test',
          visibility: SettingVisibility.USER,
        })
        .expect(201)

      const settingId = createResponse.body.data.id
      expect(createResponse.body.data.key).toBe('e2e_user_setting')

      // 2. Read the setting back
      const readResponse = await request(app)
        .get(`/api/v1/settings/${settingId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(readResponse.body.data.value).toBe('initial_value')

      // 3. Update the setting
      const updateResponse = await request(app)
        .put(`/api/v1/settings/${settingId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          value: 'updated_value',
          type: 'string',
        })
        .expect(200)

      expect(updateResponse.body.data.value).toBe('updated_value')

      // 4. Verify in list
      const listResponse = await request(app)
        .get('/api/v1/settings?key=e2e_user_setting')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      const foundSetting = listResponse.body.data.find(
        (s: { id: number }) => s.id === settingId,
      )
      expect(foundSetting.value).toBe('updated_value')

      // 5. Delete the setting
      await request(app)
        .delete(`/api/v1/settings/${settingId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      // 6. Verify deletion
      await request(app)
        .get(`/api/v1/settings/${settingId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404)
    })

    it('should complete admin settings workflow', async () => {
      // 1. Admin creates admin-level setting
      const createResponse = await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          key: 'e2e_admin_setting',
          value: 'admin_value',
          type: 'string',
          category: 'admin',
          visibility: SettingVisibility.ADMIN,
        })
        .expect(201)

      const settingId = createResponse.body.data.id

      // 2. Admin can read their admin setting
      await request(app)
        .get(`/api/v1/settings/${settingId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      // 3. Regular user cannot access admin setting
      await request(app)
        .get(`/api/v1/settings/${settingId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403)

      // 4. Admin can view statistics
      const statsResponse = await request(app)
        .get('/api/v1/settings/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(statsResponse.body.data.total).toBeGreaterThan(0)

      // 5. Regular user cannot view statistics
      await request(app)
        .get('/api/v1/settings/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403)
    })

    it('should complete super admin system settings workflow', async () => {
      // 1. Super admin creates system setting
      const createResponse = await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          key: 'e2e_system_setting',
          value: 'system_value',
          type: 'string',
          category: 'system',
          visibility: SettingVisibility.SYSTEM,
        })
        .expect(201)

      const settingId = createResponse.body.data.id

      // 2. Super admin can access system settings
      await request(app)
        .get('/api/v1/settings/system')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200)

      // 3. Admin cannot access system settings
      await request(app)
        .get('/api/v1/settings/system')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403)

      // 4. Regular user cannot access system settings
      await request(app)
        .get('/api/v1/settings/system')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403)

      // 5. Only super admin can read system setting
      await request(app)
        .get(`/api/v1/settings/${settingId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200)

      await request(app)
        .get(`/api/v1/settings/${settingId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403)
    })
  })

  describe('Cross-Module Integration', () => {
    it('should integrate with user authentication properly', async () => {
      // Test with different auth states
      const settingData = {
        key: 'auth_integration_test',
        value: 'test_value',
        category: 'test',
      }

      // 1. Unauthenticated request should fail
      await request(app).post('/api/v1/settings').send(settingData).expect(401)

      // 2. Authenticated request should succeed
      await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${userToken}`)
        .send(settingData)
        .expect(201)

      // 3. Invalid token should fail
      await request(app)
        .post('/api/v1/settings')
        .set('Authorization', 'Bearer invalid_token')
        .send(settingData)
        .expect(401)
    })

    it('should properly handle user context and ownership', async () => {
      // Create settings for different users
      const user1Setting = await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          key: 'user1_exclusive',
          value: 'user1_value',
          category: 'test',
        })
        .expect(201)

      const user1SettingId = user1Setting.body.data.id

      const admin1Setting = await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          key: 'admin1_exclusive',
          value: 'admin1_value',
          category: 'test',
        })
        .expect(201)

      const admin1SettingId = admin1Setting.body.data.id

      // Users should only see their own settings in listings
      const userListResponse = await request(app)
        .get('/api/v1/settings')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      userListResponse.body.data.forEach((setting: { userId: number }) => {
        expect(setting.userId).toBe(userId)
      })

      // Users should not access other users' settings
      await request(app)
        .get(`/api/v1/settings/${admin1SettingId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403)

      // But should access their own
      await request(app)
        .get(`/api/v1/settings/${user1SettingId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
    })
  })

  describe('Performance and Scalability', () => {
    it('should handle concurrent operations from multiple users', async () => {
      const concurrentOperations = Array(10)
        .fill(null)
        .map(async (_, index) => {
          // Create setting
          const createResponse = await request(app)
            .post('/api/v1/settings')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
              key: `concurrent_test_${index}_${Date.now()}`,
              value: `value_${index}`,
              category: 'concurrent',
            })

          if (createResponse.status === 201) {
            const settingId = createResponse.body.data.id

            // Update setting
            await request(app)
              .put(`/api/v1/settings/${settingId}`)
              .set('Authorization', `Bearer ${userToken}`)
              .send({
                value: `updated_value_${index}`,
              })

            // Read setting
            await request(app)
              .get(`/api/v1/settings/${settingId}`)
              .set('Authorization', `Bearer ${userToken}`)

            return settingId
          }
          return null
        })

      const results = await Promise.allSettled(concurrentOperations)

      // Most operations should succeed
      const successful = results.filter(
        (result) => result.status === 'fulfilled' && result.value !== null,
      )
      expect(successful.length).toBeGreaterThan(7) // Allow for some failures due to timing
    })

    it('should handle large datasets efficiently', async () => {
      // Create many settings
      const batchSize = 20
      const promises = Array(batchSize)
        .fill(null)
        .map((_, index) =>
          request(app)
            .post('/api/v1/settings')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
              key: `large_dataset_${index}_${Date.now()}`,
              value: `value_${index}`,
              category: 'performance',
            }),
        )

      await Promise.all(promises)

      // Test pagination performance
      const startTime = Date.now()

      const response = await request(app)
        .get('/api/v1/settings?category=performance&limit=50')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      const endTime = Date.now()

      expect(response.body.data.length).toBeGreaterThan(0)
      expect(endTime - startTime).toBeLessThan(5000) // Should complete within 5 seconds
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should maintain data consistency during errors', async () => {
      // Create a valid setting
      const createResponse = await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          key: 'error_handling_test',
          value: 'original_value',
          category: 'test',
        })
        .expect(201)

      const settingId = createResponse.body.data.id

      // Try invalid update
      await request(app)
        .put(`/api/v1/settings/${settingId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          key: '', // Invalid update
        })
        .expect(400)

      // Verify original data is intact
      const verifyResponse = await request(app)
        .get(`/api/v1/settings/${settingId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(verifyResponse.body.data.value).toBe('original_value')
      expect(verifyResponse.body.data.key).toBe('error_handling_test')
    })

    it('should handle partial failures gracefully', async () => {
      const operations = [
        // Valid operation
        {
          type: 'create',
          data: {
            key: 'partial_failure_valid',
            value: 'valid_value',
            category: 'test',
          },
          expectedStatus: 201,
        },
        // Invalid operation
        {
          type: 'create',
          data: {
            key: '', // Invalid
            value: 'invalid_value',
            category: 'test',
          },
          expectedStatus: 400,
        },
        // Another valid operation
        {
          type: 'create',
          data: {
            key: 'partial_failure_valid_2',
            value: 'valid_value_2',
            category: 'test',
          },
          expectedStatus: 201,
        },
      ]

      const results = await Promise.allSettled(
        operations.map((op) =>
          request(app)
            .post('/api/v1/settings')
            .set('Authorization', `Bearer ${userToken}`)
            .send(op.data),
        ),
      )

      // Check that valid operations succeeded and invalid failed
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          expect(result.value.status).toBe(operations[index].expectedStatus)
        }
      })
    })
  })

  describe('Real-world Usage Scenarios', () => {
    it('should support user preference management workflow', async () => {
      // Simulate user setting up their preferences
      const preferences = [
        { key: 'theme', value: 'dark', category: 'appearance' },
        { key: 'language', value: 'en', category: 'localization' },
        { key: 'timezone', value: 'UTC', category: 'localization' },
        {
          key: 'notifications_email',
          value: 'true',
          category: 'notifications',
        },
        {
          key: 'notifications_push',
          value: 'false',
          category: 'notifications',
        },
      ]

      // Create all preferences
      const createPromises = preferences.map((pref) =>
        request(app)
          .post('/api/v1/settings')
          .set('Authorization', `Bearer ${userToken}`)
          .send(pref),
      )

      const createResults = await Promise.all(createPromises)
      createResults.forEach((result) => {
        expect(result.status).toBe(201)
      })

      // Get user's preferences grouped by category
      const appearanceResponse = await request(app)
        .get('/api/v1/settings?category=appearance')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      const localizationResponse = await request(app)
        .get('/api/v1/settings?category=localization')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      const notificationsResponse = await request(app)
        .get('/api/v1/settings?category=notifications')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(appearanceResponse.body.data.length).toBe(1)
      expect(localizationResponse.body.data.length).toBe(2)
      expect(notificationsResponse.body.data.length).toBe(2)

      // Update theme preference
      const themeSettingId = appearanceResponse.body.data[0].id
      await request(app)
        .put(`/api/v1/settings/${themeSettingId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ value: 'light' })
        .expect(200)

      // Verify update
      const updatedThemeResponse = await request(app)
        .get(`/api/v1/settings/${themeSettingId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(updatedThemeResponse.body.data.value).toBe('light')
    })

    it('should support admin configuration management', async () => {
      // Admin sets up system configurations
      const configs = [
        {
          key: 'max_upload_size',
          value: '10MB',
          category: 'limits',
          visibility: SettingVisibility.ADMIN,
        },
        {
          key: 'session_timeout',
          value: '3600',
          category: 'security',
          visibility: SettingVisibility.ADMIN,
        },
        {
          key: 'rate_limit',
          value: '100',
          category: 'security',
          visibility: SettingVisibility.ADMIN,
        },
      ]

      const createPromises = configs.map((config) =>
        request(app)
          .post('/api/v1/settings')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(config),
      )

      await Promise.all(createPromises)

      // Admin views all admin settings
      const adminSettingsResponse = await request(app)
        .get(`/api/v1/settings?visibility=${SettingVisibility.ADMIN}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(adminSettingsResponse.body.data.length).toBeGreaterThanOrEqual(3)

      // Admin views statistics
      const statsResponse = await request(app)
        .get('/api/v1/settings/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(statsResponse.body.data.byVisibility.ADMIN).toBeGreaterThan(0)

      // Regular user cannot see admin settings
      const userSettingsResponse = await request(app)
        .get(`/api/v1/settings?visibility=${SettingVisibility.ADMIN}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      // Should return empty array or filtered results
      const adminSettingsVisibleToUser = userSettingsResponse.body.data.filter(
        (setting: { visibility: string }) =>
          setting.visibility === SettingVisibility.ADMIN,
      )
      expect(adminSettingsVisibleToUser.length).toBe(0)
    })
  })
})
