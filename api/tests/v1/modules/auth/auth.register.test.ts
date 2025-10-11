import request from 'supertest'
import { createApp } from '../../../../src/app'
import { testHelpers } from './auth.helpers'

const app = createApp()

describe('Auth Registration', () => {
  beforeEach(async () => {
    await testHelpers.cleanupDatabase()
  })

  afterAll(async () => {
    await testHelpers.disconnectDatabase()
  })

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
      }

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('Registration successful')
      expect(response.body.data).toHaveProperty('email', userData.email)
      expect(response.body.data).toHaveProperty('name', userData.name)
      expect(response.body.data).not.toHaveProperty('password')
    })

    it('should reject registration with invalid email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
      }

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Validation failed')
      expect(response.body.error).toBeDefined()
    })

    it('should reject registration with weak password', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: '123',
        confirmPassword: '123',
      }

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Validation failed')
    })

    it('should reject registration with mismatched passwords', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'TestPassword123!',
        confirmPassword: 'DifferentPassword123!',
      }

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Validation failed')
    })

    it('should reject registration with duplicate email', async () => {
      // Create a user first
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
      }

      await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201)

      // Try to register with same email
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('already exists')
    })
  })
})
