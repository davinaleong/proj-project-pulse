import request from 'supertest'
import { createApp } from '../../../../src/app'
import { userTestHelpers, prisma } from './users.helpers'
import { UserStatus, User } from '@prisma/client'

const app = createApp()

describe('Users Email Verification', () => {
  beforeEach(async () => {
    await userTestHelpers.cleanupDatabase()
  })

  afterAll(async () => {
    await userTestHelpers.disconnectDatabase()
  })

  describe('PATCH /api/v1/users/verify-email/:uuid', () => {
    let unverifiedUser: User

    beforeEach(async () => {
      // Create an unverified user
      unverifiedUser = await userTestHelpers.createTestUser({
        name: 'Unverified User',
        email: 'unverified@test.com',
        password: 'Password123!',
        status: UserStatus.PENDING,
        emailVerifiedAt: null,
      })
    })

    it('should verify email successfully', async () => {
      const response = await request(app)
        .patch(`/api/v1/users/verify-email/${unverifiedUser.uuid}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Email verified successfully')

      // Verify user is now active
      const verifiedUser = await prisma.user.findFirst({
        where: { uuid: unverifiedUser.uuid },
      })
      expect(verifiedUser?.emailVerifiedAt).not.toBeNull()
      expect(verifiedUser?.status).toBe(UserStatus.ACTIVE)
    })

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .patch(
          '/api/v1/users/verify-email/00000000-0000-0000-0000-000000000000',
        )
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('User not found')
    })

    it('should return 400 for already verified user', async () => {
      // First verify the user
      await request(app)
        .patch(`/api/v1/users/verify-email/${unverifiedUser.uuid}`)
        .expect(200)

      // Try to verify again
      const response = await request(app)
        .patch(`/api/v1/users/verify-email/${unverifiedUser.uuid}`)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Email is already verified')
    })

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app)
        .patch('/api/v1/users/verify-email/invalid-uuid')
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Invalid UUID format')
    })

    it('should verify email for user with different status', async () => {
      // Create a banned user that needs verification
      const bannedUser = await userTestHelpers.createTestUser({
        name: 'Banned User',
        email: 'banned@test.com',
        password: 'Password123!',
        status: UserStatus.BANNED,
        emailVerifiedAt: null,
      })

      const response = await request(app)
        .patch(`/api/v1/users/verify-email/${bannedUser.uuid}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Email verified successfully')

      // Verify email is verified but status remains banned
      const verifiedUser = await prisma.user.findFirst({
        where: { uuid: bannedUser.uuid },
      })
      expect(verifiedUser?.emailVerifiedAt).not.toBeNull()
      expect(verifiedUser?.status).toBe(UserStatus.BANNED) // Status should remain unchanged
    })
  })

  describe('Email Verification Integration', () => {
    it('should allow login after email verification', async () => {
      const unverifiedUser = await userTestHelpers.createTestUser({
        name: 'Login Test User',
        email: 'logintest@test.com',
        password: 'Password123!',
        status: UserStatus.PENDING,
        emailVerifiedAt: null,
      })

      // Try to login before verification (should fail)
      const loginBeforeResponse = await request(app)
        .post('/api/v1/users/login')
        .send({
          email: 'logintest@test.com',
          password: 'Password123!',
        })
        .expect(401)

      expect(loginBeforeResponse.body.success).toBe(false)
      expect(loginBeforeResponse.body.message).toBe(
        'Please verify your email first',
      )

      // Verify email
      await request(app)
        .patch(`/api/v1/users/verify-email/${unverifiedUser.uuid}`)
        .expect(200)

      // Try to login after verification (should succeed)
      const loginAfterResponse = await request(app)
        .post('/api/v1/users/login')
        .send({
          email: 'logintest@test.com',
          password: 'Password123!',
        })
        .expect(200)

      expect(loginAfterResponse.body.success).toBe(true)
      expect(loginAfterResponse.body.data.token).toBeDefined()
    })
  })
})
