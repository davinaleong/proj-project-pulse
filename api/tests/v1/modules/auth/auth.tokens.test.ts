import request from 'supertest'
import { createApp } from '../../../../src/app'
import { testHelpers } from './auth.helpers'
import { UserStatus } from '@prisma/client'

const app = createApp()

describe('Auth Tokens', () => {
  beforeEach(async () => {
    await testHelpers.cleanupDatabase()
  })

  afterAll(async () => {
    await testHelpers.disconnectDatabase()
  })

  describe('POST /api/v1/auth/refresh', () => {
    let refreshToken: string

    beforeEach(async () => {
      // Create user and get tokens
      await testHelpers.createTestUser({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'TestPassword123!',
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
      })

      const loginResponse = await request(app).post('/api/v1/auth/login').send({
        email: 'john@example.com',
        password: 'TestPassword123!',
      })

      refreshToken = loginResponse.body.data.tokens.refreshToken
    })

    it('should refresh tokens successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Token refreshed successfully')
      expect(response.body.data.tokens).toHaveProperty('accessToken')
      expect(response.body.data.tokens).toHaveProperty('refreshToken')
    })

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Invalid refresh token')
    })
  })

  describe('GET /api/v1/auth/me', () => {
    let accessToken: string

    beforeEach(async () => {
      // Create user and get tokens
      await testHelpers.createTestUser({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'TestPassword123!',
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
      })

      const loginResponse = await request(app).post('/api/v1/auth/login').send({
        email: 'john@example.com',
        password: 'TestPassword123!',
      })

      accessToken = loginResponse.body.data.tokens.accessToken
    })

    it('should get current user info', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('User retrieved successfully')
      expect(response.body.data).toHaveProperty('email', 'john@example.com')
      expect(response.body.data).not.toHaveProperty('password')
    })

    it('should reject request without token', async () => {
      const response = await request(app).get('/api/v1/auth/me').expect(401)

      expect(response.body.success).toBe(false)
    })

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)

      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /api/v1/auth/logout', () => {
    let accessToken: string

    beforeEach(async () => {
      // Create user and get tokens
      await testHelpers.createTestUser({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'TestPassword123!',
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
      })

      const loginResponse = await request(app).post('/api/v1/auth/login').send({
        email: 'john@example.com',
        password: 'TestPassword123!',
      })

      accessToken = loginResponse.body.data.tokens.accessToken
    })

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Logout successful')
    })

    it('should reject logout without token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('No access token provided')
    })
  })
})
