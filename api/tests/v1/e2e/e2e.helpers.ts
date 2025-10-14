import {
  PrismaClient,
  UserRole,
  UserStatus,
  ProjectStage,
  TaskStatus,
  NoteStatus,
} from '@prisma/client'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

export const e2eTestHelpers = {
  /**
   * Database cleanup and setup
   */
  async cleanupDatabase() {
    // Clean up in order to respect foreign key constraints
    await prisma.passwordResetToken.deleteMany()
    await prisma.session.deleteMany()
    await prisma.note.deleteMany()
    await prisma.task.deleteMany()
    await prisma.project.deleteMany()
    await prisma.profile.deleteMany()
    await prisma.user.deleteMany()
  },

  async setupTestDatabase() {
    await this.cleanupDatabase()
    // Any additional setup can be added here
  },

  /**
   * User management helpers
   */
  async createTestUser(overrides?: {
    uuid?: string
    name?: string
    email?: string
    password?: string
    role?: UserRole
    status?: UserStatus
    emailVerifiedAt?: Date | null
  }) {
    const uuid = overrides?.uuid || randomUUID()
    const hashedPassword = await bcrypt.hash(
      overrides?.password || 'TestPassword123!',
      12,
    )

    const user = await prisma.user.create({
      data: {
        uuid,
        name: overrides?.name || 'Test User',
        email: overrides?.email || `test-${uuid}@example.com`,
        password: hashedPassword,
        role: overrides?.role || UserRole.USER,
        status: overrides?.status || UserStatus.ACTIVE,
        emailVerifiedAt: overrides?.emailVerifiedAt || new Date(),
      },
    })

    // Create associated profile
    await prisma.profile.create({
      data: {
        userId: user.id,
        bio: 'Test user profile',
        timezone: 'Asia/Singapore',
      },
    })

    return user
  },

  async createAdminUser(
    overrides?: Partial<Parameters<typeof this.createTestUser>[0]>,
  ) {
    return this.createTestUser({
      ...overrides,
      role: UserRole.ADMIN,
      name: overrides?.name || 'Admin User',
      email: overrides?.email || `admin-${randomUUID()}@example.com`,
    })
  },

  async createInactiveUser(
    overrides?: Partial<Parameters<typeof this.createTestUser>[0]>,
  ) {
    return this.createTestUser({
      ...overrides,
      status: UserStatus.INACTIVE,
      emailVerifiedAt: null,
      name: overrides?.name || 'Inactive User',
      email: overrides?.email || `inactive-${randomUUID()}@example.com`,
    })
  },

  /**
   * Authentication helpers
   */
  generateAuthToken(user: {
    id: number
    uuid: string
    email: string
    role: UserRole
  }) {
    const payload = {
      userId: user.id,
      userUuid: user.uuid,
      email: user.email,
      role: user.role,
    }
    return jwt.sign(payload, process.env.JWT_SECRET_KEY || 'test-secret', {
      expiresIn: '1h',
    })
  },

  getAuthHeaders(token: string) {
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  },

  async createAuthenticatedUser(
    userOverrides?: Parameters<typeof this.createTestUser>[0],
  ) {
    const user = await this.createTestUser(userOverrides)
    const token = this.generateAuthToken(user)
    return { user, token, headers: this.getAuthHeaders(token) }
  },

  async createAuthenticatedAdmin(
    userOverrides?: Partial<Parameters<typeof this.createTestUser>[0]>,
  ) {
    const admin = await this.createAdminUser(userOverrides)
    const token = this.generateAuthToken(admin)
    return { user: admin, token, headers: this.getAuthHeaders(token) }
  },

  /**
   * Project management helpers
   */
  async createTestProject(
    userId: number,
    overrides?: {
      uuid?: string
      title?: string
      description?: string
      stage?: ProjectStage
    },
  ) {
    const uuid = overrides?.uuid || randomUUID()
    return prisma.project.create({
      data: {
        uuid,
        title: overrides?.title || 'Test Project',
        description: overrides?.description || 'A test project for e2e testing',
        stage: overrides?.stage || ProjectStage.PLANNING,
        userId,
      },
    })
  },

  async createCollaborativeProject(ownerUserId: number) {
    const project = await this.createTestProject(ownerUserId, {
      title: 'Collaborative Project',
      description: 'A project with multiple collaborators',
    })

    // Note: If you have a ProjectMember or similar table, add collaborators here
    // For now, we'll simulate through task assignments

    return project
  },

  /**
   * Task management helpers
   */
  async createTestTask(
    projectId: number,
    assignedUserId?: number,
    overrides?: {
      uuid?: string
      title?: string
      definitionOfDone?: string
      status?: TaskStatus
    },
  ) {
    const uuid = overrides?.uuid || randomUUID()
    return prisma.task.create({
      data: {
        uuid,
        title: overrides?.title || 'Test Task',
        definitionOfDone:
          overrides?.definitionOfDone || 'A test task for e2e testing',
        status: overrides?.status || TaskStatus.TODO,
        projectId,
        userId: assignedUserId,
      },
    })
  },

  async createTaskWorkflow(projectId: number, assignedUserId: number) {
    const todoTask = await this.createTestTask(projectId, assignedUserId, {
      title: 'Todo Task',
      status: TaskStatus.TODO,
    })

    const inProgressTask = await this.createTestTask(
      projectId,
      assignedUserId,
      {
        title: 'In Progress Task',
        status: TaskStatus.WIP,
      },
    )

    const doneTask = await this.createTestTask(projectId, assignedUserId, {
      title: 'Completed Task',
      status: TaskStatus.DONE,
    })

    return { todoTask, inProgressTask, doneTask }
  },

  /**
   * Note management helpers
   */
  async createTestNote(
    userId: number,
    projectId?: number,
    overrides?: {
      uuid?: string
      title?: string
      description?: string
      body?: string
      status?: NoteStatus
    },
  ) {
    const uuid = overrides?.uuid || randomUUID()
    return prisma.note.create({
      data: {
        uuid,
        title: overrides?.title || 'Test Note',
        description: overrides?.description || 'Test note description',
        body: overrides?.body || 'This is a test note for e2e testing',
        status: overrides?.status || NoteStatus.DRAFT,
        userId,
        projectId,
      },
    })
  },

  /**
   * Session management helpers
   */
  async createTestSession(
    userId: number,
    token: string,
    overrides?: {
      userAgent?: string
      ipAddress?: string
    },
  ) {
    return prisma.session.create({
      data: {
        token,
        userId,
        userAgent: overrides?.userAgent || 'E2E Test Agent',
        ipAddress: overrides?.ipAddress || '127.0.0.1',
      },
    })
  },

  /**
   * Complete workflow helpers
   */
  async createCompleteUserWorkflow() {
    // Create user with profile
    const user = await this.createTestUser()
    const token = this.generateAuthToken(user)

    // Create user's projects
    const personalProject = await this.createTestProject(user.id, {
      title: 'Personal Project',
    })

    const publicProject = await this.createTestProject(user.id, {
      title: 'Public Project',
    })

    // Create tasks in projects
    const personalTasks = await this.createTaskWorkflow(
      personalProject.id,
      user.id,
    )
    const publicTasks = await this.createTaskWorkflow(publicProject.id, user.id)

    // Create notes
    const personalNote = await this.createTestNote(
      user.id,
      personalProject.id,
      {
        title: 'Personal Project Note',
      },
    )

    const publicNote = await this.createTestNote(user.id, publicProject.id, {
      title: 'Public Project Note',
      status: NoteStatus.PUBLISHED,
    })

    // Create session
    const session = await this.createTestSession(user.id, token)

    return {
      user,
      token,
      headers: this.getAuthHeaders(token),
      projects: { personalProject, publicProject },
      tasks: { personalTasks, publicTasks },
      notes: { personalNote, publicNote },
      session,
    }
  },

  async createMultiUserScenario() {
    // Create multiple users with different roles
    const regularUser = await this.createTestUser({ name: 'Regular User' })
    const adminUser = await this.createAdminUser({ name: 'Admin User' })
    const inactiveUser = await this.createInactiveUser({
      name: 'Inactive User',
    })

    // Create collaborative project
    const project = await this.createTestProject(regularUser.id, {
      title: 'Multi-User Project',
      description: 'A project for testing multi-user scenarios',
    })

    // Create tasks assigned to different users
    const userTask = await this.createTestTask(project.id, regularUser.id, {
      title: 'User Task',
      status: TaskStatus.WIP,
    })

    const adminTask = await this.createTestTask(project.id, adminUser.id, {
      title: 'Admin Task',
      status: TaskStatus.TODO,
    })

    // Create shared notes
    const userNote = await this.createTestNote(regularUser.id, project.id, {
      title: 'User Note',
    })

    const adminNote = await this.createTestNote(adminUser.id, project.id, {
      title: 'Admin Note',
      status: NoteStatus.PUBLISHED,
    })

    return {
      users: { regularUser, adminUser, inactiveUser },
      project,
      tasks: { userTask, adminTask },
      notes: { userNote, adminNote },
      tokens: {
        regular: this.generateAuthToken(regularUser),
        admin: this.generateAuthToken(adminUser),
      },
    }
  },

  /**
   * Edge case data helpers
   */
  async createEdgeCaseData() {
    // User with very long name and email
    const longNameUser = await this.createTestUser({
      name: 'A'.repeat(255), // Maximum length name
      email: `${'verylongemailaddress'.repeat(10)}@example.com`,
    })

    // Project with minimal data
    const minimalProject = await this.createTestProject(longNameUser.id, {
      title: 'A', // Minimal name
      description: '',
    })

    // Task with edge case dates
    const futureDueTask = await this.createTestTask(
      minimalProject.id,
      longNameUser.id,
      {
        title: 'Future Due Task',
      },
    )

    const pastDueTask = await this.createTestTask(
      minimalProject.id,
      longNameUser.id,
      {
        title: 'Past Due Task',
      },
    )

    // Note with special characters
    const specialCharNote = await this.createTestNote(
      longNameUser.id,
      minimalProject.id,
      {
        title: '🚀 Special Chars: <>&"\'',
        body: 'Content with\nnewlines\tand\ttabs and unicode: 🎉 ñáéíóú',
      },
    )

    return {
      longNameUser,
      minimalProject,
      tasks: { futureDueTask, pastDueTask },
      specialCharNote,
    }
  },

  /**
   * Performance test data helpers
   */
  async createBulkData(counts: {
    users?: number
    projects?: number
    tasks?: number
    notes?: number
  }) {
    const results = {
      users: [] as { id: number; uuid: string; email: string }[],
      projects: [] as { id: number; uuid: string; title: string }[],
      tasks: [] as { id: number; uuid: string; title: string }[],
      notes: [] as { id: number; uuid: string; title: string }[],
    }

    // Create users
    if (counts.users) {
      for (let i = 0; i < counts.users; i++) {
        const user = await this.createTestUser({
          name: `Bulk User ${i + 1}`,
          email: `bulkuser${i + 1}@example.com`,
        })
        results.users.push(user)
      }
    }

    // Create projects
    if (counts.projects && results.users.length > 0) {
      for (let i = 0; i < counts.projects; i++) {
        const randomUser =
          results.users[Math.floor(Math.random() * results.users.length)]
        const project = await this.createTestProject(randomUser.id, {
          title: `Bulk Project ${i + 1}`,
          description: `Bulk project ${i + 1} for performance testing`,
        })
        results.projects.push(project)
      }
    }

    // Create tasks
    if (
      counts.tasks &&
      results.projects.length > 0 &&
      results.users.length > 0
    ) {
      for (let i = 0; i < counts.tasks; i++) {
        const randomProject =
          results.projects[Math.floor(Math.random() * results.projects.length)]
        const randomUser =
          results.users[Math.floor(Math.random() * results.users.length)]
        const task = await this.createTestTask(
          randomProject.id,
          randomUser.id,
          {
            title: `Bulk Task ${i + 1}`,
            definitionOfDone: `Bulk task ${i + 1} for performance testing`,
          },
        )
        results.tasks.push(task)
      }
    }

    // Create notes
    if (counts.notes && results.users.length > 0) {
      for (let i = 0; i < counts.notes; i++) {
        const randomUser =
          results.users[Math.floor(Math.random() * results.users.length)]
        const randomProject =
          results.projects.length > 0
            ? results.projects[
                Math.floor(Math.random() * results.projects.length)
              ]
            : undefined

        const note = await this.createTestNote(
          randomUser.id,
          randomProject?.id,
          {
            title: `Bulk Note ${i + 1}`,
            body: `This is bulk note ${i + 1} created for performance testing purposes.`,
          },
        )
        results.notes.push(note)
      }
    }

    return results
  },

  /**
   * Utility helpers
   */
  async disconnectDatabase() {
    await prisma.$disconnect()
  },

  generateRandomString(length: number = 10) {
    return Math.random()
      .toString(36)
      .substring(2, length + 2)
  },

  generateRandomEmail() {
    return `test-${this.generateRandomString()}@example.com`
  },

  generateRandomDate(
    start: Date = new Date(2023, 0, 1),
    end: Date = new Date(),
  ) {
    return new Date(
      start.getTime() + Math.random() * (end.getTime() - start.getTime()),
    )
  },

  async waitFor(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  },
}

export { prisma }
