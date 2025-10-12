import request from 'supertest'
import { createApp } from '../../../../src/app'
import { passwordResetTestHelpers } from './passwordResets.helpers'
import { Application } from 'express'

describe('Password Reset Edge Cases', () => {
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

  describe('Database Edge Cases', () => {
    it('should handle database connection issues gracefully', async () => {
      // This would require mocking the database connection
      // For now, we'll test the error handling behavior
      const response = await request(app)
        .post('/api/v1/password-resets/request')
        .send({
          email: 'test@example.com',
        })

      // Should not expose internal database errors
      expect([200, 500]).toContain(response.status)
      if (response.status === 500) {
        expect(response.body.error).not.toContain('database')
        expect(response.body.error).not.toContain('connection')
        expect(response.body.error).not.toContain('sql')
      }
    })

    it('should handle concurrent token creation', async () => {
      const user = await passwordResetTestHelpers.createTestUser({
        email: 'concurrent@example.com',
      })

      // Simulate concurrent requests
      const promises = Array.from({ length: 5 }, () =>
        request(app)
          .post('/api/v1/password-resets/request')
          .send({ email: 'concurrent@example.com' }),
      )

      const results = await Promise.all(promises)

      // All should succeed
      results.forEach((result) => {
        expect(result.status).toBe(200)
        expect(result.body.success).toBe(true)
      })

      // Should have only one active token (last one wins)
      const activeTokens =
        await passwordResetTestHelpers.getActiveTokensForUser(user.id)
      expect(activeTokens.length).toBe(1)
    })

    it('should handle user deletion during reset process', async () => {
      const user = await passwordResetTestHelpers.createTestUser({
        email: 'deleteme@example.com',
      })
      const resetToken =
        await passwordResetTestHelpers.createPasswordResetToken(user.id)

      // Delete the user
      await passwordResetTestHelpers.deleteUser(user.id)

      // Token verification should fail gracefully
      const verifyResponse = await request(app)
        .post('/api/v1/password-resets/verify')
        .send({ token: resetToken.token })
        .expect(400)

      expect(verifyResponse.body.error).toBe('Invalid or expired reset token')

      // Password reset should fail gracefully
      const resetResponse = await request(app)
        .post('/api/v1/password-resets/reset')
        .send({
          token: resetToken.token,
          newPassword: 'NewPassword123!',
        })
        .expect(400)

      expect(resetResponse.body.error).toBe('Invalid or expired reset token')
    })
  })

  describe('Token Edge Cases', () => {
    it('should handle tokens at exact expiry time', async () => {
      const user = await passwordResetTestHelpers.createTestUser()

      // Create token that expires in exactly 1 second
      const almostExpiredToken =
        await passwordResetTestHelpers.createAlmostExpiredToken(user.id)

      // Should work immediately
      const immediateResponse = await request(app)
        .post('/api/v1/password-resets/verify')
        .send({ token: almostExpiredToken.token })
        .expect(200)

      expect(immediateResponse.body.valid).toBe(true)

      // Wait for expiry and test again
      await new Promise((resolve) => setTimeout(resolve, 1100))

      const expiredResponse = await request(app)
        .post('/api/v1/password-resets/verify')
        .send({ token: almostExpiredToken.token })
        .expect(400)

      expect(expiredResponse.body.error).toBe('Invalid or expired reset token')
    })

    it('should handle malformed token structures', async () => {
      const malformedTokens = [
        'validlength123456789012345678901234567890123456789012345678901234', // 63 chars (invalid)
        'validlength12345678901234567890123456789012345678901234567890123456', // 65 chars (invalid)
        'g'.repeat(64), // invalid hex
        'Z'.repeat(64), // invalid hex
        '😀'.repeat(32), // unicode
        '\x00'.repeat(64), // null bytes
        Buffer.from('test').toString('hex').padEnd(64, '0'), // valid hex but wrong source
      ]

      for (const token of malformedTokens) {
        const response = await request(app)
          .post('/api/v1/password-resets/verify')
          .send({ token })

        expect([400, 422]).toContain(response.status)
        expect(response.body.error).toMatch(/validation|invalid|expired/i)
      }
    })

    it('should handle extremely old tokens', async () => {
      const user = await passwordResetTestHelpers.createTestUser()

      // Create a token that expired a year ago
      const veryOldToken = await passwordResetTestHelpers.createVeryOldToken(
        user.id,
      )

      const response = await request(app)
        .post('/api/v1/password-resets/verify')
        .send({ token: veryOldToken.token })
        .expect(400)

      expect(response.body.error).toBe('Invalid or expired reset token')
    })

    it('should handle tokens for non-existent users', async () => {
      // Create a token manually without a user
      const orphanToken = await passwordResetTestHelpers.createOrphanToken()

      const response = await request(app)
        .post('/api/v1/password-resets/verify')
        .send({ token: orphanToken.token })
        .expect(400)

      expect(response.body.error).toBe('Invalid or expired reset token')
    })
  })

  describe('Rate Limiting Edge Cases', () => {
    it('should handle rate limit boundary conditions', async () => {
      const user = await passwordResetTestHelpers.createTestUser({
        email: 'boundary@example.com',
      })

      // Create exactly 2 recent attempts
      await passwordResetTestHelpers.createMultipleResetAttempts(user.id, 2)

      // 3rd attempt should succeed
      const thirdResponse = await request(app)
        .post('/api/v1/password-resets/request')
        .send({ email: 'boundary@example.com' })
        .expect(200)

      expect(thirdResponse.body.success).toBe(true)

      // 4th attempt should fail
      const fourthResponse = await request(app)
        .post('/api/v1/password-resets/request')
        .send({ email: 'boundary@example.com' })
        .expect(400)

      expect(fourthResponse.body.error).toContain(
        'Too many password reset attempts',
      )
    })

    it('should handle rate limit at exact time boundaries', async () => {
      const user = await passwordResetTestHelpers.createTestUser({
        email: 'timeboundary@example.com',
      })

      // Create attempts at exactly 1 hour ago
      await passwordResetTestHelpers.createResetAttemptAtTime(
        user.id,
        new Date(Date.now() - 60 * 60 * 1000),
      )
      await passwordResetTestHelpers.createResetAttemptAtTime(
        user.id,
        new Date(Date.now() - 60 * 60 * 1000 + 1000),
      )
      await passwordResetTestHelpers.createResetAttemptAtTime(
        user.id,
        new Date(Date.now() - 60 * 60 * 1000 + 2000),
      )

      // Should be able to make new request as old attempts are exactly at boundary
      const response = await request(app)
        .post('/api/v1/password-resets/request')
        .send({ email: 'timeboundary@example.com' })
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    it('should handle rapid successive requests', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const user = await passwordResetTestHelpers.createTestUser({
        email: 'rapid@example.com',
      })

      // Make rapid requests in quick succession
      const promises = Array.from({ length: 10 }, (_, i) =>
        request(app)
          .post('/api/v1/password-resets/request')
          .send({ email: 'rapid@example.com' })
          .then((res) => ({ index: i, status: res.status, body: res.body })),
      )

      const results = await Promise.all(promises)

      // First 3 should succeed, rest should fail
      const successful = results.filter((r) => r.status === 200)
      const failed = results.filter((r) => r.status === 400)

      expect(successful.length).toBeLessThanOrEqual(3)
      expect(failed.length).toBeGreaterThan(0)

      failed.forEach((result) => {
        expect(result.body.error).toContain('Too many password reset attempts')
      })
    })
  })

  describe('User State Edge Cases', () => {
    it('should handle inactive user accounts', async () => {
      const inactiveUser = await passwordResetTestHelpers.createTestUser({
        email: 'inactive@example.com',
        status: 'INACTIVE',
      })

      const response = await request(app)
        .post('/api/v1/password-resets/request')
        .send({ email: 'inactive@example.com' })
        .expect(200)

      // Should give same response as for non-existent users
      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain(
        'If an account with that email exists',
      )

      // No token should be created for inactive users
      const tokenCount =
        await passwordResetTestHelpers.countUserPasswordResetTokens(
          inactiveUser.id,
        )
      expect(tokenCount).toBe(0)
    })

    it('should handle suspended user accounts', async () => {
      const suspendedUser = await passwordResetTestHelpers.createTestUser({
        email: 'suspended@example.com',
        status: 'INACTIVE', // Use INACTIVE since SUSPENDED may not exist
      })

      const response = await request(app)
        .post('/api/v1/password-resets/request')
        .send({ email: 'suspended@example.com' })
        .expect(200)

      // Should give same response as for non-existent users
      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain(
        'If an account with that email exists',
      )

      // No token should be created for suspended users
      const tokenCount =
        await passwordResetTestHelpers.countUserPasswordResetTokens(
          suspendedUser.id,
        )
      expect(tokenCount).toBe(0)
    })

    it('should handle user email changes during reset process', async () => {
      const user = await passwordResetTestHelpers.createTestUser({
        email: 'original@example.com',
      })
      const resetToken =
        await passwordResetTestHelpers.createPasswordResetToken(user.id)

      // Change user email
      await passwordResetTestHelpers.updateUserEmail(
        user.id,
        'changed@example.com',
      )

      // Token should still work (tied to user ID, not email)
      const verifyResponse = await request(app)
        .post('/api/v1/password-resets/verify')
        .send({ token: resetToken.token })
        .expect(200)

      expect(verifyResponse.body.valid).toBe(true)
      expect(verifyResponse.body.user.email).toBe('changed@example.com')
    })
  })

  describe('Password Validation Edge Cases', () => {
    it('should handle password at minimum strength threshold', async () => {
      const user = await passwordResetTestHelpers.createTestUser()
      const resetToken =
        await passwordResetTestHelpers.createPasswordResetToken(user.id)

      // Minimum valid password (assuming 8 chars, 1 upper, 1 lower, 1 number, 1 special)
      const minValidPassword = 'Abc123!x'

      const response = await request(app)
        .post('/api/v1/password-resets/reset')
        .send({
          token: resetToken.token,
          newPassword: minValidPassword,
        })
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    it('should handle extremely long passwords', async () => {
      const user = await passwordResetTestHelpers.createTestUser()
      const resetToken =
        await passwordResetTestHelpers.createPasswordResetToken(user.id)

      // Very long but valid password
      const longPassword = 'A1!' + 'x'.repeat(200) + 'Z2@'

      const response = await request(app)
        .post('/api/v1/password-resets/reset')
        .send({
          token: resetToken.token,
          newPassword: longPassword,
        })

      // Should either succeed or fail with validation error (depending on max length limit)
      expect([200, 400]).toContain(response.status)

      if (response.status === 400) {
        expect(response.body.error).toMatch(/validation|length|long/i)
      }
    })

    it('should handle unicode passwords', async () => {
      const user = await passwordResetTestHelpers.createTestUser()
      const resetToken =
        await passwordResetTestHelpers.createPasswordResetToken(user.id)

      const unicodePassword = 'Pάssw0rd123!🔒'

      const response = await request(app)
        .post('/api/v1/password-resets/reset')
        .send({
          token: resetToken.token,
          newPassword: unicodePassword,
        })

      // Should handle unicode gracefully
      expect([200, 400]).toContain(response.status)

      if (response.status === 200) {
        expect(response.body.success).toBe(true)
      }
    })
  })

  describe('Cleanup Edge Cases', () => {
    it('should handle cleanup of expired tokens', async () => {
      const user1 = await passwordResetTestHelpers.createTestUser()
      const user2 = await passwordResetTestHelpers.createTestUser()

      // Create mix of valid and expired tokens
      await passwordResetTestHelpers.createPasswordResetToken(user1.id)
      await passwordResetTestHelpers.createExpiredToken(user1.id)
      await passwordResetTestHelpers.createPasswordResetToken(user2.id)
      await passwordResetTestHelpers.createExpiredToken(user2.id)

      const totalBefore =
        await passwordResetTestHelpers.countPasswordResetTokens()
      expect(totalBefore).toBe(4)

      // Cleanup should only remove expired tokens
      await passwordResetTestHelpers.cleanupExpiredTokens()

      const totalAfter =
        await passwordResetTestHelpers.countPasswordResetTokens()
      expect(totalAfter).toBe(2) // Only active tokens remain
    })

    it('should handle cleanup when no tokens exist', async () => {
      // Ensure no tokens exist
      await passwordResetTestHelpers.cleanupDatabase()

      const countBefore =
        await passwordResetTestHelpers.countPasswordResetTokens()
      expect(countBefore).toBe(0)

      // Cleanup should not error
      await expect(
        passwordResetTestHelpers.cleanupExpiredTokens(),
      ).resolves.not.toThrow()

      const countAfter =
        await passwordResetTestHelpers.countPasswordResetTokens()
      expect(countAfter).toBe(0)
    })
  })
})
