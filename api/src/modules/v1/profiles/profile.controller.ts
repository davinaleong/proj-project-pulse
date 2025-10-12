import { Request, Response } from 'express'
import { profileService } from './profile.service'
import { CreateProfileData, UpdateProfileData } from './profile.model'
import { Theme, Visibility } from '@prisma/client'
import { sendResponse, sendError } from '../../../utils/response'
import { validate } from '../../../utils/validator'
import { z } from 'zod'

// Validation schemas
const createProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
  coverUrl: z.string().url().optional(),
  timezone: z.string().optional(),
  language: z.string().min(2).max(5).optional(),
  theme: z.nativeEnum(Theme).optional(),
  socialLinks: z
    .object({
      website: z.string().url().optional(),
      linkedin: z.string().url().optional(),
      github: z.string().url().optional(),
      twitter: z.string().url().optional(),
      instagram: z.string().url().optional(),
    })
    .optional(),
  notifications: z
    .object({
      email: z
        .object({
          projects: z.boolean().optional(),
          tasks: z.boolean().optional(),
          notes: z.boolean().optional(),
          mentions: z.boolean().optional(),
        })
        .optional(),
      push: z
        .object({
          projects: z.boolean().optional(),
          tasks: z.boolean().optional(),
          notes: z.boolean().optional(),
          mentions: z.boolean().optional(),
        })
        .optional(),
      frequency: z.enum(['immediate', 'daily', 'weekly', 'never']).optional(),
    })
    .optional(),
  visibility: z.nativeEnum(Visibility).optional(),
})

const updateProfileSchema = createProfileSchema.partial()

const profileQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  search: z.string().optional(),
  language: z.string().optional(),
  theme: z.nativeEnum(Theme).optional(),
})

const settingsSchema = z.object({
  theme: z.nativeEnum(Theme).optional(),
  language: z.string().min(2).max(5).optional(),
  timezone: z.string().optional(),
  notifications: z
    .object({
      email: z
        .object({
          projects: z.boolean().optional(),
          tasks: z.boolean().optional(),
          notes: z.boolean().optional(),
          mentions: z.boolean().optional(),
        })
        .optional(),
      push: z
        .object({
          projects: z.boolean().optional(),
          tasks: z.boolean().optional(),
          notes: z.boolean().optional(),
          mentions: z.boolean().optional(),
        })
        .optional(),
      frequency: z.enum(['immediate', 'daily', 'weekly', 'never']).optional(),
    })
    .optional(),
  visibility: z.nativeEnum(Visibility).optional(),
})

export class ProfileController {
  // Create a new profile
  async createProfile(req: Request, res: Response): Promise<void> {
    try {
      const { error, data } = validate(createProfileSchema, req.body)
      if (error) {
        sendError(res, 400, 'Validation failed', error)
        return
      }

      const userId = req.user?.id
      if (!userId) {
        sendError(res, 401, 'User not authenticated')
        return
      }

      const profileData: CreateProfileData = {
        ...data,
        userId,
      }

      const profile = await profileService.createProfile(profileData)
      sendResponse(res, 201, 'Profile created successfully', { profile })
    } catch (error: any) {
      sendError(res, 400, error.message)
    }
  }

  // Get current user's profile
  async getMyProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id
      if (!userId) {
        sendError(res, 401, 'User not authenticated')
        return
      }

      const profile = await profileService.getProfileByUserId(userId)
      if (!profile) {
        sendError(res, 404, 'Profile not found')
        return
      }

      sendResponse(res, 200, 'Profile retrieved successfully', { profile })
    } catch (error: any) {
      sendError(res, 500, error.message)
    }
  }

  // Get profile by UUID
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const { uuid } = req.params
      const requesterId = req.user?.id

      const profile = await profileService.getProfileByUuid(uuid)
      if (!profile) {
        sendError(res, 404, 'Profile not found')
        return
      }

      // Check if profile is public or user has access
      if (profile.visibility !== Visibility.PUBLIC) {
        if (
          !requesterId ||
          (profile.userId !== requesterId && req.user?.role !== 'ADMIN')
        ) {
          sendError(res, 403, 'Profile is private')
          return
        }
      }

      sendResponse(res, 200, 'Profile retrieved successfully', { profile })
    } catch (error: any) {
      sendError(res, 500, error.message)
    }
  }

  // Get public profiles with filters
  async getPublicProfiles(req: Request, res: Response): Promise<void> {
    try {
      const { error, data } = validate(profileQuerySchema, req.query)
      if (error) {
        sendError(res, 400, 'Validation failed', error)
        return
      }

      const { page, limit, search, language, theme } = data

      const result = await profileService.getPublicProfiles(
        { search, language, theme },
        { page, limit, sortBy: 'createdAt', sortOrder: 'desc' },
      )

      sendResponse(res, 200, 'Public profiles retrieved successfully', result)
    } catch (error: any) {
      sendError(res, 500, error.message)
    }
  }

  // Update profile
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const { uuid } = req.params
      const { error, data } = validate(updateProfileSchema, req.body)
      if (error) {
        sendError(res, 400, 'Validation failed', error)
        return
      }

      const requesterId = req.user?.id
      if (!requesterId) {
        sendError(res, 401, 'User not authenticated')
        return
      }

      const profile = await profileService.updateProfile(
        uuid,
        data,
        requesterId,
      )
      sendResponse(res, 200, 'Profile updated successfully', { profile })
    } catch (error: any) {
      sendError(res, 400, error.message)
    }
  }

  // Delete profile
  async deleteProfile(req: Request, res: Response): Promise<void> {
    try {
      const { uuid } = req.params
      const requesterId = req.user?.id
      if (!requesterId) {
        sendError(res, 401, 'User not authenticated')
        return
      }

      await profileService.deleteProfile(uuid, requesterId)
      sendResponse(res, 200, 'Profile deleted successfully')
    } catch (error: any) {
      sendError(res, 400, error.message)
    }
  }

  // Get profile statistics
  async getProfileStats(req: Request, res: Response): Promise<void> {
    try {
      const { uuid } = req.params
      const requesterId = req.user?.id

      const stats = await profileService.getProfileStats(uuid, requesterId)
      sendResponse(res, 200, 'Profile statistics retrieved successfully', {
        stats,
      })
    } catch (error: any) {
      sendError(res, 400, error.message)
    }
  }

  // Get profile settings (for authenticated user)
  async getProfileSettings(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id
      if (!userId) {
        sendError(res, 401, 'User not authenticated')
        return
      }

      const settings = await profileService.getProfileSettings(userId)
      sendResponse(res, 200, 'Profile settings retrieved successfully', {
        settings,
      })
    } catch (error: any) {
      sendError(res, 500, error.message)
    }
  }

  // Update profile settings
  async updateProfileSettings(req: Request, res: Response): Promise<void> {
    try {
      const { error, data } = validate(settingsSchema, req.body)
      if (error) {
        sendError(res, 400, 'Validation failed', error)
        return
      }

      const userId = req.user?.id
      if (!userId) {
        sendError(res, 401, 'User not authenticated')
        return
      }

      const profile = await profileService.updateProfileSettings(userId, data)
      sendResponse(res, 200, 'Profile settings updated successfully', {
        profile,
      })
    } catch (error: any) {
      sendError(res, 400, error.message)
    }
  }
}

export const profileController = new ProfileController()
