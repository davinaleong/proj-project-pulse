import request from 'supertest'
import { createApp } from '../../../../src/app'
import { settingsTestHelpers, prisma } from './settings.helpers'
import { SettingVisibility } from '@prisma/client'

const app = createApp()

describe('Settings CRUD Operations', () => {
  let authToken: string
  let userId: number
  let adminToken: string
  let adminUserId: number
  let superAdminToken: string
  let superAdminUserId: number

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
  })

  afterAll(async () => {
    await settingsTestHelpers.disconnectDatabase()
  })

  describe('POST /api/v1/settings', () => {
    it('should create a new user setting successfully', async () => {
      const settingData = {
        key: 'theme',
        value: 'dark',
        type: 'string',
        category: 'appearance',
        visibility: SettingVisibility.USER,
      }

      const response = await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(settingData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.key).toBe(settingData.key)
      expect(response.body.data.value).toBe(settingData.value)
      expect(response.body.data.type).toBe(settingData.type)
      expect(response.body.data.category).toBe(settingData.category)
      expect(response.body.data.visibility).toBe(settingData.visibility)
      expect(response.body.data.userId).toBe(userId)
      expect(response.body.data.uuid).toBeDefined()
    })

    it('should create admin setting when user is admin', async () => {
      const settingData = {
        key: 'admin_feature',
        value: 'enabled',
        type: 'boolean',
        category: 'admin',
        visibility: SettingVisibility.ADMIN,
      }

      const response = await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(settingData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.visibility).toBe(SettingVisibility.ADMIN)
      expect(response.body.data.userId).toBe(adminUserId)
    })

    it('should create system setting when user is super admin', async () => {
      const settingData = {
        key: 'system_config',
        value: 'production',
        type: 'string',
        category: 'system',
        visibility: SettingVisibility.SYSTEM,
      }

      const response = await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(settingData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.visibility).toBe(SettingVisibility.SYSTEM)
      expect(response.body.data.userId).toBe(superAdminUserId)
    })

    it('should prevent regular user from creating admin settings', async () => {
      const settingData = {
        key: 'admin_only',
        value: 'test',
        visibility: SettingVisibility.ADMIN,
      }

      await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(settingData)
        .expect(403)
    })

    it('should prevent regular user from creating system settings', async () => {
      const settingData = {
        key: 'system_only',
        value: 'test',
        visibility: SettingVisibility.SYSTEM,
      }

      await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(settingData)
        .expect(403)
    })

    it('should prevent admin from creating system settings', async () => {
      const settingData = {
        key: 'system_only_admin_try',
        value: 'test',
        visibility: SettingVisibility.SYSTEM,
      }

      await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(settingData)
        .expect(403)
    })

    it('should validate required fields', async () => {
      await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400)
    })

    it('should validate key uniqueness per user', async () => {
      const settingData = {
        key: 'duplicate_key',
        value: 'first',
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
        .send({ ...settingData, value: 'second' })
        .expect(400)
    })
  })

  describe('GET /api/v1/settings', () => {
    beforeAll(async () => {
      // Create test settings for different users and visibility levels
      await settingsTestHelpers.createTestSettings(userId)
      await settingsTestHelpers.createTestSettings(adminUserId)
    })

    it('should get user settings with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(response.body.pagination).toBeDefined()
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    it('should filter settings by category', async () => {
      const response = await request(app)
        .get('/api/v1/settings?category=appearance')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      response.body.data.forEach((setting: { category: string }) => {
        expect(setting.category).toBe('appearance')
      })
    })

    it('should filter settings by visibility', async () => {
      const response = await request(app)
        .get(`/api/v1/settings?visibility=${SettingVisibility.USER}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      response.body.data.forEach((setting: { visibility: string }) => {
        expect(setting.visibility).toBe(SettingVisibility.USER)
      })
    })

    it('should support pagination parameters', async () => {
      const response = await request(app)
        .get('/api/v1/settings?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.pagination.page).toBe(1)
      expect(response.body.pagination.limit).toBe(2)
      expect(response.body.data.length).toBeLessThanOrEqual(2)
    })
  })

  describe('GET /api/v1/settings/:id', () => {
    let testSettingId: number

    beforeAll(async () => {
      const setting = await settingsTestHelpers.createTestSetting(userId, {
        key: 'get_by_id_test',
        value: 'test_value',
      })
      testSettingId = setting.id
    })

    it('should get setting by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/settings/${testSettingId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.id).toBe(testSettingId)
      expect(response.body.data.key).toBe('get_by_id_test')
    })

    it('should return 404 for non-existent setting', async () => {
      await request(app)
        .get('/api/v1/settings/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)
    })

    it('should prevent access to other users settings', async () => {
      const otherUserSetting = await settingsTestHelpers.createTestSetting(
        adminUserId,
        { key: 'other_user_setting' },
      )

      await request(app)
        .get(`/api/v1/settings/${otherUserSetting.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403)
    })
  })

  describe('PUT /api/v1/settings/:id', () => {
    let testSettingId: number

    beforeEach(async () => {
      const setting = await settingsTestHelpers.createTestSetting(userId, {
        key: 'update_test',
        value: 'original_value',
      })
      testSettingId = setting.id
    })

    it('should update setting successfully', async () => {
      const updateData = {
        value: 'updated_value',
        type: 'string',
        category: 'updated_category',
      }

      const response = await request(app)
        .put(`/api/v1/settings/${testSettingId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.value).toBe(updateData.value)
      expect(response.body.data.category).toBe(updateData.category)
    })

    it('should prevent updating other users settings', async () => {
      const otherUserSetting = await settingsTestHelpers.createTestSetting(
        adminUserId,
        { key: 'other_user_update' },
      )

      await request(app)
        .put(`/api/v1/settings/${otherUserSetting.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ value: 'hacked' })
        .expect(403)
    })

    it('should return 404 for non-existent setting', async () => {
      await request(app)
        .put('/api/v1/settings/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ value: 'test' })
        .expect(404)
    })
  })

  describe('DELETE /api/v1/settings/:id', () => {
    let testSettingId: number

    beforeEach(async () => {
      const setting = await settingsTestHelpers.createTestSetting(userId, {
        key: 'delete_test',
        value: 'to_be_deleted',
      })
      testSettingId = setting.id
    })

    it('should delete setting successfully', async () => {
      await request(app)
        .delete(`/api/v1/settings/${testSettingId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      // Verify setting is deleted
      const deletedSetting = await prisma.setting.findUnique({
        where: { id: testSettingId },
      })
      expect(deletedSetting).toBeNull()
    })

    it('should prevent deleting other users settings', async () => {
      const otherUserSetting = await settingsTestHelpers.createTestSetting(
        adminUserId,
        { key: 'other_user_delete' },
      )

      await request(app)
        .delete(`/api/v1/settings/${otherUserSetting.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403)
    })

    it('should return 404 for non-existent setting', async () => {
      await request(app)
        .delete('/api/v1/settings/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)
    })
  })
})
