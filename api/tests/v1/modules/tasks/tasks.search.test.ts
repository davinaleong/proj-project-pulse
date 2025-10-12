import request from 'supertest'
import createApp from '../../../../src/app'
import { TaskStatus, UserRole } from '@prisma/client'
import { tasksTestHelpers } from './tasks.helpers'

interface TaskResponse {
  id: number
  title: string
  userId: number
  projectId: number
  status: TaskStatus
  [key: string]: unknown
}

const app = createApp()

describe('Tasks Search and Filtering', () => {
  let userToken: string
  let userId: number
  let otherUserId: number
  let projectId: number
  let otherProjectId: number

  beforeEach(async () => {
    await tasksTestHelpers.cleanupDatabase()

    // Create test users
    const user = await tasksTestHelpers.createTestUser({
      email: 'user@test.com',
      role: UserRole.USER,
    })
    const otherUser = await tasksTestHelpers.createTestUser({
      email: 'other@test.com',
      role: UserRole.USER,
    })

    userId = user.id
    otherUserId = otherUser.id

    // Create test projects
    const project = await tasksTestHelpers.createTestProject(userId, {
      title: 'Main Project',
    })
    const otherProject = await tasksTestHelpers.createTestProject(otherUserId, {
      title: 'Other Project',
    })

    projectId = project.id
    otherProjectId = otherProject.id

    // Generate tokens
    userToken = tasksTestHelpers.generateAuthToken(user)

    // Create diverse test tasks for search testing
    await createTestTasks()
  })

  afterAll(async () => {
    await tasksTestHelpers.cleanupDatabase()
    await tasksTestHelpers.disconnectDatabase()
  })

  const createTestTasks = async () => {
    // Tasks with different statuses
    await tasksTestHelpers.createTestTask(projectId, userId, {
      title: 'Backlog Task',
      definitionOfDone: 'This is a task in backlog',
      status: TaskStatus.BACKLOG,
    })

    await tasksTestHelpers.createTestTask(projectId, userId, {
      title: 'Todo Task',
      definitionOfDone: 'This is a todo task',
      status: TaskStatus.TODO,
    })

    await tasksTestHelpers.createTestTask(projectId, userId, {
      title: 'In Progress Task',
      definitionOfDone: 'This is a work in progress task',
      status: TaskStatus.WIP,
    })

    await tasksTestHelpers.createTestTask(projectId, userId, {
      title: 'Completed Task',
      definitionOfDone: 'This is a completed task',
      status: TaskStatus.DONE,
    })

    await tasksTestHelpers.createTestTask(projectId, userId, {
      title: 'Blocked Task',
      definitionOfDone: 'This is a blocked task',
      status: TaskStatus.BLOCKED,
    })

    // Tasks with different keywords
    await tasksTestHelpers.createTestTask(projectId, userId, {
      title: 'Frontend Development',
      definitionOfDone: 'Build React components for user interface',
      status: TaskStatus.TODO,
    })

    await tasksTestHelpers.createTestTask(projectId, userId, {
      title: 'Backend API',
      definitionOfDone: 'Create REST API endpoints',
      status: TaskStatus.WIP,
    })

    await tasksTestHelpers.createTestTask(projectId, userId, {
      title: 'Database Migration',
      definitionOfDone: 'Update database schema',
      status: TaskStatus.DONE,
    })

    // Tasks with time tracking
    await tasksTestHelpers.createTestTask(projectId, userId, {
      title: 'Quick Task',
      definitionOfDone: 'Small task',
      timeSpent: 1.0,
      status: TaskStatus.TODO,
    })

    await tasksTestHelpers.createTestTask(projectId, userId, {
      title: 'Long Task',
      definitionOfDone: 'Complex task',
      timeSpent: 40.0,
      status: TaskStatus.BACKLOG,
    })

    // Tasks in other project (for admin testing)
    await tasksTestHelpers.createTestTask(otherProjectId, otherUserId, {
      title: 'Other User Task',
      definitionOfDone: 'Task from another user',
      status: TaskStatus.TODO,
    })
  }

  describe('Text Search', () => {
    it('should search tasks by title', async () => {
      const response = await request(app)
        .get('/api/v1/tasks?search=Frontend')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
      expect(response.body.data.tasks).toHaveLength(1)
      expect(response.body.data.tasks[0].title).toContain('Frontend')
    })

    it('should search tasks by description', async () => {
      const response = await request(app)
        .get('/api/v1/tasks?search=React')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
      expect(response.body.data.tasks).toHaveLength(1)
      expect(response.body.data.tasks[0].definitionOfDone).toContain('React')
    })

    it('should perform case-insensitive search', async () => {
      const response = await request(app)
        .get('/api/v1/tasks?search=BACKEND')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
      expect(response.body.data.tasks).toHaveLength(1)
      expect(response.body.data.tasks[0].title.toLowerCase()).toContain(
        'backend',
      )
    })

    it('should search partial words', async () => {
      const response = await request(app)
        .get('/api/v1/tasks?search=API')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
      expect(response.body.data.tasks.length).toBeGreaterThan(0)
      const hasApiTask = response.body.data.tasks.some(
        (task: TaskResponse) =>
          task.title.toLowerCase().includes('api') ||
          task.definitionOfDone?.toString().toLowerCase().includes('api'),
      )
      expect(hasApiTask).toBe(true)
    })

    it('should return empty results for non-matching search', async () => {
      const response = await request(app)
        .get('/api/v1/tasks?search=NonExistentTerm')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
      expect(response.body.data.tasks).toHaveLength(0)
    })

    it('should handle special characters in search', async () => {
      // Create a task with special characters
      await tasksTestHelpers.createTestTask(projectId, userId, {
        title: 'Task with @#$% special chars',
        definitionOfDone: 'Testing special characters: !@#$%^&*()',
      })

      const response = await request(app)
        .get('/api/v1/tasks?search=@#$%')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
      expect(response.body.data.tasks.length).toBeGreaterThan(0)
    })
  })

  describe('Status Filtering', () => {
    it('should filter tasks by single status', async () => {
      const response = await request(app)
        .get('/api/v1/tasks?status=TODO')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
      response.body.data.tasks.forEach((task: TaskResponse) => {
        expect(task.status).toBe(TaskStatus.TODO)
      })
    })

    it('should filter tasks by multiple statuses', async () => {
      const response = await request(app)
        .get('/api/v1/tasks?status=TODO,WIP')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
      response.body.data.tasks.forEach((task: TaskResponse) => {
        expect([TaskStatus.TODO, TaskStatus.WIP]).toContain(task.status)
      })
    })

    it('should handle invalid status values gracefully', async () => {
      const response = await request(app)
        .get('/api/v1/tasks?status=INVALID_STATUS')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
      // Should return all tasks when status filter is invalid
      expect(response.body.data.tasks.length).toBeGreaterThan(0)
    })
  })

  describe('Time-based Filtering', () => {
    it('should filter tasks with time spent', async () => {
      const response = await request(app)
        .get('/api/v1/tasks?hasTimeSpent=true')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
      response.body.data.tasks.forEach((task: TaskResponse) => {
        expect(task.timeSpent).not.toBeNull()
      })
    })
  })

  describe('Date-based Filtering', () => {
    it('should filter tasks by creation date range', async () => {
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const response = await request(app)
        .get(
          `/api/v1/tasks?createdAfter=${yesterday.toISOString()}&createdBefore=${tomorrow.toISOString()}`,
        )
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
      expect(response.body.data.tasks.length).toBeGreaterThan(0)
    })

    it('should filter tasks by due date', async () => {
      // Create task with due date
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 7) // 7 days from now

      await tasksTestHelpers.createTestTask(projectId, userId, {
        title: 'Task with Due Date',
      })

      const response = await request(app)
        .get(`/api/v1/tasks?dueBefore=${dueDate.toISOString()}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
      expect(response.body.data.tasks.length).toBeGreaterThan(0)
    })
  })

  describe('Combined Filtering', () => {
    it('should combine multiple filters', async () => {
      const response = await request(app)
        .get('/api/v1/tasks?status=TODO,WIP&search=Task')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
      response.body.data.tasks.forEach((task: TaskResponse) => {
        expect([TaskStatus.TODO, TaskStatus.WIP]).toContain(task.status)
        expect(
          task.title.toLowerCase().includes('task') ||
            (task.definitionOfDone &&
              task.definitionOfDone.toString().toLowerCase().includes('task')),
        ).toBe(true)
      })
    })

    it('should combine search with project filter', async () => {
      const response = await request(app)
        .get(`/api/v1/tasks?search=Task&projectId=${projectId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
      response.body.data.tasks.forEach((task: TaskResponse) => {
        expect(task.projectId).toBe(projectId)
        expect(
          task.title.toLowerCase().includes('task') ||
            (task.definitionOfDone &&
              task.definitionOfDone.toString().toLowerCase().includes('task')),
        ).toBe(true)
      })
    })
  })

  describe('Sorting', () => {
    it('should sort tasks by title ascending', async () => {
      const response = await request(app)
        .get('/api/v1/tasks?sortBy=title&sortOrder=asc')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
      const titles = response.body.data.tasks.map(
        (task: TaskResponse) => task.title,
      )
      const sortedTitles = [...titles].sort()
      expect(titles).toEqual(sortedTitles)
    })

    it('should sort tasks by title descending', async () => {
      const response = await request(app)
        .get('/api/v1/tasks?sortBy=title&sortOrder=desc')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
      const titles = response.body.data.tasks.map(
        (task: TaskResponse) => task.title,
      )
      const sortedTitles = [...titles].sort().reverse()
      expect(titles).toEqual(sortedTitles)
    })

    it('should sort tasks by priority', async () => {
      const response = await request(app)
        .get('/api/v1/tasks?sortBy=priority&sortOrder=desc')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
      const priorities = response.body.data.tasks.map(
        (task: TaskResponse) => task.priority,
      )
      const sortedPriorities = [...priorities].sort((a, b) => b - a)
      expect(priorities).toEqual(sortedPriorities)
    })

    it('should sort tasks by creation date', async () => {
      const response = await request(app)
        .get('/api/v1/tasks?sortBy=createdAt&sortOrder=desc')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
      const dates = response.body.data.tasks.map(
        (task: TaskResponse) => new Date(task.createdAt as string),
      )

      // Verify descending order
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i - 1].getTime()).toBeGreaterThanOrEqual(
          dates[i].getTime(),
        )
      }
    })

    it('should handle invalid sort fields gracefully', async () => {
      const response = await request(app)
        .get('/api/v1/tasks?sortBy=invalidField')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
      // Should return tasks in default order
      expect(response.body.data.tasks.length).toBeGreaterThan(0)
    })
  })

  describe('Advanced Search Features', () => {
    it('should support exact phrase search with quotes', async () => {
      await tasksTestHelpers.createTestTask(projectId, userId, {
        title: 'Exact phrase match test',
        definitionOfDone: 'This contains the exact phrase',
      })

      const response = await request(app)
        .get('/api/v1/tasks?search="exact phrase"')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
      expect(response.body.data.tasks.length).toBeGreaterThan(0)
    })

    it('should handle empty search gracefully', async () => {
      const response = await request(app)
        .get('/api/v1/tasks?search=')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
      // Empty search should return all tasks
      expect(response.body.data.tasks.length).toBeGreaterThan(0)
    })

    it('should handle whitespace-only search', async () => {
      const response = await request(app)
        .get('/api/v1/tasks?search=%20%20%20') // URL-encoded spaces
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
      // Whitespace-only search should return all tasks
      expect(response.body.data.tasks.length).toBeGreaterThan(0)
    })
  })

  describe('Performance and Limits', () => {
    beforeEach(async () => {
      // Create many tasks for performance testing
      const tasks = []
      for (let i = 0; i < 50; i++) {
        tasks.push(
          tasksTestHelpers.createTestTask(projectId, userId, {
            title: `Performance Test Task ${i}`,
            definitionOfDone: `Description for task ${i}`,
            status: i % 2 === 0 ? TaskStatus.TODO : TaskStatus.DONE,
          }),
        )
      }
      await Promise.all(tasks)
    })

    it('should handle large result sets with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/tasks?limit=20&page=1')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
      expect(response.body.data.tasks).toHaveLength(20)
      expect(response.body.data.pagination.totalPages).toBeGreaterThan(1)
    })

    it('should handle complex filter combinations efficiently', async () => {
      const startTime = Date.now()

      const response = await request(app)
        .get(
          '/api/v1/tasks?search=Test&status=TODO,DONE&priority=1,2,3&sortBy=title&sortOrder=asc&limit=10',
        )
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      const endTime = Date.now()
      const responseTime = endTime - startTime

      expect(response.body.status).toBe('success')
      expect(responseTime).toBeLessThan(1000) // Should respond within 1 second
    })
  })
})
