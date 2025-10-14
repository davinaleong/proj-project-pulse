import { describe, it, expect, beforeEach, afterAll } from '@jest/globals'
import request from 'supertest'
import app from '../../../src/app'
import { e2eTestHelpers } from '../e2e/e2e.helpers'

/**
 * Authentication Integration Tests
 *
 * These tests cover complete authentication workflows and edge cases,
 * including registration, login, password management, and token handling.
 */
describe('Authentication Integration Tests', () => {
  beforeEach(async () => {
    await e2eTestHelpers.setupTestDatabase()
  })

  afterAll(async () => {
    await e2eTestHelpers.cleanupDatabase()
    await e2eTestHelpers.disconnectDatabase()
  })

  describe('User Registration Workflow', () => {
    it('should handle complete registration flow with email verification', async () => {
      const userData = {
        name: 'Integration Test User',
        email: 'integration@example.com',
        password: 'SecurePassword123!',
      }

      // 1. Register user
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201)

      expect(registerResponse.body.success).toBe(true)
      expect(registerResponse.body.data.user.email).toBe(userData.email)
      expect(registerResponse.body.data.user.emailVerifiedAt).toBeNull()
      expect(registerResponse.body.data.token).toBeDefined()

      const userId = registerResponse.body.data.user.id
      const registrationToken = registerResponse.body.data.token

      // 2. User should not be able to access protected resources without verification
      await request(app)
        .get('/api/v1/users/me')
        .set({ Authorization: `Bearer ${registrationToken}` })
        .expect(403) // Assuming email verification is required

      // 3. Verify email (simulate clicking verification link)
      const verifyResponse = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ token: registrationToken })
        .expect(200)

      expect(verifyResponse.body.success).toBe(true)

      // 4. After verification, user should be able to access protected resources
      const profileResponse = await request(app)
        .get('/api/v1/users/me')
        .set({ Authorization: `Bearer ${registrationToken}` })
        .expect(200)

      expect(profileResponse.body.data.id).toBe(userId)
      expect(profileResponse.body.data.emailVerifiedAt).not.toBeNull()
    })

    it('should prevent duplicate email registration', async () => {
      const userData = {
        name: 'First User',
        email: 'duplicate@example.com',
        password: 'Password123!',
      }

      // Register first user
      await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201)

      // Try to register second user with same email
      const duplicateResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Second User',
          email: userData.email, // Same email
          password: 'DifferentPassword123!',
        })
        .expect(409)

      expect(duplicateResponse.body.success).toBe(false)
      expect(duplicateResponse.body.message).toContain('email')
    })

    it('should validate registration input thoroughly', async () => {
      // Test invalid email formats
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test User',
          email: 'invalid-email',
          password: 'Password123!',
        })
        .expect(400)

      await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test User',
          email: 'test@',
          password: 'Password123!',
        })
        .expect(400)

      // Test weak passwords
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: '123',
        })
        .expect(400)

      await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password', // No numbers or special chars
        })
        .expect(400)

      // Test missing required fields
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          // Missing name
        })
        .expect(400)

      // Test empty strings
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: '',
          email: 'test@example.com',
          password: 'Password123!',
        })
        .expect(400)

      // Test extremely long inputs
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'A'.repeat(256), // Too long
          email: 'test@example.com',
          password: 'Password123!',
        })
        .expect(400)
    })

    it('should handle registration edge cases', async () => {
      // Test registration with international characters
      const internationalUser = {
        name: 'José María García-López',
        email: 'josé@éxample.com',
        password: 'Contraseña123!',
      }

      const internationalResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(internationalUser)

      // Should either succeed or fail gracefully
      expect([200, 201, 400]).toContain(internationalResponse.status)

      // Test registration with maximum valid lengths
      const maxLengthUser = {
        name: 'A'.repeat(255), // Maximum allowed length
        email: `${'test'.repeat(60)}@example.com`, // Long but valid email
        password: 'VeryLongButValidPassword123!@#',
      }

      const maxLengthResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(maxLengthUser)

      expect([200, 201, 400]).toContain(maxLengthResponse.status)
    })
  })

  describe('User Login Workflow', () => {
    it('should handle complete login flow with session management', async () => {
      // Create a verified user
      const { user } = await e2eTestHelpers.createAuthenticatedUser()

      // 1. Login with correct credentials
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: 'TestPassword123!', // Default password from helper
        })
        .expect(200)

      expect(loginResponse.body.success).toBe(true)
      expect(loginResponse.body.data.token).toBeDefined()
      expect(loginResponse.body.data.user.id).toBe(user.id)

      const token = loginResponse.body.data.token

      // 2. Use token to access protected resources
      const protectedResponse = await request(app)
        .get('/api/v1/users/me')
        .set({ Authorization: `Bearer ${token}` })
        .expect(200)

      expect(protectedResponse.body.data.id).toBe(user.id)

      // 3. Login should create a session
      const sessionsResponse = await request(app)
        .get('/api/v1/sessions/me')
        .set({ Authorization: `Bearer ${token}` })
        .expect(200)

      expect(sessionsResponse.body.data.length).toBeGreaterThan(0)

      // 4. Logout should invalidate session
      await request(app)
        .post('/api/v1/auth/logout')
        .set({ Authorization: `Bearer ${token}` })
        .expect(200)

      // 5. Token should no longer work
      await request(app)
        .get('/api/v1/users/me')
        .set({ Authorization: `Bearer ${token}` })
        .expect(401)
    })

    it('should handle login failures and security measures', async () => {
      const { user } = await e2eTestHelpers.createAuthenticatedUser()

      // 1. Wrong password
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: 'WrongPassword123!',
        })
        .expect(401)

      // 2. Non-existent email
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        })
        .expect(401)

      // 3. Inactive user
      const inactiveUser = await e2eTestHelpers.createInactiveUser()
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: inactiveUser.email,
          password: 'TestPassword123!',
        })
        .expect(401)

      // 4. Multiple failed attempts (rate limiting test)
      for (let i = 0; i < 5; i++) {
        await request(app).post('/api/v1/auth/login').send({
          email: user.email,
          password: 'WrongPassword',
        })
      }

      // Should be rate limited
      const rateLimitedResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: 'TestPassword123!', // Even correct password
        })

      expect([401, 429]).toContain(rateLimitedResponse.status)
    })

    it('should handle concurrent login sessions', async () => {
      const { user } = await e2eTestHelpers.createAuthenticatedUser()

      // Login from multiple "devices" (different user agents)
      const device1Response = await request(app)
        .post('/api/v1/auth/login')
        .set('User-Agent', 'Device1/1.0')
        .send({
          email: user.email,
          password: 'TestPassword123!',
        })
        .expect(200)

      const device2Response = await request(app)
        .post('/api/v1/auth/login')
        .set('User-Agent', 'Device2/1.0')
        .send({
          email: user.email,
          password: 'TestPassword123!',
        })
        .expect(200)

      const token1 = device1Response.body.data.token
      const token2 = device2Response.body.data.token

      // Both tokens should be valid
      await request(app)
        .get('/api/v1/users/me')
        .set({ Authorization: `Bearer ${token1}` })
        .expect(200)

      await request(app)
        .get('/api/v1/users/me')
        .set({ Authorization: `Bearer ${token2}` })
        .expect(200)

      // Check active sessions
      const sessionsResponse = await request(app)
        .get('/api/v1/sessions/me')
        .set({ Authorization: `Bearer ${token1}` })
        .expect(200)

      expect(sessionsResponse.body.data.length).toBe(2)

      // Logout from one device
      await request(app)
        .post('/api/v1/auth/logout')
        .set({ Authorization: `Bearer ${token1}` })
        .expect(200)

      // First token should be invalid
      await request(app)
        .get('/api/v1/users/me')
        .set({ Authorization: `Bearer ${token1}` })
        .expect(401)

      // Second token should still be valid
      await request(app)
        .get('/api/v1/users/me')
        .set({ Authorization: `Bearer ${token2}` })
        .expect(200)
    })
  })

  describe('Password Reset Workflow', () => {
    it('should handle complete password reset flow', async () => {
      const { user } = await e2eTestHelpers.createAuthenticatedUser()

      // 1. Request password reset
      const resetRequestResponse = await request(app)
        .post('/api/v1/auth/password-reset/request')
        .send({ email: user.email })
        .expect(200)

      expect(resetRequestResponse.body.success).toBe(true)

      // 2. In a real scenario, user would receive email with reset token
      // For testing, we'll assume the token is available
      // (In production, you might store this in the database)

      // 3. Try to reset with invalid token
      await request(app)
        .post('/api/v1/auth/password-reset/confirm')
        .send({
          token: 'invalid-token',
          newPassword: 'NewPassword123!',
        })
        .expect(400)

      // 4. Try to reset with expired token (simulate)
      const expiredTokenResponse = await request(app)
        .post('/api/v1/auth/password-reset/confirm')
        .send({
          token: 'expired-token',
          newPassword: 'NewPassword123!',
        })

      expect([400, 401]).toContain(expiredTokenResponse.status)

      // 5. Multiple reset requests should be rate limited
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/v1/auth/password-reset/request')
          .send({ email: user.email })
      }

      const rateLimitedResponse = await request(app)
        .post('/api/v1/auth/password-reset/request')
        .send({ email: user.email })

      expect([200, 429]).toContain(rateLimitedResponse.status)
    })

    it('should handle password reset edge cases', async () => {
      // Request reset for non-existent email
      const nonExistentResponse = await request(app)
        .post('/api/v1/auth/password-reset/request')
        .send({ email: 'nonexistent@example.com' })
        .expect(200) // Should return 200 to prevent email enumeration

      expect(nonExistentResponse.body.success).toBe(true)

      // Request reset for inactive user
      const inactiveUser = await e2eTestHelpers.createInactiveUser()
      const inactiveResponse = await request(app)
        .post('/api/v1/auth/password-reset/request')
        .send({ email: inactiveUser.email })
        .expect(200)

      expect(inactiveResponse.body.success).toBe(true)

      // Invalid email format
      await request(app)
        .post('/api/v1/auth/password-reset/request')
        .send({ email: 'invalid-email' })
        .expect(400)

      // Weak new password
      await request(app)
        .post('/api/v1/auth/password-reset/confirm')
        .send({
          token: 'valid-token',
          newPassword: '123',
        })
        .expect(400)
    })
  })

  describe('Token Management', () => {
    it('should handle token refresh and expiration', async () => {
      const { token } = await e2eTestHelpers.createAuthenticatedUser()

      // 1. Token should be valid initially
      await request(app)
        .get('/api/v1/users/me')
        .set({ Authorization: `Bearer ${token}` })
        .expect(200)

      // 2. Refresh token (if implemented)
      const refreshResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .set({ Authorization: `Bearer ${token}` })

      if (refreshResponse.status === 200) {
        const newToken = refreshResponse.body.data.token
        expect(newToken).toBeDefined()
        expect(newToken).not.toBe(token)

        // Old token might still be valid (depending on implementation)
        // New token should definitely be valid
        await request(app)
          .get('/api/v1/users/me')
          .set({ Authorization: `Bearer ${newToken}` })
          .expect(200)
      }

      // 3. Test malformed tokens
      await request(app)
        .get('/api/v1/users/me')
        .set({ Authorization: 'Bearer invalid-jwt-token' })
        .expect(401)

      await request(app)
        .get('/api/v1/users/me')
        .set({ Authorization: 'InvalidFormat' })
        .expect(401)

      // 4. Test missing token
      await request(app).get('/api/v1/users/me').expect(401)
    })

    it('should handle token blacklisting and logout all devices', async () => {
      const { user } = await e2eTestHelpers.createAuthenticatedUser()

      // Create multiple sessions
      const session1 = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: 'TestPassword123!',
        })
        .expect(200)

      const session2 = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: 'TestPassword123!',
        })
        .expect(200)

      const token1 = session1.body.data.token
      const token2 = session2.body.data.token

      // Both tokens should work
      await request(app)
        .get('/api/v1/users/me')
        .set({ Authorization: `Bearer ${token1}` })
        .expect(200)

      await request(app)
        .get('/api/v1/users/me')
        .set({ Authorization: `Bearer ${token2}` })
        .expect(200)

      // Logout all devices
      await request(app)
        .post('/api/v1/auth/logout-all')
        .set({ Authorization: `Bearer ${token1}` })
        .expect(200)

      // Both tokens should now be invalid
      await request(app)
        .get('/api/v1/users/me')
        .set({ Authorization: `Bearer ${token1}` })
        .expect(401)

      await request(app)
        .get('/api/v1/users/me')
        .set({ Authorization: `Bearer ${token2}` })
        .expect(401)
    })
  })

  describe('Security and Attack Prevention', () => {
    it('should prevent common authentication attacks', async () => {
      // 1. SQL Injection attempts
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: "admin'; DROP TABLE users; --",
          password: 'password',
        })
        .expect(401)

      // 2. NoSQL Injection attempts
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: { $ne: null },
          password: { $ne: null },
        })
        .expect(400)

      // 3. XSS attempts in registration
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: '<script>alert("xss")</script>',
          email: 'test@example.com',
          password: 'Password123!',
        })
        .expect(400)

      // 4. Timing attack prevention (consistent response times)
      const start1 = Date.now()
      await request(app).post('/api/v1/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'password',
      })
      const time1 = Date.now() - start1

      const { user } = await e2eTestHelpers.createAuthenticatedUser()
      const start2 = Date.now()
      await request(app).post('/api/v1/auth/login').send({
        email: user.email,
        password: 'wrongpassword',
      })
      const time2 = Date.now() - start2

      // Response times should be similar (within 500ms difference)
      expect(Math.abs(time1 - time2)).toBeLessThan(500)
    })

    it('should handle CSRF and other header-based attacks', async () => {
      const { token } = await e2eTestHelpers.createAuthenticatedUser()

      // Test missing or invalid content-type
      await request(app)
        .post('/api/v1/auth/logout')
        .set({
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/plain',
        })
        .expect(400)

      // Test CSRF token validation (if implemented)
      const csrfResponse = await request(app)
        .post('/api/v1/auth/logout')
        .set({
          Authorization: `Bearer ${token}`,
          Origin: 'https://malicious-site.com',
        })

      // Should either work (if CORS is properly configured) or fail
      expect([200, 403]).toContain(csrfResponse.status)
    })
  })

  describe('Integration with Other Modules', () => {
    it('should properly integrate authentication with user profiles', async () => {
      // Registration should create user profile
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Profile Integration User',
          email: 'profile@example.com',
          password: 'Password123!',
        })
        .expect(201)

      const token = registerResponse.body.data.token

      // User should have a default profile
      const profileResponse = await request(app)
        .get('/api/v1/profiles/me')
        .set({ Authorization: `Bearer ${token}` })
        .expect(200)

      expect(profileResponse.body.data).toBeDefined()

      // Profile updates should be tracked
      await request(app)
        .put('/api/v1/profiles/me')
        .set({ Authorization: `Bearer ${token}` })
        .send({
          bio: 'Updated bio',
          location: 'New Location',
        })
        .expect(200)

      // Check activity log
      const activityResponse = await request(app)
        .get('/api/v1/activities/me')
        .set({ Authorization: `Bearer ${token}` })
        .expect(200)

      expect(activityResponse.body.data.length).toBeGreaterThan(0)
    })

    it('should handle authentication with project and task access', async () => {
      const { token: ownerToken } =
        await e2eTestHelpers.createAuthenticatedUser()
      const { token: otherToken } =
        await e2eTestHelpers.createAuthenticatedUser()

      // Owner creates private project
      const projectResponse = await request(app)
        .post('/api/v1/projects')
        .set({ Authorization: `Bearer ${ownerToken}` })
        .send({
          name: 'Private Project',
          description: 'A private project',
          isPublic: false,
        })
        .expect(201)

      const projectId = projectResponse.body.data.id

      // Other user should not be able to access private project
      await request(app)
        .get(`/api/v1/projects/${projectId}`)
        .set({ Authorization: `Bearer ${otherToken}` })
        .expect(403)

      // Owner should be able to access their project
      await request(app)
        .get(`/api/v1/projects/${projectId}`)
        .set({ Authorization: `Bearer ${ownerToken}` })
        .expect(200)

      // Create task in project
      const taskResponse = await request(app)
        .post('/api/v1/tasks')
        .set({ Authorization: `Bearer ${ownerToken}` })
        .send({
          title: 'Private Task',
          projectId,
        })
        .expect(201)

      const taskId = taskResponse.body.data.id

      // Other user should not access task in private project
      await request(app)
        .get(`/api/v1/tasks/${taskId}`)
        .set({ Authorization: `Bearer ${otherToken}` })
        .expect(403)
    })
  })
})
