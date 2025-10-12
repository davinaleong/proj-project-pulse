import { Profile, Theme, Visibility } from '@prisma/client'
import {
  profileModel,
  CreateProfileData,
  UpdateProfileData,
  ProfileWithUser,
  ProfileFilters,
  ProfilePaginationOptions,
} from './profile.model'
import { userModel } from '../users/user.model'

export class ProfileService {
  // Create a new profile for a user
  async createProfile(data: CreateProfileData): Promise<Profile> {
    // Check if user exists
    const user = await userModel.findById(data.userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Check if profile already exists for this user
    const existingProfile = await profileModel.existsForUser(data.userId)
    if (existingProfile) {
      throw new Error('Profile already exists for this user')
    }

    // Set default values
    const profileData: CreateProfileData = {
      ...data,
      theme: data.theme || Theme.LIGHT,
      visibility: data.visibility || Visibility.PUBLIC,
      language: data.language || 'en',
      timezone: data.timezone || 'UTC',
      socialLinks: data.socialLinks || {},
      notifications: data.notifications || {
        email: {
          projects: true,
          tasks: true,
          notes: true,
          mentions: true,
        },
        push: {
          projects: false,
          tasks: true,
          notes: false,
          mentions: true,
        },
        frequency: 'immediate',
      },
    }

    return profileModel.create(profileData)
  }

  // Get profile by user ID
  async getProfileByUserId(userId: number): Promise<ProfileWithUser | null> {
    return profileModel.findByUserId(userId)
  }

  // Get profile by UUID
  async getProfileByUuid(uuid: string): Promise<ProfileWithUser | null> {
    return profileModel.findByUuid(uuid)
  }

  // Update profile
  async updateProfile(
    uuid: string,
    data: UpdateProfileData,
    requesterId: number,
  ): Promise<Profile> {
    const profile = await profileModel.findByUuid(uuid)
    if (!profile) {
      throw new Error('Profile not found')
    }

    // Check if requester is the profile owner or admin
    const requester = await userModel.findById(requesterId)
    if (!requester) {
      throw new Error('Requester not found')
    }

    if (profile.userId !== requesterId && requester.role !== 'ADMIN') {
      throw new Error('Unauthorized to update this profile')
    }

    // Validate theme and visibility if provided
    if (data.theme && !Object.values(Theme).includes(data.theme)) {
      throw new Error('Invalid theme value')
    }

    if (
      data.visibility &&
      !Object.values(Visibility).includes(data.visibility)
    ) {
      throw new Error('Invalid visibility value')
    }

    // Validate social links format
    if (data.socialLinks) {
      const validSocialPlatforms = [
        'website',
        'linkedin',
        'github',
        'twitter',
        'instagram',
      ]
      const invalidPlatforms = Object.keys(data.socialLinks).filter(
        (platform) => !validSocialPlatforms.includes(platform),
      )

      if (invalidPlatforms.length > 0) {
        throw new Error(
          `Invalid social platforms: ${invalidPlatforms.join(', ')}`,
        )
      }

      // Validate URLs
      for (const [platform, url] of Object.entries(data.socialLinks)) {
        if (url && !this.isValidUrl(url)) {
          throw new Error(`Invalid URL for ${platform}`)
        }
      }
    }

    return profileModel.update(uuid, data)
  }

  // Get public profiles with pagination and filters
  async getPublicProfiles(
    filters: ProfileFilters = {},
    options: ProfilePaginationOptions = {},
  ): Promise<{
    profiles: ProfileWithUser[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }> {
    // Ensure only public profiles are returned
    const profileFilters: ProfileFilters = {
      ...filters,
      visibility: Visibility.PUBLIC,
    }

    return profileModel.findPublic(profileFilters, options)
  }

  // Delete profile
  async deleteProfile(uuid: string, requesterId: number): Promise<void> {
    const profile = await profileModel.findByUuid(uuid)
    if (!profile) {
      throw new Error('Profile not found')
    }

    // Check if requester is the profile owner or admin
    const requester = await userModel.findById(requesterId)
    if (!requester) {
      throw new Error('Requester not found')
    }

    if (profile.userId !== requesterId && requester.role !== 'ADMIN') {
      throw new Error('Unauthorized to delete this profile')
    }

    await profileModel.delete(uuid)
  }

  // Get profile statistics
  async getProfileStats(
    uuid: string,
    requesterId?: number,
  ): Promise<{
    projectCount: number
    taskCount: number
    noteCount: number
    completedTaskCount: number
    joinedDate: Date
  }> {
    const profile = await profileModel.findByUuid(uuid)
    if (!profile) {
      throw new Error('Profile not found')
    }

    // Check if profile is public or requester is owner/admin
    if (profile.visibility !== Visibility.PUBLIC && requesterId) {
      const requester = await userModel.findById(requesterId)
      if (!requester) {
        throw new Error('Requester not found')
      }

      if (profile.userId !== requesterId && requester.role !== 'ADMIN') {
        throw new Error('Unauthorized to view profile statistics')
      }
    } else if (profile.visibility !== Visibility.PUBLIC && !requesterId) {
      throw new Error('Profile is private')
    }

    return profileModel.getStats(uuid)
  }

  // Get profile settings for owner
  async getProfileSettings(userId: number): Promise<{
    theme: Theme
    language: string
    timezone: string
    notifications: any
    visibility: Visibility
  }> {
    const profile = await profileModel.findByUserId(userId)
    if (!profile) {
      throw new Error('Profile not found')
    }

    return {
      theme: profile.theme,
      language: profile.language,
      timezone: profile.timezone,
      notifications: profile.notifications,
      visibility: profile.visibility,
    }
  }

  // Update profile settings
  async updateProfileSettings(
    userId: number,
    settings: {
      theme?: Theme
      language?: string
      timezone?: string
      notifications?: any
      visibility?: Visibility
    },
  ): Promise<Profile> {
    const profile = await profileModel.findByUserId(userId)
    if (!profile) {
      throw new Error('Profile not found')
    }

    // Validate settings
    if (settings.theme && !Object.values(Theme).includes(settings.theme)) {
      throw new Error('Invalid theme value')
    }

    if (
      settings.visibility &&
      !Object.values(Visibility).includes(settings.visibility)
    ) {
      throw new Error('Invalid visibility value')
    }

    if (settings.language && !this.isValidLanguageCode(settings.language)) {
      throw new Error('Invalid language code')
    }

    if (settings.timezone && !this.isValidTimezone(settings.timezone)) {
      throw new Error('Invalid timezone')
    }

    return profileModel.update(profile.uuid, settings)
  }

  // Private helper methods
  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  private isValidLanguageCode(language: string): boolean {
    // Basic language code validation (e.g., 'en', 'es', 'fr', 'de')
    const validLanguages = [
      'en',
      'es',
      'fr',
      'de',
      'it',
      'pt',
      'ru',
      'ja',
      'ko',
      'zh',
    ]
    return validLanguages.includes(language)
  }

  private isValidTimezone(timezone: string): boolean {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone })
      return true
    } catch {
      return false
    }
  }
}

export const profileService = new ProfileService()
