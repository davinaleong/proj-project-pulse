import request from 'supertest'
import { createApp } from '../../../../src/app'
import { userTestHelpers, prisma } from './users.helpers'
import { User } from '@prisma/client'

const app = createApp()

describe('Users Password Reset', () => {
  beforeEach(async () => {
    await userTestHelpers.cleanupDatabase()
  })

  afterAll(async () => {
    await userTestHelpers.disconnectDatabase()
  })

  describe('POST /api/v1/users/forgot-password', () => {
    beforeEach(async () => {
      await userTestHelpers.createAdminUser()
    })

    it('should create password reset token', async () => {
      const response = await request(app)
        .post('/api/v1/users/forgot-password')
        .send({ email: 'admin@test.com' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Password reset email sent')

      // In development, token should be returned
      if (process.env.NODE_ENV === 'development') {
        expect(response.body.data.token).toBeDefined()
      }
    })

    it('should not reveal if email does not exist', async () => {
      const response = await request(app)
        .post('/api/v1/users/forgot-password')
        .send({ email: 'nonexistent@test.com' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe(
        'If the email exists, a password reset link has been sent',
      )
    })

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/users/forgot-password')
        .send({ email: 'invalid-email' })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Validation failed')
    })

    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/v1/users/forgot-password')
        .send({})
        .expect(400)

      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /api/v1/users/reset-password', () => {
    let resetToken: string
    let user: User

    beforeEach(async () => {
      user = await userTestHelpers.createAdminUser()
      resetToken = 'test-reset-token'
      await userTestHelpers.createPasswordResetToken(user.id, resetToken)
    })

    it('should reset password with valid token', async () => {
      const resetData = {
        token: resetToken,
        password: 'ResetPassword123!',
        confirmPassword: 'ResetPassword123!',
      }

      const response = await request(app)
        .post('/api/v1/users/reset-password')
        .send(resetData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Password reset successfully')

      // Verify new password works
      const loginResponse = await request(app)
        .post('/api/v1/users/login')
        .send({
          email: 'admin@test.com',
          password: 'ResetPassword123!',
        })
        .expect(200)

      expect(loginResponse.body.success).toBe(true)

      // Verify token is marked as used
      const usedToken = await prisma.passwordResetToken.findFirst({
        where: { token: resetToken },
      })
      expect(usedToken?.usedAt).toBeDefined()
    })

    it('should return 400 for invalid token', async () => {
      const resetData = {
        token: 'invalid-token',
        password: 'NewPassword123!',
        confirmPassword: 'NewPassword123!',
      }

      const response = await request(app)
        .post('/api/v1/users/reset-password')
        .send(resetData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Invalid or expired reset token')
    })

    it('should return 400 for mismatched passwords', async () => {
      const resetData = {
        token: resetToken,
        password: 'NewPassword123!',
        confirmPassword: 'DifferentPassword123!',
      }

      const response = await request(app)
        .post('/api/v1/users/reset-password')
        .send(resetData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Validation failed')
    })

    it('should return 400 for weak password', async () => {
      const resetData = {
        token: resetToken,
        password: '123',
        confirmPassword: '123',
      }

      const response = await request(app)
        .post('/api/v1/users/reset-password')
        .send(resetData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Validation failed')
    })

    it('should return 400 for expired token', async () => {
      // Create an expired token
      const expiredToken = 'expired-token'
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: expiredToken,
          expiresAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        },
      })

      const resetData = {
        token: expiredToken,
        password: 'NewPassword123!',
        confirmPassword: 'NewPassword123!',
      }

      const response = await request(app)
        .post('/api/v1/users/reset-password')
        .send(resetData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Invalid or expired reset token')
    })

    it('should return 400 for already used token', async () => {
      // Mark token as used
      await prisma.passwordResetToken.update({
        where: { token: resetToken },
        data: { usedAt: new Date() },
      })

      const resetData = {
        token: resetToken,
        password: 'NewPassword123!',
        confirmPassword: 'NewPassword123!',
      }

      const response = await request(app)
        .post('/api/v1/users/reset-password')
        .send(resetData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Invalid or expired reset token')
    })
  })
})
