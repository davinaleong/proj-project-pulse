import request from 'supertest'
import createApp from '../../../../src/app'
import { ProjectStage, TaskStatus } from '@prisma/client'
import { projectsTestHelpers } from './projects.helpers'

const app = createApp()

describe('Projects Analytics', () => {
  let authToken: string
  let adminToken: string
  let managerToken: string
  let userId: number
  let adminId: number
  let managerId: number

  beforeEach(async () => {
    await projectsTestHelpers.cleanupDatabase()

    const testData = await projectsTestHelpers.setupTestData()
    authToken = testData.authToken
    adminToken = testData.adminToken
    managerToken = testData.managerToken
    userId = testData.user.id
    adminId = testData.admin.id
    managerId = testData.manager.id
  })

  afterAll(async () => {
    await projectsTestHelpers.cleanupDatabase()
    await projectsTestHelpers.disconnectDatabase()
  })

  describe('GET /api/v1/projects/analytics/overview - Portfolio Overview', () => {
    beforeEach(async () => {
      // Create diverse project portfolio
      await projectsTestHelpers.createMultipleProjects(userId, 5, [
        {
          title: 'Active Project 1',
          stage: ProjectStage.IMPLEMENTATION,
          beganAt: new Date('2024-01-01'),
          rate: 100,
          currency: 'USD',
        },
        {
          title: 'Planning Project',
          stage: ProjectStage.PLANNING,
          rate: 150,
          currency: 'EUR',
        },
        {
          title: 'Completed Project',
          stage: ProjectStage.DEPLOYMENT,
          beganAt: new Date('2024-01-15'),
          completedAt: new Date('2024-02-15'),
          rate: 120,
          currency: 'USD',
        },
        {
          title: 'Testing Project',
          stage: ProjectStage.TESTING,
          beganAt: new Date('2024-02-01'),
          rate: 80,
          currency: 'GBP',
        },
        {
          title: 'Archived Project',
          stage: ProjectStage.MAINTENANCE,
          beganAt: new Date('2023-12-01'),
          completedAt: new Date('2024-01-30'),
          rate: 90,
          currency: 'USD',
        },
      ])
    })

    it('should provide comprehensive portfolio analytics', async () => {
      const response = await request(app)
        .get('/api/v1/projects/analytics/overview')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
      expect(response.body.data.analytics).toEqual(
        expect.objectContaining({
          totalProjects: 6, // 5 created + 1 from setup
          activeProjects: expect.any(Number),
          completedProjects: expect.any(Number),
          stageDistribution: expect.objectContaining({
            [ProjectStage.PLANNING]: expect.any(Number),
            [ProjectStage.IMPLEMENTATION]: expect.any(Number),
            [ProjectStage.TESTING]: expect.any(Number),
            [ProjectStage.DEPLOYMENT]: expect.any(Number),
            [ProjectStage.MAINTENANCE]: expect.any(Number),
          }),
        }),
      )
    })

    it('should calculate revenue metrics', async () => {
      const response = await request(app)
        .get('/api/v1/projects/analytics/overview')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.data.analytics.revenue).toEqual(
        expect.objectContaining({
          totalValue: expect.any(Number),
          currencyBreakdown: expect.objectContaining({
            USD: expect.any(Number),
            EUR: expect.any(Number),
            GBP: expect.any(Number),
          }),
          averageProjectValue: expect.any(Number),
        }),
      )
    })

    it('should provide timeline metrics', async () => {
      const response = await request(app)
        .get('/api/v1/projects/analytics/overview')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.data.analytics.timeline).toEqual(
        expect.objectContaining({
          averageCompletionTime: expect.any(Number),
          onTimeDeliveryRate: expect.any(Number),
          projectsStartedThisMonth: expect.any(Number),
          projectsCompletedThisMonth: expect.any(Number),
        }),
      )
    })

    it('should include productivity metrics', async () => {
      const response = await request(app)
        .get('/api/v1/projects/analytics/overview')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.data.analytics.productivity).toEqual(
        expect.objectContaining({
          projectsPerMonth: expect.any(Number),
          averageProjectDuration: expect.any(Number),
          utilizationRate: expect.any(Number),
        }),
      )
    })
  })

  describe('GET /api/v1/projects/analytics/performance - Performance Metrics', () => {
    beforeEach(async () => {
      const project1 = await projectsTestHelpers.createTestProject(userId, {
        title: 'High Performance Project',
        stage: ProjectStage.IMPLEMENTATION,
        beganAt: new Date('2024-01-01'),
        rate: 100,
      })

      const project2 = await projectsTestHelpers.createTestProject(userId, {
        title: 'Slow Project',
        stage: ProjectStage.ANALYSIS,
        beganAt: new Date('2024-01-15'),
        rate: 150,
      })

      // Add tasks with different completion rates
      await projectsTestHelpers.createTestTask(project1.id, userId, {
        title: 'Fast Task 1',
        status: TaskStatus.DONE,
        timeSpent: 2,
        costInProjectCurrency: 200,
      })
      await projectsTestHelpers.createTestTask(project1.id, userId, {
        title: 'Fast Task 2',
        status: TaskStatus.DONE,
        timeSpent: 3,
        costInProjectCurrency: 300,
      })

      await projectsTestHelpers.createTestTask(project2.id, userId, {
        title: 'Slow Task 1',
        status: TaskStatus.WIP,
        timeSpent: 8,
        costInProjectCurrency: 1200,
      })
      await projectsTestHelpers.createTestTask(project2.id, userId, {
        title: 'Slow Task 2',
        status: TaskStatus.BACKLOG,
      })
    })

    it('should analyze project velocity', async () => {
      const response = await request(app)
        .get('/api/v1/projects/analytics/performance')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
      expect(response.body.data.performance).toEqual(
        expect.objectContaining({
          velocity: expect.objectContaining({
            averageTasksPerWeek: expect.any(Number),
            averageHoursPerTask: expect.any(Number),
            completionRate: expect.any(Number),
          }),
        }),
      )
    })

    it('should identify bottlenecks', async () => {
      const response = await request(app)
        .get('/api/v1/projects/analytics/performance')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.data.performance.bottlenecks).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: expect.any(String),
            description: expect.any(String),
            severity: expect.any(String),
            affectedProjects: expect.any(Number),
          }),
        ]),
      )
    })

    it('should provide efficiency metrics', async () => {
      const response = await request(app)
        .get('/api/v1/projects/analytics/performance')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.data.performance.efficiency).toEqual(
        expect.objectContaining({
          costEfficiency: expect.any(Number),
          timeEfficiency: expect.any(Number),
          resourceUtilization: expect.any(Number),
          qualityScore: expect.any(Number),
        }),
      )
    })

    it('should compare against benchmarks', async () => {
      const response = await request(app)
        .get('/api/v1/projects/analytics/performance')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.data.performance.benchmarks).toEqual(
        expect.objectContaining({
          industryAverage: expect.any(Number),
          personalBest: expect.any(Number),
          improvementOpportunities: expect.arrayContaining([
            expect.objectContaining({
              area: expect.any(String),
              potential: expect.any(Number),
              recommendation: expect.any(String),
            }),
          ]),
        }),
      )
    })
  })

  describe('GET /api/v1/projects/analytics/trends - Trend Analysis', () => {
    beforeEach(async () => {
      // Create projects across different time periods
      const dates = [
        new Date('2024-01-01'),
        new Date('2024-01-15'),
        new Date('2024-02-01'),
        new Date('2024-02-15'),
        new Date('2024-03-01'),
      ]

      for (let i = 0; i < dates.length; i++) {
        await projectsTestHelpers.createTestProject(userId, {
          title: `Trend Project ${i + 1}`,
          stage: i < 3 ? ProjectStage.DEPLOYMENT : ProjectStage.IMPLEMENTATION,
          beganAt: dates[i],
          completedAt:
            i < 3
              ? new Date(dates[i].getTime() + 30 * 24 * 60 * 60 * 1000)
              : null,
          rate: 100 + i * 10,
        })
      }
    })

    it('should analyze completion trends over time', async () => {
      const response = await request(app)
        .get('/api/v1/projects/analytics/trends?period=quarterly')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
      expect(response.body.data.trends).toEqual(
        expect.objectContaining({
          completionTrend: expect.objectContaining({
            direction: expect.any(String), // 'up', 'down', 'stable'
            percentage: expect.any(Number),
            dataPoints: expect.arrayContaining([
              expect.objectContaining({
                period: expect.any(String),
                completed: expect.any(Number),
                started: expect.any(Number),
              }),
            ]),
          }),
        }),
      )
    })

    it('should analyze revenue trends', async () => {
      const response = await request(app)
        .get('/api/v1/projects/analytics/trends?period=monthly')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.data.trends.revenueTrend).toEqual(
        expect.objectContaining({
          direction: expect.any(String),
          growthRate: expect.any(Number),
          dataPoints: expect.arrayContaining([
            expect.objectContaining({
              period: expect.any(String),
              revenue: expect.any(Number),
              projects: expect.any(Number),
            }),
          ]),
        }),
      )
    })

    it('should identify seasonal patterns', async () => {
      const response = await request(app)
        .get('/api/v1/projects/analytics/trends?period=yearly')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.data.trends.seasonality).toEqual(
        expect.objectContaining({
          peakMonth: expect.any(String),
          lowMonth: expect.any(String),
          variance: expect.any(Number),
          patterns: expect.arrayContaining([
            expect.objectContaining({
              pattern: expect.any(String),
              confidence: expect.any(Number),
              description: expect.any(String),
            }),
          ]),
        }),
      )
    })

    it('should support custom date ranges', async () => {
      const startDate = '2024-01-01'
      const endDate = '2024-03-31'

      const response = await request(app)
        .get(
          `/api/v1/projects/analytics/trends?startDate=${startDate}&endDate=${endDate}`,
        )
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.data.trends).toEqual(
        expect.objectContaining({
          dateRange: expect.objectContaining({
            start: startDate,
            end: endDate,
          }),
        }),
      )
    })
  })

  describe('GET /api/v1/projects/analytics/reports - Generate Reports', () => {
    beforeEach(async () => {
      // Create comprehensive test data
      const project = await projectsTestHelpers.createTestProject(userId, {
        title: 'Report Project',
        stage: ProjectStage.DEPLOYMENT,
        beganAt: new Date('2024-01-01'),
        completedAt: new Date('2024-02-01'),
        rate: 100,
        currency: 'USD',
      })

      await projectsTestHelpers.createTestTask(project.id, userId, {
        title: 'Report Task',
        status: TaskStatus.DONE,
        timeSpent: 10,
        costInProjectCurrency: 1000,
      })
    })

    it('should generate executive summary report', async () => {
      const response = await request(app)
        .get('/api/v1/projects/analytics/reports?type=executive')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
      expect(response.body.data.report).toEqual(
        expect.objectContaining({
          type: 'executive',
          period: expect.any(String),
          summary: expect.objectContaining({
            totalProjects: expect.any(Number),
            totalRevenue: expect.any(Number),
            completionRate: expect.any(Number),
            keyMetrics: expect.arrayContaining([
              expect.objectContaining({
                metric: expect.any(String),
                value: expect.any(Number),
                trend: expect.any(String),
              }),
            ]),
          }),
        }),
      )
    })

    it('should generate detailed project report', async () => {
      const response = await request(app)
        .get('/api/v1/projects/analytics/reports?type=detailed')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.data.report).toEqual(
        expect.objectContaining({
          type: 'detailed',
          projects: expect.arrayContaining([
            expect.objectContaining({
              title: expect.any(String),
              stage: expect.any(String),
              duration: expect.any(Number),
              cost: expect.any(Number),
              tasks: expect.objectContaining({
                total: expect.any(Number),
                completed: expect.any(Number),
                timeSpent: expect.any(Number),
              }),
            }),
          ]),
        }),
      )
    })

    it('should generate financial report', async () => {
      const response = await request(app)
        .get('/api/v1/projects/analytics/reports?type=financial')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.data.report).toEqual(
        expect.objectContaining({
          type: 'financial',
          revenue: expect.objectContaining({
            total: expect.any(Number),
            byPeriod: expect.any(Array),
            byCurrency: expect.any(Object),
            projections: expect.any(Object),
          }),
          costs: expect.objectContaining({
            total: expect.any(Number),
            breakdown: expect.any(Object),
            efficiency: expect.any(Number),
          }),
        }),
      )
    })

    it('should support custom report parameters', async () => {
      const response = await request(app)
        .get(
          '/api/v1/projects/analytics/reports?type=custom&metrics=revenue,completion&period=quarterly',
        )
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.data.report.parameters).toEqual(
        expect.objectContaining({
          metrics: ['revenue', 'completion'],
          period: 'quarterly',
        }),
      )
    })
  })

  describe('Admin/Manager Analytics', () => {
    beforeEach(async () => {
      // Create projects for multiple users
      const otherUser = await projectsTestHelpers.createTestUser({
        uuid: 'other-user-uuid',
        email: 'other@example.com',
        name: 'Other User',
      })

      await projectsTestHelpers.createTestProject(otherUser.id, {
        title: 'Other User Project',
        stage: ProjectStage.IMPLEMENTATION,
      })
    })

    it('should allow managers to view team analytics', async () => {
      const response = await request(app)
        .get('/api/v1/projects/analytics/team')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200)

      expect(response.body.data.analytics).toEqual(
        expect.objectContaining({
          teamSize: expect.any(Number),
          totalProjects: expect.any(Number),
          userMetrics: expect.arrayContaining([
            expect.objectContaining({
              userId: expect.any(Number),
              projectCount: expect.any(Number),
              completionRate: expect.any(Number),
              avgProjectDuration: expect.any(Number),
            }),
          ]),
        }),
      )
    })

    it('should allow admins to view system-wide analytics', async () => {
      const response = await request(app)
        .get('/api/v1/projects/analytics/system')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.data.analytics).toEqual(
        expect.objectContaining({
          systemMetrics: expect.objectContaining({
            totalUsers: expect.any(Number),
            totalProjects: expect.any(Number),
            systemUtilization: expect.any(Number),
            performanceMetrics: expect.any(Object),
          }),
        }),
      )
    })

    it('should restrict user analytics to own data', async () => {
      await request(app)
        .get('/api/v1/projects/analytics/team')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403)

      await request(app)
        .get('/api/v1/projects/analytics/system')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403)
    })
  })
})
