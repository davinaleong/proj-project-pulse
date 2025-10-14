import { UserRole, UserStatus, NoteStatus, ProjectStage } from '@prisma/client'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import prisma from '../../../../src/config/db'

export const notesTestHelpers = {
  async cleanupDatabase() {
    await prisma.note.deleteMany()
    await prisma.project.deleteMany()
    await prisma.user.deleteMany()
  },

  async createTestUser(overrides?: {
    name?: string
    email?: string
    password?: string
    role?: UserRole
    status?: UserStatus
  }) {
    const hashedPassword = await bcrypt.hash(
      overrides?.password || 'TestPassword123!',
      12,
    )
    return prisma.user.create({
      data: {
        name: overrides?.name || 'Test User',
        email: overrides?.email || 'test@example.com',
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
    },
  ) {
    return prisma.project.create({
      data: {
        title: overrides?.title || 'Test Project',
        description: overrides?.description || 'Test project for notes',
        userId: userId,
        stage: overrides?.stage || ProjectStage.PLANNING,
      },
    })
  },

  async createTestNote(
    userId: number,
    overrides?: {
      title?: string
      description?: string | null
      body?: string | null
      status?: NoteStatus
      projectId?: number | null
      deletedAt?: Date | null
    },
  ) {
    return prisma.note.create({
      data: {
        title: overrides?.title || 'Test Note',
        description: overrides?.description || null,
        body: overrides?.body || null,
        status: overrides?.status || NoteStatus.DRAFT,
        userId: userId,
        projectId: overrides?.projectId || null,
        deletedAt: overrides?.deletedAt || null,
      },
    })
  },

  async createMultipleTestNotes(userId: number, projectId?: number) {
    return prisma.note.createMany({
      data: [
        {
          title: 'Published Note',
          description: 'Published note description',
          status: NoteStatus.PUBLISHED,
          userId: userId,
          projectId: projectId || null,
        },
        {
          title: 'Private Note',
          description: 'Private note description',
          status: NoteStatus.PRIVATE,
          userId: userId,
        },
        {
          title: 'Searchable Content',
          body: 'This note contains searchable keywords',
          status: NoteStatus.DRAFT,
          userId: userId,
        },
      ],
    })
  },

  generateMockAuthToken(user?: { uuid: string; email: string; role: string }) {
    if (!user) {
      return 'mock-jwt-token'
    }
    return jwt.sign(
      { uuid: user.uuid, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only',
      { expiresIn: '1h' },
    )
  },

  async setupTestData() {
    const user = await this.createTestUser()
    const project = await this.createTestProject(user.id)
    const authToken = this.generateMockAuthToken({
      uuid: user.uuid,
      email: user.email,
      role: user.role,
    })

    return {
      user,
      project,
      authToken,
    }
  },

  async disconnectDatabase() {
    await prisma.$disconnect()
  },
}

export { prisma }
