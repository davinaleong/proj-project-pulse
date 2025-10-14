import { UserRole, UserStatus } from '@prisma/client'
import jwt from 'jsonwebtoken'
import prisma from '../../../../src/config/db'

export const sessionsTestHelpers = {
  async cleanupDatabase() {
    await prisma.session.deleteMany()
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

  async createTestSession(
    userId: number,
    overrides?: {
      userAgent?: string
      ipAddress?: string
      token?: string
      lastActiveAt?: Date
      revokedAt?: Date | null
    },
  ) {
    return prisma.session.create({
      data: {
        userId,
        userAgent: overrides?.userAgent || 'Mozilla/5.0 Test Browser',
        ipAddress: overrides?.ipAddress || '192.168.1.1',
        lastActiveAt: overrides?.lastActiveAt || new Date(),
        token: overrides?.token || 'test-session-token',
        revokedAt: overrides?.revokedAt || null,
      },
    })
  },

  async createMultipleSessions(
    userId: number,
    count: number,
    overrides?: Array<{
      userAgent?: string
      ipAddress?: string
      token?: string
      lastActiveAt?: Date
      revokedAt?: Date | null
    }>,
  ) {
    const sessions = []
    for (let i = 0; i < count; i++) {
      const sessionData = overrides?.[i] || {}
      const session = await this.createTestSession(userId, {
        userAgent: sessionData.userAgent || `Test Browser ${i + 1}`,
        ipAddress: sessionData.ipAddress || `192.168.1.${i + 10}`,
        token: sessionData.token || `test-token-${i + 1}`,
        ...sessionData,
      })
      sessions.push(session)
    }
    return sessions
  },

  generateMockAuthToken(user?: { uuid: string; email: string; role: string }) {
    if (!user) {
      return 'mock-jwt-token'
    }
    return jwt.sign(
      { uuid: user.uuid, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' },
    )
  },

  generateInvalidToken() {
    return jwt.sign(
      { uuid: 'fake-uuid', email: 'fake@example.com', role: 'user' },
      'wrong-secret',
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

    // Create test session for user
    const session = await this.createTestSession(user.id)

    // Generate auth tokens
    const authToken = this.generateMockAuthToken({
      uuid: user.uuid,
      email: user.email,
      role: user.role,
    })

    const adminToken = this.generateMockAuthToken({
      uuid: admin.uuid,
      email: admin.email,
      role: admin.role,
    })

    return {
      user,
      admin,
      session,
      authToken,
      adminToken,
    }
  },

  async disconnectDatabase() {
    await prisma.$disconnect()
  },
}

export { prisma }
