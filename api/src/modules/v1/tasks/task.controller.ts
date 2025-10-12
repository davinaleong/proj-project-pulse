import { Request, Response, NextFunction } from 'express'
import { taskService } from './task.service'
import {
  createTaskSchema,
  updateTaskSchema,
  taskQuerySchema,
  TaskError,
} from './task.model'
import {
  createSuccessResponse,
  createErrorResponse,
} from '../../../utils/response'

export class TaskController {
  // Create task
  async createTask(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return createErrorResponse(
          res,
          'User not authenticated',
          undefined,
          401,
        )
      }

      const validatedData = createTaskSchema.parse(req.body)
      const task = await taskService.createTask(validatedData, userId)

      console.info('Task created', {
        taskId: task.id,
        userId,
        taskTitle: task.title,
      })

      return createSuccessResponse(res, 'Task created successfully', task, 201)
    } catch (err) {
      if (err instanceof TaskError) {
        return createErrorResponse(res, err.message, undefined, err.statusCode)
      }
      return next(err)
    }
  }

  // Get tasks with filtering
  async getTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return createErrorResponse(
          res,
          'User not authenticated',
          undefined,
          401,
        )
      }

      const queryParams = taskQuerySchema.parse(req.query)
      const tasks = await taskService.getTasks(queryParams, userId)

      return createSuccessResponse(res, 'Tasks retrieved successfully', tasks)
    } catch (err) {
      if (err instanceof TaskError) {
        return createErrorResponse(res, err.message, undefined, err.statusCode)
      }
      return next(err)
    }
  }

  // Get task by ID
  async getTaskById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return createErrorResponse(
          res,
          'User not authenticated',
          undefined,
          401,
        )
      }

      const taskId = parseInt(req.params.id)
      if (isNaN(taskId)) {
        return createErrorResponse(res, 'Invalid task ID', undefined, 400)
      }

      const task = await taskService.getTaskById(taskId, userId)

      return createSuccessResponse(res, 'Task retrieved successfully', task)
    } catch (err) {
      if (err instanceof TaskError) {
        return createErrorResponse(res, err.message, undefined, err.statusCode)
      }
      return next(err)
    }
  }

  // Get task by UUID
  async getTaskByUuid(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return createErrorResponse(
          res,
          'User not authenticated',
          undefined,
          401,
        )
      }

      const { uuid } = req.params
      if (!uuid) {
        return createErrorResponse(res, 'UUID is required', undefined, 400)
      }

      const task = await taskService.getTaskByUuid(uuid, userId)

      return createSuccessResponse(res, 'Task retrieved successfully', task)
    } catch (err) {
      if (err instanceof TaskError) {
        return createErrorResponse(res, err.message, undefined, err.statusCode)
      }
      return next(err)
    }
  }

  // Update task
  async updateTask(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return createErrorResponse(
          res,
          'User not authenticated',
          undefined,
          401,
        )
      }

      const taskId = parseInt(req.params.id)
      if (isNaN(taskId)) {
        return createErrorResponse(res, 'Invalid task ID', undefined, 400)
      }

      const validatedData = updateTaskSchema.parse(req.body)
      const task = await taskService.updateTask(taskId, validatedData, userId)

      console.info('Task updated', {
        taskId,
        userId,
        taskTitle: task.title,
      })

      return createSuccessResponse(res, 'Task updated successfully', task)
    } catch (err) {
      if (err instanceof TaskError) {
        return createErrorResponse(res, err.message, undefined, err.statusCode)
      }
      return next(err)
    }
  }

  // Delete task
  async deleteTask(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return createErrorResponse(
          res,
          'User not authenticated',
          undefined,
          401,
        )
      }

      const taskId = parseInt(req.params.id)
      if (isNaN(taskId)) {
        return createErrorResponse(res, 'Invalid task ID', undefined, 400)
      }

      await taskService.deleteTask(taskId, userId)

      console.info('Task deleted', { taskId, userId })

      return createSuccessResponse(res, 'Task deleted successfully', null)
    } catch (err) {
      if (err instanceof TaskError) {
        return createErrorResponse(res, err.message, undefined, err.statusCode)
      }
      return next(err)
    }
  }

  // Get project tasks
  async getProjectTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return createErrorResponse(
          res,
          'User not authenticated',
          undefined,
          401,
        )
      }

      const projectId = parseInt(req.params.projectId)
      if (isNaN(projectId)) {
        return createErrorResponse(res, 'Invalid project ID', undefined, 400)
      }

      const queryParams = taskQuerySchema.parse(req.query)
      const tasks = await taskService.getProjectTasks(
        projectId,
        queryParams,
        userId,
      )

      return createSuccessResponse(
        res,
        'Project tasks retrieved successfully',
        tasks,
      )
    } catch (err) {
      if (err instanceof TaskError) {
        return createErrorResponse(res, err.message, undefined, err.statusCode)
      }
      return next(err)
    }
  }

  // Get user tasks
  async getUserTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const requestingUserId = req.user?.id
      if (!requestingUserId) {
        return createErrorResponse(
          res,
          'User not authenticated',
          undefined,
          401,
        )
      }

      const userId = parseInt(req.params.userId)
      if (isNaN(userId)) {
        return createErrorResponse(res, 'Invalid user ID', undefined, 400)
      }

      const queryParams = taskQuerySchema.parse(req.query)
      const tasks = await taskService.getUserTasks(
        userId,
        queryParams,
        requestingUserId,
      )

      return createSuccessResponse(
        res,
        'User tasks retrieved successfully',
        tasks,
      )
    } catch (err) {
      if (err instanceof TaskError) {
        return createErrorResponse(res, err.message, undefined, err.statusCode)
      }
      return next(err)
    }
  }

  // Get task statistics
  async getTaskStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return createErrorResponse(
          res,
          'User not authenticated',
          undefined,
          401,
        )
      }

      const stats = await taskService.getTaskStats(userId)

      return createSuccessResponse(
        res,
        'Task statistics retrieved successfully',
        stats,
      )
    } catch (err) {
      if (err instanceof TaskError) {
        return createErrorResponse(res, err.message, undefined, err.statusCode)
      }
      return next(err)
    }
  }

  // Get user task statistics
  async getUserTaskStats(req: Request, res: Response, next: NextFunction) {
    try {
      const requestingUserId = req.user?.id
      if (!requestingUserId) {
        return createErrorResponse(
          res,
          'User not authenticated',
          undefined,
          401,
        )
      }

      const userId = parseInt(req.params.userId)
      if (isNaN(userId)) {
        return createErrorResponse(res, 'Invalid user ID', undefined, 400)
      }

      const stats = await taskService.getUserTaskStats(userId, requestingUserId)

      return createSuccessResponse(
        res,
        'User task statistics retrieved successfully',
        stats,
      )
    } catch (err) {
      if (err instanceof TaskError) {
        return createErrorResponse(res, err.message, undefined, err.statusCode)
      }
      return next(err)
    }
  }
}

export const taskController = new TaskController()
