import { Request, Response, NextFunction } from 'express'
import { projectService } from './project.service'
import {
  createProjectSchema,
  updateProjectSchema,
  projectQuerySchema,
  ProjectError,
} from './project.model'
import {
  createSuccessResponse,
  createErrorResponse,
} from '../../../utils/response'

export class ProjectController {
  // Create project
  async createProject(req: Request, res: Response, next: NextFunction) {
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

      const validatedData = createProjectSchema.parse(req.body)
      const project = await projectService.createProject(validatedData, userId)

      console.info('Project created', {
        projectId: project.id,
        userId,
        projectTitle: project.title,
      })

      return createSuccessResponse(
        res,
        'Project created successfully',
        project,
        201,
      )
    } catch (err) {
      if (err instanceof ProjectError) {
        return createErrorResponse(res, err.message, undefined, err.statusCode)
      }
      return next(err)
    }
  }

  // Get projects with filtering
  async getProjects(req: Request, res: Response, next: NextFunction) {
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

      const queryParams = projectQuerySchema.parse(req.query)
      const projects = await projectService.getProjects(queryParams, userId)

      return createSuccessResponse(
        res,
        'Projects retrieved successfully',
        projects,
      )
    } catch (err) {
      if (err instanceof ProjectError) {
        return createErrorResponse(res, err.message, undefined, err.statusCode)
      }
      return next(err)
    }
  }

  // Get project by ID
  async getProjectById(req: Request, res: Response, next: NextFunction) {
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

      const projectId = parseInt(req.params.id)
      if (isNaN(projectId)) {
        return createErrorResponse(res, 'Invalid project ID', undefined, 400)
      }

      const project = await projectService.getProjectById(projectId, userId)

      return createSuccessResponse(
        res,
        'Project retrieved successfully',
        project,
      )
    } catch (err) {
      if (err instanceof ProjectError) {
        return createErrorResponse(res, err.message, undefined, err.statusCode)
      }
      return next(err)
    }
  }

  // Get project by UUID
  async getProjectByUuid(req: Request, res: Response, next: NextFunction) {
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

      const project = await projectService.getProjectByUuid(uuid, userId)

      return createSuccessResponse(
        res,
        'Project retrieved successfully',
        project,
      )
    } catch (err) {
      if (err instanceof ProjectError) {
        return createErrorResponse(res, err.message, undefined, err.statusCode)
      }
      return next(err)
    }
  }

  // Update project
  async updateProject(req: Request, res: Response, next: NextFunction) {
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

      const projectId = parseInt(req.params.id)
      if (isNaN(projectId)) {
        return createErrorResponse(res, 'Invalid project ID', undefined, 400)
      }

      const validatedData = updateProjectSchema.parse(req.body)
      const project = await projectService.updateProject(
        projectId,
        validatedData,
        userId,
      )

      console.info('Project updated', {
        projectId,
        userId,
        projectTitle: project.title,
      })

      return createSuccessResponse(res, 'Project updated successfully', project)
    } catch (err) {
      if (err instanceof ProjectError) {
        return createErrorResponse(res, err.message, undefined, err.statusCode)
      }
      return next(err)
    }
  }

  // Delete project
  async deleteProject(req: Request, res: Response, next: NextFunction) {
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

      const projectId = parseInt(req.params.id)
      if (isNaN(projectId)) {
        return createErrorResponse(res, 'Invalid project ID', undefined, 400)
      }

      await projectService.deleteProject(projectId, userId)

      console.info('Project deleted', { projectId, userId })

      return createSuccessResponse(res, 'Project deleted successfully', null)
    } catch (err) {
      if (err instanceof ProjectError) {
        return createErrorResponse(res, err.message, undefined, err.statusCode)
      }
      return next(err)
    }
  }

  // Get user projects
  async getUserProjects(req: Request, res: Response, next: NextFunction) {
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

      const queryParams = projectQuerySchema.parse(req.query)
      const projects = await projectService.getUserProjects(
        userId,
        queryParams,
        requestingUserId,
      )

      return createSuccessResponse(
        res,
        'User projects retrieved successfully',
        projects,
      )
    } catch (err) {
      if (err instanceof ProjectError) {
        return createErrorResponse(res, err.message, undefined, err.statusCode)
      }
      return next(err)
    }
  }

  // Get project statistics
  async getProjectStats(req: Request, res: Response, next: NextFunction) {
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

      const stats = await projectService.getProjectStats(userId)

      return createSuccessResponse(
        res,
        'Project statistics retrieved successfully',
        stats,
      )
    } catch (err) {
      if (err instanceof ProjectError) {
        return createErrorResponse(res, err.message, undefined, err.statusCode)
      }
      return next(err)
    }
  }

  // Get user project statistics
  async getUserProjectStats(req: Request, res: Response, next: NextFunction) {
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

      const stats = await projectService.getUserProjectStats(
        userId,
        requestingUserId,
      )

      return createSuccessResponse(
        res,
        'User project statistics retrieved successfully',
        stats,
      )
    } catch (err) {
      if (err instanceof ProjectError) {
        return createErrorResponse(res, err.message, undefined, err.statusCode)
      }
      return next(err)
    }
  }
}

export const projectController = new ProjectController()
