import request from 'supertest'
import { createApp } from '../../../../src/app'
import { passwordResetTestHelpers } from './passwordResets.helpers'
import { Application } from 'express'

describe('Password Reset Security Tests', () => {
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

  describe('Rate Limiting', () => {
    it('should enforce rate limit of 3 attempts per hour', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const user = await passwordResetTestHelpers.createTestUser({
        email: 'ratelimit@example.com',
      })

      // Make 3 successful requests
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/v1/password-resets/request')
          .send({ email: 'ratelimit@example.com' })
          .expect(200)
      }

      // 4th request should be rate limited
      const response = await request(app)
        .post('/api/v1/password-resets/request')
        .send({ email: 'ratelimit@example.com' })
        .expect(400)

      expect(response.body.error).toContain('Too many password reset attempts')
      expect(response.body.error).toContain('Try again in')
    })

    it('should reset rate limit after time window expires', async () => {
      const user = await passwordResetTestHelpers.createTestUser({
        email: 'timewindow@example.com',
      })

      // Create 3 old reset attempts (older than 1 hour)
      await passwordResetTestHelpers.createOldResetAttempts(user.id, 3)

      // Should be able to make new request
      const response = await request(app)
        .post('/api/v1/password-resets/request')
        .send({ email: 'timewindow@example.com' })
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    it('should count attempts per user, not globally', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const user1 = await passwordResetTestHelpers.createTestUser({
        email: 'user1@example.com',
      })
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const user2 = await passwordResetTestHelpers.createTestUser({
        email: 'user2@example.com',
      })

      // User1 makes 3 attempts
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/v1/password-resets/request')
          .send({ email: 'user1@example.com' })
          .expect(200)
      }

      // User1's 4th attempt should fail
      await request(app)
        .post('/api/v1/password-resets/request')
        .send({ email: 'user1@example.com' })
        .expect(400)

      // User2 should still be able to make requests
      const response = await request(app)
        .post('/api/v1/password-resets/request')
        .send({ email: 'user2@example.com' })
        .expect(200)

      expect(response.body.success).toBe(true)
    })
  })

  describe('Token Security', () => {
    it('should generate cryptographically secure tokens', async () => {
      const user = await passwordResetTestHelpers.createTestUser()

      // Create multiple tokens and ensure they're unique
      const tokens = new Set()
      for (let i = 0; i < 10; i++) {
        const token = await passwordResetTestHelpers.createPasswordResetToken(
          user.id,
        )
        expect(tokens.has(token.token)).toBe(false)
        tokens.add(token.token)
        expect(token.token.length).toBe(64) // 32 bytes in hex
        expect(/^[a-f0-9]+$/i.test(token.token)).toBe(true) // Valid hex
      }
    })

    it('should hash tokens in database', async () => {
      const user = await passwordResetTestHelpers.createTestUser()
      const token = await passwordResetTestHelpers.createPasswordResetToken(
        user.id,
      )

      // Raw token should not be stored in database
      const storedToken =
        await passwordResetTestHelpers.getPasswordResetTokenByToken(token.token)
      expect(storedToken?.token).not.toBe(token.token)
      expect(storedToken?.token.length).toBeGreaterThan(token.token.length) // Hashed
    })

    it('should enforce token expiration', async () => {
      const user = await passwordResetTestHelpers.createTestUser()
      const expiredToken = await passwordResetTestHelpers.createExpiredToken(
        user.id,
      )

      // Verify token should fail
      const verifyResponse = await request(app)
        .post('/api/v1/password-resets/verify')
        .send({ token: expiredToken.token })
        .expect(400)

      expect(verifyResponse.body.error).toBe('Invalid or expired reset token')

      // Reset password should fail
      const resetResponse = await request(app)
        .post('/api/v1/password-resets/reset')
        .send({
          token: expiredToken.token,
          newPassword: 'NewPassword123!',
        })
        .expect(400)

      expect(resetResponse.body.error).toBe('Reset token has expired')
    })

    it('should prevent token reuse', async () => {
      const user = await passwordResetTestHelpers.createTestUser({
        password: 'OldPassword123!',
      })
      const resetToken =
        await passwordResetTestHelpers.createPasswordResetToken(user.id)

      // First reset should succeed
      await request(app)
        .post('/api/v1/password-resets/reset')
        .send({
          token: resetToken.token,
          newPassword: 'NewPassword123!',
        })
        .expect(200)

      // Second attempt with same token should fail
      const response = await request(app)
        .post('/api/v1/password-resets/reset')
        .send({
          token: resetToken.token,
          newPassword: 'AnotherPassword123!',
        })
        .expect(400)

      expect(response.body.error).toBe('Reset token has already been used')
    })

    it('should invalidate all user tokens after successful reset', async () => {
      const user = await passwordResetTestHelpers.createTestUser()

      // Create multiple tokens
      const token1 = await passwordResetTestHelpers.createPasswordResetToken(
        user.id,
      )
      const token2 = await passwordResetTestHelpers.createPasswordResetToken(
        user.id,
      )
      const token3 = await passwordResetTestHelpers.createPasswordResetToken(
        user.id,
      )

      // Reset with token1
      await request(app)
        .post('/api/v1/password-resets/reset')
        .send({
          token: token1.token,
          newPassword: 'NewPassword123!',
        })
        .expect(200)

      // Other tokens should no longer work
      const response2 = await request(app)
        .post('/api/v1/password-resets/verify')
        .send({ token: token2.token })
        .expect(400)

      const response3 = await request(app)
        .post('/api/v1/password-resets/verify')
        .send({ token: token3.token })
        .expect(400)

      expect(response2.body.error).toBe('Invalid or expired reset token')
      expect(response3.body.error).toBe('Invalid or expired reset token')
    })
  })

  describe('Password Security', () => {
    it('should enforce strong password requirements', async () => {
      const user = await passwordResetTestHelpers.createTestUser()
      const resetToken =
        await passwordResetTestHelpers.createPasswordResetToken(user.id)

      const weakPasswords = [
        'weak',
        '12345678',
        'password',
        'Password',
        'Password123',
        'password123!',
        'PASSWORD123!',
      ]

      for (const weakPassword of weakPasswords) {
        const response = await request(app)
          .post('/api/v1/password-resets/reset')
          .send({
            token: resetToken.token,
            newPassword: weakPassword,
          })
          .expect(400)

        expect(response.body.error).toBe('Validation failed')
        expect(response.body.details).toBeDefined()
      }
    })

    it('should accept strong passwords', async () => {
      const user = await passwordResetTestHelpers.createTestUser()

      const strongPasswords = [
        'StrongPassword123!',
        'My$ecureP@ssw0rd',
        'C0mplex!Password',
        'S3cure#Passw0rd!',
      ]

      for (const strongPassword of strongPasswords) {
        // Create fresh token for each attempt
        const resetToken =
          await passwordResetTestHelpers.createPasswordResetToken(user.id)

        const response = await request(app)
          .post('/api/v1/password-resets/reset')
          .send({
            token: resetToken.token,
            newPassword: strongPassword,
          })
          .expect(200)

        expect(response.body.success).toBe(true)
      }
    })

    it('should hash new passwords securely', async () => {
      const user = await passwordResetTestHelpers.createTestUser({
        password: 'OldPassword123!',
      })
      const resetToken =
        await passwordResetTestHelpers.createPasswordResetToken(user.id)
      const newPassword = 'NewSecurePassword123!'

      await request(app)
        .post('/api/v1/password-resets/reset')
        .send({
          token: resetToken.token,
          newPassword,
        })
        .expect(200)

      // Verify password was hashed (not stored in plain text)
      const updatedUser = await passwordResetTestHelpers.getUserByEmail(
        user.email,
      )
      expect(updatedUser?.password).not.toBe(newPassword)
      expect(updatedUser?.password.length).toBeGreaterThan(50) // bcrypt hash length
      expect(updatedUser?.password.startsWith('$2')).toBe(true) // bcrypt prefix
    })
  })

  describe('Data Leakage Prevention', () => {
    it('should not leak user existence in password reset requests', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const existingUser = await passwordResetTestHelpers.createTestUser({
        email: 'exists@example.com',
      })

      // Request for existing user
      const existingResponse = await request(app)
        .post('/api/v1/password-resets/request')
        .send({ email: 'exists@example.com' })
        .expect(200)

      // Request for non-existing user
      const nonExistingResponse = await request(app)
        .post('/api/v1/password-resets/request')
        .send({ email: 'nonexistent@example.com' })
        .expect(200)

      // Responses should be identical to prevent user enumeration
      expect(existingResponse.body.message).toBe(
        nonExistingResponse.body.message,
      )
      expect(existingResponse.body.success).toBe(
        nonExistingResponse.body.success,
      )
    })

    it('should not expose sensitive user data in token verification', async () => {
      const user = await passwordResetTestHelpers.createTestUser({
        email: 'verify@example.com',
        name: 'Sensitive User',
      })
      const resetToken =
        await passwordResetTestHelpers.createPasswordResetToken(user.id)

      const response = await request(app)
        .post('/api/v1/password-resets/verify')
        .send({ token: resetToken.token })
        .expect(200)

      // Should only include safe user data
      expect(response.body.user.email).toBe('verify@example.com')
      expect(response.body.user.name).toBe('Sensitive User')
      expect(response.body.user.password).toBeUndefined()
      expect(response.body.user.id).toBeUndefined()
      expect(response.body.user.createdAt).toBeUndefined()
      expect(response.body.user.updatedAt).toBeUndefined()
    })

    it('should not return tokens in production mode', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const user = await passwordResetTestHelpers.createTestUser({
          email: 'production@example.com',
        })

        const response = await request(app)
          .post('/api/v1/password-resets/request')
          .send({ email: 'production@example.com' })
          .expect(200)

        expect(response.body.success).toBe(true)
        expect(response.body.token).toBeUndefined() // Should not leak token
      } finally {
        process.env.NODE_ENV = originalEnv
      }
    })
  })

  describe('Input Validation Security', () => {
    it('should sanitize email input', async () => {
      const maliciousEmails = [
        'test@example.com<script>alert(1)</script>',
        'test+malicious@example.com; DROP TABLE users;',
        'test@example.com\n\r\nBCC: hacker@evil.com',
      ]

      for (const email of maliciousEmails) {
        const response = await request(app)
          .post('/api/v1/password-resets/request')
          .send({ email })
          .expect(400)

        expect(response.body.error).toBe('Validation failed')
      }
    })

    it('should validate token format strictly', async () => {
      const maliciousTokens = [
        '',
        'a',
        'x'.repeat(1000),
        '<script>alert(1)</script>',
        '../../etc/passwd',
        'token; DROP TABLE password_reset_tokens;',
        'token\n\r\nmalicious',
      ]

      for (const token of maliciousTokens) {
        const verifyResponse = await request(app)
          .post('/api/v1/password-resets/verify')
          .send({ token })
          .expect(400)

        expect(verifyResponse.body.error).toBe('Validation failed')

        const resetResponse = await request(app)
          .post('/api/v1/password-resets/reset')
          .send({
            token,
            newPassword: 'ValidPassword123!',
          })
          .expect(400)

        expect(resetResponse.body.error).toBe('Validation failed')
      }
    })
  })
})
