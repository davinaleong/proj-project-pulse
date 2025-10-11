import request from 'supertest'
import createApp from '../../../../src/app'
import { ProjectStage, UserRole, UserStatus } from '@prisma/client'
import { projectsTestHelpers, prisma } from './projects.helpers'

const app = createApp()

describe('Projects Admin Operations', () => {
  let authToken: string
  let adminToken: string
  let managerToken: string
  let superAdminToken: string
  let userId: number
  let adminId: number
  let managerId: number
  let superAdminId: number

  beforeEach(async () => {
    await projectsTestHelpers.cleanupDatabase()

    const testData = await projectsTestHelpers.setupTestData()
    authToken = testData.authToken
    adminToken = testData.adminToken
    managerToken = testData.managerToken
    userId = testData.user.id
    adminId = testData.admin.id
    managerId = testData.manager.id

    // Create superadmin
    const superAdmin = await projectsTestHelpers.createTestUser({
      uuid: 'superadmin-uuid',
      email: 'superadmin@example.com',
      name: 'Super Admin',
      role: UserRole.SUPERADMIN,
    })
    superAdminId = superAdmin.id
    superAdminToken = projectsTestHelpers.generateMockAuthToken({
      id: superAdmin.id,
      uuid: superAdmin.uuid,
      email: superAdmin.email,
      role: superAdmin.role,
    })
  })

  afterAll(async () => {
    await projectsTestHelpers.cleanupDatabase()
    await projectsTestHelpers.disconnectDatabase()
  })

  describe('GET /api/v1/admin/projects - Admin Project Management', () => {
    beforeEach(async () => {
      // Create projects for multiple users
      const user2 = await projectsTestHelpers.createTestUser({
        uuid: 'user2-uuid',
        email: 'user2@example.com',
        name: 'User Two',
      })

      const user3 = await projectsTestHelpers.createTestUser({
        uuid: 'user3-uuid',
        email: 'user3@example.com',
        name: 'User Three',
        status: UserStatus.INACTIVE,
      })

      await projectsTestHelpers.createMultipleProjects(userId, 2, [
        { title: 'User 1 Project 1', stage: ProjectStage.IMPLEMENTATION },
        { title: 'User 1 Project 2', stage: ProjectStage.PLANNING },
      ])

      await projectsTestHelpers.createMultipleProjects(user2.id, 2, [
        { title: 'User 2 Project 1', stage: ProjectStage.TESTING },
        { title: 'User 2 Project 2', stage: ProjectStage.DEPLOYMENT },
      ])

      await projectsTestHelpers.createTestProject(user3.id, {
        title: 'Inactive User Project',
        stage: ProjectStage.ANALYSIS,
      })
    })

    it('should list all projects across all users for admin', async () => {
      const response = await request(app)
        .get('/api/v1/admin/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
      expect(response.body.data.projects.length).toBeGreaterThanOrEqual(6) // 5 created + 1 from setup
      expect(response.body.data.projects).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            title: 'User 1 Project 1',
            user: expect.objectContaining({
              name: 'Test User',
              email: 'test@example.com',
            }),
          }),
          expect.objectContaining({
            title: 'User 2 Project 1',
            user: expect.objectContaining({
              name: 'User Two',
              email: 'user2@example.com',
            }),
          }),
        ]),
      )
    })

    it('should support filtering by user status', async () => {
      const response = await request(app)
        .get('/api/v1/admin/projects?userStatus=INACTIVE')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.data.projects).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            title: 'Inactive User Project',
            user: expect.objectContaining({
              status: UserStatus.INACTIVE,
            }),
          }),
        ]),
      )
    })

    it('should support filtering by project stage', async () => {
      const response = await request(app)
        .get(`/api/v1/admin/projects?stage=${ProjectStage.TESTING}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.data.projects).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            stage: ProjectStage.TESTING,
          }),
        ]),
      )
    })

    it('should support searching across all projects', async () => {
      const response = await request(app)
        .get('/api/v1/admin/projects?search=User 2')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(
        response.body.data.projects.every((p: any) =>
          p.title.includes('User 2'),
        ),
      ).toBe(true)
    })

    it('should include project statistics', async () => {
      const response = await request(app)
        .get('/api/v1/admin/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.data.statistics).toEqual(
        expect.objectContaining({
          totalProjects: expect.any(Number),
          projectsByStage: expect.objectContaining({
            [ProjectStage.PLANNING]: expect.any(Number),
            [ProjectStage.IMPLEMENTATION]: expect.any(Number),
            [ProjectStage.TESTING]: expect.any(Number),
          }),
          projectsByUser: expect.any(Array),
        }),
      )
    })

    it('should restrict access to regular users', async () => {
      await request(app)
        .get('/api/v1/admin/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403)
    })

    it('should allow manager access', async () => {
      const response = await request(app)
        .get('/api/v1/admin/projects')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
    })
  })

  describe('POST /api/v1/admin/projects/:uuid/transfer - Transfer Project Ownership', () => {
    let project: any
    let targetUser: any

    beforeEach(async () => {
      project = await projectsTestHelpers.createTestProject(userId, {
        title: 'Project to Transfer',
        stage: ProjectStage.IMPLEMENTATION,
      })

      targetUser = await projectsTestHelpers.createTestUser({
        uuid: 'target-user-uuid',
        email: 'target@example.com',
        name: 'Target User',
      })

      // Add some tasks and notes to test transfer
      await projectsTestHelpers.createTestTask(project.id, userId, {
        title: 'Task to Transfer',
      })
      await projectsTestHelpers.createTestNote(userId, project.id, {
        title: 'Note to Transfer',
      })
    })

    it('should transfer project ownership to another user', async () => {
      const response = await request(app)
        .post(`/api/v1/admin/projects/${project.uuid}/transfer`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          targetUserId: targetUser.id,
          reason: 'User request for project transfer',
        })
        .expect(200)

      expect(response.body.status).toBe('success')
      expect(response.body.data.project.userId).toBe(targetUser.id)

      // Verify in database
      const transferredProject = await prisma.project.findUnique({
        where: { uuid: project.uuid },
      })
      expect(transferredProject?.userId).toBe(targetUser.id)
    })

    it('should transfer related tasks but not notes', async () => {
      await request(app)
        .post(`/api/v1/admin/projects/${project.uuid}/transfer`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          targetUserId: targetUser.id,
          transferTasks: true,
          transferNotes: false,
        })
        .expect(200)

      const transferredTasks = await prisma.task.findMany({
        where: { projectId: project.id },
      })
      const originalNotes = await prisma.note.findMany({
        where: { projectId: project.id },
      })

      expect(transferredTasks[0].userId).toBe(targetUser.id)
      expect(originalNotes[0].userId).toBe(userId) // Note stays with original user
    })

    it('should log transfer activity', async () => {
      const response = await request(app)
        .post(`/api/v1/admin/projects/${project.uuid}/transfer`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          targetUserId: targetUser.id,
          reason: 'Administrative transfer',
        })
        .expect(200)

      expect(response.body.data.transferLog).toEqual(
        expect.objectContaining({
          fromUserId: userId,
          toUserId: targetUser.id,
          adminId: adminId,
          reason: 'Administrative transfer',
          timestamp: expect.any(String),
        }),
      )
    })

    it('should prevent transfer to non-existent user', async () => {
      const response = await request(app)
        .post(`/api/v1/admin/projects/${project.uuid}/transfer`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          targetUserId: 99999,
          reason: 'Invalid transfer',
        })
        .expect(400)

      expect(response.body.status).toBe('error')
      expect(response.body.message).toContain('Target user not found')
    })

    it('should restrict access to admin+ roles', async () => {
      await request(app)
        .post(`/api/v1/admin/projects/${project.uuid}/transfer`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ targetUserId: targetUser.id })
        .expect(403)

      await request(app)
        .post(`/api/v1/admin/projects/${project.uuid}/transfer`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ targetUserId: targetUser.id })
        .expect(403)
    })
  })

  describe('POST /api/v1/admin/projects/bulk-actions - Bulk Operations', () => {
    let projects: any[]

    beforeEach(async () => {
      projects = await projectsTestHelpers.createMultipleProjects(userId, 3, [
        { title: 'Bulk Project 1', stage: ProjectStage.PLANNING },
        { title: 'Bulk Project 2', stage: ProjectStage.ANALYSIS },
        { title: 'Bulk Project 3', stage: ProjectStage.DESIGN },
      ])
    })

    it('should bulk update project stages', async () => {
      const projectUuids = projects.map((p) => p.uuid)

      const response = await request(app)
        .post('/api/v1/admin/projects/bulk-actions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'update-stage',
          projectUuids,
          data: { stage: ProjectStage.IMPLEMENTATION },
        })
        .expect(200)

      expect(response.body.status).toBe('success')
      expect(response.body.data.updated).toBe(3)

      // Verify updates
      const updatedProjects = await prisma.project.findMany({
        where: { uuid: { in: projectUuids } },
      })
      expect(
        updatedProjects.every((p) => p.stage === ProjectStage.IMPLEMENTATION),
      ).toBe(true)
    })

    it('should bulk archive projects', async () => {
      // First update to completed stage
      await prisma.project.updateMany({
        where: { id: { in: projects.map((p) => p.id) } },
        data: { stage: ProjectStage.DEPLOYMENT, completedAt: new Date() },
      })

      const projectUuids = projects.map((p) => p.uuid)

      const response = await request(app)
        .post('/api/v1/admin/projects/bulk-actions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'archive',
          projectUuids,
          data: { reason: 'Bulk archival by admin' },
        })
        .expect(200)

      expect(response.body.data.archived).toBe(3)

      const archivedProjects = await prisma.project.findMany({
        where: { uuid: { in: projectUuids } },
      })
      expect(
        archivedProjects.every((p) => p.stage === ProjectStage.MAINTENANCE),
      ).toBe(true)
    })

    it('should bulk delete projects', async () => {
      const projectUuids = projects.map((p) => p.uuid)

      const response = await request(app)
        .post('/api/v1/admin/projects/bulk-actions')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          action: 'delete',
          projectUuids,
          data: { reason: 'Data cleanup', confirmDelete: true },
        })
        .expect(200)

      expect(response.body.data.deleted).toBe(3)

      const remainingProjects = await prisma.project.findMany({
        where: { uuid: { in: projectUuids } },
      })
      expect(remainingProjects).toHaveLength(0)
    })

    it('should validate bulk action permissions', async () => {
      const projectUuids = projects.map((p) => p.uuid)

      // Regular admin cannot delete
      await request(app)
        .post('/api/v1/admin/projects/bulk-actions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'delete',
          projectUuids,
        })
        .expect(403)

      // Manager cannot perform bulk actions
      await request(app)
        .post('/api/v1/admin/projects/bulk-actions')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          action: 'update-stage',
          projectUuids,
        })
        .expect(403)
    })

    it('should provide detailed results for partial failures', async () => {
      const validProject = projects[0]
      const invalidUuid = 'invalid-uuid'

      const response = await request(app)
        .post('/api/v1/admin/projects/bulk-actions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'update-stage',
          projectUuids: [validProject.uuid, invalidUuid],
          data: { stage: ProjectStage.TESTING },
        })
        .expect(207) // Partial success

      expect(response.body.data).toEqual(
        expect.objectContaining({
          successful: 1,
          failed: 1,
          results: expect.arrayContaining([
            expect.objectContaining({
              uuid: validProject.uuid,
              success: true,
            }),
            expect.objectContaining({
              uuid: invalidUuid,
              success: false,
              error: expect.any(String),
            }),
          ]),
        }),
      )
    })
  })

  describe('GET /api/v1/admin/projects/audit - Project Audit Trail', () => {
    let project: any

    beforeEach(async () => {
      project = await projectsTestHelpers.createTestProject(userId, {
        title: 'Audit Project',
        stage: ProjectStage.PLANNING,
      })

      // Perform some actions to create audit trail
      await request(app)
        .put(`/api/v1/projects/${project.uuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated Audit Project' })

      await request(app)
        .post(`/api/v1/projects/${project.uuid}/stage`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ stage: ProjectStage.ANALYSIS })
    })

    it('should provide comprehensive audit trail', async () => {
      const response = await request(app)
        .get(`/api/v1/admin/projects/audit?projectUuid=${project.uuid}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
      expect(response.body.data.auditTrail).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            action: 'project_created',
            userId: userId,
            timestamp: expect.any(String),
            details: expect.any(Object),
          }),
          expect.objectContaining({
            action: 'project_updated',
            userId: userId,
            changes: expect.objectContaining({
              title: expect.objectContaining({
                from: 'Audit Project',
                to: 'Updated Audit Project',
              }),
            }),
          }),
          expect.objectContaining({
            action: 'stage_transition',
            userId: userId,
            changes: expect.objectContaining({
              stage: expect.objectContaining({
                from: ProjectStage.PLANNING,
                to: ProjectStage.ANALYSIS,
              }),
            }),
          }),
        ]),
      )
    })

    it('should support filtering audit trail by action type', async () => {
      const response = await request(app)
        .get(
          `/api/v1/admin/projects/audit?projectUuid=${project.uuid}&action=stage_transition`,
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(
        response.body.data.auditTrail.every(
          (entry: any) => entry.action === 'stage_transition',
        ),
      ).toBe(true)
    })

    it('should support filtering by user', async () => {
      const response = await request(app)
        .get(`/api/v1/admin/projects/audit?userId=${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(
        response.body.data.auditTrail.every(
          (entry: any) => entry.userId === userId,
        ),
      ).toBe(true)
    })

    it('should support date range filtering', async () => {
      const today = new Date().toISOString().split('T')[0]
      const response = await request(app)
        .get(`/api/v1/admin/projects/audit?startDate=${today}&endDate=${today}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.data.auditTrail).toEqual(expect.any(Array))
    })

    it('should restrict access to admin+ roles', async () => {
      await request(app)
        .get(`/api/v1/admin/projects/audit?projectUuid=${project.uuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403)
    })
  })

  describe('POST /api/v1/admin/projects/maintenance - System Maintenance', () => {
    beforeEach(async () => {
      // Create some old/stale projects for cleanup
      await projectsTestHelpers.createTestProject(userId, {
        title: 'Old Completed Project',
        stage: ProjectStage.MAINTENANCE,
        completedAt: new Date('2023-01-01'),
      })

      await projectsTestHelpers.createTestProject(userId, {
        title: 'Stale Planning Project',
        stage: ProjectStage.PLANNING,
        createdAt: new Date('2023-01-01'),
      })
    })

    it('should perform data cleanup operations', async () => {
      const response = await request(app)
        .post('/api/v1/admin/projects/maintenance')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          operation: 'cleanup',
          parameters: {
            archiveOldCompleted: true,
            removeStaleProjects: false,
            daysThreshold: 365,
          },
        })
        .expect(200)

      expect(response.body.status).toBe('success')
      expect(response.body.data.maintenance).toEqual(
        expect.objectContaining({
          operation: 'cleanup',
          itemsProcessed: expect.any(Number),
          itemsModified: expect.any(Number),
          summary: expect.any(String),
        }),
      )
    })

    it('should validate project data integrity', async () => {
      const response = await request(app)
        .post('/api/v1/admin/projects/maintenance')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          operation: 'validate',
          parameters: {
            checkOrphanedTasks: true,
            checkStageConsistency: true,
            checkDateConsistency: true,
          },
        })
        .expect(200)

      expect(response.body.data.validation).toEqual(
        expect.objectContaining({
          totalChecked: expect.any(Number),
          issuesFound: expect.any(Number),
          issues: expect.any(Array),
          recommendations: expect.any(Array),
        }),
      )
    })

    it('should recalculate project statistics', async () => {
      const response = await request(app)
        .post('/api/v1/admin/projects/maintenance')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          operation: 'recalculate',
          parameters: {
            recalculateCosts: true,
            recalculateProgress: true,
            recalculateTimelines: true,
          },
        })
        .expect(200)

      expect(response.body.data.recalculation).toEqual(
        expect.objectContaining({
          projectsUpdated: expect.any(Number),
          calculationsPerformed: expect.any(Array),
          errors: expect.any(Array),
        }),
      )
    })

    it('should restrict maintenance operations to superadmin only', async () => {
      await request(app)
        .post('/api/v1/admin/projects/maintenance')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ operation: 'cleanup' })
        .expect(403)

      await request(app)
        .post('/api/v1/admin/projects/maintenance')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ operation: 'cleanup' })
        .expect(403)
    })
  })
})
