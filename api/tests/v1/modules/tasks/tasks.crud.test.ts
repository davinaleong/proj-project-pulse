import request from 'supertest'
import createApp from '../../../../src/app'
import { TaskStatus } from '@prisma/client'
import { tasksTestHelpers, prisma } from './tasks.helpers'

const app = createApp()

interface TaskResponse {
  id: number
  title: string
  status: TaskStatus
  projectId: number
  userId?: number
}

describe('Tasks CRUD Operations', () => {
  let authToken: string
  let adminToken: string
  let userId: number
  let projectId: number

  beforeEach(async () => {
    await tasksTestHelpers.cleanupDatabase()

    const testData = await tasksTestHelpers.setupTestData()
    authToken = testData.authToken
    adminToken = testData.adminToken
    userId = testData.user.id
    projectId = testData.project.id
  })

  afterAll(async () => {
    await tasksTestHelpers.cleanupDatabase()
    await tasksTestHelpers.disconnectDatabase()
  })

  describe('POST /api/v1/tasks - Create Task', () => {
    it('should create a new task with valid data', async () => {
      const taskData = {
        title: 'New Test Task',
        definitionOfDone: 'A comprehensive test task',
        status: TaskStatus.BACKLOG,
        projectId,
      }

      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(201)

      expect(response.body.status).toBe('success')
      expect(response.body.data).toEqual(
        expect.objectContaining({
          title: taskData.title,
          definitionOfDone: taskData.definitionOfDone,
          status: taskData.status,
          projectId: taskData.projectId,
          userId,
        }),
      )
      expect(response.body.data.uuid).toBeDefined()
      expect(response.body.data.createdAt).toBeDefined()
    })

    it('should create a task with minimal required fields', async () => {
      const taskData = {
        title: 'Minimal Task',
        projectId,
      }

      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(201)

      expect(response.body.status).toBe('success')
      expect(response.body.data.title).toBe(taskData.title)
      expect(response.body.data.status).toBe(TaskStatus.BACKLOG) // Default status
      expect(response.body.data.definitionOfDone).toBeNull()
    })

    it('should create a task with time tracking data', async () => {
      const taskData = {
        title: 'Time Tracked Task',
        definitionOfDone: 'Task with time tracking',
        status: TaskStatus.WIP,
        startedAt: new Date().toISOString(),
        timeSpent: 2.5,
        costInProjectCurrency: 125.0,
        projectId,
      }

      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(201)

      expect(response.body.status).toBe('success')
      expect(response.body.data.timeSpent).toBeDefined()
      expect(response.body.data.costInProjectCurrency).toBeDefined()
      expect(response.body.data.startedAt).toBeDefined()
    })

    it('should fail to create task without title', async () => {
      const taskData = {
        definitionOfDone: 'Task without title',
        projectId,
      }

      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(400)

      expect(response.body.status).toBe('error')
      expect(response.body.message).toContain('Title is required')
    })

    it('should fail to create task without projectId', async () => {
      const taskData = {
        title: 'Task without project',
        definitionOfDone: 'Task without project',
      }

      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(400)

      expect(response.body.status).toBe('error')
    })

    it('should fail to create task with non-existent projectId', async () => {
      const taskData = {
        title: 'Task with invalid project',
        projectId: 99999,
      }

      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(404)

      expect(response.body.status).toBe('error')
      expect(response.body.message).toContain('Project not found')
    })

    it('should fail without authentication', async () => {
      const taskData = {
        title: 'Unauthorized Task',
        projectId,
      }

      await request(app).post('/api/v1/tasks').send(taskData).expect(401)
    })
  })

  describe('GET /api/v1/tasks - List Tasks', () => {
    beforeEach(async () => {
      await tasksTestHelpers.createMultipleTasks(projectId, userId, 5)
    })

    it('should retrieve user tasks with default pagination', async () => {
      const response = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
      expect(response.body.data.tasks).toHaveLength(5)
      expect(response.body.data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 5,
        totalPages: 1,
      })
    })

    it('should filter tasks by status', async () => {
      const response = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: TaskStatus.WIP })
        .expect(200)

      expect(response.body.status).toBe('success')
      response.body.data.tasks.forEach((task: TaskResponse) => {
        expect(task.status).toBe(TaskStatus.WIP)
      })
    })

    it('should filter tasks by project', async () => {
      const response = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ projectId })
        .expect(200)

      expect(response.body.status).toBe('success')
      response.body.data.tasks.forEach((task: TaskResponse) => {
        expect(task.projectId).toBe(projectId)
      })
    })

    it('should search tasks by title', async () => {
      const response = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ search: 'Task 1' })
        .expect(200)

      expect(response.body.status).toBe('success')
      expect(response.body.data.tasks.length).toBeGreaterThan(0)
      response.body.data.tasks.forEach((task: TaskResponse) => {
        expect(task.title.toLowerCase()).toContain('task 1')
      })
    })

    it('should paginate results correctly', async () => {
      const response = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 2 })
        .expect(200)

      expect(response.body.status).toBe('success')
      expect(response.body.data.tasks).toHaveLength(2)
      expect(response.body.data.pagination).toEqual({
        page: 1,
        limit: 2,
        total: 5,
        totalPages: 3,
      })
    })

    it('should sort tasks by different fields', async () => {
      const response = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ sortBy: 'title', sortOrder: 'asc' })
        .expect(200)

      expect(response.body.status).toBe('success')
      const titles = response.body.data.tasks.map(
        (task: TaskResponse) => task.title,
      )
      expect(titles).toEqual([...titles].sort())
    })
  })

  describe('GET /api/v1/tasks/:id - Get Task by ID', () => {
    let taskId: number

    beforeEach(async () => {
      const task = await tasksTestHelpers.createTestTask(projectId, userId)
      taskId = task.id
    })

    it('should retrieve a task by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
      expect(response.body.data.id).toBe(taskId)
      expect(response.body.data.user).toEqual({
        id: userId,
        name: expect.any(String),
        email: expect.any(String),
      })
      expect(response.body.data.project).toEqual({
        id: projectId,
        uuid: expect.any(String),
        title: expect.any(String),
      })
    })

    it('should fail with invalid task ID', async () => {
      await request(app)
        .get('/api/v1/tasks/invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)
    })

    it('should fail with non-existent task ID', async () => {
      await request(app)
        .get('/api/v1/tasks/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)
    })

    it('should fail without authentication', async () => {
      await request(app).get(`/api/v1/tasks/${taskId}`).expect(401)
    })
  })

  describe('GET /api/v1/tasks/uuid/:uuid - Get Task by UUID', () => {
    let taskUuid: string

    beforeEach(async () => {
      const task = await tasksTestHelpers.createTestTask(projectId, userId)
      taskUuid = task.uuid
    })

    it('should retrieve a task by UUID', async () => {
      const response = await request(app)
        .get(`/api/v1/tasks/uuid/${taskUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
      expect(response.body.data.uuid).toBe(taskUuid)
    })

    it('should fail with invalid UUID format', async () => {
      await request(app)
        .get('/api/v1/tasks/uuid/invalid-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)
    })

    it('should fail with non-existent UUID', async () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000'
      await request(app)
        .get(`/api/v1/tasks/uuid/${validUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)
    })
  })

  describe('PUT /api/v1/tasks/:id - Update Task', () => {
    let taskId: number

    beforeEach(async () => {
      const task = await tasksTestHelpers.createTestTask(projectId, userId)
      taskId = task.id
    })

    it('should update task with valid data', async () => {
      const updateData = {
        title: 'Updated Task Title',
        definitionOfDone: 'Updated definition of done',
        status: TaskStatus.WIP,
        timeSpent: 3.5,
        costInProjectCurrency: 175.0,
      }

      const response = await request(app)
        .put(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200)

      expect(response.body.status).toBe('success')
      expect(response.body.data.title).toBe(updateData.title)
      expect(response.body.data.status).toBe(updateData.status)
      expect(response.body.data.definitionOfDone).toBe(
        updateData.definitionOfDone,
      )
    })

    it('should partially update task', async () => {
      const updateData = {
        status: TaskStatus.DONE,
        endedAt: new Date().toISOString(),
      }

      const response = await request(app)
        .put(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200)

      expect(response.body.status).toBe('success')
      expect(response.body.data.status).toBe(updateData.status)
      expect(response.body.data.endedAt).toBeDefined()
    })

    it('should fail with invalid task ID', async () => {
      await request(app)
        .put('/api/v1/tasks/invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated' })
        .expect(400)
    })

    it('should fail with non-existent task ID', async () => {
      await request(app)
        .put('/api/v1/tasks/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated' })
        .expect(404)
    })

    it('should fail without authentication', async () => {
      await request(app)
        .put(`/api/v1/tasks/${taskId}`)
        .send({ title: 'Updated' })
        .expect(401)
    })
  })

  describe('DELETE /api/v1/tasks/:id - Delete Task', () => {
    let taskId: number

    beforeEach(async () => {
      const task = await tasksTestHelpers.createTestTask(projectId, userId)
      taskId = task.id
    })

    it('should soft delete a task', async () => {
      const response = await request(app)
        .delete(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
      expect(response.body.message).toContain('deleted successfully')

      // Verify task is soft deleted
      const deletedTask = await prisma.task.findUnique({
        where: { id: taskId },
      })
      expect(deletedTask?.deletedAt).not.toBeNull()
    })

    it('should fail with invalid task ID', async () => {
      await request(app)
        .delete('/api/v1/tasks/invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)
    })

    it('should fail with non-existent task ID', async () => {
      await request(app)
        .delete('/api/v1/tasks/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)
    })

    it('should fail without authentication', async () => {
      await request(app).delete(`/api/v1/tasks/${taskId}`).expect(401)
    })
  })

  describe('GET /api/v1/tasks/project/:projectId - Get Project Tasks', () => {
    beforeEach(async () => {
      await tasksTestHelpers.createMultipleTasks(projectId, userId, 3)
    })

    it('should retrieve all tasks for a project', async () => {
      const response = await request(app)
        .get(`/api/v1/tasks/project/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
      expect(response.body.data.tasks).toHaveLength(3)
      response.body.data.tasks.forEach((task: TaskResponse) => {
        expect(task.projectId).toBe(projectId)
      })
    })

    it('should fail with invalid project ID', async () => {
      await request(app)
        .get('/api/v1/tasks/project/invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)
    })

    it('should fail with non-existent project ID', async () => {
      await request(app)
        .get('/api/v1/tasks/project/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)
    })
  })

  describe('GET /api/v1/tasks/stats - Get Task Statistics', () => {
    beforeEach(async () => {
      await tasksTestHelpers.createMultipleTasks(projectId, userId, 5)
    })

    it('should retrieve task statistics for admin', async () => {
      const response = await request(app)
        .get('/api/v1/tasks/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
      expect(response.body.data).toEqual(
        expect.objectContaining({
          total: expect.any(Number),
          byStatus: expect.any(Object),
          byPriority: expect.any(Object),
          overdueTasks: expect.any(Number),
          completedToday: expect.any(Number),
        }),
      )
    })

    it('should fail for non-admin users', async () => {
      await request(app)
        .get('/api/v1/tasks/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403)
    })
  })
})
