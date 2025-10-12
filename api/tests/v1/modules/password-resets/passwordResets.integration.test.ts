import request from 'supertest'
import { createApp } from '../../../../src/app'
import { passwordResetTestHelpers } from './passwordResets.helpers'
import { Application } from 'express'

describe('Password Reset Integration Tests', () => {
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

  describe('Complete Password Reset Flow', () => {
    it('should complete full password reset workflow', async () => {
      // 1. Create a user
      const user = await passwordResetTestHelpers.createTestUser({
        email: 'fullflow@example.com',
        password: 'OldPassword123!',
      })

      // 2. Request password reset
      const requestResponse = await request(app)
        .post('/api/v1/password-resets/request')
        .send({ email: 'fullflow@example.com' })
        .expect(200)

      expect(requestResponse.body.success).toBe(true)

      // Get the token from the database since it's not returned in production
      const activeTokens =
        await passwordResetTestHelpers.getActiveTokensForUser(user.id)
      expect(activeTokens.length).toBe(1)
      const resetToken = activeTokens[0]

      // 3. Verify the token
      const verifyResponse = await request(app)
        .post('/api/v1/password-resets/verify')
        .send({ token: resetToken.token })
        .expect(200)

      expect(verifyResponse.body.valid).toBe(true)
      expect(verifyResponse.body.user.email).toBe('fullflow@example.com')

      // 4. Reset the password
      const resetResponse = await request(app)
        .post('/api/v1/password-resets/reset')
        .send({
          token: resetToken.token,
          newPassword: 'NewSecurePassword123!',
        })
        .expect(200)

      expect(resetResponse.body.success).toBe(true)
      expect(resetResponse.body.message).toBe(
        'Password has been reset successfully',
      )

      // 5. Verify token is now used
      const verifyUsedResponse = await request(app)
        .post('/api/v1/password-resets/verify')
        .send({ token: resetToken.token })
        .expect(400)

      expect(verifyUsedResponse.body.error).toBe(
        'Invalid or expired reset token',
      )

      // 6. Verify password was actually changed
      const updatedUser = await passwordResetTestHelpers.getUserByEmail(
        'fullflow@example.com',
      )
      expect(updatedUser?.password).not.toBe(user.password)
    })

    it('should handle multiple users simultaneously', async () => {
      // Create multiple users
      const users = await Promise.all([
        passwordResetTestHelpers.createTestUser({ email: 'user1@example.com' }),
        passwordResetTestHelpers.createTestUser({ email: 'user2@example.com' }),
        passwordResetTestHelpers.createTestUser({ email: 'user3@example.com' }),
      ])

      // All request password resets simultaneously
      const requestPromises = users.map((user) =>
        request(app)
          .post('/api/v1/password-resets/request')
          .send({ email: user.email }),
      )

      const requestResults = await Promise.all(requestPromises)
      requestResults.forEach((result) => {
        expect(result.status).toBe(200)
        expect(result.body.success).toBe(true)
      })

      // Each user should have their own token
      for (const user of users) {
        const activeTokens =
          await passwordResetTestHelpers.getActiveTokensForUser(user.id)
        expect(activeTokens.length).toBe(1)
      }

      // Verify all tokens work independently
      for (let i = 0; i < users.length; i++) {
        const activeTokens =
          await passwordResetTestHelpers.getActiveTokensForUser(users[i].id)
        const verifyResponse = await request(app)
          .post('/api/v1/password-resets/verify')
          .send({ token: activeTokens[0].token })
          .expect(200)

        expect(verifyResponse.body.user.email).toBe(users[i].email)
      }
    })

    it('should handle workflow interruption and recovery', async () => {
      const user = await passwordResetTestHelpers.createTestUser({
        email: 'interrupt@example.com',
      })

      // 1. Start reset process
      await request(app)
        .post('/api/v1/password-resets/request')
        .send({ email: 'interrupt@example.com' })
        .expect(200)

      let activeTokens = await passwordResetTestHelpers.getActiveTokensForUser(
        user.id,
      )
      expect(activeTokens.length).toBe(1)
      const firstToken = activeTokens[0].token

      // 2. User requests another reset (common scenario)
      await request(app)
        .post('/api/v1/password-resets/request')
        .send({ email: 'interrupt@example.com' })
        .expect(200)

      // First token should be invalidated
      const verifyOldResponse = await request(app)
        .post('/api/v1/password-resets/verify')
        .send({ token: firstToken })
        .expect(400)

      expect(verifyOldResponse.body.error).toBe(
        'Invalid or expired reset token',
      )

      // New token should work
      activeTokens = await passwordResetTestHelpers.getActiveTokensForUser(
        user.id,
      )
      expect(activeTokens.length).toBe(1)
      const newToken = activeTokens[0].token

      const verifyNewResponse = await request(app)
        .post('/api/v1/password-resets/verify')
        .send({ token: newToken })
        .expect(200)

      expect(verifyNewResponse.body.valid).toBe(true)
    })
  })

  describe('Security Integration', () => {
    it('should prevent brute force attacks across the entire flow', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const user = await passwordResetTestHelpers.createTestUser({
        email: 'bruteforce@example.com',
      })

      // Exhaust rate limit
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/v1/password-resets/request')
          .send({ email: 'bruteforce@example.com' })
          .expect(200)
      }

      // 4th request should fail
      await request(app)
        .post('/api/v1/password-resets/request')
        .send({ email: 'bruteforce@example.com' })
        .expect(400)

      // Try to brute force verification with random tokens
      const randomTokens = Array.from({ length: 10 }, () =>
        passwordResetTestHelpers.generateRandomToken(),
      )

      for (const token of randomTokens) {
        const response = await request(app)
          .post('/api/v1/password-resets/verify')
          .send({ token })
          .expect(400)

        expect(response.body.error).toBe('Invalid or expired reset token')
      }

      // System should still function normally for other users
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const otherUser = await passwordResetTestHelpers.createTestUser({
        email: 'normal@example.com',
      })

      const normalResponse = await request(app)
        .post('/api/v1/password-resets/request')
        .send({ email: 'normal@example.com' })
        .expect(200)

      expect(normalResponse.body.success).toBe(true)
    })

    it('should maintain security with complex attack scenarios', async () => {
      const user = await passwordResetTestHelpers.createTestUser({
        email: 'complex@example.com',
        password: 'OriginalPassword123!',
      })

      // 1. Legitimate reset request
      await request(app)
        .post('/api/v1/password-resets/request')
        .send({ email: 'complex@example.com' })
        .expect(200)

      const activeTokens =
        await passwordResetTestHelpers.getActiveTokensForUser(user.id)
      const legitimateToken = activeTokens[0].token

      // 2. Attacker tries various token manipulation attacks
      const manipulatedTokens = [
        legitimateToken + 'x', // Append character
        legitimateToken.slice(0, -1), // Remove character
        legitimateToken.toUpperCase(), // Change case
        legitimateToken.replace(/a/g, 'b'), // Character substitution
        legitimateToken.split('').reverse().join(''), // Reverse
      ]

      for (const token of manipulatedTokens) {
        const response = await request(app)
          .post('/api/v1/password-resets/verify')
          .send({ token })
          .expect(400)

        expect(response.body.error).toBe('Invalid or expired reset token')
      }

      // 3. Legitimate token should still work
      const verifyResponse = await request(app)
        .post('/api/v1/password-resets/verify')
        .send({ token: legitimateToken })
        .expect(200)

      expect(verifyResponse.body.valid).toBe(true)

      // 4. Complete legitimate reset
      await request(app)
        .post('/api/v1/password-resets/reset')
        .send({
          token: legitimateToken,
          newPassword: 'NewSecurePassword123!',
        })
        .expect(200)

      // 5. Verify password was changed and old token invalidated
      const updatedUser = await passwordResetTestHelpers.getUserByEmail(
        'complex@example.com',
      )
      expect(updatedUser?.password).not.toBe(user.password)

      await request(app)
        .post('/api/v1/password-resets/verify')
        .send({ token: legitimateToken })
        .expect(400)
    })
  })

  describe('Error Recovery Integration', () => {
    it('should handle graceful degradation under load', async () => {
      // Create many users
      const users = await Promise.all(
        Array.from({ length: 20 }, (_, i) =>
          passwordResetTestHelpers.createTestUser({
            email: `load${i}@example.com`,
          }),
        ),
      )

      // Simulate high load with concurrent requests
      const allRequests = users.flatMap((user) => [
        () =>
          request(app)
            .post('/api/v1/password-resets/request')
            .send({ email: user.email }),
        () =>
          request(app)
            .post('/api/v1/password-resets/request')
            .send({ email: user.email }),
      ])

      // Execute all requests concurrently
      const results = await Promise.allSettled(allRequests.map((req) => req()))

      // Should handle load gracefully - some may succeed, others may fail
      const successful = results.filter(
        (r) => r.status === 'fulfilled' && r.value.status === 200,
      )
      const failed = results.filter(
        (r) =>
          r.status === 'rejected' ||
          (r.status === 'fulfilled' && r.value.status !== 200),
      )

      // At least some should succeed
      expect(successful.length).toBeGreaterThan(0)

      // Failures should be graceful (rate limiting, not server errors)
      failed.forEach((result) => {
        if (result.status === 'fulfilled') {
          expect([400, 429]).toContain(result.value.status)
        }
      })
    })

    it('should maintain data consistency during failures', async () => {
      const user = await passwordResetTestHelpers.createTestUser({
        email: 'consistency@example.com',
        password: 'OriginalPassword123!',
      })

      // Start reset process
      await request(app)
        .post('/api/v1/password-resets/request')
        .send({ email: 'consistency@example.com' })
        .expect(200)

      const activeTokens =
        await passwordResetTestHelpers.getActiveTokensForUser(user.id)
      const token = activeTokens[0].token

      // Simulate potential race condition - multiple reset attempts
      const resetPromises = [
        request(app).post('/api/v1/password-resets/reset').send({
          token,
          newPassword: 'Password1!',
        }),
        request(app).post('/api/v1/password-resets/reset').send({
          token,
          newPassword: 'Password2!',
        }),
        request(app).post('/api/v1/password-resets/reset').send({
          token,
          newPassword: 'Password3!',
        }),
      ]

      const resetResults = await Promise.allSettled(resetPromises)

      // Only one should succeed
      const successful = resetResults.filter(
        (r) => r.status === 'fulfilled' && r.value.status === 200,
      )
      const failed = resetResults.filter(
        (r) => r.status === 'fulfilled' && r.value.status !== 200,
      )

      expect(successful.length).toBe(1)
      expect(failed.length).toBe(2)

      // Failed attempts should get "already used" error
      failed.forEach((result) => {
        if (result.status === 'fulfilled') {
          expect(result.value.body.error).toBe(
            'Reset token has already been used',
          )
        }
      })

      // User password should be changed exactly once
      const finalUser = await passwordResetTestHelpers.getUserByEmail(
        'consistency@example.com',
      )
      expect(finalUser?.password).not.toBe(user.password)

      // No active tokens should remain
      const remainingTokens =
        await passwordResetTestHelpers.getActiveTokensForUser(user.id)
      expect(remainingTokens.length).toBe(0)
    })
  })
})
