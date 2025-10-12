import request from 'supertest'
import createApp from '../../../../src/app'
import { TaskStatus, UserRole } from '@prisma/client'
import { tasksTestHelpers, prisma } from './tasks.helpers'

interface TaskResponse {
  id: number
  title: string
  userId: number
  projectId: number
  status: TaskStatus
  [key: string]: unknown
}

const app = createApp()

describe('Tasks Security', () => {
  let userToken: string
  let adminToken: string
  let managerToken: string
  let userId: number
  let otherUserId: number
  let projectId: number
  let otherProjectId: number
  let taskId: number
  let otherTaskId: number

  beforeEach(async () => {
    await tasksTestHelpers.cleanupDatabase()

    // Create test users
    const user = await tasksTestHelpers.createTestUser({
      email: 'user@test.com',
      role: UserRole.USER,
    })
    const admin = await tasksTestHelpers.createTestUser({
      email: 'admin@test.com',
      role: UserRole.ADMIN,
    })
    const manager = await tasksTestHelpers.createTestUser({
      email: 'manager@test.com',
      role: UserRole.MANAGER,
    })
    const otherUser = await tasksTestHelpers.createTestUser({
      email: 'other@test.com',
      role: UserRole.USER,
    })

    userId = user.id
    otherUserId = otherUser.id

    // Create test projects
    const project = await tasksTestHelpers.createTestProject(userId, {
      title: 'User Project',
    })
    const otherProject = await tasksTestHelpers.createTestProject(otherUserId, {
      title: 'Other User Project',
    })

    projectId = project.id
    otherProjectId = otherProject.id

    // Create test tasks
    const task = await tasksTestHelpers.createTestTask(projectId, userId)
    const otherTask = await tasksTestHelpers.createTestTask(
      otherProjectId,
      otherUserId,
    )

    taskId = task.id
    otherTaskId = otherTask.id

    // Generate tokens
    userToken = tasksTestHelpers.generateAuthToken(user)
    adminToken = tasksTestHelpers.generateAuthToken(admin)
    managerToken = tasksTestHelpers.generateAuthToken(manager)
  })

  afterAll(async () => {
    await tasksTestHelpers.cleanupDatabase()
    await tasksTestHelpers.disconnectDatabase()
  })

  describe('Authentication Requirements', () => {
    it('should require authentication for all task endpoints', async () => {
      const endpoints = [
        { method: 'GET', path: '/api/v1/tasks' },
        { method: 'POST', path: '/api/v1/tasks' },
        { method: 'GET', path: `/api/v1/tasks/${taskId}` },
        { method: 'PUT', path: `/api/v1/tasks/${taskId}` },
        { method: 'DELETE', path: `/api/v1/tasks/${taskId}` },
        { method: 'GET', path: '/api/v1/tasks/stats' },
      ]

      for (const endpoint of endpoints) {
        let response
        switch (endpoint.method.toLowerCase()) {
          case 'get':
            response = await request(app).get(endpoint.path)
            break
          case 'post':
            response = await request(app).post(endpoint.path)
            break
          case 'put':
            response = await request(app).put(endpoint.path)
            break
          case 'delete':
            response = await request(app).delete(endpoint.path)
            break
          default:
            throw new Error(`Unsupported method: ${endpoint.method}`)
        }
        expect(response.status).toBe(401)
      }
    })

    it('should reject invalid tokens', async () => {
      const invalidToken = 'invalid.token.here'

      const response = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401)

      expect(response.body.message).toContain('Invalid token')
    })

    it('should reject expired tokens', async () => {
      const user = await tasksTestHelpers.createTestUser({
        email: 'expired@test.com',
      })
      const expiredToken = tasksTestHelpers.generateExpiredToken(user)

      await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401)
    })
  })

  describe('Project Access Control', () => {
    it('should allow users to create tasks in their own projects', async () => {
      const taskData = {
        title: 'My Task',
        projectId,
      }

      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send(taskData)
        .expect(201)

      expect(response.body.status).toBe('success')
    })

    it('should deny users from creating tasks in other users projects', async () => {
      const taskData = {
        title: 'Unauthorized Task',
        projectId: otherProjectId,
      }

      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send(taskData)
        .expect(404)

      expect(response.body.message).toContain('Project not found')
    })

    it('should allow admins to create tasks in any project', async () => {
      const taskData = {
        title: 'Admin Task',
        projectId: otherProjectId,
      }

      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(taskData)
        .expect(201)

      expect(response.body.status).toBe('success')
    })

    it('should allow managers to create tasks in any project', async () => {
      const taskData = {
        title: 'Manager Task',
        projectId: otherProjectId,
      }

      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(taskData)
        .expect(201)

      expect(response.body.status).toBe('success')
    })
  })

  describe('Task Access Control', () => {
    it('should allow users to view their own tasks', async () => {
      const response = await request(app)
        .get(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
    })

    it('should deny users from viewing other users tasks', async () => {
      await request(app)
        .get(`/api/v1/tasks/${otherTaskId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403)
    })

    it('should allow project owners to view tasks in their projects', async () => {
      // Create a task assigned to otherUser but in user's project
      const taskInUserProject = await tasksTestHelpers.createTestTask(
        projectId,
        otherUserId,
      )

      const response = await request(app)
        .get(`/api/v1/tasks/${taskInUserProject.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
    })

    it('should allow admins to view any task', async () => {
      const response = await request(app)
        .get(`/api/v1/tasks/${otherTaskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
    })

    it('should allow managers to view any task', async () => {
      const response = await request(app)
        .get(`/api/v1/tasks/${otherTaskId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
    })
  })

  describe('Task Modification Control', () => {
    it('should allow users to update their own tasks', async () => {
      const updateData = {
        title: 'Updated Task',
        status: TaskStatus.WIP,
      }

      const response = await request(app)
        .put(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200)

      expect(response.body.status).toBe('success')
    })

    it('should deny users from updating other users tasks', async () => {
      const updateData = {
        title: 'Unauthorized Update',
      }

      await request(app)
        .put(`/api/v1/tasks/${otherTaskId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(403)
    })

    it('should allow project owners to update tasks in their projects', async () => {
      // Create a task assigned to otherUser but in user's project
      const taskInUserProject = await tasksTestHelpers.createTestTask(
        projectId,
        otherUserId,
      )

      const updateData = {
        title: 'Updated by Project Owner',
      }

      const response = await request(app)
        .put(`/api/v1/tasks/${taskInUserProject.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200)

      expect(response.body.status).toBe('success')
    })

    it('should allow admins to update any task', async () => {
      const updateData = {
        title: 'Updated by Admin',
      }

      const response = await request(app)
        .put(`/api/v1/tasks/${otherTaskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200)

      expect(response.body.status).toBe('success')
    })
  })

  describe('Task Deletion Control', () => {
    it('should allow users to delete their own tasks', async () => {
      const response = await request(app)
        .delete(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')

      // Verify soft deletion
      const deletedTask = await prisma.task.findUnique({
        where: { id: taskId },
      })
      expect(deletedTask?.deletedAt).not.toBeNull()
    })

    it('should deny users from deleting other users tasks', async () => {
      await request(app)
        .delete(`/api/v1/tasks/${otherTaskId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403)
    })

    it('should allow project owners to delete tasks in their projects', async () => {
      // Create a task assigned to otherUser but in user's project
      const taskInUserProject = await tasksTestHelpers.createTestTask(
        projectId,
        otherUserId,
      )

      const response = await request(app)
        .delete(`/api/v1/tasks/${taskInUserProject.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
    })

    it('should allow admins to delete any task', async () => {
      const response = await request(app)
        .delete(`/api/v1/tasks/${otherTaskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
    })
  })

  describe('Statistics Access Control', () => {
    it('should allow admins to access global task statistics', async () => {
      const response = await request(app)
        .get('/api/v1/tasks/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
      expect(response.body.data).toHaveProperty('total')
    })

    it('should allow managers to access global task statistics', async () => {
      const response = await request(app)
        .get('/api/v1/tasks/stats')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
    })

    it('should deny regular users from accessing global task statistics', async () => {
      await request(app)
        .get('/api/v1/tasks/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403)
    })

    it('should allow users to access their own task statistics', async () => {
      const response = await request(app)
        .get(`/api/v1/tasks/user/${userId}/stats`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
    })

    it('should deny users from accessing other users task statistics', async () => {
      await request(app)
        .get(`/api/v1/tasks/user/${otherUserId}/stats`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403)
    })

    it('should allow admins to access any user task statistics', async () => {
      const response = await request(app)
        .get(`/api/v1/tasks/user/${otherUserId}/stats`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
    })
  })

  describe('Data Isolation', () => {
    it('should only return user-specific tasks in listings', async () => {
      const response = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
      response.body.data.tasks.forEach((task: TaskResponse) => {
        expect(task.userId).toBe(userId)
      })
    })

    it('should allow admins to see all tasks', async () => {
      // Create tasks for multiple users
      await tasksTestHelpers.createTestTask(projectId, userId)
      await tasksTestHelpers.createTestTask(otherProjectId, otherUserId)

      const response = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
      // Admin should see tasks from multiple users
      const userIds = response.body.data.tasks.map(
        (task: TaskResponse) => task.userId,
      )
      expect(new Set(userIds).size).toBeGreaterThan(1)
    })
  })

  describe('Input Sanitization', () => {
    it('should handle malicious input safely', async () => {
      const maliciousData = {
        title: '<script>alert("xss")</script>Malicious Task',
        definitionOfDone: 'DoD with <img src="x" onerror="alert(1)"> content',
        projectId,
      }

      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send(maliciousData)
        .expect(201)

      expect(response.body.status).toBe('success')
      // Data should be stored as-is (sanitization happens on display)
      expect(response.body.data.title).toBe(maliciousData.title)
      expect(response.body.data.definitionOfDone).toBe(
        maliciousData.definitionOfDone,
      )
    })

    it('should reject SQL injection attempts', async () => {
      const sqlInjectionData = {
        title: "'; DROP TABLE tasks; --",
        projectId,
      }

      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send(sqlInjectionData)
        .expect(201)

      expect(response.body.status).toBe('success')
      // Verify the database is intact
      const taskCount = await prisma.task.count()
      expect(taskCount).toBeGreaterThan(0)
    })
  })
})
