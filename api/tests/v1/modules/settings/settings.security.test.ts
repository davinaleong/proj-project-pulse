import request from 'supertest'
import { createApp } from '../../../../src/app'
import { settingsTestHelpers } from './settings.helpers'
import { SettingVisibility } from '@prisma/client'

const app = createApp()

describe('Settings Security & Validation', () => {
  let authToken: string
  let userId: number
  let otherUserToken: string
  let otherUserId: number
  let adminToken: string
  let adminUserId: number
  let superAdminToken: string
  let superAdminUserId: number

  beforeAll(async () => {
    await settingsTestHelpers.cleanupDatabase()

    // Setup main test user
    const { user, authToken: token } = await settingsTestHelpers.setupTestData()
    userId = user.id
    authToken = token

    // Setup another regular user for security testing
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
  })

  afterAll(async () => {
    await settingsTestHelpers.disconnectDatabase()
  })

  describe('Authentication & Authorization', () => {
    let testSettingId: number

    beforeAll(async () => {
      const setting = await settingsTestHelpers.createTestSetting(userId, {
        key: 'security_test',
        value: 'test_value',
      })
      testSettingId = setting.id
    })

    it('should require authentication for all setting operations', async () => {
      // Test all endpoints without authentication
      await request(app).get('/api/v1/settings').expect(401)

      await request(app).post('/api/v1/settings').expect(401)

      await request(app).get(`/api/v1/settings/${testSettingId}`).expect(401)

      await request(app).put(`/api/v1/settings/${testSettingId}`).expect(401)

      await request(app).delete(`/api/v1/settings/${testSettingId}`).expect(401)

      await request(app).get('/api/v1/settings/my').expect(401)

      await request(app).get('/api/v1/settings/stats').expect(401)
    })

    it('should prevent invalid authentication tokens', async () => {
      const invalidToken = 'invalid.jwt.token'

      await request(app)
        .get('/api/v1/settings')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401)
    })

    it('should prevent expired tokens', async () => {
      // This would require a separate test setup with expired tokens
      // For now, we'll test with malformed tokens
      const malformedToken = 'Bearer malformed'

      await request(app)
        .get('/api/v1/settings')
        .set('Authorization', malformedToken)
        .expect(401)
    })
  })

  describe('Role-Based Access Control', () => {
    let userSetting: number
    let adminSetting: number
    let systemSetting: number

    beforeAll(async () => {
      // Create settings with different visibility levels
      const userSettingObj = await settingsTestHelpers.createTestSetting(
        userId,
        {
          key: 'user_visible',
          value: 'user_value',
          visibility: SettingVisibility.USER,
        },
      )
      userSetting = userSettingObj.id

      const adminSettingObj = await settingsTestHelpers.createTestSetting(
        adminUserId,
        {
          key: 'admin_visible',
          value: 'admin_value',
          visibility: SettingVisibility.ADMIN,
        },
      )
      adminSetting = adminSettingObj.id

      const systemSettingObj = await settingsTestHelpers.createTestSetting(
        superAdminUserId,
        {
          key: 'system_visible',
          value: 'system_value',
          visibility: SettingVisibility.SYSTEM,
        },
      )
      systemSetting = systemSettingObj.id
    })

    describe('USER role permissions', () => {
      it('should access own USER settings', async () => {
        await request(app)
          .get(`/api/v1/settings/${userSetting}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)
      })

      it('should NOT access ADMIN settings', async () => {
        await request(app)
          .get(`/api/v1/settings/${adminSetting}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403)
      })

      it('should NOT access SYSTEM settings', async () => {
        await request(app)
          .get(`/api/v1/settings/${systemSetting}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403)
      })

      it('should NOT create ADMIN settings', async () => {
        await request(app)
          .post('/api/v1/settings')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            key: 'user_trying_admin',
            value: 'should_fail',
            visibility: SettingVisibility.ADMIN,
          })
          .expect(403)
      })

      it('should NOT create SYSTEM settings', async () => {
        await request(app)
          .post('/api/v1/settings')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            key: 'user_trying_system',
            value: 'should_fail',
            visibility: SettingVisibility.SYSTEM,
          })
          .expect(403)
      })
    })

    describe('ADMIN role permissions', () => {
      it('should access ADMIN settings', async () => {
        await request(app)
          .get(`/api/v1/settings/${adminSetting}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
      })

      it('should NOT access SYSTEM settings', async () => {
        await request(app)
          .get(`/api/v1/settings/${systemSetting}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(403)
      })

      it('should create ADMIN settings', async () => {
        await request(app)
          .post('/api/v1/settings')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            key: 'admin_created',
            value: 'admin_value',
            visibility: SettingVisibility.ADMIN,
          })
          .expect(201)
      })

      it('should NOT create SYSTEM settings', async () => {
        await request(app)
          .post('/api/v1/settings')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            key: 'admin_trying_system',
            value: 'should_fail',
            visibility: SettingVisibility.SYSTEM,
          })
          .expect(403)
      })

      it('should access settings statistics', async () => {
        await request(app)
          .get('/api/v1/settings/stats')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
      })
    })

    describe('SUPERADMIN role permissions', () => {
      it('should access ALL settings', async () => {
        await request(app)
          .get(`/api/v1/settings/${userSetting}`)
          .set('Authorization', `Bearer ${superAdminToken}`)
          .expect(200)

        await request(app)
          .get(`/api/v1/settings/${adminSetting}`)
          .set('Authorization', `Bearer ${superAdminToken}`)
          .expect(200)

        await request(app)
          .get(`/api/v1/settings/${systemSetting}`)
          .set('Authorization', `Bearer ${superAdminToken}`)
          .expect(200)
      })

      it('should create SYSTEM settings', async () => {
        await request(app)
          .post('/api/v1/settings')
          .set('Authorization', `Bearer ${superAdminToken}`)
          .send({
            key: 'superadmin_system',
            value: 'system_value',
            visibility: SettingVisibility.SYSTEM,
          })
          .expect(201)
      })

      it('should access system settings', async () => {
        await request(app)
          .get('/api/v1/settings/system')
          .set('Authorization', `Bearer ${superAdminToken}`)
          .expect(200)
      })
    })
  })

  describe('Data Validation', () => {
    it('should validate required fields for setting creation', async () => {
      // Missing key
      await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          value: 'test_value',
        })
        .expect(400)

      // Invalid visibility
      await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          key: 'test_key',
          value: 'test_value',
          visibility: 'INVALID_VISIBILITY',
        })
        .expect(400)
    })

    it('should validate key format', async () => {
      // Empty key
      await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          key: '',
          value: 'test_value',
        })
        .expect(400)

      // Key with invalid characters (if validation exists)
      // This depends on your validation rules
    })

    it('should enforce unique keys per user', async () => {
      const settingData = {
        key: 'unique_test_key',
        value: 'first_value',
        category: 'test',
      }

      // First creation should succeed
      await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(settingData)
        .expect(201)

      // Second creation with same key should fail
      await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...settingData,
          value: 'second_value',
        })
        .expect(400)
    })

    it('should allow same key for different users', async () => {
      const settingData = {
        key: 'shared_key_name',
        value: 'user1_value',
        category: 'test',
      }

      // User 1 creates setting
      await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(settingData)
        .expect(201)

      // User 2 creates setting with same key (should succeed)
      await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          ...settingData,
          value: 'user2_value',
        })
        .expect(201)
    })
  })

  describe('Input Sanitization & Security', () => {
    it('should handle XSS attempts in setting values', async () => {
      const xssAttempt = '<script>alert("xss")</script>'

      const response = await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          key: 'xss_test',
          value: xssAttempt,
          category: 'security_test',
        })
        .expect(201)

      // The value should be stored as-is (sanitization happens on output)
      expect(response.body.data.value).toBe(xssAttempt)
    })

    it('should handle SQL injection attempts', async () => {
      const sqlInjection = "'; DROP TABLE settings; --"

      const response = await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          key: 'sql_injection_test',
          value: sqlInjection,
          category: 'security_test',
        })
        .expect(201)

      expect(response.body.data.value).toBe(sqlInjection)
    })

    it('should handle very long values', async () => {
      const longValue = 'a'.repeat(10000)

      // This should either succeed or fail gracefully with proper error
      const response = await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          key: 'long_value_test',
          value: longValue,
          category: 'test',
        })

      // Either succeeds with the long value or fails with proper error
      if (response.status === 201) {
        expect(response.body.data.value).toBe(longValue)
      } else {
        expect(response.status).toBe(400)
      }
    })
  })

  describe('Privacy & Data Protection', () => {
    it('should not expose other users settings in listings', async () => {
      // Create setting for user 1
      await settingsTestHelpers.createTestSetting(userId, {
        key: 'user1_private',
        value: 'user1_secret',
      })

      // Create setting for user 2
      await settingsTestHelpers.createTestSetting(otherUserId, {
        key: 'user2_private',
        value: 'user2_secret',
      })

      // User 1 should only see their own settings
      const response = await request(app)
        .get('/api/v1/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      const userSettings = response.body.data
      userSettings.forEach((setting: { userId: number }) => {
        expect(setting.userId).toBe(userId)
      })
    })

    it('should not allow access to other users personal settings', async () => {
      const otherUserSetting = await settingsTestHelpers.createTestSetting(
        otherUserId,
        {
          key: 'other_user_secret',
          value: 'should_not_access',
        },
      )

      await request(app)
        .get(`/api/v1/settings/${otherUserSetting.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403)
    })

    it('should prevent modification of other users settings', async () => {
      const otherUserSetting = await settingsTestHelpers.createTestSetting(
        otherUserId,
        {
          key: 'other_user_modify',
          value: 'original_value',
        },
      )

      await request(app)
        .put(`/api/v1/settings/${otherUserSetting.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ value: 'hacked_value' })
        .expect(403)

      await request(app)
        .delete(`/api/v1/settings/${otherUserSetting.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403)
    })
  })
})
