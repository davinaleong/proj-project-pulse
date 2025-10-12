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

describe('Tasks Edge Cases', () => {
  let userToken: string
  let userId: number
  let projectId: number
  let taskId: number

  beforeEach(async () => {
    await tasksTestHelpers.cleanupDatabase()

    // Create test users
    const user = await tasksTestHelpers.createTestUser({
      email: 'user@test.com',
      role: UserRole.USER,
    })

    userId = user.id

    // Create test project
    const project = await tasksTestHelpers.createTestProject(userId, {
      title: 'Test Project',
    })
    projectId = project.id

    // Create test task
    const task = await tasksTestHelpers.createTestTask(projectId, userId)
    taskId = task.id

    // Generate tokens
    userToken = tasksTestHelpers.generateAuthToken(user)
  })

  afterAll(async () => {
    await tasksTestHelpers.cleanupDatabase()
    await tasksTestHelpers.disconnectDatabase()
  })

  describe('Boundary Value Testing', () => {
    it('should handle maximum string lengths', async () => {
      const maxTitle = 'a'.repeat(255)
      const maxDescription = 'a'.repeat(2000)
      const maxDoD = 'a'.repeat(1000)

      const taskData = {
        title: maxTitle,
        description: maxDescription,
        definitionOfDone: maxDoD,
        projectId,
      }

      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send(taskData)
        .expect(201)

      expect(response.body.status).toBe('success')
      expect(response.body.data.title).toBe(maxTitle)
      expect(response.body.data.description).toBe(maxDescription)
      expect(response.body.data.definitionOfDone).toBe(maxDoD)
    })

    it('should reject title exceeding maximum length', async () => {
      const oversizedTitle = 'a'.repeat(256)

      const taskData = {
        title: oversizedTitle,
        projectId,
      }

      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send(taskData)
        .expect(400)

      expect(response.body.status).toBe('error')
      expect(response.body.message).toContain('too long')
    })

    it('should handle minimum valid time tracking values', async () => {
      const taskData = {
        title: 'Time Test Task',
        projectId,
        timeEstimate: 0.01, // 1 cent of hour
        timeSpent: 0.01,
      }

      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send(taskData)
        .expect(201)

      expect(response.body.status).toBe('success')
      expect(response.body.data.timeEstimate).toBe('0.01')
      expect(response.body.data.timeSpent).toBe('0.01')
    })

    it('should handle large time tracking values', async () => {
      const taskData = {
        title: 'Large Time Task',
        projectId,
        timeEstimate: 9999.99,
        timeSpent: 8888.88,
      }

      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send(taskData)
        .expect(201)

      expect(response.body.status).toBe('success')
      expect(response.body.data.timeEstimate).toBe('9999.99')
      expect(response.body.data.timeSpent).toBe('8888.88')
    })

    it('should reject negative time values', async () => {
      const taskData = {
        title: 'Negative Time Task',
        projectId,
        timeEstimate: -1,
      }

      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send(taskData)
        .expect(400)

      expect(response.body.status).toBe('error')
      expect(response.body.message).toContain('greater than')
    })

    it('should handle cost tracking precision', async () => {
      const taskData = {
        title: 'Cost Precision Task',
        projectId,
        costEstimate: 123.456789,
        costActual: 98.12345,
      }

      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send(taskData)
        .expect(201)

      expect(response.body.status).toBe('success')
      // Decimal precision should be maintained
      expect(parseFloat(response.body.data.costEstimate)).toBeCloseTo(
        123.456789,
        6,
      )
      expect(parseFloat(response.body.data.costActual)).toBeCloseTo(98.12345, 5)
    })
  })

  describe('Non-Existent Resource Handling', () => {
    it('should return 404 for non-existent task ID', async () => {
      const nonExistentId = 999999

      const response = await request(app)
        .get(`/api/v1/tasks/${nonExistentId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404)

      expect(response.body.status).toBe('error')
      expect(response.body.message).toContain('not found')
    })

    it('should return 404 when updating non-existent task', async () => {
      const nonExistentId = 999999
      const updateData = { title: 'Updated Title' }

      const response = await request(app)
        .put(`/api/v1/tasks/${nonExistentId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(404)

      expect(response.body.status).toBe('error')
      expect(response.body.message).toContain('not found')
    })

    it('should return 404 when deleting non-existent task', async () => {
      const nonExistentId = 999999

      const response = await request(app)
        .delete(`/api/v1/tasks/${nonExistentId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404)

      expect(response.body.status).toBe('error')
      expect(response.body.message).toContain('not found')
    })

    it('should handle non-existent project ID gracefully', async () => {
      const taskData = {
        title: 'Task for Non-Existent Project',
        projectId: 999999,
      }

      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send(taskData)
        .expect(404)

      expect(response.body.status).toBe('error')
      expect(response.body.message).toContain('Project not found')
    })
  })

  describe('Invalid Data Types', () => {
    it('should reject non-numeric task ID parameters', async () => {
      const invalidId = 'not-a-number'

      const response = await request(app)
        .get(`/api/v1/tasks/${invalidId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400)

      expect(response.body.status).toBe('error')
      expect(response.body.message).toContain('valid number')
    })

    it('should reject non-numeric project ID', async () => {
      const taskData = {
        title: 'Invalid Project ID Task',
        projectId: 'not-a-number',
      }

      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send(taskData)
        .expect(400)

      expect(response.body.status).toBe('error')
      expect(response.body.message).toContain('number')
    })

    it('should reject invalid status values', async () => {
      const taskData = {
        title: 'Invalid Status Task',
        projectId,
        status: 'INVALID_STATUS',
      }

      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send(taskData)
        .expect(400)

      expect(response.body.status).toBe('error')
      expect(response.body.message).toContain('Invalid enum')
    })

    it('should reject non-numeric time values', async () => {
      const taskData = {
        title: 'Invalid Time Task',
        projectId,
        timeEstimate: 'not-a-number',
      }

      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send(taskData)
        .expect(400)

      expect(response.body.status).toBe('error')
      expect(response.body.message).toContain('number')
    })

    it('should reject invalid priority values', async () => {
      const taskData = {
        title: 'Invalid Priority Task',
        projectId,
        priority: 999, // Outside valid range
      }

      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send(taskData)
        .expect(400)

      expect(response.body.status).toBe('error')
      expect(response.body.message).toContain('between')
    })
  })

  describe('Pagination Edge Cases', () => {
    beforeEach(async () => {
      // Create multiple tasks for pagination testing
      for (let i = 1; i <= 25; i++) {
        await tasksTestHelpers.createTestTask(projectId, userId, {
          title: `Task ${i}`,
        })
      }
    })

    it('should handle page number exceeding available pages', async () => {
      const response = await request(app)
        .get('/api/v1/tasks?page=1000')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
      expect(response.body.data.tasks).toHaveLength(0)
      expect(response.body.data.pagination.page).toBe(1000)
    })

    it('should handle zero page number', async () => {
      const response = await request(app)
        .get('/api/v1/tasks?page=0')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
      // Should default to page 1
      expect(response.body.data.pagination.page).toBe(1)
    })

    it('should handle negative page number', async () => {
      const response = await request(app)
        .get('/api/v1/tasks?page=-5')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
      // Should default to page 1
      expect(response.body.data.pagination.page).toBe(1)
    })

    it('should handle extremely large limit values', async () => {
      const response = await request(app)
        .get('/api/v1/tasks?limit=10000')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
      // Should be capped at maximum allowed limit
      expect(response.body.data.tasks.length).toBeLessThanOrEqual(100)
    })

    it('should handle zero limit', async () => {
      const response = await request(app)
        .get('/api/v1/tasks?limit=0')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
      // Should default to minimum limit
      expect(response.body.data.tasks.length).toBeGreaterThan(0)
    })
  })

  describe('Deleted Task Handling', () => {
    it('should not return deleted tasks in listings', async () => {
      // Delete the task
      await request(app)
        .delete(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      // Try to get all tasks
      const response = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
      const taskIds = response.body.data.tasks.map(
        (task: TaskResponse) => task.id,
      )
      expect(taskIds).not.toContain(taskId)
    })

    it('should return 404 when accessing deleted task directly', async () => {
      // Delete the task
      await request(app)
        .delete(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      // Try to get the deleted task
      const response = await request(app)
        .get(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404)

      expect(response.body.status).toBe('error')
      expect(response.body.message).toContain('not found')
    })

    it('should return 404 when updating deleted task', async () => {
      // Delete the task
      await request(app)
        .delete(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      // Try to update the deleted task
      const updateData = { title: 'Updated Deleted Task' }
      const response = await request(app)
        .put(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(404)

      expect(response.body.status).toBe('error')
      expect(response.body.message).toContain('not found')
    })

    it('should handle double deletion gracefully', async () => {
      // Delete the task first time
      await request(app)
        .delete(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      // Try to delete again
      const response = await request(app)
        .delete(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404)

      expect(response.body.status).toBe('error')
      expect(response.body.message).toContain('not found')
    })
  })

  describe('Concurrent Operations', () => {
    it('should handle concurrent updates to the same task', async () => {
      const updateData1 = { title: 'Concurrent Update 1' }
      const updateData2 = { title: 'Concurrent Update 2' }

      // Send both updates concurrently
      const [response1, response2] = await Promise.all([
        request(app)
          .put(`/api/v1/tasks/${taskId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send(updateData1),
        request(app)
          .put(`/api/v1/tasks/${taskId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send(updateData2),
      ])

      // Both should succeed (last write wins)
      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)

      // Verify final state
      const finalResponse = await request(app)
        .get(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      // One of the updates should have won
      expect([updateData1.title, updateData2.title]).toContain(
        finalResponse.body.data.title,
      )
    })

    it('should handle concurrent task creation', async () => {
      const taskData1 = { title: 'Concurrent Task 1', projectId }
      const taskData2 = { title: 'Concurrent Task 2', projectId }

      // Create tasks concurrently
      const [response1, response2] = await Promise.all([
        request(app)
          .post('/api/v1/tasks')
          .set('Authorization', `Bearer ${userToken}`)
          .send(taskData1),
        request(app)
          .post('/api/v1/tasks')
          .set('Authorization', `Bearer ${userToken}`)
          .send(taskData2),
      ])

      // Both should succeed
      expect(response1.status).toBe(201)
      expect(response2.status).toBe(201)

      // Should have different IDs
      expect(response1.body.data.id).not.toBe(response2.body.data.id)
    })
  })

  describe('Resource Cleanup', () => {
    it('should handle project deletion affecting tasks', async () => {
      // This test assumes project deletion would soft-delete associated tasks
      // Implementation depends on your business logic

      // Get initial task count
      const initialResponse = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      const initialCount = initialResponse.body.data.tasks.length

      // Delete the project (this would typically soft-delete tasks too)
      await prisma.project.update({
        where: { id: projectId },
        data: { deletedAt: new Date() },
      })

      // Check tasks are no longer visible
      const finalResponse = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(finalResponse.body.data.tasks.length).toBeLessThan(initialCount)
    })
  })

  describe('Unicode and Special Characters', () => {
    it('should handle unicode characters in task data', async () => {
      const unicodeData = {
        title: '🚀 Unicode Task with émojis and spëcial charäcters',
        description: 'Description with 中文, العربية, and русский text',
        projectId,
      }

      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send(unicodeData)
        .expect(201)

      expect(response.body.status).toBe('success')
      expect(response.body.data.title).toBe(unicodeData.title)
      expect(response.body.data.description).toBe(unicodeData.description)
    })

    it('should handle newlines and special formatting in text fields', async () => {
      const specialData = {
        title: 'Task with\nNewlines',
        description:
          'Description with:\n- Bullet points\n- Multiple\n\nParagraphs\n\nAnd\ttabs',
        definitionOfDone:
          'DoD with "quotes" and \'apostrophes\' and [brackets]',
        projectId,
      }

      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send(specialData)
        .expect(201)

      expect(response.body.status).toBe('success')
      expect(response.body.data.title).toBe(specialData.title)
      expect(response.body.data.description).toBe(specialData.description)
      expect(response.body.data.definitionOfDone).toBe(
        specialData.definitionOfDone,
      )
    })
  })
})
