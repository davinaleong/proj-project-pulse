import {
  UserRole,
  UserStatus,
  TaskStatus,
  ProjectStage,
  NoteStatus,
} from '@prisma/client'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { Decimal } from '@prisma/client/runtime/library'
import prisma from '../../../../src/config/db'

export const tasksTestHelpers = {
  async cleanupDatabase() {
    await prisma.note.deleteMany()
    await prisma.task.deleteMany()
    await prisma.project.deleteMany()
    await prisma.user.deleteMany()
  },

  async disconnectDatabase() {
    await prisma.$disconnect()
  },

  async createTestUser(overrides?: {
    name?: string
    email?: string
    password?: string
    role?: UserRole
    status?: UserStatus
  }) {
    const randomId = Math.random().toString(36).substring(7)
    const hashedPassword = await bcrypt.hash(
      overrides?.password || 'TestPassword123!',
      12,
    )
    return prisma.user.create({
      data: {
        name: overrides?.name || 'Test User',
        email: overrides?.email || `test-${randomId}@example.com`,
        password: hashedPassword,
        role: overrides?.role || UserRole.USER,
        status: overrides?.status || UserStatus.ACTIVE,
      },
    })
  },

  async createTestProject(
    userId: number,
    overrides?: {
      title?: string
      description?: string
      stage?: ProjectStage
      beganAt?: Date
      completedAt?: Date
      billingCycle?: string
      rate?: number
      currency?: string
    },
  ) {
    return prisma.project.create({
      data: {
        title: overrides?.title || 'Test Project',
        description: overrides?.description || 'Test project description',
        stage: overrides?.stage || ProjectStage.PLANNING,
        userId,
        beganAt: overrides?.beganAt,
        completedAt: overrides?.completedAt,
        billingCycle: overrides?.billingCycle,
        rate: overrides?.rate ? new Decimal(overrides.rate) : null,
        currency: overrides?.currency,
      },
    })
  },

  async createTestTask(
    projectId: number,
    userId: number,
    overrides?: {
      title?: string
      definitionOfDone?: string
      status?: TaskStatus
      startedAt?: Date
      endedAt?: Date
      timeSpent?: number
      costInProjectCurrency?: number
    },
  ) {
    return prisma.task.create({
      data: {
        title: overrides?.title || 'Test Task',
        definitionOfDone:
          overrides?.definitionOfDone || 'Test task definition of done',
        status: overrides?.status || TaskStatus.BACKLOG,
        startedAt: overrides?.startedAt,
        endedAt: overrides?.endedAt,
        timeSpent: overrides?.timeSpent
          ? new Decimal(overrides.timeSpent)
          : null,
        costInProjectCurrency: overrides?.costInProjectCurrency
          ? new Decimal(overrides.costInProjectCurrency)
          : null,
        projectId,
        userId,
      },
    })
  },

  async createTestNote(
    projectId: number,
    userId: number,
    overrides?: {
      title?: string
      description?: string
      body?: string
      status?: NoteStatus
    },
  ) {
    return prisma.note.create({
      data: {
        title: overrides?.title || 'Test Note',
        description: overrides?.description || 'Test note description',
        body: overrides?.body || 'Test note body',
        status: overrides?.status || NoteStatus.DRAFT,
        projectId,
        userId,
      },
    })
  },

  generateAuthToken(user: {
    id: number
    uuid: string
    email: string
    role: UserRole
  }) {
    return jwt.sign(
      {
        uuid: user.uuid,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only',
      { expiresIn: '1h' },
    )
  },

  generateExpiredToken(user: {
    id: number
    uuid: string
    email: string
    role: UserRole
  }) {
    return jwt.sign(
      {
        uuid: user.uuid,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only',
      { expiresIn: '-1h' }, // Expired
    )
  },

  generateInvalidToken() {
    return 'invalid.token.here'
  },

  async getTaskWithRelations(taskId: number) {
    return prisma.task.findUnique({
      where: { id: taskId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            uuid: true,
            title: true,
          },
        },
      },
    })
  },

  async setupTestData() {
    // Create test users with unique emails
    const randomId = Math.random().toString(36).substring(7)
    const user = await this.createTestUser({
      name: 'Regular User',
      email: `user-${randomId}@test.com`,
      role: UserRole.USER,
    })

    const admin = await this.createTestUser({
      name: 'Admin User',
      email: `admin-${randomId}@test.com`,
      role: UserRole.ADMIN,
    })

    const manager = await this.createTestUser({
      name: 'Manager User',
      email: `manager-${randomId}@test.com`,
      role: UserRole.MANAGER,
    })

    // Create test project with unique title
    const project = await this.createTestProject(user.id, {
      title: `Test Project for Tasks ${randomId}`,
      description: 'A project to test task functionality',
    })

    // Generate auth tokens
    const authToken = this.generateAuthToken(user)
    const adminToken = this.generateAuthToken(admin)
    const managerToken = this.generateAuthToken(manager)

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

  // Common test data generators
  generateValidTaskData(projectId: number) {
    return {
      title: 'Valid Task Title',
      definitionOfDone: 'Valid task definition of done',
      status: TaskStatus.BACKLOG,
      projectId,
    }
  },

  generateInvalidTaskData() {
    return {
      title: '', // Invalid: empty title
      definitionOfDone: 'x'.repeat(2001), // Invalid: too long
      status: 'INVALID_STATUS' as TaskStatus,
      projectId: -1, // Invalid: negative projectId
    }
  },

  generateUpdateTaskData() {
    return {
      title: 'Updated Task Title',
      definitionOfDone: 'Updated task definition of done',
      status: TaskStatus.WIP,
      startedAt: new Date().toISOString(),
      timeSpent: 2.5,
      costInProjectCurrency: 125.75,
    }
  },

  async createMultipleTasks(
    projectId: number,
    userId: number,
    count: number = 5,
  ) {
    const tasks = []
    const statuses = [
      TaskStatus.BACKLOG,
      TaskStatus.TODO,
      TaskStatus.WIP,
      TaskStatus.DONE,
      TaskStatus.BLOCKED,
    ]

    for (let i = 0; i < count; i++) {
      const task = await this.createTestTask(projectId, userId, {
        title: `Test Task ${i + 1}`,
        definitionOfDone: `Definition of done for task ${i + 1}`,
        status: statuses[i % statuses.length],
        timeSpent: i * 1.5,
        costInProjectCurrency: i * 50,
      })
      tasks.push(task)
    }
    return tasks
  },

  async waitForMs(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  },

  // Task status helpers
  getTaskStatusCounts(tasks: { status: TaskStatus }[]) {
    return tasks.reduce(
      (acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )
  },

  calculateTotalCost(tasks: { costInProjectCurrency: Decimal | null }[]) {
    return tasks.reduce((total, task) => {
      const cost = task.costInProjectCurrency
        ? parseFloat(task.costInProjectCurrency.toString())
        : 0
      return total + cost
    }, 0)
  },

  calculateTotalTime(tasks: { timeSpent: Decimal | null }[]) {
    return tasks.reduce((total, task) => {
      const time = task.timeSpent ? parseFloat(task.timeSpent.toString()) : 0
      return total + time
    }, 0)
  },
}

export { prisma }
