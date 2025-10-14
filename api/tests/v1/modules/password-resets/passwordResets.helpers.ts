import { UserRole, UserStatus } from '@prisma/client'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import prisma from '../../../../src/config/db'

export const passwordResetTestHelpers = {
  async cleanupDatabase() {
    await prisma.passwordResetToken.deleteMany()
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

  async createPasswordResetToken(
    userId: number,
    overrides?: {
      token?: string
      expiresAt?: Date
      usedAt?: Date | null
    },
  ) {
    const defaultToken = crypto.randomBytes(32).toString('hex')
    const defaultExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    return prisma.passwordResetToken.create({
      data: {
        userId,
        token: overrides?.token || defaultToken,
        expiresAt: overrides?.expiresAt || defaultExpiresAt,
        usedAt: overrides?.usedAt,
      },
    })
  },

  async createExpiredToken(userId: number) {
    const expiredDate = new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
    return this.createPasswordResetToken(userId, {
      expiresAt: expiredDate,
    })
  },

  async createUsedToken(userId: number) {
    const usedDate = new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
    return this.createPasswordResetToken(userId, {
      usedAt: usedDate,
    })
  },

  generateAuthToken(user: {
    id: number
    uuid: string
    email: string
    role: string
  }) {
    const jwtSecret = process.env.JWT_SECRET || 'test-secret-key'
    return jwt.sign(
      {
        uuid: user.uuid,
        email: user.email,
        role: user.role,
      },
      jwtSecret,
      { expiresIn: '24h' },
    )
  },

  async getUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    })
  },

  async getPasswordResetTokenByToken(token: string) {
    return prisma.passwordResetToken.findUnique({
      where: { token },
      include: {
        user: true,
      },
    })
  },

  async countPasswordResetTokens() {
    return prisma.passwordResetToken.count()
  },

  async countUserPasswordResetTokens(userId: number) {
    return prisma.passwordResetToken.count({
      where: { userId },
    })
  },

  async getActiveTokensForUser(userId: number) {
    return prisma.passwordResetToken.findMany({
      where: {
        userId,
        expiresAt: {
          gt: new Date(),
        },
        usedAt: null,
      },
    })
  },

  async createMultipleResetAttempts(userId: number, count: number) {
    const tokens = []
    for (let i = 0; i < count; i++) {
      const token = await this.createPasswordResetToken(userId)
      tokens.push(token)
      // Add small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
    return tokens
  },

  async createOldResetAttempts(userId: number, count: number): Promise<void> {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago

    for (let i = 0; i < count; i++) {
      const token = crypto.randomBytes(32).toString('hex')
      const hashedToken = await bcrypt.hash(token, 10)

      await prisma.passwordResetToken.create({
        data: {
          userId,
          token: hashedToken,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
          createdAt: twoHoursAgo,
        },
      })
    }
  },

  // Test data generators
  generateValidEmail() {
    return `test-${Date.now()}@example.com`
  },

  generateInvalidEmail() {
    return 'invalid-email'
  },

  generateStrongPassword() {
    return 'NewStrongPassword123!'
  },

  generateWeakPassword() {
    return 'weak'
  },

  generateValidToken() {
    return crypto.randomBytes(32).toString('hex')
  },

  generateInvalidToken() {
    return 'invalid-token'
  },

  // Validation helpers
  isValidPasswordResetResponse(
    response: unknown,
  ): response is { success: boolean; message: string } {
    return (
      response !== null &&
      typeof response === 'object' &&
      'success' in response &&
      'message' in response &&
      typeof (response as Record<string, unknown>).success === 'boolean' &&
      typeof (response as Record<string, unknown>).message === 'string'
    )
  },

  isValidTokenVerificationResponse(
    response: unknown,
  ): response is { success: boolean; valid: boolean } {
    return (
      response !== null &&
      typeof response === 'object' &&
      'success' in response &&
      'valid' in response &&
      typeof (response as Record<string, unknown>).success === 'boolean' &&
      typeof (response as Record<string, unknown>).valid === 'boolean'
    )
  },

  isValidErrorResponse(response: unknown): response is { error: string } {
    return (
      response !== null &&
      typeof response === 'object' &&
      'error' in response &&
      typeof (response as Record<string, unknown>).error === 'string'
    )
  },

  async deleteUser(userId: number): Promise<void> {
    await prisma.user.delete({
      where: { id: userId },
    })
  },

  async createAlmostExpiredToken(userId: number) {
    const token = crypto.randomBytes(32).toString('hex')
    const hashedToken = await bcrypt.hash(token, 10)
    const expiresAt = new Date(Date.now() + 1000) // Expires in 1 second

    const dbToken = await prisma.passwordResetToken.create({
      data: {
        userId,
        token: hashedToken,
        expiresAt,
      },
    })

    return { ...dbToken, token } // Return with original token
  },

  async createVeryOldToken(userId: number) {
    const token = crypto.randomBytes(32).toString('hex')
    const hashedToken = await bcrypt.hash(token, 10)
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    const expiresAt = new Date(oneYearAgo.getTime() + 24 * 60 * 60 * 1000) // Was valid for 24 hours, year ago

    const dbToken = await prisma.passwordResetToken.create({
      data: {
        userId,
        token: hashedToken,
        expiresAt,
        createdAt: oneYearAgo,
      },
    })

    return { ...dbToken, token } // Return with original token
  },

  async createOrphanToken() {
    const token = crypto.randomBytes(32).toString('hex')
    const hashedToken = await bcrypt.hash(token, 10)

    // Create token with non-existent user ID
    const dbToken = await prisma.passwordResetToken.create({
      data: {
        userId: 999999, // Non-existent user
        token: hashedToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    })

    return { ...dbToken, token } // Return with original token
  },

  async createResetAttemptAtTime(userId: number, createdAt: Date) {
    const token = crypto.randomBytes(32).toString('hex')
    const hashedToken = await bcrypt.hash(token, 10)

    return await prisma.passwordResetToken.create({
      data: {
        userId,
        token: hashedToken,
        expiresAt: new Date(createdAt.getTime() + 24 * 60 * 60 * 1000),
        createdAt,
      },
    })
  },

  async updateUserEmail(userId: number, newEmail: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { email: newEmail },
    })
  },

  async cleanupExpiredTokens(): Promise<void> {
    await prisma.passwordResetToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    })
  },

  generateRandomToken(): string {
    return crypto.randomBytes(32).toString('hex')
  },
}
