import { Request, Response } from 'express'
import { UserService } from './user.service'
import {
  createUserSchema,
  updateUserSchema,
  changePasswordSchema,
  loginSchema,
  confirmResetPasswordSchema,
  userQuerySchema,
} from './user.model'
import { createResponse } from '../../../utils/response'
import { z } from 'zod'

export class UserController {
  private userService: UserService

  constructor() {
    this.userService = new UserService()
  }

  // Get all users with pagination and filtering
  getUsers = async (req: Request, res: Response) => {
    try {
      const query = userQuerySchema.parse(req.query)
      const result = await this.userService.getUsers(query)

      return createResponse(res, 200, 'Users retrieved successfully', result)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return createResponse(
          res,
          400,
          'Invalid query parameters',
          null,
          error.issues,
        )
      }
      return createResponse(res, 500, 'Internal server error', null, error)
    }
  }

  // Get user by UUID
  getUserByUuid = async (req: Request, res: Response) => {
    try {
      const { uuid } = req.params
      const includeProfile = req.query.includeProfile === 'true'

      const user = await this.userService.getUserByUuid(uuid, includeProfile)

      if (!user) {
        return createResponse(res, 404, 'User not found')
      }

      return createResponse(res, 200, 'User retrieved successfully', user)
    } catch (error) {
      return createResponse(res, 500, 'Internal server error', null, error)
    }
  }

  // Create new user
  createUser = async (req: Request, res: Response) => {
    try {
      const userData = createUserSchema.parse(req.body)
      const user = await this.userService.createUser(userData)

      return createResponse(res, 201, 'User created successfully', user)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return createResponse(
          res,
          400,
          'Invalid query parameters',
          null,
          error.issues,
        )
      }

      if (error instanceof Error) {
        if (error.message === 'Email already exists') {
          return createResponse(res, 409, 'Email already exists')
        }
      }

      return createResponse(res, 500, 'Internal server error', null, error)
    }
  }

  // Update user
  updateUser = async (req: Request, res: Response) => {
    try {
      const { uuid } = req.params
      const updateData = updateUserSchema.parse(req.body)

      const user = await this.userService.updateUser(uuid, updateData)

      if (!user) {
        return createResponse(res, 404, 'User not found')
      }

      return createResponse(res, 200, 'User updated successfully', user)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return createResponse(
          res,
          400,
          'Invalid update data',
          null,
          error.issues,
        )
      }

      if (error instanceof Error) {
        if (error.message === 'Email already exists') {
          return createResponse(res, 409, 'Email already exists')
        }
      }

      return createResponse(res, 500, 'Internal server error', null, error)
    }
  }

  // Change user password
  changePassword = async (req: Request, res: Response) => {
    try {
      const { uuid } = req.params
      const passwordData = changePasswordSchema.parse(req.body)

      const success = await this.userService.changePassword(uuid, passwordData)

      if (!success) {
        return createResponse(res, 404, 'User not found')
      }

      return createResponse(res, 200, 'Password changed successfully')
    } catch (error) {
      if (error instanceof z.ZodError) {
        return createResponse(
          res,
          400,
          'Invalid password data',
          null,
          error.issues,
        )
      }

      if (error instanceof Error) {
        if (error.message === 'Current password is incorrect') {
          return createResponse(res, 400, 'Current password is incorrect')
        }
      }

      return createResponse(res, 500, 'Internal server error', null, error)
    }
  }

  // Delete user (soft delete)
  deleteUser = async (req: Request, res: Response) => {
    try {
      const { uuid } = req.params
      const success = await this.userService.deleteUser(uuid)

      if (!success) {
        return createResponse(res, 404, 'User not found')
      }

      return createResponse(res, 200, 'User deleted successfully')
    } catch (error) {
      return createResponse(res, 500, 'Internal server error', null, error)
    }
  }

  // Login user
  login = async (req: Request, res: Response) => {
    try {
      const loginData = loginSchema.parse(req.body)
      const user = await this.userService.verifyPassword(
        loginData.email,
        loginData.password,
      )

      if (!user) {
        return createResponse(res, 401, 'Invalid email or password')
      }

      // Update login info with IP address
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown'
      await this.userService.updateLoginInfo(user.uuid, ipAddress)

      return createResponse(res, 200, 'Login successful', {
        user,
        // TODO: Add JWT token generation here
        token: 'TODO_JWT_TOKEN',
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return createResponse(
          res,
          400,
          'Invalid login data',
          null,
          error.issues,
        )
      }

      if (error instanceof Error) {
        if (
          error.message.includes('locked') ||
          error.message.includes('not active')
        ) {
          return createResponse(res, 423, error.message)
        }
      }

      return createResponse(res, 500, 'Internal server error', null, error)
    }
  }

  // Request password reset
  requestPasswordReset = async (req: Request, res: Response) => {
    try {
      const { email } = req.body

      if (!email) {
        return createResponse(res, 400, 'Email is required')
      }

      const token = await this.userService.createPasswordResetToken(email)

      if (!token) {
        // Don't reveal if email exists or not for security
        return createResponse(
          res,
          200,
          'If the email exists, a password reset link has been sent',
        )
      }

      // TODO: Send email with reset token
      // For now, return the token in development
      const responseData =
        process.env.NODE_ENV === 'development' ? { token } : undefined

      return createResponse(res, 200, 'Password reset email sent', responseData)
    } catch (error) {
      return createResponse(res, 500, 'Internal server error', null, error)
    }
  }

  // Reset password with token
  resetPassword = async (req: Request, res: Response) => {
    try {
      const resetData = confirmResetPasswordSchema.parse(req.body)
      const success = await this.userService.resetPasswordWithToken(
        resetData.token,
        resetData.password,
      )

      if (!success) {
        return createResponse(res, 400, 'Invalid or expired reset token')
      }

      return createResponse(res, 200, 'Password reset successfully')
    } catch (error) {
      if (error instanceof z.ZodError) {
        return createResponse(res, 400, 'Invalid user data', null, error.issues)
      }

      if (error instanceof Error) {
        if (error.message === 'Invalid or expired reset token') {
          return createResponse(res, 400, 'Invalid or expired reset token')
        }
      }

      return createResponse(res, 500, 'Internal server error', null, error)
    }
  }

  // Verify email
  verifyEmail = async (req: Request, res: Response) => {
    try {
      const { uuid } = req.params
      const success = await this.userService.verifyEmail(uuid)

      if (!success) {
        return createResponse(res, 404, 'User not found')
      }

      return createResponse(res, 200, 'Email verified successfully')
    } catch (error) {
      return createResponse(res, 500, 'Internal server error', null, error)
    }
  }

  // Get current user (from auth middleware)
  getCurrentUser = async (req: Request, res: Response) => {
    try {
      // Assuming auth middleware adds user to request
      const userUuid = req.user?.uuid

      if (!userUuid) {
        return createResponse(res, 401, 'Not authenticated')
      }

      const user = await this.userService.getUserByUuid(userUuid, true)

      if (!user) {
        return createResponse(res, 404, 'User not found')
      }

      return createResponse(
        res,
        200,
        'Current user retrieved successfully',
        user,
      )
    } catch (error) {
      return createResponse(res, 500, 'Internal server error', null, error)
    }
  }

  // Check user permissions
  checkPermission = async (req: Request, res: Response) => {
    try {
      const { uuid } = req.params
      const { role } = req.query

      if (!role || typeof role !== 'string') {
        return createResponse(res, 400, 'Role parameter is required')
      }

      const hasPermission = await this.userService.hasPermission(uuid, role)

      return createResponse(res, 200, 'Permission check completed', {
        hasPermission,
      })
    } catch (error) {
      return createResponse(res, 500, 'Internal server error', null, error)
    }
  }
}
