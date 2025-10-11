import request from 'supertest'
import { createApp } from '../../../../src/app'
import { testHelpers, prisma } from './auth.helpers'
import { UserStatus } from '@prisma/client'

const app = createApp()

describe('Auth Login', () => {
  beforeEach(async () => {
    await testHelpers.cleanupDatabase()
  })

  afterAll(async () => {
    await testHelpers.disconnectDatabase()
  })

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Create a verified user for login tests
      await testHelpers.createTestUser({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'TestPassword123!',
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
      })
    })

    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'john@example.com',
        password: 'TestPassword123!',
      }

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Login successful')
      expect(response.body.data).toHaveProperty('user')
      expect(response.body.data).toHaveProperty('tokens')
      expect(response.body.data.tokens).toHaveProperty('accessToken')
      expect(response.body.data.tokens).toHaveProperty('refreshToken')
      expect(response.body.data.user).not.toHaveProperty('password')
    })

    it('should reject login with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'TestPassword123!',
      }

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Invalid email or password')
    })

    it('should reject login with invalid password', async () => {
      const loginData = {
        email: 'john@example.com',
        password: 'WrongPassword123!',
      }

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Invalid email or password')
    })

    it('should reject login for banned user', async () => {
      // Update user status to banned
      await prisma.user.update({
        where: { email: 'john@example.com' },
        data: { status: UserStatus.BANNED },
      })

      const loginData = {
        email: 'john@example.com',
        password: 'TestPassword123!',
      }

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Account has been banned')
    })

    it('should handle account lockout after failed attempts', async () => {
      const loginData = {
        email: 'john@example.com',
        password: 'WrongPassword',
      }

      // Make 5 failed login attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/v1/auth/login')
          .send(loginData)
          .expect(400)
      }

      // Try with correct password - should be locked
      const correctLogin = {
        email: 'john@example.com',
        password: 'TestPassword123!',
      }

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(correctLogin)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('locked')
    })
  })
})
