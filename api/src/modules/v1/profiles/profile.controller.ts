import { Request, Response } from 'express'
import { profileService } from './profile.service'
import { CreateProfileData } from './profile.model'
import { Theme, Visibility } from '@prisma/client'
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
  async createProfile(req: Request, res: Response) {
    try {
      const validationResult = createProfileSchema.safeParse(req.body)
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validationResult.error.issues,
        })
      }

      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' })
      }

      const profileData: CreateProfileData = {
        ...validationResult.data,
        userId,
      }

      const profile = await profileService.createProfile(profileData)
      res.json({
        success: true,
        data: profile,
      })
    } catch (error: unknown) {
      res.status(400).json({ error: (error as Error).message })
    }
  }

  // Get current user's profile
  async getMyProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' })
      }

      const profile = await profileService.getProfileByUserId(userId)
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' })
      }

      res.json({
        success: true,
        data: profile,
      })
    } catch (error: unknown) {
      res.status(500).json({ error: (error as Error).message })
    }
  }

  // Get profile by UUID
  async getProfile(req: Request, res: Response) {
    try {
      const { uuid } = req.params
      const requesterId = req.user?.id

      const profile = await profileService.getProfileByUuid(uuid)
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' })
      }

      // Check if profile is public or user has access
      if (profile.visibility !== Visibility.PUBLIC) {
        if (
          !requesterId ||
          (profile.userId !== requesterId && req.user?.role !== 'ADMIN')
        ) {
          return res.status(403).json({ error: 'Profile is private' })
        }
      }

      res.json({
        success: true,
        data: profile,
      })
    } catch (error: unknown) {
      res.status(500).json({ error: (error as Error).message })
    }
  }

  // Get public profiles with filters
  async getPublicProfiles(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 20
      const search = req.query.search as string

      const result = await profileService.getPublicProfiles(
        { search },
        { page, limit },
      )

      res.json({
        success: true,
        data: result.profiles,
        pagination: result.pagination,
      })
    } catch (error: unknown) {
      res.status(500).json({ error: (error as Error).message })
    }
  }

  // Update profile
  async updateProfile(req: Request, res: Response) {
    try {
      const { uuid } = req.params
      const validationResult = updateProfileSchema.safeParse(req.body)
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validationResult.error.issues,
        })
      }

      const requesterId = req.user?.id
      if (!requesterId) {
        return res.status(401).json({ error: 'User not authenticated' })
      }

      const profile = await profileService.updateProfile(
        uuid,
        validationResult.data,
        requesterId,
      )
      res.json({
        success: true,
        data: profile,
      })
    } catch (error: unknown) {
      res.status(400).json({ error: (error as Error).message })
    }
  }

  // Delete profile
  async deleteProfile(req: Request, res: Response) {
    try {
      const { uuid } = req.params
      const requesterId = req.user?.id
      if (!requesterId) {
        return res.status(401).json({ error: 'User not authenticated' })
      }

      await profileService.deleteProfile(uuid, requesterId)
      res.json({
        success: true,
        message: 'Profile deleted successfully',
      })
    } catch (error: unknown) {
      res.status(400).json({ error: (error as Error).message })
    }
  }

  // Get profile statistics
  async getProfileStats(req: Request, res: Response) {
    try {
      const { uuid } = req.params
      const requesterId = req.user?.id

      const stats = await profileService.getProfileStats(uuid, requesterId)
      res.json({
        success: true,
        data: stats,
      })
    } catch (error: unknown) {
      res.status(400).json({ error: (error as Error).message })
    }
  }

  // Get profile settings (for authenticated user)
  async getProfileSettings(req: Request, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' })
      }

      const settings = await profileService.getProfileSettings(userId)
      res.json({
        success: true,
        data: settings,
      })
    } catch (error: unknown) {
      res.status(500).json({ error: (error as Error).message })
    }
  }

  // Update profile settings
  async updateProfileSettings(req: Request, res: Response) {
    try {
      const validationResult = settingsSchema.safeParse(req.body)
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validationResult.error.issues,
        })
      }

      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' })
      }

      const profile = await profileService.updateProfileSettings(
        userId,
        validationResult.data,
      )
      res.json({
        success: true,
        data: profile,
      })
    } catch (error: unknown) {
      res.status(400).json({ error: (error as Error).message })
    }
  }
}

export const profileController = new ProfileController()
