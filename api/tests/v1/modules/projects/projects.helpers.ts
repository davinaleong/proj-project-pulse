import {
  UserRole,
  UserStatus,
  ProjectStage,
  TaskStatus,
  NoteStatus,
} from '@prisma/client'
import jwt from 'jsonwebtoken'
import prisma from '../../../../src/config/db'

export const projectsTestHelpers = {
  async cleanupDatabase() {
    await prisma.note.deleteMany()
    await prisma.task.deleteMany()
    await prisma.project.deleteMany()
    await prisma.user.deleteMany()
  },

  async createTestUser(overrides?: {
    uuid?: string
    name?: string
    email?: string
    password?: string
    role?: UserRole
    status?: UserStatus
  }) {
    return prisma.user.create({
      data: {
        uuid: overrides?.uuid || 'test-user-uuid',
        email: overrides?.email || 'test@example.com',
        name: overrides?.name || 'Test User',
        password: overrides?.password || 'hashedpassword',
        role: overrides?.role || UserRole.USER,
        status: overrides?.status || UserStatus.ACTIVE,
      },
    })
  },

  async createTestProject(
    userId: number,
    overrides?: {
      uuid?: string
      title?: string
      description?: string
      stage?: ProjectStage
      beganAt?: Date | null
      completedAt?: Date | null
      billingCycle?: string | null
      rate?: number | null
      currency?: string | null
    },
  ) {
    return prisma.project.create({
      data: {
        uuid: overrides?.uuid || 'test-project-uuid',
        title: overrides?.title || 'Test Project',
        description: overrides?.description || 'Test project description',
        stage: overrides?.stage || ProjectStage.PLANNING,
        userId,
        beganAt: overrides?.beganAt,
        completedAt: overrides?.completedAt,
        billingCycle: overrides?.billingCycle,
        rate: overrides?.rate,
        currency: overrides?.currency || 'SGD',
      },
    })
  },

  async createMultipleProjects(
    userId: number,
    count: number,
    overrides?: Array<{
      uuid?: string
      title?: string
      description?: string
      stage?: ProjectStage
      beganAt?: Date | null
      completedAt?: Date | null
      billingCycle?: string | null
      rate?: number | null
      currency?: string | null
    }>,
  ) {
    const projects = []
    for (let i = 0; i < count; i++) {
      const projectData = overrides?.[i] || {}
      const project = await this.createTestProject(userId, {
        uuid: projectData.uuid || `test-project-uuid-${i + 1}`,
        title: projectData.title || `Test Project ${i + 1}`,
        description:
          projectData.description || `Test project ${i + 1} description`,
        stage: projectData.stage || ProjectStage.PLANNING,
        ...projectData,
      })
      projects.push(project)
    }
    return projects
  },

  async createTestTask(
    projectId: number,
    userId?: number,
    overrides?: {
      uuid?: string
      title?: string
      definitionOfDone?: string | null
      status?: TaskStatus
      startedAt?: Date | null
      endedAt?: Date | null
      timeSpent?: number | null
      costInProjectCurrency?: number | null
    },
  ) {
    return prisma.task.create({
      data: {
        uuid: overrides?.uuid || 'test-task-uuid',
        projectId,
        title: overrides?.title || 'Test Task',
        definitionOfDone: overrides?.definitionOfDone,
        status: overrides?.status || TaskStatus.BACKLOG,
        userId,
        startedAt: overrides?.startedAt,
        endedAt: overrides?.endedAt,
        timeSpent: overrides?.timeSpent,
        costInProjectCurrency: overrides?.costInProjectCurrency,
      },
    })
  },

  async createTestNote(
    userId: number,
    projectId?: number,
    overrides?: {
      uuid?: string
      title?: string
      description?: string | null
      body?: string | null
      status?: NoteStatus
    },
  ) {
    return prisma.note.create({
      data: {
        uuid: overrides?.uuid || 'test-note-uuid',
        title: overrides?.title || 'Test Note',
        description: overrides?.description,
        body: overrides?.body,
        status: overrides?.status || NoteStatus.DRAFT,
        userId,
        projectId,
      },
    })
  },

  generateMockAuthToken(user?: {
    id: number
    uuid: string
    email: string
    role: string
  }) {
    if (!user) {
      return 'mock-jwt-token'
    }
    return jwt.sign(
      { id: user.id, uuid: user.uuid, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' },
    )
  },

  async setupTestData() {
    // Create regular user
    const user = await this.createTestUser()

    // Create admin user
    const admin = await this.createTestUser({
      uuid: 'admin-user-uuid',
      email: 'admin@example.com',
      name: 'Admin User',
      role: UserRole.ADMIN,
    })

    // Create manager user
    const manager = await this.createTestUser({
      uuid: 'manager-user-uuid',
      email: 'manager@example.com',
      name: 'Manager User',
      role: UserRole.MANAGER,
    })

    // Create test project for user
    const project = await this.createTestProject(user.id)

    // Generate auth tokens
    const authToken = this.generateMockAuthToken({
      id: user.id,
      uuid: user.uuid,
      email: user.email,
      role: user.role,
    })

    const adminToken = this.generateMockAuthToken({
      id: admin.id,
      uuid: admin.uuid,
      email: admin.email,
      role: admin.role,
    })

    const managerToken = this.generateMockAuthToken({
      id: manager.id,
      uuid: manager.uuid,
      email: manager.email,
      role: manager.role,
    })

    return {
      user,
      admin,
      manager,
      project,
      authToken,
      adminToken,
      managerToken,
    }
  },

  async disconnectDatabase() {
    await prisma.$disconnect()
  },
}

export { prisma }
