import request from 'supertest'
import { createApp } from '../../../../src/app'
import { testHelpers, prisma } from './auth.helpers'
import { UserStatus } from '@prisma/client'

const app = createApp()

describe('Auth Password', () => {
  beforeEach(async () => {
    await testHelpers.cleanupDatabase()
  })

  afterAll(async () => {
    await testHelpers.disconnectDatabase()
  })

  describe('POST /api/v1/auth/forgot-password', () => {
    beforeEach(async () => {
      // Create user
      await testHelpers.createTestUser({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'TestPassword123!',
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
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
      const user = await testHelpers.createTestUser({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'TestPassword123!',
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
      })
      userId = user.id

      // Create reset token
      resetToken = 'valid-reset-token'
      await testHelpers.createPasswordResetToken(userId, resetToken)
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
})
