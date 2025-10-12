import { Request, Response } from 'express'
import { passwordResetService } from './passwordReset.service'
import {
  requestPasswordResetSchema,
  resetPasswordSchema,
  verifyTokenSchema,
} from './passwordReset.model'

// Request password reset
export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const validationResult = requestPasswordResetSchema.safeParse(req.body)
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.issues,
      })
    }

    const { email } = validationResult.data
    const result = await passwordResetService.requestPasswordReset(email)

    res.json({
      success: true,
      message: result.message,
      // In production, remove the token from response
      ...(process.env.NODE_ENV === 'development' && { token: result.token }),
    })
  } catch (error) {
    res.status(400).json({ error: (error as Error).message })
  }
}

// Verify reset token
export const verifyResetToken = async (req: Request, res: Response) => {
  try {
    const validationResult = verifyTokenSchema.safeParse(req.body)
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.issues,
      })
    }

    const { token } = validationResult.data
    const result = await passwordResetService.verifyResetToken(token)

    if (!result.valid) {
      return res.status(400).json({
        error: 'Invalid or expired reset token',
      })
    }

    res.json({
      success: true,
      valid: true,
      user: {
        email: result.user?.email,
        name: result.user?.name,
      },
    })
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
}

// Reset password
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const validationResult = resetPasswordSchema.safeParse(req.body)
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.issues,
      })
    }

    const { token, newPassword } = validationResult.data
    const result = await passwordResetService.resetPassword(token, newPassword)

    res.json({
      success: true,
      message: result.message,
    })
  } catch (error) {
    res.status(400).json({ error: (error as Error).message })
  }
}

// Get reset token details (admin/debug endpoint)
export const getResetTokenDetails = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params

    if (!uuid) {
      return res.status(400).json({ error: 'Token UUID is required' })
    }

    const tokenDetails = await passwordResetService.getResetTokenDetails(uuid)

    if (!tokenDetails) {
      return res.status(404).json({ error: 'Reset token not found' })
    }

    res.json({
      success: true,
      data: {
        uuid: tokenDetails.uuid,
        userId: tokenDetails.userId,
        expiresAt: tokenDetails.expiresAt,
        usedAt: tokenDetails.usedAt,
        createdAt: tokenDetails.createdAt,
        user: {
          uuid: tokenDetails.user.uuid,
          email: tokenDetails.user.email,
          name: tokenDetails.user.name,
        },
      },
    })
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
}

// Cleanup expired tokens (admin endpoint)
export const cleanupExpiredTokens = async (req: Request, res: Response) => {
  try {
    const result = await passwordResetService.cleanupExpiredTokens()

    res.json({
      success: true,
      message: `Cleaned up ${result.deletedCount} expired tokens`,
      deletedCount: result.deletedCount,
    })
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
}

// Get user's active tokens (admin endpoint)
export const getUserActiveTokens = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId)

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' })
    }

    const tokens = await passwordResetService.getUserActiveTokens(userId)

    res.json({
      success: true,
      data: tokens.map((token) => ({
        uuid: token.uuid,
        expiresAt: token.expiresAt,
        createdAt: token.createdAt,
      })),
    })
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
}

// Cancel user's reset tokens (admin endpoint)
export const cancelUserResetTokens = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId)

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' })
    }

    const result = await passwordResetService.cancelUserResetTokens(userId)

    res.json({
      success: true,
      message: `Cancelled ${result.deletedCount} reset tokens`,
      deletedCount: result.deletedCount,
    })
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
}
