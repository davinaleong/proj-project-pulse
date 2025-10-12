import request from 'supertest'
import createApp from '../../../../src/app'
import { ProjectStage, TaskStatus } from '@prisma/client'
import { projectsTestHelpers, prisma } from './projects.helpers'

const app = createApp()

type TestProject = Awaited<
  ReturnType<typeof projectsTestHelpers.createTestProject>
>

describe('Projects Management Operations', () => {
  let authToken: string
  let managerToken: string
  let userId: number

  beforeEach(async () => {
    await projectsTestHelpers.cleanupDatabase()

    const testData = await projectsTestHelpers.setupTestData()
    authToken = testData.authToken
    managerToken = testData.managerToken
    userId = testData.user.id
  })

  afterAll(async () => {
    await projectsTestHelpers.cleanupDatabase()
    await projectsTestHelpers.disconnectDatabase()
  })

  describe('POST /api/v1/projects/:uuid/stage - Stage Transitions', () => {
    let project: TestProject

    beforeEach(async () => {
      project = await projectsTestHelpers.createTestProject(userId, {
        title: 'Lifecycle Project',
        stage: ProjectStage.PLANNING,
      })
    })

    it('should transition project from PLANNING to ANALYSIS', async () => {
      const response = await request(app)
        .post(`/api/v1/projects/${project.uuid}/stage`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ stage: ProjectStage.ANALYSIS })
        .expect(200)

      expect(response.body.status).toBe('success')
      expect(response.body.data.project.stage).toBe(ProjectStage.ANALYSIS)

      // Verify in database
      const updatedProject = await prisma.project.findUnique({
        where: { uuid: project.uuid },
      })
      expect(updatedProject?.stage).toBe(ProjectStage.ANALYSIS)
    })

    it('should set beganAt timestamp when moving to IMPLEMENTATION', async () => {
      const beforeTime = new Date()

      await request(app)
        .post(`/api/v1/projects/${project.uuid}/stage`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ stage: ProjectStage.IMPLEMENTATION })
        .expect(200)

      const afterTime = new Date()
      const updatedProject = await prisma.project.findUnique({
        where: { uuid: project.uuid },
      })

      expect(updatedProject?.beganAt).toBeTruthy()
      expect(new Date(updatedProject!.beganAt!)).toBeInstanceOf(Date)
      expect(
        new Date(updatedProject!.beganAt!).getTime(),
      ).toBeGreaterThanOrEqual(beforeTime.getTime())
      expect(new Date(updatedProject!.beganAt!).getTime()).toBeLessThanOrEqual(
        afterTime.getTime(),
      )
    })

    it('should set completedAt timestamp when moving to DEPLOYMENT', async () => {
      // First move to IMPLEMENTATION
      await request(app)
        .post(`/api/v1/projects/${project.uuid}/stage`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ stage: ProjectStage.IMPLEMENTATION })
        .expect(200)

      const beforeTime = new Date()

      // Then move to DEPLOYMENT
      await request(app)
        .post(`/api/v1/projects/${project.uuid}/stage`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ stage: ProjectStage.DEPLOYMENT })
        .expect(200)

      const afterTime = new Date()
      const updatedProject = await prisma.project.findUnique({
        where: { uuid: project.uuid },
      })

      expect(updatedProject?.completedAt).toBeTruthy()
      expect(
        new Date(updatedProject!.completedAt!).getTime(),
      ).toBeGreaterThanOrEqual(beforeTime.getTime())
      expect(
        new Date(updatedProject!.completedAt!).getTime(),
      ).toBeLessThanOrEqual(afterTime.getTime())
    })

    it('should prevent invalid stage transitions', async () => {
      const response = await request(app)
        .post(`/api/v1/projects/${project.uuid}/stage`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ stage: ProjectStage.DEPLOYMENT }) // Skip intermediate stages
        .expect(400)

      expect(response.body.status).toBe('error')
      expect(response.body.message).toContain('Invalid stage transition')
    })

    it('should prevent moving backwards in project lifecycle', async () => {
      // Move to IMPLEMENTATION first
      await request(app)
        .post(`/api/v1/projects/${project.uuid}/stage`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ stage: ProjectStage.IMPLEMENTATION })
        .expect(200)

      // Try to move back to PLANNING
      const response = await request(app)
        .post(`/api/v1/projects/${project.uuid}/stage`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ stage: ProjectStage.PLANNING })
        .expect(400)

      expect(response.body.status).toBe('error')
      expect(response.body.message).toContain('Cannot move backwards')
    })
  })

  describe('GET /api/v1/projects/:uuid/progress - Project Progress', () => {
    let project: TestProject

    beforeEach(async () => {
      project = await projectsTestHelpers.createTestProject(userId, {
        title: 'Progress Project',
        stage: ProjectStage.IMPLEMENTATION,
        beganAt: new Date('2024-01-01'),
      })

      // Create tasks with various statuses
      await projectsTestHelpers.createTestTask(project.id, userId, {
        uuid: 'task-1',
        title: 'Completed Task',
        status: TaskStatus.DONE,
        timeSpent: 4,
      })
      await projectsTestHelpers.createTestTask(project.id, userId, {
        uuid: 'task-2',
        title: 'In Progress Task',
        status: TaskStatus.WIP,
        timeSpent: 2,
      })
      await projectsTestHelpers.createTestTask(project.id, userId, {
        uuid: 'task-3',
        title: 'Backlog Task',
        status: TaskStatus.BACKLOG,
      })
    })

    it('should calculate project progress metrics', async () => {
      const response = await request(app)
        .get(`/api/v1/projects/${project.uuid}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
      expect(response.body.data.progress).toEqual(
        expect.objectContaining({
          totalTasks: 3,
          completedTasks: 1,
          inProgressTasks: 1,
          backlogTasks: 1,
          completionPercentage: 33.33,
          totalTimeSpent: 6,
        }),
      )
    })

    it('should include stage-specific metrics', async () => {
      const response = await request(app)
        .get(`/api/v1/projects/${project.uuid}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.data.progress).toEqual(
        expect.objectContaining({
          currentStage: ProjectStage.IMPLEMENTATION,
          daysInCurrentStage: expect.any(Number),
          estimatedCompletionDate: expect.any(String),
        }),
      )
    })

    it('should calculate velocity metrics for active projects', async () => {
      const response = await request(app)
        .get(`/api/v1/projects/${project.uuid}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.data.progress).toEqual(
        expect.objectContaining({
          velocity: expect.objectContaining({
            tasksPerWeek: expect.any(Number),
            hoursPerWeek: expect.any(Number),
          }),
        }),
      )
    })
  })

  describe('POST /api/v1/projects/:uuid/archive - Archive Project', () => {
    let project: TestProject

    beforeEach(async () => {
      project = await projectsTestHelpers.createTestProject(userId, {
        title: 'Project to Archive',
        stage: ProjectStage.DEPLOYMENT,
        completedAt: new Date(),
      })
    })

    it('should archive completed project', async () => {
      const response = await request(app)
        .post(`/api/v1/projects/${project.uuid}/archive`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: 'Project completed successfully' })
        .expect(200)

      expect(response.body.status).toBe('success')
      expect(response.body.data.project.stage).toBe(ProjectStage.MAINTENANCE)

      // Verify in database
      const archivedProject = await prisma.project.findUnique({
        where: { uuid: project.uuid },
      })
      expect(archivedProject?.stage).toBe(ProjectStage.MAINTENANCE)
    })

    it('should prevent archiving incomplete projects', async () => {
      const incompleteProject = await projectsTestHelpers.createTestProject(
        userId,
        {
          title: 'Incomplete Project',
          stage: ProjectStage.IMPLEMENTATION,
        },
      )

      const response = await request(app)
        .post(`/api/v1/projects/${incompleteProject.uuid}/archive`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: 'Premature archival' })
        .expect(400)

      expect(response.body.status).toBe('error')
      expect(response.body.message).toContain(
        'Cannot archive incomplete project',
      )
    })

    it('should allow managers to archive any project', async () => {
      const response = await request(app)
        .post(`/api/v1/projects/${project.uuid}/archive`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ reason: 'Manager decision' })
        .expect(200)

      expect(response.body.status).toBe('success')
    })
  })

  describe('GET /api/v1/projects/:uuid/timeline - Project Timeline', () => {
    let project: TestProject

    beforeEach(async () => {
      project = await projectsTestHelpers.createTestProject(userId, {
        title: 'Timeline Project',
        stage: ProjectStage.IMPLEMENTATION,
        beganAt: new Date('2024-01-01'),
      })

      // Create some activities/timeline events
      await projectsTestHelpers.createTestTask(project.id, userId, {
        title: 'First Task',
        startedAt: new Date('2024-01-05'),
        endedAt: new Date('2024-01-10'),
        status: TaskStatus.DONE,
      })
    })

    it('should return project timeline events', async () => {
      const response = await request(app)
        .get(`/api/v1/projects/${project.uuid}/timeline`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
      expect(response.body.data.timeline).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            event: 'project_started',
            date: expect.any(String),
            description: expect.any(String),
          }),
          expect.objectContaining({
            event: 'task_completed',
            date: expect.any(String),
            description: expect.any(String),
          }),
        ]),
      )
    })

    it('should include stage transition events', async () => {
      // Transition to next stage
      await request(app)
        .post(`/api/v1/projects/${project.uuid}/stage`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ stage: ProjectStage.TESTING })

      const response = await request(app)
        .get(`/api/v1/projects/${project.uuid}/timeline`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.data.timeline).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            event: 'stage_transition',
            from: ProjectStage.IMPLEMENTATION,
            to: ProjectStage.TESTING,
            date: expect.any(String),
          }),
        ]),
      )
    })
  })

  describe('GET /api/v1/projects/:uuid/costs - Project Cost Analysis', () => {
    let project: TestProject

    beforeEach(async () => {
      project = await projectsTestHelpers.createTestProject(userId, {
        title: 'Cost Analysis Project',
        rate: 100,
        currency: 'USD',
        billingCycle: 'HOURLY',
      })

      // Create tasks with time and cost data
      await projectsTestHelpers.createTestTask(project.id, userId, {
        title: 'Expensive Task',
        timeSpent: 8,
        costInProjectCurrency: 800,
        status: TaskStatus.DONE,
      })
      await projectsTestHelpers.createTestTask(project.id, userId, {
        title: 'Cheaper Task',
        timeSpent: 4,
        costInProjectCurrency: 400,
        status: TaskStatus.DONE,
      })
    })

    it('should calculate total project costs', async () => {
      const response = await request(app)
        .get(`/api/v1/projects/${project.uuid}/costs`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
      expect(response.body.data.costs).toEqual(
        expect.objectContaining({
          totalCost: 1200,
          currency: 'USD',
          totalHours: 12,
          averageHourlyRate: 100,
          costBreakdown: expect.objectContaining({
            completedTasks: 1200,
            inProgressTasks: 0,
            estimatedRemaining: expect.any(Number),
          }),
        }),
      )
    })

    it('should provide cost projections', async () => {
      const response = await request(app)
        .get(`/api/v1/projects/${project.uuid}/costs`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.data.costs.projections).toEqual(
        expect.objectContaining({
          estimatedTotalCost: expect.any(Number),
          costToCompletion: expect.any(Number),
          budgetVariance: expect.any(Number),
        }),
      )
    })

    it('should handle projects without cost data', async () => {
      const freeProject = await projectsTestHelpers.createTestProject(userId, {
        title: 'Free Project',
        // No rate or billing info
      })

      const response = await request(app)
        .get(`/api/v1/projects/${freeProject.uuid}/costs`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.data.costs).toEqual(
        expect.objectContaining({
          totalCost: 0,
          currency: 'SGD', // Default currency
          message: 'No billing configuration',
        }),
      )
    })
  })

  describe('POST /api/v1/projects/:uuid/duplicate - Duplicate Project', () => {
    let project: TestProject

    beforeEach(async () => {
      project = await projectsTestHelpers.createTestProject(userId, {
        title: 'Original Project',
        description: 'Project to be duplicated',
        stage: ProjectStage.PLANNING,
        rate: 150,
        currency: 'EUR',
      })

      // Add some tasks to the original project
      await projectsTestHelpers.createTestTask(project.id, userId, {
        title: 'Task to Copy',
        status: TaskStatus.BACKLOG,
      })
    })

    it('should duplicate project with new UUID', async () => {
      const response = await request(app)
        .post(`/api/v1/projects/${project.uuid}/duplicate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Duplicated Project',
          includeTasks: true,
        })
        .expect(201)

      expect(response.body.status).toBe('success')
      expect(response.body.data.project).toEqual(
        expect.objectContaining({
          title: 'Duplicated Project',
          description: 'Project to be duplicated',
          stage: ProjectStage.PLANNING,
          rate: 150,
          currency: 'EUR',
          userId,
        }),
      )

      // Should have different UUID
      expect(response.body.data.project.uuid).not.toBe(project.uuid)

      // Verify tasks were copied
      const duplicatedProject = await prisma.project.findUnique({
        where: { uuid: response.body.data.project.uuid },
        include: { tasks: true },
      })
      expect(duplicatedProject?.tasks).toHaveLength(1)
    })

    it('should duplicate project without tasks when specified', async () => {
      const response = await request(app)
        .post(`/api/v1/projects/${project.uuid}/duplicate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Duplicated Project (No Tasks)',
          includeTask: false,
        })
        .expect(201)

      const duplicatedProject = await prisma.project.findUnique({
        where: { uuid: response.body.data.project.uuid },
        include: { tasks: true },
      })
      expect(duplicatedProject?.tasks).toHaveLength(0)
    })

    it('should reset project timestamps on duplication', async () => {
      const response = await request(app)
        .post(`/api/v1/projects/${project.uuid}/duplicate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Fresh Duplicate',
        })
        .expect(201)

      expect(response.body.data.project.beganAt).toBeNull()
      expect(response.body.data.project.completedAt).toBeNull()
      expect(response.body.data.project.stage).toBe(ProjectStage.PLANNING)
    })
  })
})
