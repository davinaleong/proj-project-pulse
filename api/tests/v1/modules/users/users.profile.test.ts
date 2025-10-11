import request from 'supertest'
import { createApp } from '../../../../src/app'
import { userTestHelpers } from './users.helpers'

const app = createApp()

describe('Users Profile', () => {
  let userToken: string
  let adminToken: string

  beforeEach(async () => {
    await userTestHelpers.cleanupDatabase()
    const { userToken: uToken, adminToken: aToken } =
      await userTestHelpers.setupTestUsers()
    userToken = uToken
    adminToken = aToken
  })

  afterAll(async () => {
    await userTestHelpers.disconnectDatabase()
  })

  describe('GET /api/v1/users/me', () => {
    it('should get current user profile', async () => {
      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.email).toBe('user@test.com')
      expect(response.body.data.name).toBe('Regular User')
      expect(response.body.data.role).toBe('USER')
    })

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/v1/users/me').expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Access denied. No token provided.')
    })
  })

  describe('PATCH /api/v1/users/me/password', () => {
    it('should change password successfully', async () => {
      const passwordData = {
        currentPassword: 'AdminPass123!',
        newPassword: 'NewAdminPass123!',
        confirmPassword: 'NewAdminPass123!',
      }

      const response = await request(app)
        .patch('/api/v1/users/me/password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(passwordData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Password changed successfully')

      // Verify new password works
      const loginResponse = await request(app)
        .post('/api/v1/users/login')
        .send({
          email: 'admin@test.com',
          password: 'NewAdminPass123!',
        })
        .expect(200)

      expect(loginResponse.body.success).toBe(true)
    })

    it('should return 400 for incorrect current password', async () => {
      const passwordData = {
        currentPassword: 'WrongCurrentPassword',
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!',
      }

      const response = await request(app)
        .patch('/api/v1/users/me/password')
        .set('Authorization', `Bearer ${userToken}`)
        .send(passwordData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Current password is incorrect')
    })

    it('should return 400 for mismatched password confirmation', async () => {
      const passwordData = {
        currentPassword: 'UserPass123!',
        newPassword: 'NewPassword123!',
        confirmPassword: 'DifferentPassword123!',
      }

      const response = await request(app)
        .patch('/api/v1/users/me/password')
        .set('Authorization', `Bearer ${userToken}`)
        .send(passwordData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Validation failed')
    })

    it('should return 401 without authentication', async () => {
      const passwordData = {
        currentPassword: 'UserPass123!',
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!',
      }

      const response = await request(app)
        .patch('/api/v1/users/me/password')
        .send(passwordData)
        .expect(401)

      expect(response.body.success).toBe(false)
    })
  })
})
