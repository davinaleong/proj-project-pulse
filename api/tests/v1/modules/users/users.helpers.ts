import { UserRole, UserStatus } from '@prisma/client'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import prisma from '../../../../src/config/db'

export const userTestHelpers = {
  async cleanupDatabase() {
    await prisma.passwordResetToken.deleteMany()
    await prisma.session.deleteMany()
    await prisma.profile.deleteMany()
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
        emailVerifiedAt:
          overrides?.emailVerifiedAt !== undefined
            ? overrides.emailVerifiedAt
            : new Date(),
      },
    })
  },

  async createAdminUser() {
    const hashedPassword = await bcrypt.hash('AdminPass123!', 12)
    return prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@test.com',
        password: hashedPassword,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
      },
    })
  },

  async createManagerUser() {
    const hashedPassword = await bcrypt.hash('ManagerPass123!', 12)
    return prisma.user.create({
      data: {
        name: 'Manager User',
        email: 'manager@test.com',
        password: hashedPassword,
        role: UserRole.MANAGER,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
      },
    })
  },

  async createUserToken(user: { uuid: string; email: string; role: string }) {
    return jwt.sign(
      { uuid: user.uuid, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' },
    )
  },

  async createPasswordResetToken(userId: number, token?: string) {
    return prisma.passwordResetToken.create({
      data: {
        userId,
        token: token || 'test-reset-token',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    })
  },

  async setupTestUsers() {
    const adminUser = await this.createAdminUser()
    const managerUser = await this.createManagerUser()
    const regularUser = await this.createTestUser({
      name: 'Regular User',
      email: 'user@test.com',
      password: 'UserPass123!',
    })

    const adminToken = await this.createUserToken(adminUser)
    const managerToken = await this.createUserToken(managerUser)
    const userToken = await this.createUserToken(regularUser)

    return {
      adminUser,
      managerUser,
      regularUser,
      adminToken,
      managerToken,
      userToken,
    }
  },

  async disconnectDatabase() {
    await prisma.$disconnect()
  },
}

export { prisma }
