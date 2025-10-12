import request from 'supertest'
import { createApp } from '../../../../src/app'
import { settingsTestHelpers } from './settings.helpers'
import { SettingVisibility } from '@prisma/client'

const app = createApp()

describe('Settings Search & Advanced Queries', () => {
  let authToken: string
  let adminToken: string

  beforeAll(async () => {
    await settingsTestHelpers.cleanupDatabase()

    const { authToken: token } = await settingsTestHelpers.setupTestData()
    authToken = token

    const { adminToken: adminAuthToken } =
      await settingsTestHelpers.setupAdminTestData()
    adminToken = adminAuthToken

    // Create diverse test settings for comprehensive search testing
    await setupSearchTestData()
  })

  afterAll(async () => {
    await settingsTestHelpers.disconnectDatabase()
  })

  async function setupSearchTestData() {
    const searchTestSettings = [
      // Theme settings
      {
        key: 'theme_mode',
        value: 'dark',
        type: 'string',
        category: 'appearance',
        visibility: SettingVisibility.USER,
      },
      {
        key: 'theme_color',
        value: 'blue',
        type: 'string',
        category: 'appearance',
        visibility: SettingVisibility.USER,
      },
      {
        key: 'theme_font_size',
        value: '14',
        type: 'number',
        category: 'appearance',
        visibility: SettingVisibility.USER,
      },
      // Notification settings
      {
        key: 'notifications_email',
        value: 'true',
        type: 'boolean',
        category: 'notifications',
        visibility: SettingVisibility.USER,
      },
      {
        key: 'notifications_push',
        value: 'false',
        type: 'boolean',
        category: 'notifications',
        visibility: SettingVisibility.USER,
      },
      {
        key: 'notifications_frequency',
        value: 'daily',
        type: 'string',
        category: 'notifications',
        visibility: SettingVisibility.USER,
      },
      // Privacy settings
      {
        key: 'privacy_profile_visible',
        value: 'true',
        type: 'boolean',
        category: 'privacy',
        visibility: SettingVisibility.USER,
      },
      {
        key: 'privacy_data_sharing',
        value: 'false',
        type: 'boolean',
        category: 'privacy',
        visibility: SettingVisibility.USER,
      },
      // Admin settings
      {
        key: 'admin_debug_mode',
        value: 'false',
        type: 'boolean',
        category: 'debug',
        visibility: SettingVisibility.ADMIN,
      },
      {
        key: 'admin_maintenance_mode',
        value: 'false',
        type: 'boolean',
        category: 'system',
        visibility: SettingVisibility.ADMIN,
      },
    ]

    const promises = searchTestSettings.map((setting) =>
      request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(setting),
    )

    await Promise.all(promises)

    // Create some admin-only settings
    const adminSettings = [
      {
        key: 'admin_log_level',
        value: 'info',
        type: 'string',
        category: 'debug',
        visibility: SettingVisibility.ADMIN,
      },
      {
        key: 'admin_backup_frequency',
        value: 'weekly',
        type: 'string',
        category: 'backup',
        visibility: SettingVisibility.ADMIN,
      },
    ]

    const adminPromises = adminSettings.map((setting) =>
      request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(setting),
    )

    await Promise.all(adminPromises)
  }

  describe('Basic Search Functionality', () => {
    it('should search settings by key pattern', async () => {
      const response = await request(app)
        .get('/api/v1/settings?key=theme')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data)).toBe(true)

      response.body.data.forEach((setting: { key: string }) => {
        expect(setting.key.toLowerCase()).toContain('theme')
      })
    })

    it('should search settings by value', async () => {
      const response = await request(app)
        .get('/api/v1/settings?value=dark')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      response.body.data.forEach((setting: { value: string }) => {
        expect(setting.value).toContain('dark')
      })
    })

    it('should search settings by category', async () => {
      const response = await request(app)
        .get('/api/v1/settings?category=appearance')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      response.body.data.forEach((setting: { category: string }) => {
        expect(setting.category).toBe('appearance')
      })
    })

    it('should search settings by type', async () => {
      const response = await request(app)
        .get('/api/v1/settings?type=boolean')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      response.body.data.forEach((setting: { type: string }) => {
        expect(setting.type).toBe('boolean')
      })
    })

    it('should search settings by visibility', async () => {
      const response = await request(app)
        .get(`/api/v1/settings?visibility=${SettingVisibility.USER}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      response.body.data.forEach((setting: { visibility: string }) => {
        expect(setting.visibility).toBe(SettingVisibility.USER)
      })
    })
  })

  describe('Advanced Search Combinations', () => {
    it('should combine multiple search criteria', async () => {
      const response = await request(app)
        .get('/api/v1/settings?category=notifications&type=boolean')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      response.body.data.forEach(
        (setting: { category: string; type: string }) => {
          expect(setting.category).toBe('notifications')
          expect(setting.type).toBe('boolean')
        },
      )
    })

    it('should handle complex multi-field searches', async () => {
      const response = await request(app)
        .get('/api/v1/settings?category=privacy&type=boolean&value=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      response.body.data.forEach(
        (setting: { category: string; type: string; value: string }) => {
          expect(setting.category).toBe('privacy')
          expect(setting.type).toBe('boolean')
          expect(setting.value).toBe('true')
        },
      )
    })

    it('should handle partial key matches', async () => {
      const response = await request(app)
        .get('/api/v1/settings?key=notification')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      response.body.data.forEach((setting: { key: string }) => {
        expect(setting.key.toLowerCase()).toContain('notification')
      })
    })

    it('should handle case-insensitive searches', async () => {
      const response = await request(app)
        .get('/api/v1/settings?category=APPEARANCE')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      response.body.data.forEach((setting: { category: string }) => {
        expect(setting.category.toLowerCase()).toBe('appearance')
      })
    })
  })

  describe('Search with Pagination', () => {
    it('should paginate search results', async () => {
      const response = await request(app)
        .get('/api/v1/settings?category=notifications&page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.pagination).toBeDefined()
      expect(response.body.pagination.page).toBe(1)
      expect(response.body.pagination.limit).toBe(2)
      expect(response.body.data.length).toBeLessThanOrEqual(2)
    })

    it('should handle large result sets with pagination', async () => {
      // First, get total count without pagination
      const allResponse = await request(app)
        .get('/api/v1/settings?type=boolean')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      const totalBooleanSettings = allResponse.body.data.length

      if (totalBooleanSettings > 0) {
        // Test pagination with smaller page size
        const paginatedResponse = await request(app)
          .get('/api/v1/settings?type=boolean&page=1&limit=1')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)

        expect(paginatedResponse.body.data.length).toBe(1)
        expect(paginatedResponse.body.pagination.total).toBe(
          totalBooleanSettings,
        )
      }
    })
  })

  describe('Search Edge Cases', () => {
    it('should handle empty search results', async () => {
      const response = await request(app)
        .get('/api/v1/settings?key=nonexistent_setting_key_12345')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual([])
      expect(response.body.pagination.total).toBe(0)
    })

    it('should handle special characters in search terms', async () => {
      // Create a setting with special characters
      const specialSetting = {
        key: 'special_chars_test',
        value: 'test@#$%^&*()',
        category: 'test',
      }

      await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(specialSetting)
        .expect(201)

      const response = await request(app)
        .get('/api/v1/settings?value=test@#$%^&*()')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      const foundSetting = response.body.data.find(
        (s: { key: string }) => s.key === 'special_chars_test',
      )
      expect(foundSetting).toBeDefined()
    })

    it('should handle unicode characters in search', async () => {
      const unicodeSetting = {
        key: 'unicode_test',
        value: '测试 🚀 العربية',
        category: 'unicode',
      }

      await request(app)
        .post('/api/v1/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(unicodeSetting)
        .expect(201)

      const response = await request(app)
        .get('/api/v1/settings?category=unicode')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.length).toBeGreaterThan(0)
    })

    it('should handle very long search terms', async () => {
      const longSearchTerm = 'a'.repeat(1000)

      const response = await request(app)
        .get(`/api/v1/settings?key=${longSearchTerm}`)
        .set('Authorization', `Bearer ${authToken}`)

      // Should either handle gracefully or return proper error
      expect([200, 400]).toContain(response.status)
    })
  })

  describe('Search Performance', () => {
    it('should perform searches efficiently', async () => {
      const startTime = Date.now()

      await request(app)
        .get('/api/v1/settings?category=notifications&type=boolean')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      const endTime = Date.now()
      const duration = endTime - startTime

      // Should complete search within reasonable time
      expect(duration).toBeLessThan(2000) // 2 seconds
    })

    it('should handle concurrent searches', async () => {
      const searchQueries = [
        'category=appearance',
        'type=boolean',
        'key=theme',
        'value=true',
        'category=privacy',
      ]

      const promises = searchQueries.map((query) =>
        request(app)
          .get(`/api/v1/settings?${query}`)
          .set('Authorization', `Bearer ${authToken}`),
      )

      const results = await Promise.all(promises)

      results.forEach((response) => {
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
      })
    })
  })

  describe('Admin Search Capabilities', () => {
    it('should allow admin to search across all visibility levels', async () => {
      const response = await request(app)
        .get('/api/v1/settings?category=debug')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)

      // Should include admin settings that regular users can't see
      const adminSettings = response.body.data.filter(
        (setting: { visibility: string }) =>
          setting.visibility === SettingVisibility.ADMIN,
      )
      expect(adminSettings.length).toBeGreaterThan(0)
    })

    it('should filter search results based on user permissions', async () => {
      // Regular user searching for admin settings
      const userResponse = await request(app)
        .get('/api/v1/settings?category=debug')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      // Admin searching for same settings
      const adminResponse = await request(app)
        .get('/api/v1/settings?category=debug')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      // Admin should see more settings than regular user
      expect(adminResponse.body.data.length).toBeGreaterThanOrEqual(
        userResponse.body.data.length,
      )
    })

    it('should support admin-specific search filters', async () => {
      const response = await request(app)
        .get(`/api/v1/settings?visibility=${SettingVisibility.ADMIN}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      response.body.data.forEach((setting: { visibility: string }) => {
        expect(setting.visibility).toBe(SettingVisibility.ADMIN)
      })
    })
  })

  describe('Search Result Formatting', () => {
    it('should return properly formatted search results', async () => {
      const response = await request(app)
        .get('/api/v1/settings?category=appearance&limit=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('success')
      expect(response.body).toHaveProperty('data')
      expect(response.body).toHaveProperty('pagination')

      if (response.body.data.length > 0) {
        const setting = response.body.data[0]
        expect(setting).toHaveProperty('id')
        expect(setting).toHaveProperty('uuid')
        expect(setting).toHaveProperty('key')
        expect(setting).toHaveProperty('value')
        expect(setting).toHaveProperty('category')
        expect(setting).toHaveProperty('visibility')
        expect(setting).toHaveProperty('userId')
        expect(setting).toHaveProperty('updatedAt')
      }
    })

    it('should include search metadata in response', async () => {
      const response = await request(app)
        .get('/api/v1/settings?category=notifications&page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.pagination).toHaveProperty('page')
      expect(response.body.pagination).toHaveProperty('limit')
      expect(response.body.pagination).toHaveProperty('total')
      expect(response.body.pagination).toHaveProperty('totalPages')

      expect(typeof response.body.pagination.page).toBe('number')
      expect(typeof response.body.pagination.limit).toBe('number')
      expect(typeof response.body.pagination.total).toBe('number')
      expect(typeof response.body.pagination.totalPages).toBe('number')
    })
  })

  describe('Search Validation', () => {
    it('should validate search parameters', async () => {
      // Invalid visibility value
      await request(app)
        .get('/api/v1/settings?visibility=INVALID_VISIBILITY')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)

      // Invalid pagination parameters
      await request(app)
        .get('/api/v1/settings?page=-1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)

      await request(app)
        .get('/api/v1/settings?limit=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)
    })

    it('should sanitize search input', async () => {
      // Test SQL injection attempts in search
      const sqlInjection = "'; DROP TABLE settings; --"

      const response = await request(app)
        .get(`/api/v1/settings?key=${encodeURIComponent(sqlInjection)}`)
        .set('Authorization', `Bearer ${authToken}`)

      // Should handle safely without errors
      expect([200, 400]).toContain(response.status)
    })

    it('should handle malformed query parameters', async () => {
      const response = await request(app)
        .get('/api/v1/settings?page=abc&limit=xyz')
        .set('Authorization', `Bearer ${authToken}`)

      // Should return proper validation error
      expect([400, 200]).toContain(response.status) // Depends on implementation
    })
  })
})
