import request from 'supertest'
import { createApp } from '../../../../src/app'
import { passwordResetTestHelpers } from './passwordResets.helpers'
import { Application } from 'express'

describe('Password Reset CRUD Operations', () => {
  let app: Application

  beforeAll(async () => {
    app = createApp()
  })

  beforeEach(async () => {
    await passwordResetTestHelpers.cleanupDatabase()
  })

  afterAll(async () => {
    await passwordResetTestHelpers.cleanupDatabase()
  })

  describe('POST /api/v1/password-resets/request', () => {
    it('should create a password reset request for valid email', async () => {
      // Create a test user
      const user = await passwordResetTestHelpers.createTestUser({
        email: 'user@example.com',
      })

      const response = await request(app)
        .post('/api/v1/password-resets/request')
        .send({
          email: 'user@example.com',
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('password reset link')

      // In development mode, token should be returned
      if (process.env.NODE_ENV === 'development') {
        expect(response.body.token).toBeDefined()
        expect(typeof response.body.token).toBe('string')
        expect(response.body.token.length).toBe(64) // 32 bytes in hex
      }

      // Verify token was created in database
      const tokenCount =
        await passwordResetTestHelpers.countUserPasswordResetTokens(user.id)
      expect(tokenCount).toBe(1)
    })

    it('should handle non-existent email gracefully', async () => {
      const response = await request(app)
        .post('/api/v1/password-resets/request')
        .send({
          email: 'nonexistent@example.com',
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain(
        'If an account with that email exists',
      )

      // No token should be created
      const tokenCount =
        await passwordResetTestHelpers.countPasswordResetTokens()
      expect(tokenCount).toBe(0)
    })

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/v1/password-resets/request')
        .send({
          email: 'invalid-email',
        })
        .expect(400)

      expect(response.body.error).toBe('Validation failed')
      expect(response.body.details).toBeDefined()
      expect(Array.isArray(response.body.details)).toBe(true)
    })

    it('should enforce rate limiting', async () => {
      const user = await passwordResetTestHelpers.createTestUser({
        email: 'ratelimit@example.com',
      })

      // Create 3 recent reset attempts (within 1 hour)
      await passwordResetTestHelpers.createMultipleResetAttempts(user.id, 3)

      const response = await request(app)
        .post('/api/v1/password-resets/request')
        .send({
          email: 'ratelimit@example.com',
        })
        .expect(400)

      expect(response.body.error).toContain('Too many password reset attempts')
    })

    it('should delete existing tokens when creating new one', async () => {
      const user = await passwordResetTestHelpers.createTestUser({
        email: 'replace@example.com',
      })

      // Create an existing token
      await passwordResetTestHelpers.createPasswordResetToken(user.id)

      let tokenCount =
        await passwordResetTestHelpers.countUserPasswordResetTokens(user.id)
      expect(tokenCount).toBe(1)

      // Request another reset
      await request(app)
        .post('/api/v1/password-resets/request')
        .send({
          email: 'replace@example.com',
        })
        .expect(200)

      // Should still have only 1 token (old one replaced)
      tokenCount = await passwordResetTestHelpers.countUserPasswordResetTokens(
        user.id,
      )
      expect(tokenCount).toBe(1)
    })
  })

  describe('POST /api/v1/password-resets/verify', () => {
    it('should verify valid token', async () => {
      const user = await passwordResetTestHelpers.createTestUser({
        email: 'verify@example.com',
      })
      const resetToken =
        await passwordResetTestHelpers.createPasswordResetToken(user.id)

      const response = await request(app)
        .post('/api/v1/password-resets/verify')
        .send({
          token: resetToken.token,
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.valid).toBe(true)
      expect(response.body.user).toBeDefined()
      expect(response.body.user.email).toBe('verify@example.com')
      expect(response.body.user.name).toBe('Test User')
    })

    it('should reject invalid token', async () => {
      const response = await request(app)
        .post('/api/v1/password-resets/verify')
        .send({
          token: 'invalid-token',
        })
        .expect(400)

      expect(response.body.error).toBe('Invalid or expired reset token')
    })

    it('should reject expired token', async () => {
      const user = await passwordResetTestHelpers.createTestUser()
      const expiredToken = await passwordResetTestHelpers.createExpiredToken(
        user.id,
      )

      const response = await request(app)
        .post('/api/v1/password-resets/verify')
        .send({
          token: expiredToken.token,
        })
        .expect(400)

      expect(response.body.error).toBe('Invalid or expired reset token')
    })

    it('should reject used token', async () => {
      const user = await passwordResetTestHelpers.createTestUser()
      const usedToken = await passwordResetTestHelpers.createUsedToken(user.id)

      const response = await request(app)
        .post('/api/v1/password-resets/verify')
        .send({
          token: usedToken.token,
        })
        .expect(400)

      expect(response.body.error).toBe('Invalid or expired reset token')
    })

    it('should validate token format', async () => {
      const response = await request(app)
        .post('/api/v1/password-resets/verify')
        .send({
          token: '',
        })
        .expect(400)

      expect(response.body.error).toBe('Validation failed')
      expect(response.body.details).toBeDefined()
    })
  })

  describe('POST /api/v1/password-resets/reset', () => {
    it('should reset password with valid token', async () => {
      const user = await passwordResetTestHelpers.createTestUser({
        email: 'reset@example.com',
        password: 'OldPassword123!',
      })
      const resetToken =
        await passwordResetTestHelpers.createPasswordResetToken(user.id)

      const response = await request(app)
        .post('/api/v1/password-resets/reset')
        .send({
          token: resetToken.token,
          newPassword: 'NewPassword123!',
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Password has been reset successfully')

      // Verify token is marked as used
      const updatedToken =
        await passwordResetTestHelpers.getPasswordResetTokenByToken(
          resetToken.token,
        )
      expect(updatedToken?.usedAt).toBeTruthy()

      // Verify old password no longer works by checking if password was actually changed
      const updatedUser =
        await passwordResetTestHelpers.getUserByEmail('reset@example.com')
      expect(updatedUser?.password).not.toBe(user.password)
    })

    it('should reject invalid token', async () => {
      const response = await request(app)
        .post('/api/v1/password-resets/reset')
        .send({
          token: 'invalid-token',
          newPassword: 'NewPassword123!',
        })
        .expect(400)

      expect(response.body.error).toBe('Invalid or expired reset token')
    })

    it('should reject expired token', async () => {
      const user = await passwordResetTestHelpers.createTestUser()
      const expiredToken = await passwordResetTestHelpers.createExpiredToken(
        user.id,
      )

      const response = await request(app)
        .post('/api/v1/password-resets/reset')
        .send({
          token: expiredToken.token,
          newPassword: 'NewPassword123!',
        })
        .expect(400)

      expect(response.body.error).toBe('Reset token has expired')
    })

    it('should reject used token', async () => {
      const user = await passwordResetTestHelpers.createTestUser()
      const usedToken = await passwordResetTestHelpers.createUsedToken(user.id)

      const response = await request(app)
        .post('/api/v1/password-resets/reset')
        .send({
          token: usedToken.token,
          newPassword: 'NewPassword123!',
        })
        .expect(400)

      expect(response.body.error).toBe('Reset token has already been used')
    })

    it('should validate password strength', async () => {
      const user = await passwordResetTestHelpers.createTestUser()
      const resetToken =
        await passwordResetTestHelpers.createPasswordResetToken(user.id)

      const response = await request(app)
        .post('/api/v1/password-resets/reset')
        .send({
          token: resetToken.token,
          newPassword: 'weak',
        })
        .expect(400)

      expect(response.body.error).toBe('Validation failed')
      expect(response.body.details).toBeDefined()
    })

    it('should delete other active tokens after successful reset', async () => {
      const user = await passwordResetTestHelpers.createTestUser()

      // Create multiple tokens
      const token1 = await passwordResetTestHelpers.createPasswordResetToken(
        user.id,
      )
      await passwordResetTestHelpers.createPasswordResetToken(user.id)
      await passwordResetTestHelpers.createPasswordResetToken(user.id)

      let activeTokens = await passwordResetTestHelpers.getActiveTokensForUser(
        user.id,
      )
      expect(activeTokens.length).toBe(3)

      // Reset password with one token
      await request(app)
        .post('/api/v1/password-resets/reset')
        .send({
          token: token1.token,
          newPassword: 'NewPassword123!',
        })
        .expect(200)

      // All tokens should be gone
      activeTokens = await passwordResetTestHelpers.getActiveTokensForUser(
        user.id,
      )
      expect(activeTokens.length).toBe(0)
    })
  })
})
