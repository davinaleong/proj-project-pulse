import { z } from 'zod'
import { PrismaClient, TaskStatus, Prisma } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

const prisma = new PrismaClient()

// Validation schemas
export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  definitionOfDone: z.string().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  startedAt: z.string().datetime().optional(),
  endedAt: z.string().datetime().optional(),
  timeSpent: z.number().positive().optional(),
  costInProjectCurrency: z.number().positive().optional(),
  projectId: z.number().int().positive(),
})

export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title too long')
    .optional(),
  definitionOfDone: z.string().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  startedAt: z.string().datetime().optional(),
  endedAt: z.string().datetime().optional(),
  timeSpent: z.number().positive().optional(),
  costInProjectCurrency: z.number().positive().optional(),
  projectId: z.number().int().positive().optional(),
})

export const taskQuerySchema = z.object({
  search: z.string().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  projectId: z.number().int().positive().optional(),
  userId: z.number().int().positive().optional(),
  startedAfter: z.string().datetime().optional(),
  startedBefore: z.string().datetime().optional(),
  endedAfter: z.string().datetime().optional(),
  endedBefore: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'title', 'startedAt', 'endedAt'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

// Types
export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
export type TaskQuery = z.infer<typeof taskQuerySchema>

export interface TaskResponse {
  id: number
  uuid: string
  title: string
  definitionOfDone: string | null
  status: TaskStatus
  startedAt: Date | null
  endedAt: Date | null
  timeSpent: Decimal | null
  costInProjectCurrency: Decimal | null
  userId: number | null
  projectId: number
  createdAt: Date
  updatedAt: Date
  user?: {
    id: number
    name: string
    email: string
  } | null
  project?: {
    id: number
    uuid: string
    title: string
  }
}

export interface PaginatedTasksResponse {
  tasks: TaskResponse[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export class TaskError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
  ) {
    super(message)
    this.name = 'TaskError'
  }
}

// Database operations
export const taskModel = {
  async create(data: CreateTaskInput, userId: number): Promise<TaskResponse> {
    try {
      // Check if project exists and user has access
      const project = await prisma.project.findFirst({
        where: {
          id: data.projectId,
          userId,
          deletedAt: null,
        },
      })

      if (!project) {
        throw new TaskError('Project not found or access denied', 404)
      }

      // Check for duplicate task titles within the same project
      const existingTask = await prisma.task.findFirst({
        where: {
          title: data.title,
          projectId: data.projectId,
          deletedAt: null,
        },
      })

      if (existingTask) {
        throw new TaskError(
          'Task with this title already exists in the project',
          400,
        )
      }

      const task = await prisma.task.create({
        data: {
          title: data.title,
          definitionOfDone: data.definitionOfDone,
          status: data.status || TaskStatus.BACKLOG,
          startedAt: data.startedAt ? new Date(data.startedAt) : null,
          endedAt: data.endedAt ? new Date(data.endedAt) : null,
          timeSpent: data.timeSpent ? new Prisma.Decimal(data.timeSpent) : null,
          costInProjectCurrency: data.costInProjectCurrency
            ? new Prisma.Decimal(data.costInProjectCurrency)
            : null,
          projectId: data.projectId,
          userId: userId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          project: {
            select: {
              id: true,
              uuid: true,
              title: true,
            },
          },
        },
      })

      return task
    } catch (error) {
      if (error instanceof TaskError) {
        throw error
      }
      console.error('Error creating task:', error)
      throw new TaskError('Failed to create task', 500)
    }
  },

  async findMany(
    query: TaskQuery,
    userId?: number,
  ): Promise<PaginatedTasksResponse> {
    try {
      const skip = (query.page - 1) * query.limit

      const where: Prisma.TaskWhereInput = {
        deletedAt: null,
        ...(userId && { userId }),
        ...(query.projectId && { projectId: query.projectId }),
        ...(query.status && { status: query.status }),
        ...(query.startedAfter && {
          startedAt: { gte: new Date(query.startedAfter) },
        }),
        ...(query.startedBefore && {
          startedAt: { lte: new Date(query.startedBefore) },
        }),
        ...(query.endedAfter && {
          endedAt: { gte: new Date(query.endedAfter) },
        }),
        ...(query.endedBefore && {
          endedAt: { lte: new Date(query.endedBefore) },
        }),
        ...(query.search && {
          OR: [
            { title: { contains: query.search, mode: 'insensitive' } },
            {
              definitionOfDone: { contains: query.search, mode: 'insensitive' },
            },
          ],
        }),
      }

      const [tasks, total] = await Promise.all([
        prisma.task.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            project: {
              select: {
                id: true,
                uuid: true,
                title: true,
              },
            },
          },
          orderBy: { [query.sortBy]: query.sortOrder },
          skip,
          take: query.limit,
        }),
        prisma.task.count({ where }),
      ])

      return {
        tasks,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
        },
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
      throw new TaskError('Failed to fetch tasks', 500)
    }
  },

  async findById(id: number): Promise<TaskResponse | null> {
    try {
      const task = await prisma.task.findFirst({
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
          project: {
            select: {
              id: true,
              uuid: true,
              title: true,
            },
          },
        },
      })

      return task
    } catch (error) {
      console.error('Error fetching task:', error)
      throw new TaskError('Failed to fetch task', 500)
    }
  },

  async findByUuid(uuid: string): Promise<TaskResponse | null> {
    try {
      const task = await prisma.task.findFirst({
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
          project: {
            select: {
              id: true,
              uuid: true,
              title: true,
            },
          },
        },
      })

      return task
    } catch (error) {
      console.error('Error fetching task:', error)
      throw new TaskError('Failed to fetch task', 500)
    }
  },

  async update(id: number, data: UpdateTaskInput): Promise<TaskResponse> {
    try {
      // Check if task exists
      const existingTask = await prisma.task.findFirst({
        where: { id, deletedAt: null },
      })

      if (!existingTask) {
        throw new TaskError('Task not found', 404)
      }

      // Check for duplicate titles if title is being updated
      if (data.title && data.title !== existingTask.title) {
        const duplicateTask = await prisma.task.findFirst({
          where: {
            title: data.title,
            projectId: data.projectId || existingTask.projectId,
            id: { not: id },
            deletedAt: null,
          },
        })

        if (duplicateTask) {
          throw new TaskError(
            'Task with this title already exists in the project',
            400,
          )
        }
      }

      const task = await prisma.task.update({
        where: { id },
        data: {
          ...(data.title && { title: data.title }),
          ...(data.definitionOfDone !== undefined && {
            definitionOfDone: data.definitionOfDone,
          }),
          ...(data.status && { status: data.status }),
          ...(data.startedAt !== undefined && {
            startedAt: data.startedAt ? new Date(data.startedAt) : null,
          }),
          ...(data.endedAt !== undefined && {
            endedAt: data.endedAt ? new Date(data.endedAt) : null,
          }),
          ...(data.timeSpent !== undefined && {
            timeSpent: data.timeSpent
              ? new Prisma.Decimal(data.timeSpent)
              : null,
          }),
          ...(data.costInProjectCurrency !== undefined && {
            costInProjectCurrency: data.costInProjectCurrency
              ? new Prisma.Decimal(data.costInProjectCurrency)
              : null,
          }),
          ...(data.projectId && { projectId: data.projectId }),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          project: {
            select: {
              id: true,
              uuid: true,
              title: true,
            },
          },
        },
      })

      return task
    } catch (error) {
      if (error instanceof TaskError) {
        throw error
      }
      console.error('Error updating task:', error)
      throw new TaskError('Failed to update task', 500)
    }
  },

  async delete(id: number): Promise<void> {
    try {
      const existingTask = await prisma.task.findFirst({
        where: { id, deletedAt: null },
      })

      if (!existingTask) {
        throw new TaskError('Task not found', 404)
      }

      await prisma.task.update({
        where: { id },
        data: { deletedAt: new Date() },
      })
    } catch (error) {
      if (error instanceof TaskError) {
        throw error
      }
      console.error('Error deleting task:', error)
      throw new TaskError('Failed to delete task', 500)
    }
  },

  async getTaskStats(userId?: number): Promise<{
    total: number
    byStatus: Record<string, number>
    byPriority: Record<string, number>
    overdueTasks: number
    completedToday: number
  }> {
    try {
      const where: Prisma.TaskWhereInput = {
        deletedAt: null,
        ...(userId && { userId }),
      }

      const [total, statusStats, overdueTasks, completedToday] =
        await Promise.all([
          prisma.task.count({ where }),
          prisma.task.groupBy({
            by: ['status'],
            where,
            _count: { status: true },
          }),
          prisma.task.count({
            where: {
              ...where,
              endedAt: null, // Not ended yet
              status: { not: TaskStatus.DONE },
            },
          }),
          prisma.task.count({
            where: {
              ...where,
              status: TaskStatus.DONE,
              updatedAt: {
                gte: new Date(new Date().setHours(0, 0, 0, 0)),
              },
            },
          }),
        ])

      const byStatus = statusStats.reduce(
        (acc, stat) => {
          acc[stat.status] = stat._count.status
          return acc
        },
        {} as Record<string, number>,
      )

      return {
        total,
        byStatus,
        byPriority: {}, // Not available in current schema
        overdueTasks,
        completedToday,
      }
    } catch (error) {
      console.error('Error getting task statistics:', error)
      throw new TaskError('Failed to get task statistics', 500)
    }
  },
}
