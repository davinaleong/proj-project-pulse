import { SettingVisibility, UserRole } from '@prisma/client'
import {
  settingModel,
  CreateSettingInput,
  UpdateSettingInput,
  SettingQuery,
  SettingResponse,
} from './setting.model'
import prisma from '../../../config/db'

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
      !(await this.isSystemAdmin(requestingUserId))
    ) {
      throw new SettingError(
        'Insufficient permissions to create system settings',
        403,
      )
    }

    if (
      data.visibility === SettingVisibility.ADMIN &&
      !(await this.isAdmin(requestingUserId))
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
  async getSettings(query: SettingQuery, requestingUserId?: number) {
    // Apply visibility restrictions
    const filteredQuery = await this.applyVisibilityFilter(
      query,
      requestingUserId,
    )

    return await settingModel.findMany(filteredQuery)
  }

  // Get setting by ID
  async getSettingById(id: number, requestingUserId?: number) {
    const setting = await settingModel.findById(id)
    if (!setting) {
      throw new SettingError('Setting not found', 404)
    }

    // Check access permissions
    if (!(await this.canAccessSetting(setting, requestingUserId))) {
      throw new SettingError('Access denied', 403)
    }

    return setting
  }

  // Get setting by UUID
  async getSettingByUuid(uuid: string, requestingUserId?: number) {
    const setting = await settingModel.findByUuid(uuid)
    if (!setting) {
      throw new SettingError('Setting not found', 404)
    }

    // Check access permissions
    if (!(await this.canAccessSetting(setting, requestingUserId))) {
      throw new SettingError('Access denied', 403)
    }

    return setting
  }

  // Get setting by key
  async getSettingByKey(
    key: string,
    userId?: number,
    requestingUserId?: number,
  ) {
    const setting = await settingModel.findByKey(key, userId)
    if (!setting) {
      throw new SettingError('Setting not found', 404)
    }

    // Check access permissions
    if (!(await this.canAccessSetting(setting, requestingUserId))) {
      throw new SettingError('Access denied', 403)
    }

    return setting
  }

  // Update setting
  async updateSetting(
    id: number,
    data: UpdateSettingInput,
    requestingUserId?: number,
  ) {
    const setting = await settingModel.findById(id)
    if (!setting) {
      throw new SettingError('Setting not found', 404)
    }

    // Check permissions
    if (!(await this.canModifySetting(setting, requestingUserId))) {
      throw new SettingError(
        'Insufficient permissions to modify this setting',
        403,
      )
    }

    // Validate visibility changes
    if (data.visibility) {
      if (
        data.visibility === SettingVisibility.SYSTEM &&
        !(await this.isSystemAdmin(requestingUserId))
      ) {
        throw new SettingError(
          'Insufficient permissions to set system visibility',
          403,
        )
      }
      if (
        data.visibility === SettingVisibility.ADMIN &&
        !(await this.isAdmin(requestingUserId))
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
  async deleteSetting(id: number, requestingUserId?: number) {
    const setting = await settingModel.findById(id)
    if (!setting) {
      throw new SettingError('Setting not found', 404)
    }

    // Check permissions
    if (!(await this.canModifySetting(setting, requestingUserId))) {
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
  ) {
    // Users can only access their own settings unless they're admin
    if (
      userId !== requestingUserId &&
      !(await this.isAdmin(requestingUserId))
    ) {
      throw new SettingError('Access denied', 403)
    }

    if (category) {
      return await settingModel.findUserSettingsByCategory(userId, category)
    } else {
      return await settingModel.findMany({ userId })
    }
  }

  // Get system settings
  async getSystemSettings(category?: string, requestingUserId?: number) {
    // Only admins can access system settings
    if (!(await this.isAdmin(requestingUserId))) {
      throw new SettingError('Access denied', 403)
    }

    return await settingModel.findSystemSettings(category)
  }

  // Upsert setting (create or update)
  async upsertSetting(
    key: string,
    data: CreateSettingInput,
    requestingUserId?: number,
  ) {
    // Check if setting exists
    const existing = await settingModel.findByKey(key, data.userId)

    if (existing) {
      // Update existing
      return await this.updateSetting(existing.id, data, requestingUserId)
    } else {
      // Create new
      return await this.createSetting(data, requestingUserId)
    }
  }

  // Get settings statistics
  async getSettingsStats(requestingUserId?: number) {
    if (!(await this.isAdmin(requestingUserId))) {
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
  private async canAccessSetting(
    setting: SettingResponse,
    requestingUserId?: number,
  ): Promise<boolean> {
    // System settings require system admin access
    if (setting.visibility === SettingVisibility.SYSTEM) {
      return await this.isSystemAdmin(requestingUserId)
    }

    // Admin settings require admin access
    if (setting.visibility === SettingVisibility.ADMIN) {
      return await this.isAdmin(requestingUserId)
    }

    // User settings can be accessed by the owner or admin
    if (setting.visibility === SettingVisibility.USER) {
      const userIsAdmin = await this.isAdmin(requestingUserId)
      return userIsAdmin || setting.userId === requestingUserId
    }

    return false
  }

  private async canModifySetting(
    setting: SettingResponse,
    requestingUserId?: number,
  ): Promise<boolean> {
    // System settings require system admin
    if (setting.visibility === SettingVisibility.SYSTEM) {
      return await this.isSystemAdmin(requestingUserId)
    }

    // Admin settings require admin
    if (setting.visibility === SettingVisibility.ADMIN) {
      return await this.isAdmin(requestingUserId)
    }

    // User settings can be modified by owner or admin
    if (setting.visibility === SettingVisibility.USER) {
      const userIsAdmin = await this.isAdmin(requestingUserId)
      return userIsAdmin || setting.userId === requestingUserId
    }

    return false
  }

  private async applyVisibilityFilter(
    query: SettingQuery,
    requestingUserId?: number,
  ): Promise<SettingQuery> {
    const filteredQuery = { ...query }

    if (!(await this.isAdmin(requestingUserId))) {
      // Non-admin users can only see their own USER settings
      filteredQuery.visibility = SettingVisibility.USER
      filteredQuery.userId = requestingUserId
    }

    return filteredQuery
  }

  private async isAdmin(userId?: number): Promise<boolean> {
    if (!userId) return false

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      })

      return (
        user?.role === UserRole.ADMIN ||
        user?.role === UserRole.MANAGER ||
        user?.role === UserRole.SUPERADMIN
      )
    } catch (error) {
      console.error('Error checking admin status:', error)
      return false
    }
  }

  private async isSystemAdmin(userId?: number): Promise<boolean> {
    if (!userId) return false

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      })

      return user?.role === UserRole.SUPERADMIN
    } catch (error) {
      console.error('Error checking system admin status:', error)
      return false
    }
  }
}

export const settingService = new SettingService()
export { SettingError }
