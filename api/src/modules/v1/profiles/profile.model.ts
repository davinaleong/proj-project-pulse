import { PrismaClient, Profile, Theme, Visibility } from '@prisma/client'

const prisma = new PrismaClient()

export interface SocialLinks {
  website?: string
  linkedin?: string
  github?: string
  twitter?: string
  instagram?: string
  [key: string]: string | undefined
}

export interface NotificationSettings {
  email?: {
    projects?: boolean
    tasks?: boolean
    notes?: boolean
    mentions?: boolean
  }
  push?: {
    projects?: boolean
    tasks?: boolean
    notes?: boolean
    mentions?: boolean
  }
  frequency?: 'immediate' | 'daily' | 'weekly' | 'never'
  [key: string]: unknown
}

export interface ProfileWithUser extends Profile {
  user: {
    id: number
    uuid: string
    name: string
    email: string
    role: string
    status: string
    createdAt: Date
  }
}

export interface CreateProfileData {
  userId: number
  bio?: string
  avatarUrl?: string
  coverUrl?: string
  timezone?: string
  language?: string
  theme?: Theme
  socialLinks?: SocialLinks
  notifications?: NotificationSettings
  visibility?: Visibility
}

export interface UpdateProfileData {
  bio?: string
  avatarUrl?: string
  coverUrl?: string
  timezone?: string
  language?: string
  theme?: Theme
  socialLinks?: SocialLinks
  notifications?: NotificationSettings
  visibility?: Visibility
}

export interface ProfileFilters {
  visibility?: Visibility
  language?: string
  theme?: Theme
  search?: string
}

export interface ProfilePaginationOptions {
  page?: number
  limit?: number
  sortBy?: 'createdAt' | 'updatedAt' | 'name'
  sortOrder?: 'asc' | 'desc'
}

export const profileModel = {
  // Create a new profile
  async create(data: CreateProfileData): Promise<Profile> {
    return prisma.profile.create({
      data: {
        ...data,
        socialLinks: (data.socialLinks as object) || {},
        notifications: (data.notifications as object) || {},
      },
    })
  },

  // Find profile by user ID
  async findByUserId(userId: number): Promise<ProfileWithUser | null> {
    return prisma.profile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            uuid: true,
            name: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
          },
        },
      },
    }) as Promise<ProfileWithUser | null>
  },

  // Find profile by UUID
  async findByUuid(uuid: string): Promise<ProfileWithUser | null> {
    return prisma.profile.findUnique({
      where: { uuid },
      include: {
        user: {
          select: {
            id: true,
            uuid: true,
            name: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
          },
        },
      },
    }) as Promise<ProfileWithUser | null>
  },

  // Update profile
  async update(uuid: string, data: UpdateProfileData): Promise<Profile> {
    const updateData: Record<string, unknown> = { ...data }

    if (data.socialLinks) {
      updateData.socialLinks = data.socialLinks as object
    }

    if (data.notifications) {
      updateData.notifications = data.notifications as object
    }

    return prisma.profile.update({
      where: { uuid },
      data: updateData,
    })
  },

  // Get public profiles with pagination and filters
  async findPublic(
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
    const page = options.page || 1
    const limit = Math.min(options.limit || 20, 100)
    const offset = (page - 1) * limit
    const sortBy = options.sortBy || 'createdAt'
    const sortOrder = options.sortOrder || 'desc'

    // Build where clause
    const where: {
      visibility?: Visibility
      language?: string
      theme?: Theme
      OR?: Array<{
        bio?: { contains: string; mode: 'insensitive' }
        user?: { name: { contains: string; mode: 'insensitive' } }
      }>
    } = {
      visibility: filters.visibility || Visibility.PUBLIC,
    }

    if (filters.language) {
      where.language = filters.language
    }

    if (filters.theme) {
      where.theme = filters.theme
    }

    if (filters.search) {
      where.OR = [
        { bio: { contains: filters.search, mode: 'insensitive' } },
        { user: { name: { contains: filters.search, mode: 'insensitive' } } },
      ]
    }

    // Build order by clause
    let orderBy: Record<string, string> | { user: Record<string, string> } = {}
    if (sortBy === 'name') {
      orderBy = { user: { name: sortOrder } }
    } else {
      orderBy = { [sortBy]: sortOrder }
    }

    const [profiles, total] = await Promise.all([
      prisma.profile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              uuid: true,
              name: true,
              email: true,
              role: true,
              status: true,
              createdAt: true,
            },
          },
        },
        orderBy,
        skip: offset,
        take: limit,
      }) as Promise<ProfileWithUser[]>,
      prisma.profile.count({ where }),
    ])

    return {
      profiles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  },

  // Delete profile (soft delete by updating user)
  async delete(uuid: string): Promise<void> {
    const profile = await prisma.profile.findUnique({
      where: { uuid },
      include: { user: true },
    })

    if (!profile) {
      throw new Error('Profile not found')
    }

    // Delete the profile and mark user as deleted
    await prisma.$transaction([
      prisma.profile.delete({
        where: { uuid },
      }),
      prisma.user.update({
        where: { id: profile.userId },
        data: { deletedAt: new Date() },
      }),
    ])
  },

  // Check if profile exists for user
  async existsForUser(userId: number): Promise<boolean> {
    const count = await prisma.profile.count({
      where: { userId },
    })
    return count > 0
  },

  // Get profile statistics
  async getStats(uuid: string): Promise<{
    projectCount: number
    taskCount: number
    noteCount: number
    completedTaskCount: number
    joinedDate: Date
  }> {
    const profile = await prisma.profile.findUnique({
      where: { uuid },
      include: {
        user: {
          include: {
            projects: {
              include: {
                tasks: true,
                notes: true,
              },
            },
            tasks: true,
            notes: true,
          },
        },
      },
    })

    if (!profile) {
      throw new Error('Profile not found')
    }

    const projectCount = profile.user.projects.length
    const taskCount = profile.user.tasks.length
    const noteCount = profile.user.notes.length
    const completedTaskCount = profile.user.tasks.filter(
      (task) => task.status === 'DONE',
    ).length

    return {
      projectCount,
      taskCount,
      noteCount,
      completedTaskCount,
      joinedDate: profile.user.createdAt,
    }
  },
}
