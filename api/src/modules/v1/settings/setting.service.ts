import { SettingVisibility } from '@prisma/client'
import {
  settingModel,
  CreateSettingInput,
  UpdateSettingInput,
  SettingQuery,
  SettingResponse,
} from './setting.model'

// Custom error class for settings
class SettingError extends Error {
  public statusCode: number

  constructor(message: string, statusCode = 400) {
    super(message)
    this.statusCode = statusCode
    this.name = 'SettingError'
  }
}

export class SettingService {
  // Create a new setting
  async createSetting(data: CreateSettingInput, requestingUserId?: number) {
    // Validate permissions for creating settings
    if (
      data.visibility === SettingVisibility.SYSTEM &&
      !this.isSystemAdmin(requestingUserId)
    ) {
      throw new SettingError(
        'Insufficient permissions to create system settings',
        403,
      )
    }

    if (
      data.visibility === SettingVisibility.ADMIN &&
      !this.isAdmin(requestingUserId)
    ) {
      throw new SettingError(
        'Insufficient permissions to create admin settings',
        403,
      )
    }

    // Check if setting with same key already exists for this user/system
    const existing = await settingModel.findByKey(data.key, data.userId)
    if (existing) {
      throw new SettingError('Setting with this key already exists', 409)
    }

    return await settingModel.create(data)
  }

  // Get settings with filtering and pagination
  async getSettings(
    query: SettingQuery,
    requestingUserId?: number,
    isAdmin = false,
  ) {
    // Apply visibility restrictions
    const filteredQuery = this.applyVisibilityFilter(
      query,
      requestingUserId,
      isAdmin,
    )

    return await settingModel.findMany(filteredQuery)
  }

  // Get setting by ID
  async getSettingById(id: number, requestingUserId?: number, isAdmin = false) {
    const setting = await settingModel.findById(id)
    if (!setting) {
      throw new SettingError('Setting not found', 404)
    }

    // Check access permissions
    if (!this.canAccessSetting(setting, requestingUserId, isAdmin)) {
      throw new SettingError('Access denied', 403)
    }

    return setting
  }

  // Get setting by UUID
  async getSettingByUuid(
    uuid: string,
    requestingUserId?: number,
    isAdmin = false,
  ) {
    const setting = await settingModel.findByUuid(uuid)
    if (!setting) {
      throw new SettingError('Setting not found', 404)
    }

    // Check access permissions
    if (!this.canAccessSetting(setting, requestingUserId, isAdmin)) {
      throw new SettingError('Access denied', 403)
    }

    return setting
  }

  // Get setting by key
  async getSettingByKey(
    key: string,
    userId?: number,
    requestingUserId?: number,
    isAdmin = false,
  ) {
    const setting = await settingModel.findByKey(key, userId)
    if (!setting) {
      throw new SettingError('Setting not found', 404)
    }

    // Check access permissions
    if (!this.canAccessSetting(setting, requestingUserId, isAdmin)) {
      throw new SettingError('Access denied', 403)
    }

    return setting
  }

  // Update setting
  async updateSetting(
    id: number,
    data: UpdateSettingInput,
    requestingUserId?: number,
    isAdmin = false,
  ) {
    const setting = await settingModel.findById(id)
    if (!setting) {
      throw new SettingError('Setting not found', 404)
    }

    // Check permissions
    if (!this.canModifySetting(setting, requestingUserId, isAdmin)) {
      throw new SettingError(
        'Insufficient permissions to modify this setting',
        403,
      )
    }

    // Validate visibility changes
    if (data.visibility) {
      if (
        data.visibility === SettingVisibility.SYSTEM &&
        !this.isSystemAdmin(requestingUserId)
      ) {
        throw new SettingError(
          'Insufficient permissions to set system visibility',
          403,
        )
      }
      if (
        data.visibility === SettingVisibility.ADMIN &&
        !this.isAdmin(requestingUserId)
      ) {
        throw new SettingError(
          'Insufficient permissions to set admin visibility',
          403,
        )
      }
    }

    return await settingModel.update(id, data)
  }

  // Delete setting
  async deleteSetting(id: number, requestingUserId?: number, isAdmin = false) {
    const setting = await settingModel.findById(id)
    if (!setting) {
      throw new SettingError('Setting not found', 404)
    }

    // Check permissions
    if (!this.canModifySetting(setting, requestingUserId, isAdmin)) {
      throw new SettingError(
        'Insufficient permissions to delete this setting',
        403,
      )
    }

    return await settingModel.delete(id)
  }

  // Get user settings by category
  async getUserSettings(
    userId: number,
    category?: string,
    requestingUserId?: number,
    isAdmin = false,
  ) {
    // Users can only access their own settings unless they're admin
    if (userId !== requestingUserId && !isAdmin) {
      throw new SettingError('Access denied', 403)
    }

    if (category) {
      return await settingModel.findUserSettingsByCategory(userId, category)
    } else {
      return await settingModel.findMany({ userId })
    }
  }

  // Get system settings
  async getSystemSettings(
    category?: string,
    requestingUserId?: number,
    isAdmin = false,
  ) {
    // Only admins can access system settings
    if (!isAdmin) {
      throw new SettingError('Access denied', 403)
    }

    return await settingModel.findSystemSettings(category)
  }

  // Upsert setting (create or update)
  async upsertSetting(
    key: string,
    data: CreateSettingInput,
    requestingUserId?: number,
    isAdmin = false,
  ) {
    // Check if setting exists
    const existing = await settingModel.findByKey(key, data.userId)

    if (existing) {
      // Update existing
      return await this.updateSetting(
        existing.id,
        data,
        requestingUserId,
        isAdmin,
      )
    } else {
      // Create new
      return await this.createSetting(data, requestingUserId)
    }
  }

  // Get settings statistics
  async getSettingsStats(requestingUserId?: number, isAdmin = false) {
    if (!isAdmin) {
      throw new SettingError('Access denied', 403)
    }

    const countByVisibility = await settingModel.getCountByVisibility()
    const totalSettings = await settingModel.findMany({})

    return {
      total: totalSettings.pagination.total,
      byVisibility: countByVisibility.reduce(
        (acc, item) => {
          acc[item.visibility] = item._count.id
          return acc
        },
        {} as Record<string, number>,
      ),
    }
  }

  // Permission helper methods
  private canAccessSetting(
    setting: SettingResponse,
    requestingUserId?: number,
    isAdmin = false,
  ): boolean {
    // System settings require admin access
    if (setting.visibility === SettingVisibility.SYSTEM) {
      return isAdmin
    }

    // Admin settings require admin access
    if (setting.visibility === SettingVisibility.ADMIN) {
      return isAdmin
    }

    // User settings can be accessed by the owner or admin
    if (setting.visibility === SettingVisibility.USER) {
      return isAdmin || setting.userId === requestingUserId
    }

    return false
  }

  private canModifySetting(
    setting: SettingResponse,
    requestingUserId?: number,
    isAdmin = false,
  ): boolean {
    // System settings require system admin
    if (setting.visibility === SettingVisibility.SYSTEM) {
      return this.isSystemAdmin(requestingUserId)
    }

    // Admin settings require admin
    if (setting.visibility === SettingVisibility.ADMIN) {
      return isAdmin
    }

    // User settings can be modified by owner or admin
    if (setting.visibility === SettingVisibility.USER) {
      return isAdmin || setting.userId === requestingUserId
    }

    return false
  }

  private applyVisibilityFilter(
    query: SettingQuery,
    requestingUserId?: number,
    isAdmin = false,
  ): SettingQuery {
    const filteredQuery = { ...query }

    if (!isAdmin) {
      // Non-admin users can only see their own USER settings
      filteredQuery.visibility = SettingVisibility.USER
      filteredQuery.userId = requestingUserId
    }

    return filteredQuery
  }

  private isAdmin(userId?: number): boolean {
    // This would typically check user roles in the database
    // For now, we'll assume admin status is passed from the controller
    // TODO: Implement actual role checking logic
    console.log('Checking admin status for user:', userId)
    return false // Placeholder - implement based on your user role system
  }

  private isSystemAdmin(userId?: number): boolean {
    // This would check for system admin privileges
    // For now, we'll assume system admin status is passed from the controller
    // TODO: Implement actual system admin checking logic
    console.log('Checking system admin status for user:', userId)
    return false // Placeholder - implement based on your user role system
  }
}

export const settingService = new SettingService()
export { SettingError }
