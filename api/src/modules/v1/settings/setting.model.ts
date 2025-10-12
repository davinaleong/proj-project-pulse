import { z } from 'zod'
import { SettingVisibility } from '@prisma/client'
import prisma from '../../../config/db'

// Validation schemas
export const createSettingSchema = z.object({
  key: z.string().min(1, 'Key is required').max(255, 'Key too long'),
  value: z.string().optional(),
  type: z.string().optional(),
  category: z.string().optional(),
  visibility: z.nativeEnum(SettingVisibility).default(SettingVisibility.USER),
  userId: z.number().int().positive().optional(),
})

export const updateSettingSchema = z.object({
  key: z.string().min(1, 'Key is required').max(255, 'Key too long').optional(),
  value: z.string().optional(),
  type: z.string().optional(),
  category: z.string().optional(),
  visibility: z.nativeEnum(SettingVisibility).optional(),
  userId: z.number().int().positive().optional(),
})

export const settingQuerySchema = z.object({
  key: z.string().optional(),
  category: z.string().optional(),
  visibility: z.nativeEnum(SettingVisibility).optional(),
  userId: z.number().int().positive().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
})

// TypeScript interfaces
export interface CreateSettingInput {
  key: string
  value?: string
  type?: string
  category?: string
  visibility?: SettingVisibility
  userId?: number
}

export interface UpdateSettingInput {
  key?: string
  value?: string
  type?: string
  category?: string
  visibility?: SettingVisibility
  userId?: number
}

export interface SettingQuery {
  key?: string
  category?: string
  visibility?: SettingVisibility
  userId?: number
  page?: number
  limit?: number
}

export interface SettingResponse {
  id: number
  uuid: string
  key: string
  value: string | null
  type: string | null
  category: string | null
  visibility: SettingVisibility
  updatedAt: Date
  userId: number | null
  user?: {
    id: number
    name: string
    email: string
  } | null
}

// Database operations
export const settingModel = {
  // Create a new setting
  async create(data: CreateSettingInput) {
    return await prisma.setting.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
  },

  // Get all settings with optional filtering
  async findMany(query: SettingQuery = {}) {
    const { page = 1, limit = 10, key, category, visibility, userId } = query
    const skip = (page - 1) * limit

    const where: {
      key?: { contains: string; mode: 'insensitive' }
      category?: string
      visibility?: SettingVisibility
      userId?: number
    } = {}
    if (key) where.key = { contains: key, mode: 'insensitive' }
    if (category) where.category = category
    if (visibility) where.visibility = visibility
    if (userId) where.userId = userId

    const [settings, total] = await Promise.all([
      prisma.setting.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.setting.count({ where }),
    ])

    return {
      settings,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    }
  },

  // Get setting by ID
  async findById(id: number) {
    return await prisma.setting.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
  },

  // Get setting by UUID
  async findByUuid(uuid: string) {
    return await prisma.setting.findUnique({
      where: { uuid },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
  },

  // Get setting by key
  async findByKey(key: string, userId?: number) {
    const where: { key: string; userId?: number } = { key }
    if (userId) where.userId = userId

    return await prisma.setting.findFirst({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
  },

  // Update setting
  async update(id: number, data: UpdateSettingInput) {
    return await prisma.setting.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
  },

  // Delete setting
  async delete(id: number) {
    return await prisma.setting.delete({
      where: { id },
    })
  },

  // Get user settings by category
  async findUserSettingsByCategory(userId: number, category: string) {
    return await prisma.setting.findMany({
      where: {
        userId,
        category,
      },
      orderBy: { key: 'asc' },
    })
  },

  // Get system settings (no userId)
  async findSystemSettings(category?: string) {
    const where: { userId: null; category?: string } = { userId: null }
    if (category) where.category = category

    return await prisma.setting.findMany({
      where,
      orderBy: { key: 'asc' },
    })
  },

  // Upsert setting (create or update by key)
  async upsert(key: string, data: CreateSettingInput) {
    const where: { key: string; userId?: number } = { key }
    if (data.userId) where.userId = data.userId

    // For upsert, we need to find existing setting first
    const existing = await this.findByKey(key, data.userId)

    if (existing) {
      return await this.update(existing.id, data)
    } else {
      return await this.create(data)
    }
  },

  // Get settings count by visibility
  async getCountByVisibility() {
    return await prisma.setting.groupBy({
      by: ['visibility'],
      _count: {
        id: true,
      },
    })
  },
}
