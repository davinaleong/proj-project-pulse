import request from 'supertest'
import createApp from '../../../../src/app'
import { ProjectStage } from '@prisma/client'
import { projectsTestHelpers, prisma } from './projects.helpers'

const app = createApp()

describe('Projects CRUD Operations', () => {
  let authToken: string
  let adminToken: string
  let userId: number

  beforeEach(async () => {
    await projectsTestHelpers.cleanupDatabase()

    const testData = await projectsTestHelpers.setupTestData()
    authToken = testData.authToken
    adminToken = testData.adminToken
    userId = testData.user.id
  })

  afterAll(async () => {
    await projectsTestHelpers.cleanupDatabase()
    await projectsTestHelpers.disconnectDatabase()
  })

  describe('POST /api/v1/projects - Create Project', () => {
    it('should create a new project with valid data', async () => {
      const randomId = Math.random().toString(36).substring(2)
      const projectData = {
        title: `New Test Project ${randomId}`,
        description: 'A comprehensive test project',
        stage: ProjectStage.PLANNING,
        billingCycle: 'MONTHLY',
        rate: 100.5,
        currency: 'USD',
      }

      const response = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(
        expect.objectContaining({
          title: projectData.title,
          description: projectData.description,
          stage: projectData.stage,
          billingCycle: projectData.billingCycle,
          rate: projectData.rate.toString(), // API returns rate as string
          currency: projectData.currency,
          userId,
        }),
      )

      // Verify in database
      const project = await prisma.project.findUnique({
        where: { uuid: response.body.data.uuid },
      })
      expect(project).toBeTruthy()
      expect(project?.title).toBe(projectData.title)
    })

    it('should create a project with minimal required data', async () => {
      const randomId = Math.random().toString(36).substring(2)
      const projectData = {
        title: `Minimal Project ${randomId}`,
        description: 'Basic project with minimal data',
      }

      const response = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(201)

      expect(response.body.data).toEqual(
        expect.objectContaining({
          title: projectData.title,
          description: projectData.description,
          stage: ProjectStage.PLANNING, // Default stage
          userId,
        }),
      )
    })

    it('should reject project creation without authentication', async () => {
      const randomId = Math.random().toString(36).substring(2)
      const projectData = {
        title: `Unauthorized Project ${randomId}`,
        description: 'This should fail',
      }

      await request(app).post('/api/v1/projects').send(projectData).expect(401)
    })

    it('should reject project creation with invalid data', async () => {
      const invalidData = {
        description: 'Project without title',
        stage: 'INVALID_STAGE',
      }

      const response = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
    })
  })

  describe('GET /api/v1/projects - List Projects', () => {
    beforeEach(async () => {
      const randomId = Math.random().toString(36).substring(2)
      // Create multiple test projects
      await projectsTestHelpers.createMultipleProjects(userId, 3, [
        { title: `Project Alpha ${randomId}`, stage: ProjectStage.PLANNING },
        {
          title: `Project Beta ${randomId}`,
          stage: ProjectStage.IMPLEMENTATION,
        },
        { title: `Project Gamma ${randomId}`, stage: ProjectStage.DEPLOYMENT },
      ])
    })

    it('should list all projects for authenticated user', async () => {
      const response = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.projects).toHaveLength(4) // 3 created + 1 from setup
      expect(response.body.data.projects).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ stage: ProjectStage.PLANNING }),
          expect.objectContaining({ stage: ProjectStage.IMPLEMENTATION }),
          expect.objectContaining({ stage: ProjectStage.DEPLOYMENT }),
        ]),
      )
    })

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/projects?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.data.projects).toHaveLength(2)
      expect(response.body.data.pagination).toEqual(
        expect.objectContaining({
          page: 1,
          limit: 2,
          total: 4,
          totalPages: 2,
        }),
      )
    })

    it('should filter projects by stage', async () => {
      const response = await request(app)
        .get(`/api/v1/projects?stage=${ProjectStage.IMPLEMENTATION}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.data.projects).toHaveLength(1)
      expect(response.body.data.projects[0].stage).toBe(
        ProjectStage.IMPLEMENTATION,
      )
    })

    it('should search projects by title', async () => {
      const response = await request(app)
        .get('/api/v1/projects?search=Alpha')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.data.projects).toHaveLength(1)
      expect(response.body.data.projects[0].title).toContain('Project Alpha')
    })

    it('should reject unauthenticated requests', async () => {
      await request(app).get('/api/v1/projects').expect(401)
    })
  })

  describe('GET /api/v1/projects/:uuid - Get Single Project', () => {
    let project: Awaited<
      ReturnType<typeof projectsTestHelpers.createTestProject>
    >

    beforeEach(async () => {
      const randomId = Math.random().toString(36).substring(2)
      project = await projectsTestHelpers.createTestProject(userId, {
        title: `Detailed Project ${randomId}`,
        description: 'Project for detailed testing',
        stage: ProjectStage.ANALYSIS,
      })
    })

    it('should get project details for owner', async () => {
      const response = await request(app)
        .get(`/api/v1/projects/uuid/${project.uuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(
        expect.objectContaining({
          uuid: project.uuid,
          title: project.title,
          description: 'Project for detailed testing',
          stage: ProjectStage.ANALYSIS,
          userId,
        }),
      )
    })

    it('should include related tasks and notes count', async () => {
      // Add some tasks and notes
      await projectsTestHelpers.createTestTask(project.id, userId)
      await projectsTestHelpers.createTestNote(userId, project.id)

      const response = await request(app)
        .get(`/api/v1/projects/uuid/${project.uuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.data).toEqual(
        expect.objectContaining({
          _count: expect.objectContaining({
            tasks: 1,
            notes: 1,
          }),
        }),
      )
    })

    it('should return 404 for non-existent project', async () => {
      await request(app)
        .get('/api/v1/projects/uuid/non-existent-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)
    })

    it('should prevent access to other users projects', async () => {
      const otherUser = await projectsTestHelpers.createTestUser({
        uuid: 'other-user-uuid',
        email: 'other@example.com',
      })
      const otherProject = await projectsTestHelpers.createTestProject(
        otherUser.id,
      )

      await request(app)
        .get(`/api/v1/projects/uuid/${otherProject.uuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403)
    })

    it('should allow admin access to any project', async () => {
      const response = await request(app)
        .get(`/api/v1/projects/uuid/${project.uuid}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.data.uuid).toBe(project.uuid)
    })
  })

  describe('PUT /api/v1/projects/:uuid - Update Project', () => {
    let project: Awaited<
      ReturnType<typeof projectsTestHelpers.createTestProject>
    >

    beforeEach(async () => {
      const randomId = Math.random().toString(36).substring(2)
      project = await projectsTestHelpers.createTestProject(userId, {
        title: `Original Title ${randomId}`,
        description: 'Original description',
        stage: ProjectStage.PLANNING,
      })
    })

    it('should update project details', async () => {
      const randomId = Math.random().toString(36).substring(2)
      const updateData = {
        title: `Updated Title ${randomId}`,
        description: 'Updated description',
        stage: ProjectStage.IMPLEMENTATION,
        rate: 150.75,
        currency: 'EUR',
      }

      const response = await request(app)
        .put(`/api/v1/projects/${project.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(
        expect.objectContaining({
          title: updateData.title,
          description: updateData.description,
          stage: updateData.stage,
          rate: updateData.rate.toString(), // API returns rate as string
          currency: updateData.currency,
        }),
      )

      // Verify in database
      const updatedProject = await prisma.project.findUnique({
        where: { uuid: project.uuid },
      })
      expect(updatedProject?.title).toBe(updateData.title)
      expect(updatedProject?.stage).toBe(updateData.stage)
    })

    it('should handle stage transitions with timestamps', async () => {
      // Start project
      await request(app)
        .put(`/api/v1/projects/${project.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ stage: ProjectStage.IMPLEMENTATION })
        .expect(200)

      const projectAfterStart = await prisma.project.findUnique({
        where: { uuid: project.uuid },
      })
      expect(projectAfterStart?.beganAt).toBeTruthy()

      // Complete project
      await request(app)
        .put(`/api/v1/projects/${project.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ stage: ProjectStage.DEPLOYMENT })
        .expect(200)

      const projectAfterComplete = await prisma.project.findUnique({
        where: { uuid: project.uuid },
      })
      expect(projectAfterComplete?.completedAt).toBeTruthy()
    })

    it('should reject updates to other users projects', async () => {
      const otherUser = await projectsTestHelpers.createTestUser({
        uuid: 'other-user-uuid',
        email: 'other@example.com',
      })
      const otherProject = await projectsTestHelpers.createTestProject(
        otherUser.id,
      )

      await request(app)
        .put(`/api/v1/projects/${otherProject.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: `Hacked Title ${Math.random().toString(36).substring(2)}`,
        })
        .expect(403)
    })

    it('should validate update data', async () => {
      const invalidData = {
        stage: 'INVALID_STAGE',
        rate: 'not-a-number',
      }

      const response = await request(app)
        .put(`/api/v1/projects/${project.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
    })
  })

  describe('DELETE /api/v1/projects/:uuid - Delete Project', () => {
    let project: Awaited<
      ReturnType<typeof projectsTestHelpers.createTestProject>
    >

    beforeEach(async () => {
      const randomId = Math.random().toString(36).substring(2, 15)
      project = await projectsTestHelpers.createTestProject(userId, {
        title: `Project to Delete ${randomId}`,
      })
    })

    it('should delete own project', async () => {
      const response = await request(app)
        .delete(`/api/v1/projects/${project.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('deleted')

      // Verify deletion in database
      const deletedProject = await prisma.project.findUnique({
        where: { uuid: project.uuid },
      })
      expect(deletedProject?.deletedAt).toBeTruthy()
    })

    it('should delete project but preserve related tasks and notes', async () => {
      // Create related data
      const task = await projectsTestHelpers.createTestTask(project.id, userId)
      const note = await projectsTestHelpers.createTestNote(userId, project.id)

      await request(app)
        .delete(`/api/v1/projects/${project.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      // Verify that related data still exists since cascade delete is not implemented
      const remainingTask = await prisma.task.findUnique({
        where: { uuid: task.uuid },
      })
      const remainingNote = await prisma.note.findUnique({
        where: { uuid: note.uuid },
      })

      expect(remainingTask).toBeTruthy() // Tasks should still exist
      expect(remainingNote).toBeTruthy() // Notes should still exist
    })

    it('should reject deletion of other users projects', async () => {
      const otherUser = await projectsTestHelpers.createTestUser({
        uuid: 'other-user-uuid',
        email: 'other@example.com',
      })
      const otherProject = await projectsTestHelpers.createTestProject(
        otherUser.id,
      )

      await request(app)
        .delete(`/api/v1/projects/${otherProject.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403)
    })

    it('should allow admin to delete any project', async () => {
      await request(app)
        .delete(`/api/v1/projects/${project.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      const deletedProject = await prisma.project.findUnique({
        where: { uuid: project.uuid },
      })
      expect(deletedProject?.deletedAt).toBeTruthy()
    })

    it('should return 404 for non-existent project', async () => {
      await request(app)
        .delete('/api/v1/projects/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)
    })
  })
})
