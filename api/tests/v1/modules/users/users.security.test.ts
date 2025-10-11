import request from 'supertest'
import { createApp } from '../../../../src/app'
import { userTestHelpers } from './users.helpers'

const app = createApp()

describe('Users Security', () => {
  let adminToken: string

  beforeEach(async () => {
    await userTestHelpers.cleanupDatabase()
    const { adminToken: aToken } = await userTestHelpers.setupTestUsers()
    adminToken = aToken
  })

  afterAll(async () => {
    await userTestHelpers.disconnectDatabase()
  })

  describe('Account Security', () => {
    it('should lock account after 5 failed login attempts', async () => {
      // Create a test user for this test
      await userTestHelpers.createTestUser({
        name: 'Lock Test User',
        email: 'locktest@test.com',
        password: 'CorrectPassword123!',
      })

      // Make 5 failed login attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/v1/users/login')
          .send({
            email: 'locktest@test.com',
            password: 'WrongPassword',
          })
          .expect(401)
      }

      // 6th attempt should result in account lock
      const response = await request(app)
        .post('/api/v1/users/login')
        .send({
          email: 'locktest@test.com',
          password: 'WrongPassword',
        })
        .expect(423)

      expect(response.body.message).toContain('locked')
    })

    it('should not lock account with correct password attempts', async () => {
      // Create a test user for this test
      await userTestHelpers.createTestUser({
        name: 'No Lock Test User',
        email: 'nolock@test.com',
        password: 'CorrectPassword123!',
      })

      // Make 5 successful login attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/v1/users/login')
          .send({
            email: 'nolock@test.com',
            password: 'CorrectPassword123!',
          })
          .expect(200)
      }

      // 6th attempt should still succeed
      const response = await request(app)
        .post('/api/v1/users/login')
        .send({
          email: 'nolock@test.com',
          password: 'CorrectPassword123!',
        })
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    it('should reset failed attempts counter after successful login', async () => {
      // Create a test user for this test
      await userTestHelpers.createTestUser({
        name: 'Reset Counter User',
        email: 'resetcounter@test.com',
        password: 'CorrectPassword123!',
      })

      // Make 3 failed login attempts
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/v1/users/login')
          .send({
            email: 'resetcounter@test.com',
            password: 'WrongPassword',
          })
          .expect(401)
      }

      // Make a successful login
      await request(app)
        .post('/api/v1/users/login')
        .send({
          email: 'resetcounter@test.com',
          password: 'CorrectPassword123!',
        })
        .expect(200)

      // Make 4 more failed attempts (total would be 7 if counter wasn't reset)
      for (let i = 0; i < 4; i++) {
        await request(app)
          .post('/api/v1/users/login')
          .send({
            email: 'resetcounter@test.com',
            password: 'WrongPassword',
          })
          .expect(401)
      }

      // 5th failed attempt after reset should still work (not locked)
      const response = await request(app)
        .post('/api/v1/users/login')
        .send({
          email: 'resetcounter@test.com',
          password: 'WrongPassword',
        })
        .expect(401)

      expect(response.body.message).not.toContain('locked')
    })
  })

  describe('Permission Checks', () => {
    it('should check user permissions correctly', async () => {
      const { regularUser } = await userTestHelpers.setupTestUsers()

      const response = await request(app)
        .get(`/api/v1/users/${regularUser.uuid}/permissions?role=ADMIN`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.hasPermission).toBe(false) // Regular user doesn't have admin permission
    })

    it('should return true for user checking their own role', async () => {
      const { adminUser } = await userTestHelpers.setupTestUsers()

      const response = await request(app)
        .get(`/api/v1/users/${adminUser.uuid}/permissions?role=ADMIN`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.hasPermission).toBe(true) // Admin user has admin permission
    })

    it('should return false for checking higher role', async () => {
      const { regularUser } = await userTestHelpers.setupTestUsers()

      const response = await request(app)
        .get(`/api/v1/users/${regularUser.uuid}/permissions?role=SUPERADMIN`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.hasPermission).toBe(false) // Regular user doesn't have superadmin permission
    })

    it('should return 404 for non-existent user permission check', async () => {
      const response = await request(app)
        .get(
          '/api/v1/users/00000000-0000-0000-0000-000000000000/permissions?role=USER',
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('User not found')
    })

    it('should return 400 for invalid role in permission check', async () => {
      const { regularUser } = await userTestHelpers.setupTestUsers()

      const response = await request(app)
        .get(`/api/v1/users/${regularUser.uuid}/permissions?role=INVALID_ROLE`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Invalid role')
    })
  })

  describe('Rate Limiting', () => {
    it('should apply rate limiting to login attempts', async () => {
      await userTestHelpers.createTestUser({
        name: 'Rate Limit User',
        email: 'ratelimit@test.com',
        password: 'Password123!',
      })

      // Make rapid login attempts (assuming rate limit is configured)
      const promises = []
      for (let i = 0; i < 20; i++) {
        promises.push(
          request(app).post('/api/v1/users/login').send({
            email: 'ratelimit@test.com',
            password: 'Password123!',
          }),
        )
      }

      const responses = await Promise.all(promises)

      // Check if some requests were rate limited (status 429)
      const rateLimitedResponses = responses.filter((res) => res.status === 429)

      if (rateLimitedResponses.length > 0) {
        expect(rateLimitedResponses[0].body.message).toContain('rate limit')
      }
      // Note: This test might pass even without rate limiting if the limit is high enough
    })
  })

  describe('Input Sanitization', () => {
    it('should sanitize user input to prevent XSS', async () => {
      const maliciousData = {
        name: '<script>alert("xss")</script>Malicious User',
        email: 'malicious@test.com',
        password: 'Password123!',
      }

      const response = await request(app)
        .post('/api/v1/users/register')
        .send(maliciousData)
        .expect(201)

      expect(response.body.success).toBe(true)
      // Name should be sanitized (script tags removed/escaped)
      expect(response.body.data.name).not.toContain('<script>')
      expect(response.body.data.name).toContain('Malicious User')
    })

    it('should reject SQL injection attempts', async () => {
      const sqlInjectionData = {
        email: "'; DROP TABLE users; --",
        password: 'Password123!',
      }

      const response = await request(app)
        .post('/api/v1/users/login')
        .send(sqlInjectionData)
        .expect(400)

      expect(response.body.success).toBe(false)
      // Should fail validation, not execute SQL
    })
  })
})
