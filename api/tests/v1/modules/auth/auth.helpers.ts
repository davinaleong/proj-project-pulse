import { UserStatus } from '@prisma/client'
import bcrypt from 'bcrypt'
import prisma from '../../../../src/config/db'

export const testHelpers = {
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
    status?: UserStatus
    emailVerifiedAt?: Date | null
  }) {
    const hashedPassword = await bcrypt.hash(
      overrides?.password || 'TestPassword123!',
      12,
    )
    return prisma.user.create({
      data: {
        name: overrides?.name || 'John Doe',
        email: overrides?.email || 'john@example.com',
        password: hashedPassword,
        status: overrides?.status || UserStatus.ACTIVE,
        emailVerifiedAt:
          overrides?.emailVerifiedAt !== undefined
            ? overrides.emailVerifiedAt
            : new Date(),
      },
    })
  },

  async createPasswordResetToken(userId: number, token?: string) {
    return prisma.passwordResetToken.create({
      data: {
        userId,
        token: token || 'valid-reset-token',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    })
  },

  async createVerificationToken(userId: number, token?: string) {
    return prisma.passwordResetToken.create({
      data: {
        userId,
        token: token || 'valid-verification-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    })
  },

  async disconnectDatabase() {
    await prisma.$disconnect()
  },
}

export { prisma }
