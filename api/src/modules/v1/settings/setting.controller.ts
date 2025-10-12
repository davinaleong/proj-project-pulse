import { Request, Response } from 'express'
import { settingService } from './setting.service.new'
import {
  createSettingSchema,
  updateSettingSchema,
  settingQuerySchema,
} from './setting.model'
import {
  createSuccessResponse,
  createErrorResponse,
} from '../../../utils/response'

// Custom error class for settings
class SettingError extends Error {
  public statusCode: number
  constructor(message: string, statusCode = 400) {
    super(message)
    this.statusCode = statusCode
  }
}

export class SettingController {
  // Create a new setting
  async createSetting(req: Request, res: Response) {
    try {
      const validation = createSettingSchema.safeParse(req.body)
      if (!validation.success) {
        return createErrorResponse(
          res,
          'Validation failed',
          validation.error.issues,
          400,
        )
      }

      const { data } = validation
      const userId = req.user?.id

      const setting = await settingService.createSetting(data, userId)

      return createSuccessResponse(
        res,
        'Setting created successfully',
        setting,
        201,
      )
    } catch (error) {
      if (error instanceof SettingError) {
        return createErrorResponse(
          res,
          error.message,
          undefined,
          error.statusCode,
        )
      }
      console.error('Error creating setting:', error)
      return createErrorResponse(res, 'Internal server error', undefined, 500)
    }
  }

  // Get all settings with filtering
  async getSettings(req: Request, res: Response) {
    try {
      const validation = settingQuerySchema.safeParse(req.query)
      if (!validation.success) {
        return createErrorResponse(
          res,
          'Validation failed',
          validation.error.issues,
          400,
        )
      }

      const query = validation.data
      const userId = req.user?.id
      const isAdmin = req.user?.role === 'ADMIN'

      const result = await settingService.getSettings(query, userId, isAdmin)

      return res.json({
        success: true,
        message: 'Settings retrieved successfully',
        data: result.settings,
        pagination: result.pagination,
      })
    } catch (error) {
      if (error instanceof SettingError) {
        return createErrorResponse(
          res,
          error.message,
          undefined,
          error.statusCode,
        )
      }
      console.error('Error getting settings:', error)
      return createErrorResponse(res, 'Internal server error', undefined, 500)
    }
  }

  // Get setting by ID
  async getSettingById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id)
      if (isNaN(id)) {
        return createErrorResponse(res, 'Invalid setting ID', undefined, 400)
      }

      const userId = req.user?.id
      const isAdmin = req.user?.role === 'ADMIN'

      const setting = await settingService.getSettingById(id, userId, isAdmin)

      return createSuccessResponse(
        res,
        'Setting retrieved successfully',
        setting,
      )
    } catch (error) {
      if (error instanceof SettingError) {
        return createErrorResponse(
          res,
          error.message,
          undefined,
          error.statusCode,
        )
      }
      console.error('Error getting setting by ID:', error)
      return createErrorResponse(res, 'Internal server error', undefined, 500)
    }
  }

  // Update setting
  async updateSetting(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id)
      if (isNaN(id)) {
        return createErrorResponse(res, 'Invalid setting ID', undefined, 400)
      }

      const validation = updateSettingSchema.safeParse(req.body)
      if (!validation.success) {
        return createErrorResponse(
          res,
          'Validation failed',
          validation.error.issues,
          400,
        )
      }

      const { data } = validation
      const userId = req.user?.id
      const isAdmin = req.user?.role === 'ADMIN'

      const setting = await settingService.updateSetting(
        id,
        data,
        userId,
        isAdmin,
      )

      return createSuccessResponse(res, 'Setting updated successfully', setting)
    } catch (error) {
      if (error instanceof SettingError) {
        return createErrorResponse(
          res,
          error.message,
          undefined,
          error.statusCode,
        )
      }
      console.error('Error updating setting:', error)
      return createErrorResponse(res, 'Internal server error', undefined, 500)
    }
  }

  // Delete setting
  async deleteSetting(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id)
      if (isNaN(id)) {
        return createErrorResponse(res, 'Invalid setting ID', undefined, 400)
      }

      const userId = req.user?.id
      const isAdmin = req.user?.role === 'ADMIN'

      await settingService.deleteSetting(id, userId, isAdmin)

      return createSuccessResponse(res, 'Setting deleted successfully')
    } catch (error) {
      if (error instanceof SettingError) {
        return createErrorResponse(
          res,
          error.message,
          undefined,
          error.statusCode,
        )
      }
      console.error('Error deleting setting:', error)
      return createErrorResponse(res, 'Internal server error', undefined, 500)
    }
  }

  // Get my settings (convenience endpoint for current user)
  async getMySettings(req: Request, res: Response) {
    try {
      const { category } = req.query
      const userId = req.user?.id

      if (!userId) {
        return createErrorResponse(
          res,
          'Authentication required',
          undefined,
          401,
        )
      }

      const settings = await settingService.getUserSettings(
        userId,
        category as string,
        userId,
        false,
      )

      return createSuccessResponse(
        res,
        'Your settings retrieved successfully',
        settings,
      )
    } catch (error) {
      if (error instanceof SettingError) {
        return createErrorResponse(
          res,
          error.message,
          undefined,
          error.statusCode,
        )
      }
      console.error('Error getting my settings:', error)
      return createErrorResponse(res, 'Internal server error', undefined, 500)
    }
  }

  // Get user settings (admin endpoint)
  async getUserSettings(req: Request, res: Response) {
    try {
      const targetUserId = parseInt(req.params.userId)
      if (isNaN(targetUserId)) {
        return createErrorResponse(res, 'Invalid user ID', undefined, 400)
      }

      const { category } = req.query
      const requestingUserId = req.user?.id
      const isAdmin = req.user?.role === 'ADMIN'

      const settings = await settingService.getUserSettings(
        targetUserId,
        category as string,
        requestingUserId,
        isAdmin,
      )

      return createSuccessResponse(
        res,
        'User settings retrieved successfully',
        settings,
      )
    } catch (error) {
      if (error instanceof SettingError) {
        return createErrorResponse(
          res,
          error.message,
          undefined,
          error.statusCode,
        )
      }
      console.error('Error getting user settings:', error)
      return createErrorResponse(res, 'Internal server error', undefined, 500)
    }
  }

  // Get system settings (admin only)
  async getSystemSettings(req: Request, res: Response) {
    try {
      const { category } = req.query
      const userId = req.user?.id
      const isAdmin = req.user?.role === 'ADMIN'

      const settings = await settingService.getSystemSettings(
        category as string,
        userId,
        isAdmin,
      )

      return createSuccessResponse(
        res,
        'System settings retrieved successfully',
        settings,
      )
    } catch (error) {
      if (error instanceof SettingError) {
        return createErrorResponse(
          res,
          error.message,
          undefined,
          error.statusCode,
        )
      }
      console.error('Error getting system settings:', error)
      return createErrorResponse(res, 'Internal server error', undefined, 500)
    }
  }

  // Get settings statistics (admin only)
  async getSettingsStats(req: Request, res: Response) {
    try {
      const userId = req.user?.id
      const isAdmin = req.user?.role === 'ADMIN'

      const stats = await settingService.getSettingsStats(userId, isAdmin)

      return createSuccessResponse(
        res,
        'Settings statistics retrieved successfully',
        stats,
      )
    } catch (error) {
      if (error instanceof SettingError) {
        return createErrorResponse(
          res,
          error.message,
          undefined,
          error.statusCode,
        )
      }
      console.error('Error getting settings stats:', error)
      return createErrorResponse(res, 'Internal server error', undefined, 500)
    }
  }
}

export const settingController = new SettingController()
