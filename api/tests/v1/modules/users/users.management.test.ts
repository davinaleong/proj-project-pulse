import request from 'supertest'
import { createApp } from '../../../../src/app'
import { userTestHelpers, prisma } from './users.helpers'

const app = createApp()

describe('Users Management', () => {
  let adminToken: string
  let managerToken: string
  let userToken: string
  let testUserUuid: string

  beforeEach(async () => {
    await userTestHelpers.cleanupDatabase()
    const {
      adminToken: aToken,
      managerToken: mToken,
      userToken: uToken,
      regularUser,
    } = await userTestHelpers.setupTestUsers()

    adminToken = aToken
    managerToken = mToken
    userToken = uToken
    testUserUuid = regularUser.uuid
  })

  afterAll(async () => {
    await userTestHelpers.disconnectDatabase()
  })

  describe('GET /api/v1/users', () => {
    it('should get users list for admin', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.data).toBeInstanceOf(Array)
      expect(response.body.data.pagination).toBeDefined()
      expect(response.body.data.pagination.total).toBeGreaterThan(0)
    })

    it('should get users list for manager', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    it('should return 403 for regular user', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Manager or Admin access required.')
    })

    it('should filter users by role', async () => {
      const response = await request(app)
        .get('/api/v1/users?role=ADMIN')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(
        response.body.data.data.every(
          (user: { role: string }) => user.role === 'ADMIN',
        ),
      ).toBe(true)
    })

    it('should search users by name', async () => {
      const response = await request(app)
        .get('/api/v1/users?search=Admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(
        response.body.data.data.some((user: { name: string }) =>
          user.name.includes('Admin'),
        ),
      ).toBe(true)
    })

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/v1/users').expect(401)

      expect(response.body.success).toBe(false)
    })
  })

  describe('GET /api/v1/users/:uuid', () => {
    it('should get user by UUID for admin', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${testUserUuid}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.uuid).toBe(testUserUuid)
      expect(response.body.data.email).toBe('user@test.com')
    })

    it('should get user by UUID for manager', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${testUserUuid}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.uuid).toBe(testUserUuid)
    })

    it('should return 403 for regular user accessing other user', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${testUserUuid}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403)

      expect(response.body.success).toBe(false)
    })

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/v1/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('User not found')
    })
  })

  describe('PATCH /api/v1/users/:uuid', () => {
    it('should update user for admin', async () => {
      const updateData = {
        name: 'Updated Test User',
        status: 'INACTIVE',
      }

      const response = await request(app)
        .patch(`/api/v1/users/${testUserUuid}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.name).toBe(updateData.name)
      expect(response.body.data.status).toBe(updateData.status)
    })

    it('should return 409 for duplicate email', async () => {
      const updateData = {
        email: 'admin@test.com', // Email already exists
      }

      const response = await request(app)
        .patch(`/api/v1/users/${testUserUuid}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(409)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Email already exists')
    })

    it('should return 403 for regular user', async () => {
      const updateData = {
        name: 'Unauthorized Update',
      }

      const response = await request(app)
        .patch(`/api/v1/users/${testUserUuid}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(403)

      expect(response.body.success).toBe(false)
    })
  })

  describe('DELETE /api/v1/users/:uuid', () => {
    it('should return 403 for manager (admin only)', async () => {
      const response = await request(app)
        .delete(`/api/v1/users/${testUserUuid}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Admin access required.')
    })

    it('should soft delete user for admin', async () => {
      const response = await request(app)
        .delete(`/api/v1/users/${testUserUuid}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('User deleted successfully')

      // Verify user is soft deleted
      const deletedUser = await prisma.user.findFirst({
        where: { uuid: testUserUuid },
      })
      expect(deletedUser?.deletedAt).not.toBeNull()
    })

    it('should return 403 for regular user', async () => {
      const response = await request(app)
        .delete(`/api/v1/users/${testUserUuid}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403)

      expect(response.body.success).toBe(false)
    })

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .delete('/api/v1/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('User not found')
    })
  })
})
