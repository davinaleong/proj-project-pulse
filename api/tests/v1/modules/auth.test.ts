import request from 'supertest'
import { createApp } from '../../../src/app'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const app = createApp()
const prisma = new PrismaClient()

describe('Auth Module', () => {
  beforeEach(async () => {
    // Clean up database
    await prisma.passwordResetToken.deleteMany()
    await prisma.session.deleteMany()
    await prisma.profile.deleteMany()
    await prisma.user.deleteMany()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
      }

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('Registration successful')
      expect(response.body.data).toHaveProperty('email', userData.email)
      expect(response.body.data).toHaveProperty('name', userData.name)
      expect(response.body.data).not.toHaveProperty('password')
    })

    it('should reject registration with invalid email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
      }

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Validation failed')
      expect(response.body.error).toBeDefined()
    })

    it('should reject registration with weak password', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: '123',
        confirmPassword: '123',
      }

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Validation failed')
    })

    it('should reject registration with mismatched passwords', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'TestPassword123!',
        confirmPassword: 'DifferentPassword123!',
      }

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Validation failed')
    })

    it('should reject registration with duplicate email', async () => {
      // Create a user first
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
      }

      await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201)

      // Try to register with same email
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('already exists')
    })
  })

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Create a verified user for login tests
      const hashedPassword = await bcrypt.hash('TestPassword123!', 12)
      await prisma.user.create({
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          password: hashedPassword,
          status: 'ACTIVE',
          emailVerifiedAt: new Date(),
        },
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
        data: { status: 'BANNED' },
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

  describe('POST /api/v1/auth/refresh', () => {
    let refreshToken: string

    beforeEach(async () => {
      // Create user and get tokens
      const hashedPassword = await bcrypt.hash('TestPassword123!', 12)
      await prisma.user.create({
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          password: hashedPassword,
          status: 'ACTIVE',
          emailVerifiedAt: new Date(),
        },
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
      const hashedPassword = await bcrypt.hash('TestPassword123!', 12)
      await prisma.user.create({
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          password: hashedPassword,
          status: 'ACTIVE',
          emailVerifiedAt: new Date(),
        },
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
      const hashedPassword = await bcrypt.hash('TestPassword123!', 12)
      await prisma.user.create({
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          password: hashedPassword,
          status: 'ACTIVE',
          emailVerifiedAt: new Date(),
        },
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

  describe('POST /api/v1/auth/forgot-password', () => {
    beforeEach(async () => {
      // Create user
      const hashedPassword = await bcrypt.hash('TestPassword123!', 12)
      await prisma.user.create({
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          password: hashedPassword,
          status: 'ACTIVE',
          emailVerifiedAt: new Date(),
        },
      })
    })

    it('should handle forgot password request', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'john@example.com' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('password reset link')
    })

    it('should handle forgot password for non-existent email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('password reset link')
    })

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'invalid-email' })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Validation failed')
    })
  })

  describe('POST /api/v1/auth/reset-password', () => {
    let resetToken: string
    let userId: number

    beforeEach(async () => {
      // Create user
      const hashedPassword = await bcrypt.hash('TestPassword123!', 12)
      const user = await prisma.user.create({
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          password: hashedPassword,
          status: 'ACTIVE',
          emailVerifiedAt: new Date(),
        },
      })
      userId = user.id

      // Create reset token
      resetToken = 'valid-reset-token'
      await prisma.passwordResetToken.create({
        data: {
          userId,
          token: resetToken,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      })
    })

    it('should reset password successfully', async () => {
      const resetData = {
        token: resetToken,
        password: 'NewPassword123!',
        confirmPassword: 'NewPassword123!',
      }

      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send(resetData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Password has been reset successfully')

      // Verify token is marked as used
      const token = await prisma.passwordResetToken.findFirst({
        where: { token: resetToken },
      })
      expect(token?.usedAt).toBeDefined()
    })

    it('should reject invalid reset token', async () => {
      const resetData = {
        token: 'invalid-token',
        password: 'NewPassword123!',
        confirmPassword: 'NewPassword123!',
      }

      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send(resetData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Invalid or expired reset token')
    })

    it('should reject mismatched passwords', async () => {
      const resetData = {
        token: resetToken,
        password: 'NewPassword123!',
        confirmPassword: 'DifferentPassword123!',
      }

      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send(resetData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Validation failed')
    })
  })

  describe('POST /api/v1/auth/verify-email', () => {
    let verificationToken: string
    let userId: number

    beforeEach(async () => {
      // Create unverified user
      const hashedPassword = await bcrypt.hash('TestPassword123!', 12)
      const user = await prisma.user.create({
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          password: hashedPassword,
          status: 'PENDING',
        },
      })
      userId = user.id

      // Create verification token
      verificationToken = 'valid-verification-token'
      await prisma.passwordResetToken.create({
        data: {
          userId,
          token: verificationToken,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      })
    })

    it('should verify email successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ token: verificationToken })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Email has been verified successfully')

      // Verify user status is updated
      const user = await prisma.user.findUnique({ where: { id: userId } })
      expect(user?.status).toBe('ACTIVE')
      expect(user?.emailVerifiedAt).toBeDefined()
    })

    it('should reject invalid verification token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ token: 'invalid-token' })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe(
        'Invalid or expired verification token',
      )
    })
  })
})
