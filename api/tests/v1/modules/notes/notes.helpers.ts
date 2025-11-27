import { UserRole, UserStatus, NoteStatus, ProjectStage } from '@prisma/client'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import prisma from '../../../../src/config/db'

export const notesTestHelpers = {
  async cleanupDatabase() {
    await prisma.note.deleteMany()
    await prisma.session.deleteMany()
    await prisma.project.deleteMany()
    await prisma.user.deleteMany()
  },

  async createTestUser(overrides?: {
    name?: string
    email?: string
    password?: string
    role?: UserRole
    status?: UserStatus
    emailVerifiedAt?: Date | null
  }) {
    const randomId = Math.random().toString(36).substring(2, 15)
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
        emailVerifiedAt: overrides?.emailVerifiedAt !== undefined 
          ? overrides.emailVerifiedAt 
          : new Date(),
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



  async setupTestData() {
    const randomId = Math.random().toString(36).substring(2, 15)
    const password = 'TestPassword123!'
    const user = await this.createTestUser({
      email: `setuptest-${randomId}@example.com`,
      password: password,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(), // Ensure user is verified
    })
    const project = await this.createTestProject(user.id, {
      title: `Setup Test Project ${randomId}`,
    })

    // Authenticate by actually logging in (like the auth tests do)
    const { createApp } = require('../../../../src/app')
    const request = require('supertest')
    const app = createApp()
    
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: user.email,
        password: password,
      })

    if (loginResponse.status !== 200) {
      throw new Error(`Login failed: ${loginResponse.status} - ${loginResponse.body?.message}`)
    }

    const authToken = loginResponse.body.data.tokens.accessToken

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
