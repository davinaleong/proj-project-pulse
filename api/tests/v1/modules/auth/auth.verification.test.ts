import request from 'supertest'
import { createApp } from '../../../../src/app'
import { testHelpers, prisma } from './auth.helpers'
import { UserStatus } from '@prisma/client'

const app = createApp()

describe('Auth Email Verification', () => {
  beforeEach(async () => {
    await testHelpers.cleanupDatabase()
  })

  afterAll(async () => {
    await testHelpers.disconnectDatabase()
  })

  describe('POST /api/v1/auth/verify-email', () => {
    let verificationToken: string
    let userId: number

    beforeEach(async () => {
      // Create unverified user
      const user = await testHelpers.createTestUser({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'TestPassword123!',
        status: UserStatus.PENDING,
        emailVerifiedAt: null,
      })
      userId = user.id

      // Create verification token
      verificationToken = 'valid-verification-token'
      await testHelpers.createVerificationToken(userId, verificationToken)
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
      expect(user?.status).toBe(UserStatus.ACTIVE)
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
