import { z } from 'zod'
import { PrismaClient, ProjectStage, Prisma } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

const prisma = new PrismaClient()

// Validation schemas
export const createProjectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().optional(),
  stage: z.nativeEnum(ProjectStage).optional(),
  beganAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  billingCycle: z.string().optional(),
  rate: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
})

export const updateProjectSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title too long')
    .optional(),
  description: z.string().optional(),
  stage: z.nativeEnum(ProjectStage).optional(),
  beganAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  billingCycle: z.string().optional(),
  rate: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
})

export const projectQuerySchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
  stage: z.nativeEnum(ProjectStage).optional(),
  userId: z.number().int().positive().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title', 'stage']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
})

// Types
export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
export type ProjectQuery = z.infer<typeof projectQuerySchema>

export interface ProjectResponse {
  id: number
  uuid: string
  title: string
  description: string | null
  stage: ProjectStage
  userId: number
  beganAt: Date | null
  completedAt: Date | null
  billingCycle: string | null
  rate: Decimal | null
  currency: string | null
  createdAt: Date
  updatedAt: Date
  user?: {
    id: number
    name: string
    email: string
  }
  _count?: {
    tasks: number
    notes: number
  }
}

export interface PaginatedProjectsResponse {
  projects: ProjectResponse[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Custom error class
export class ProjectError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
  ) {
    super(message)
    this.name = 'ProjectError'
  }
}

// Database operations
export const projectModel = {
  async create(
    data: CreateProjectInput,
    userId: number,
  ): Promise<ProjectResponse> {
    try {
      const project = await prisma.project.create({
        data: {
          ...data,
          userId,
          beganAt: data.beganAt ? new Date(data.beganAt) : null,
          completedAt: data.completedAt ? new Date(data.completedAt) : null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              tasks: true,
              notes: true,
            },
          },
        },
      })

      return project
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ProjectError('Project with this title already exists', 400)
        }
      }
      throw new ProjectError('Failed to create project', 500)
    }
  },

  async findMany(
    query: ProjectQuery,
    userId?: number,
  ): Promise<PaginatedProjectsResponse> {
    const page = query.page || 1
    const limit = query.limit || 20
    const skip = (page - 1) * limit

    const where: Prisma.ProjectWhereInput = {
      deletedAt: null,
      ...(userId && { userId }),
      ...(query.stage && { stage: query.stage }),
      ...(query.search && {
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    }

    const orderBy: Prisma.ProjectOrderByWithRelationInput = {
      [query.sortBy || 'createdAt']: query.sortOrder || 'desc',
    }

    try {
      const [projects, total] = await Promise.all([
        prisma.project.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            _count: {
              select: {
                tasks: true,
                notes: true,
              },
            },
          },
        }),
        prisma.project.count({ where }),
      ])

      return {
        projects,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
      throw new ProjectError('Failed to fetch projects', 500)
    }
  },

  async findById(id: number): Promise<ProjectResponse | null> {
    try {
      const project = await prisma.project.findFirst({
        where: {
          id,
          deletedAt: null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              tasks: true,
              notes: true,
            },
          },
        },
      })

      return project
    } catch (error) {
      console.error('Error fetching project by ID:', error)
      throw new ProjectError('Failed to fetch project', 500)
    }
  },

  async findByUuid(uuid: string): Promise<ProjectResponse | null> {
    try {
      const project = await prisma.project.findFirst({
        where: {
          uuid,
          deletedAt: null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              tasks: true,
              notes: true,
            },
          },
        },
      })

      return project
    } catch (error) {
      console.error('Error fetching project by UUID:', error)
      throw new ProjectError('Failed to fetch project', 500)
    }
  },

  async update(id: number, data: UpdateProjectInput): Promise<ProjectResponse> {
    try {
      const project = await prisma.project.update({
        where: { id },
        data: {
          ...data,
          beganAt: data.beganAt ? new Date(data.beganAt) : undefined,
          completedAt: data.completedAt
            ? new Date(data.completedAt)
            : undefined,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              tasks: true,
              notes: true,
            },
          },
        },
      })

      return project
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new ProjectError('Project not found', 404)
        }
        if (error.code === 'P2002') {
          throw new ProjectError('Project with this title already exists', 400)
        }
      }
      throw new ProjectError('Failed to update project', 500)
    }
  },

  async delete(id: number): Promise<void> {
    try {
      await prisma.project.update({
        where: { id },
        data: {
          deletedAt: new Date(),
        },
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new ProjectError('Project not found', 404)
        }
      }
      throw new ProjectError('Failed to delete project', 500)
    }
  },

  async getProjectStats(userId?: number): Promise<{
    total: number
    byStage: Record<ProjectStage, number>
    totalTasks: number
    totalNotes: number
  }> {
    try {
      const where: Prisma.ProjectWhereInput = {
        deletedAt: null,
        ...(userId && { userId }),
      }

      const [total, stageStats, taskCount, noteCount] = await Promise.all([
        prisma.project.count({ where }),
        prisma.project.groupBy({
          by: ['stage'],
          where,
          _count: {
            id: true,
          },
        }),
        prisma.task.count({
          where: {
            project: where,
            deletedAt: null,
          },
        }),
        prisma.note.count({
          where: {
            project: where,
            deletedAt: null,
          },
        }),
      ])

      const byStage = Object.values(ProjectStage).reduce(
        (acc, stage) => {
          acc[stage] = stageStats.find((s) => s.stage === stage)?._count.id || 0
          return acc
        },
        {} as Record<ProjectStage, number>,
      )

      return {
        total,
        byStage,
        totalTasks: taskCount,
        totalNotes: noteCount,
      }
    } catch (error) {
      console.error('Error getting project statistics:', error)
      throw new ProjectError('Failed to get project statistics', 500)
    }
  },
}
