import request from 'supertest'
import { createApp } from '../../../../src/app'
import { userTestHelpers } from './users.helpers'

const app = createApp()

describe('Users Authentication', () => {
  beforeEach(async () => {
    await userTestHelpers.cleanupDatabase()
  })

  afterAll(async () => {
    await userTestHelpers.disconnectDatabase()
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
      await userTestHelpers.createAdminUser()

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
    beforeEach(async () => {
      await userTestHelpers.createAdminUser()
    })

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
})
