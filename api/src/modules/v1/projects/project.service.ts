import {
  projectModel,
  CreateProjectInput,
  UpdateProjectInput,
  ProjectQuery,
  ProjectError,
  ProjectResponse,
  PaginatedProjectsResponse,
} from './project.model'
import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

export class ProjectService {
  // Create project
  async createProject(
    data: CreateProjectInput,
    requestingUserId: number,
  ): Promise<ProjectResponse> {
    // Users can only create projects for themselves
    return await projectModel.create(data, requestingUserId)
  }

  // Get projects with filtering and pagination
  async getProjects(
    query: ProjectQuery,
    requestingUserId: number,
  ): Promise<PaginatedProjectsResponse> {
    // Apply user restrictions - users can only see their own projects unless admin
    const isAdmin = await this.isAdmin(requestingUserId)
    const userId = isAdmin ? query.userId : requestingUserId

    return await projectModel.findMany(query, userId)
  }

  // Get project by ID
  async getProjectById(
    id: number,
    requestingUserId: number,
  ): Promise<ProjectResponse> {
    const project = await projectModel.findById(id)
    if (!project) {
      throw new ProjectError('Project not found', 404)
    }

    // Check access permissions
    if (!(await this.canAccessProject(project, requestingUserId))) {
      throw new ProjectError('Access denied', 403)
    }

    return project
  }

  // Get project by UUID
  async getProjectByUuid(
    uuid: string,
    requestingUserId: number,
  ): Promise<ProjectResponse> {
    const project = await projectModel.findByUuid(uuid)
    if (!project) {
      throw new ProjectError('Project not found', 404)
    }

    // Check access permissions
    if (!(await this.canAccessProject(project, requestingUserId))) {
      throw new ProjectError('Access denied', 403)
    }

    return project
  }

  // Update project
  async updateProject(
    id: number,
    data: UpdateProjectInput,
    requestingUserId: number,
  ): Promise<ProjectResponse> {
    const project = await projectModel.findById(id)
    if (!project) {
      throw new ProjectError('Project not found', 404)
    }

    // Check permissions
    if (!(await this.canModifyProject(project, requestingUserId))) {
      throw new ProjectError(
        'Insufficient permissions to modify this project',
        403,
      )
    }

    return await projectModel.update(id, data)
  }

  // Delete project
  async deleteProject(id: number, requestingUserId: number): Promise<void> {
    const project = await projectModel.findById(id)
    if (!project) {
      throw new ProjectError('Project not found', 404)
    }

    // Check permissions
    if (!(await this.canModifyProject(project, requestingUserId))) {
      throw new ProjectError(
        'Insufficient permissions to delete this project',
        403,
      )
    }

    await projectModel.delete(id)
  }

  // Get user projects
  async getUserProjects(
    userId: number,
    query: ProjectQuery,
    requestingUserId: number,
  ): Promise<PaginatedProjectsResponse> {
    // Users can only access their own projects unless they're admin
    if (
      userId !== requestingUserId &&
      !(await this.isAdmin(requestingUserId))
    ) {
      throw new ProjectError('Access denied', 403)
    }

    return await projectModel.findMany(query, userId)
  }

  // Get project statistics
  async getProjectStats(requestingUserId: number): Promise<{
    total: number
    byStage: Record<string, number>
    totalTasks: number
    totalNotes: number
  }> {
    if (!(await this.isAdmin(requestingUserId))) {
      throw new ProjectError('Access denied', 403)
    }

    return await projectModel.getProjectStats()
  }

  // Get user project statistics
  async getUserProjectStats(
    userId: number,
    requestingUserId: number,
  ): Promise<{
    total: number
    byStage: Record<string, number>
    totalTasks: number
    totalNotes: number
  }> {
    // Users can only get their own stats unless they're admin
    if (
      userId !== requestingUserId &&
      !(await this.isAdmin(requestingUserId))
    ) {
      throw new ProjectError('Access denied', 403)
    }

    return await projectModel.getProjectStats(userId)
  }

  // Permission helper methods
  private async canAccessProject(
    project: ProjectResponse,
    requestingUserId: number,
  ): Promise<boolean> {
    // Project owner can access
    if (project.userId === requestingUserId) {
      return true
    }

    // Admins can access all projects
    return await this.isAdmin(requestingUserId)
  }

  private async canModifyProject(
    project: ProjectResponse,
    requestingUserId: number,
  ): Promise<boolean> {
    // Project owner can modify
    if (project.userId === requestingUserId) {
      return true
    }

    // Admins can modify all projects
    return await this.isAdmin(requestingUserId)
  }

  private async isAdmin(userId: number): Promise<boolean> {
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
}

export const projectService = new ProjectService()
