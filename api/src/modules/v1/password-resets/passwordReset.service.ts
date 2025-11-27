import { PasswordResetToken } from '@prisma/client'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import {
  passwordResetModel,
  PasswordResetWithUser,
} from './passwordReset.model'
import prisma from '../../../config/db'

export class PasswordResetService {
  private readonly RESET_TOKEN_EXPIRY_HOURS = 24
  private readonly MAX_RESET_ATTEMPTS_PER_HOUR = 3
  private readonly RATE_LIMIT_WINDOW_HOURS = 1

  // Generate a secure random token
  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  // Hash a token for secure database storage
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
  }

  // Request password reset - sends reset token
  async requestPasswordReset(email: string): Promise<{
    success: boolean
    message: string
    token?: string // In production, don't return token, send via email
  }> {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      })

      if (!user) {
        // Don't reveal if email exists or not for security
        return {
          success: true,
          message:
            'If an account with that email exists, a password reset link has been sent.',
        }
      }

      // Check rate limiting
      const oneHourAgo = new Date(
        Date.now() - this.RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000,
      )
      const recentAttempts = await passwordResetModel.getRecentAttempts(
        user.id,
        oneHourAgo,
      )

      if (recentAttempts.length >= this.MAX_RESET_ATTEMPTS_PER_HOUR) {
        throw new Error(
          `Too many password reset attempts. Try again in ${this.RATE_LIMIT_WINDOW_HOURS} hour(s).`,
        )
      }

      // Note: We don't delete existing tokens to preserve rate limiting history
      // Multiple valid tokens is acceptable for security (user can use any valid one)

      // Generate new token
      const plainToken = this.generateToken()
      const hashedToken = this.hashToken(plainToken)
      const expiresAt = new Date(
        Date.now() + this.RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
      )

      // Create password reset token (store hashed version)
      await passwordResetModel.create({
        userId: user.id,
        token: hashedToken,
        expiresAt,
      })

      // TODO: In production, send email with reset link instead of returning token
      // await emailService.sendPasswordResetEmail(user.email, token)

      return {
        success: true,
        message: 'Password reset link has been sent to your email.',
        token: plainToken, // Remove this in production
      }
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

  // Verify if a reset token is valid
  async verifyResetToken(token: string): Promise<{
    valid: boolean
    user?: {
      id: number
      email: string
      name: string
    }
  }> {
    try {
      const hashedToken = this.hashToken(token)
      const resetToken = await passwordResetModel.findByToken(hashedToken)

      if (!resetToken) {
        return { valid: false }
      }

      // Check if token is expired
      if (resetToken.expiresAt < new Date()) {
        return { valid: false }
      }

      // Check if token has been used
      if (resetToken.usedAt) {
        return { valid: false }
      }

      return {
        valid: true,
        user: {
          id: resetToken.user.id,
          email: resetToken.user.email,
          name: resetToken.user.name,
        },
      }
    } catch {
      throw new Error('Failed to verify reset token')
    }
  }

  // Reset password using token
  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{
    success: boolean
    message: string
  }> {
    try {
      const hashedToken = this.hashToken(token)
      const resetToken = await passwordResetModel.findByToken(hashedToken)

      if (!resetToken) {
        throw new Error('Invalid or expired reset token')
      }

      // Check if token is expired
      if (resetToken.expiresAt < new Date()) {
        throw new Error('Reset token has expired')
      }

      // Check if token has been used
      if (resetToken.usedAt) {
        throw new Error('Reset token has already been used')
      }

      // Hash the new password
      const saltRounds = 12
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds)

      // Update user password
      await prisma.user.update({
        where: { id: resetToken.userId },
        data: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      })

      // Mark token as used
      await passwordResetModel.markAsUsed(hashedToken)

      // Delete any other active tokens for this user
      await passwordResetModel.deleteByUserId(resetToken.userId)

      return {
        success: true,
        message: 'Password has been reset successfully',
      }
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

  // Get reset token details (for admin/debugging)
  async getResetTokenDetails(
    uuid: string,
  ): Promise<PasswordResetWithUser | null> {
    try {
      return await passwordResetModel.findByUuid(uuid)
    } catch {
      throw new Error('Failed to fetch reset token details')
    }
  }

  // Cleanup expired tokens (can be run as a cron job)
  async cleanupExpiredTokens(): Promise<{ deletedCount: number }> {
    try {
      const result = await passwordResetModel.deleteExpired()
      return { deletedCount: result.count }
    } catch {
      throw new Error('Failed to cleanup expired tokens')
    }
  }

  // Get active tokens for a user (admin function)
  async getUserActiveTokens(userId: number): Promise<PasswordResetToken[]> {
    try {
      return await passwordResetModel.getActiveTokensForUser(userId)
    } catch {
      throw new Error('Failed to fetch user active tokens')
    }
  }

  // Cancel all reset tokens for a user
  async cancelUserResetTokens(
    userId: number,
  ): Promise<{ deletedCount: number }> {
    try {
      const result = await passwordResetModel.deleteByUserId(userId)
      return { deletedCount: result.count }
    } catch {
      throw new Error('Failed to cancel user reset tokens')
    }
  }
}

export const passwordResetService = new PasswordResetService()
