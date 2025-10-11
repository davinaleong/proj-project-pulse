import { Request, Response } from 'express'
import { ZodError } from 'zod'
import { AuthService } from './auth.service'
import {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from './auth.types'
import { createResponse } from '../../../utils/response'

export class AuthController {
  private authService: AuthService

  constructor() {
    this.authService = new AuthService()
  }

  // POST /auth/login
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request data
      const validatedData = loginSchema.parse(req.body)

      // Get client info
      const userAgent = req.get('User-Agent')
      const ipAddress = req.ip || req.connection.remoteAddress

      // Perform login
      const result = await this.authService.login(
        validatedData,
        userAgent,
        ipAddress,
      )

      createResponse(res, 200, 'Login successful', result)
    } catch (error) {
      if (error instanceof ZodError) {
        createResponse(res, 400, 'Validation failed', null, error.issues)
      } else if (error instanceof Error) {
        createResponse(res, 400, error.message)
      } else {
        createResponse(res, 500, 'Internal server error')
      }
    }
  }

  // POST /auth/register
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request data
      const validatedData = registerSchema.parse(req.body)

      // Perform registration
      const result = await this.authService.register(validatedData)

      createResponse(res, 201, result.message, result.user)
    } catch (error) {
      if (error instanceof ZodError) {
        createResponse(res, 400, 'Validation failed', null, error.issues)
      } else if (error instanceof Error) {
        createResponse(res, 400, error.message)
      } else {
        createResponse(res, 500, 'Internal server error')
      }
    }
  }

  // POST /auth/refresh
  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request data
      const validatedData = refreshTokenSchema.parse(req.body)

      // Refresh token
      const result = await this.authService.refreshToken(validatedData)

      createResponse(res, 200, 'Token refreshed successfully', result)
    } catch (error) {
      if (error instanceof ZodError) {
        createResponse(res, 400, 'Validation failed', null, error.issues)
      } else if (error instanceof Error) {
        createResponse(res, 401, error.message)
      } else {
        createResponse(res, 500, 'Internal server error')
      }
    }
  }

  // POST /auth/logout
  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const authHeader = req.headers.authorization
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        createResponse(res, 401, 'No access token provided')
        return
      }

      const accessToken = authHeader.substring(7) // Remove "Bearer "

      // Perform logout
      await this.authService.logout(accessToken)

      createResponse(res, 200, 'Logout successful')
    } catch (error) {
      if (error instanceof Error) {
        createResponse(res, 400, error.message)
      } else {
        createResponse(res, 500, 'Internal server error')
      }
    }
  }

  // POST /auth/forgot-password
  forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request data
      const validatedData = forgotPasswordSchema.parse(req.body)

      // Process forgot password request
      const result = await this.authService.forgotPassword(validatedData)

      createResponse(res, 200, result.message)
    } catch (error) {
      if (error instanceof ZodError) {
        createResponse(res, 400, 'Validation failed', null, error.issues)
      } else if (error instanceof Error) {
        createResponse(res, 400, error.message)
      } else {
        createResponse(res, 500, 'Internal server error')
      }
    }
  }

  // POST /auth/reset-password
  resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request data
      const validatedData = resetPasswordSchema.parse(req.body)

      // Reset password
      const result = await this.authService.resetPassword(validatedData)

      createResponse(res, 200, result.message)
    } catch (error) {
      if (error instanceof ZodError) {
        createResponse(res, 400, 'Validation failed', null, error.issues)
      } else if (error instanceof Error) {
        createResponse(res, 400, error.message)
      } else {
        createResponse(res, 500, 'Internal server error')
      }
    }
  }

  // POST /auth/verify-email
  verifyEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request data
      const validatedData = verifyEmailSchema.parse(req.body)

      // Verify email
      const result = await this.authService.verifyEmail(validatedData)

      createResponse(res, 200, result.message)
    } catch (error) {
      if (error instanceof ZodError) {
        createResponse(res, 400, 'Validation failed', null, error.issues)
      } else if (error instanceof Error) {
        createResponse(res, 400, error.message)
      } else {
        createResponse(res, 500, 'Internal server error')
      }
    }
  }

  // GET /auth/me (Get current user info)
  getCurrentUser = async (req: Request, res: Response): Promise<void> => {
    try {
      // User should be available from auth middleware
      if (!req.user) {
        createResponse(res, 401, 'User not authenticated')
        return
      }

      createResponse(res, 200, 'User retrieved successfully', req.user)
    } catch (error) {
      if (error instanceof Error) {
        createResponse(res, 400, error.message)
      } else {
        createResponse(res, 500, 'Internal server error')
      }
    }
  }
}
