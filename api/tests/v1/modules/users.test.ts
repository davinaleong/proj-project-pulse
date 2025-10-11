import request from 'supertest'
import { createApp } from '../../../src/app'
import prisma from '../../../src/config/db'
import { Application } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

describe('Users Module', () => {
  let app: Application
  let adminToken: string
  let userToken: string
  let managerToken: string
  let testUserUuid: string

  beforeAll(async () => {
    app = createApp()

    // Create admin user
    const hashedPassword = await bcrypt.hash('AdminPass123!', 12)
    const adminUser = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@test.com',
        password: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
      },
    })
    adminToken = jwt.sign(
      { uuid: adminUser.uuid, email: adminUser.email, role: adminUser.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' },
    )

    // Create manager user
    const managerUser = await prisma.user.create({
      data: {
        name: 'Manager User',
        email: 'manager@test.com',
        password: hashedPassword,
        role: 'MANAGER',
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
      },
    })
    managerToken = jwt.sign(
      {
        uuid: managerUser.uuid,
        email: managerUser.email,
        role: managerUser.role,
      },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' },
    )

    // Create regular test user
    const testUser = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'user@test.com',
        password: hashedPassword,
        role: 'USER',
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
      },
    })
    testUserUuid = testUser.uuid
    userToken = jwt.sign(
      { uuid: testUser.uuid, email: testUser.email, role: testUser.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' },
    )
  })

  afterAll(async () => {
    // Clean up test data
    await prisma.passwordResetToken.deleteMany()
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })

  describe('POST /api/v1/users/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'New User',
        email: 'newuser@test.com',
        password: 'NewUserPass123!',
        role: 'USER',
      }

      const response = await request(app)
        .post('/api/v1/users/register')
        .send(userData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('User created successfully')
      expect(response.body.data.name).toBe(userData.name)
      expect(response.body.data.email).toBe(userData.email.toLowerCase())
      expect(response.body.data.role).toBe(userData.role)
      expect(response.body.data.status).toBe('PENDING')
      expect(response.body.data.uuid).toBeDefined()
      expect(response.body.data.password).toBeUndefined() // Password should not be returned
    })

    it('should return 400 for invalid user data', async () => {
      const invalidData = {
        name: '', // empty name
        email: 'invalid-email',
        password: '123', // weak password
      }

      const response = await request(app)
        .post('/api/v1/users/register')
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Invalid user data')
      expect(response.body.error).toBeDefined()
    })

    it('should return 409 for duplicate email', async () => {
      const userData = {
        name: 'Duplicate User',
        email: 'admin@test.com', // Email already exists
        password: 'DuplicatePass123!',
      }

      const response = await request(app)
        .post('/api/v1/users/register')
        .send(userData)
        .expect(409)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Email already exists')
    })
  })

  describe('POST /api/v1/users/login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'admin@test.com',
        password: 'AdminPass123!',
      }

      const response = await request(app)
        .post('/api/v1/users/login')
        .send(loginData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Login successful')
      expect(response.body.data.user.email).toBe(loginData.email)
      expect(response.body.data.token).toBeDefined()
    })

    it('should return 401 for invalid credentials', async () => {
      const loginData = {
        email: 'admin@test.com',
        password: 'WrongPassword',
      }

      const response = await request(app)
        .post('/api/v1/users/login')
        .send(loginData)
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Invalid email or password')
    })

    it('should return 401 for non-existent user', async () => {
      const loginData = {
        email: 'nonexistent@test.com',
        password: 'SomePassword123!',
      }

      const response = await request(app)
        .post('/api/v1/users/login')
        .send(loginData)
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Invalid email or password')
    })

    it('should return 400 for invalid login data format', async () => {
      const loginData = {
        email: 'invalid-email',
        password: '',
      }

      const response = await request(app)
        .post('/api/v1/users/login')
        .send(loginData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Invalid login data')
    })
  })

  describe('GET /api/v1/users/me', () => {
    it('should get current user profile', async () => {
      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.email).toBe('user@test.com')
      expect(response.body.data.name).toBe('Test User')
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
  })

  describe('POST /api/v1/users/forgot-password', () => {
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
  })

  describe('POST /api/v1/users/reset-password', () => {
    beforeAll(async () => {
      // Create a reset token for testing
      const user = await prisma.user.findFirst({
        where: { email: 'admin@test.com' },
      })
      if (user) {
        await prisma.passwordResetToken.create({
          data: {
            userId: user.id,
            token: 'test-reset-token',
            expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
          },
        })
      }
    })

    it('should reset password with valid token', async () => {
      const resetData = {
        token: 'test-reset-token',
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
  })

  describe('PATCH /api/v1/users/verify-email/:uuid', () => {
    beforeAll(async () => {
      // Create an unverified user
      await prisma.user.create({
        data: {
          name: 'Unverified User',
          email: 'unverified@test.com',
          password: await bcrypt.hash('Password123!', 12),
          role: 'USER',
          status: 'PENDING',
          emailVerifiedAt: null,
        },
      })
    })

    it('should verify email successfully', async () => {
      const unverifiedUser = await prisma.user.findFirst({
        where: { email: 'unverified@test.com' },
      })

      const response = await request(app)
        .patch(`/api/v1/users/verify-email/${unverifiedUser?.uuid}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Email verified successfully')

      // Verify user is now active
      const verifiedUser = await prisma.user.findFirst({
        where: { uuid: unverifiedUser?.uuid },
      })
      expect(verifiedUser?.emailVerifiedAt).not.toBeNull()
      expect(verifiedUser?.status).toBe('ACTIVE')
    })
  })

  describe('Account Security', () => {
    it('should lock account after 5 failed login attempts', async () => {
      // Create a test user for this test
      await prisma.user.create({
        data: {
          name: 'Lock Test User',
          email: 'locktest@test.com',
          password: await bcrypt.hash('CorrectPassword123!', 12),
          role: 'USER',
          status: 'ACTIVE',
        },
      })

      // Make 5 failed login attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/v1/users/login')
          .send({
            email: 'locktest@test.com',
            password: 'WrongPassword',
          })
          .expect(401)
      }

      // 6th attempt should result in account lock
      const response = await request(app)
        .post('/api/v1/users/login')
        .send({
          email: 'locktest@test.com',
          password: 'WrongPassword',
        })
        .expect(423)

      expect(response.body.message).toContain('locked')
    })
  })

  describe('Permission Checks', () => {
    it('should check user permissions correctly', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${testUserUuid}/permissions?role=ADMIN`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.hasPermission).toBe(false) // Regular user doesn't have admin permission
    })
  })
})
