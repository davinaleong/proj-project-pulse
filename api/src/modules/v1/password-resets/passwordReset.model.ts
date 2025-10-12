import { PrismaClient, PasswordResetToken } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schemas
export const requestPasswordResetSchema = z.object({
  email: z.string().email('Invalid email format'),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    ),
})

export const verifyTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
})

// Types
export interface CreatePasswordResetData {
  userId: number
  token: string
  expiresAt: Date
}

export interface PasswordResetWithUser extends PasswordResetToken {
  user: {
    id: number
    uuid: string
    email: string
    name: string
  }
}

// Model functions
export const passwordResetModel = {
  // Create a new password reset token
  async create(data: CreatePasswordResetData): Promise<PasswordResetToken> {
    return prisma.passwordResetToken.create({
      data,
    })
  },

  // Find password reset token by token string
  async findByToken(token: string): Promise<PasswordResetWithUser | null> {
    return prisma.passwordResetToken.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            uuid: true,
            email: true,
            name: true,
          },
        },
      },
    })
  },

  // Find password reset token by UUID
  async findByUuid(uuid: string): Promise<PasswordResetWithUser | null> {
    return prisma.passwordResetToken.findUnique({
      where: { uuid },
      include: {
        user: {
          select: {
            id: true,
            uuid: true,
            email: true,
            name: true,
          },
        },
      },
    })
  },

  // Mark token as used
  async markAsUsed(token: string): Promise<PasswordResetToken> {
    return prisma.passwordResetToken.update({
      where: { token },
      data: { usedAt: new Date() },
    })
  },

  // Delete expired tokens
  async deleteExpired(): Promise<{ count: number }> {
    return prisma.passwordResetToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    })
  },

  // Delete all tokens for a user
  async deleteByUserId(userId: number): Promise<{ count: number }> {
    return prisma.passwordResetToken.deleteMany({
      where: { userId },
    })
  },

  // Get recent reset attempts for a user (for rate limiting)
  async getRecentAttempts(
    userId: number,
    since: Date,
  ): Promise<PasswordResetToken[]> {
    return prisma.passwordResetToken.findMany({
      where: {
        userId,
        createdAt: {
          gte: since,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  },

  // Get all active tokens for a user
  async getActiveTokensForUser(userId: number): Promise<PasswordResetToken[]> {
    return prisma.passwordResetToken.findMany({
      where: {
        userId,
        expiresAt: {
          gt: new Date(),
        },
        usedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  },
}
