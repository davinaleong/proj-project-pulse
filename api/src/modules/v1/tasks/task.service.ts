import {
  taskModel,
  CreateTaskInput,
  UpdateTaskInput,
  TaskQuery,
  TaskError,
  TaskResponse,
  PaginatedTasksResponse,
} from './task.model'
import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

export class TaskService {
  // Create task
  async createTask(
    data: CreateTaskInput,
    requestingUserId: number,
  ): Promise<TaskResponse> {
    // Check if user has access to the project
    const project = await prisma.project.findFirst({
      where: {
        id: data.projectId,
        OR: [
          { userId: requestingUserId },
          // Admins can create tasks in any project
          ...((await this.isAdmin(requestingUserId)) ? [{}] : []),
        ],
      },
    })

    if (!project) {
      throw new TaskError('Project not found or access denied', 404)
    }

    return await taskModel.create(data, requestingUserId)
  }

  // Get tasks with filtering and pagination
  async getTasks(
    query: TaskQuery,
    requestingUserId: number,
  ): Promise<PaginatedTasksResponse> {
    // Apply user restrictions - users can only see their own tasks unless admin
    const isAdmin = await this.isAdmin(requestingUserId)
    const userId = isAdmin ? query.userId : requestingUserId

    return await taskModel.findMany(query, userId)
  }

  // Get task by ID
  async getTaskById(
    id: number,
    requestingUserId: number,
  ): Promise<TaskResponse> {
    const task = await taskModel.findById(id)
    if (!task) {
      throw new TaskError('Task not found', 404)
    }

    // Check access permissions
    if (!(await this.canAccessTask(task, requestingUserId))) {
      throw new TaskError('Access denied', 403)
    }

    return task
  }

  // Get task by UUID
  async getTaskByUuid(
    uuid: string,
    requestingUserId: number,
  ): Promise<TaskResponse> {
    const task = await taskModel.findByUuid(uuid)
    if (!task) {
      throw new TaskError('Task not found', 404)
    }

    // Check access permissions
    if (!(await this.canAccessTask(task, requestingUserId))) {
      throw new TaskError('Access denied', 403)
    }

    return task
  }

  // Update task
  async updateTask(
    id: number,
    data: UpdateTaskInput,
    requestingUserId: number,
  ): Promise<TaskResponse> {
    const task = await taskModel.findById(id)
    if (!task) {
      throw new TaskError('Task not found', 404)
    }

    // Check permissions
    if (!(await this.canModifyTask(task, requestingUserId))) {
      throw new TaskError('Insufficient permissions to modify this task', 403)
    }

    return await taskModel.update(id, data)
  }

  // Delete task
  async deleteTask(id: number, requestingUserId: number): Promise<void> {
    const task = await taskModel.findById(id)
    if (!task) {
      throw new TaskError('Task not found', 404)
    }

    // Check permissions
    if (!(await this.canModifyTask(task, requestingUserId))) {
      throw new TaskError('Insufficient permissions to delete this task', 403)
    }

    await taskModel.delete(id)
  }

  // Get project tasks
  async getProjectTasks(
    projectId: number,
    query: TaskQuery,
    requestingUserId: number,
  ): Promise<PaginatedTasksResponse> {
    // Check if user has access to the project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { userId: requestingUserId },
          // Admins can access any project
          ...((await this.isAdmin(requestingUserId)) ? [{}] : []),
        ],
      },
    })

    if (!project) {
      throw new TaskError('Project not found or access denied', 404)
    }

    return await taskModel.findMany({ ...query, projectId }, requestingUserId)
  }

  // Get user tasks
  async getUserTasks(
    userId: number,
    query: TaskQuery,
    requestingUserId: number,
  ): Promise<PaginatedTasksResponse> {
    // Users can only access their own tasks unless they're admin
    if (
      userId !== requestingUserId &&
      !(await this.isAdmin(requestingUserId))
    ) {
      throw new TaskError('Access denied', 403)
    }

    return await taskModel.findMany(query, userId)
  }

  // Get task statistics
  async getTaskStats(requestingUserId: number): Promise<{
    total: number
    byStatus: Record<string, number>
    byPriority: Record<string, number>
    overdueTasks: number
    completedToday: number
  }> {
    if (!(await this.isAdmin(requestingUserId))) {
      throw new TaskError('Access denied', 403)
    }

    return await taskModel.getTaskStats()
  }

  // Get user task statistics
  async getUserTaskStats(
    userId: number,
    requestingUserId: number,
  ): Promise<{
    total: number
    byStatus: Record<string, number>
    byPriority: Record<string, number>
    overdueTasks: number
    completedToday: number
  }> {
    // Users can only get their own stats unless they're admin
    if (
      userId !== requestingUserId &&
      !(await this.isAdmin(requestingUserId))
    ) {
      throw new TaskError('Access denied', 403)
    }

    return await taskModel.getTaskStats(userId)
  }

  // Permission helper methods
  private async canAccessTask(
    task: TaskResponse,
    requestingUserId: number,
  ): Promise<boolean> {
    // Task owner can access
    if (task.userId === requestingUserId) {
      return true
    }

    // Project owner can access tasks in their project
    if (task.project) {
      const project = await prisma.project.findFirst({
        where: { id: task.projectId, userId: requestingUserId },
      })
      if (project) {
        return true
      }
    }

    // Admins can access all tasks
    return await this.isAdmin(requestingUserId)
  }

  private async canModifyTask(
    task: TaskResponse,
    requestingUserId: number,
  ): Promise<boolean> {
    // Task owner can modify
    if (task.userId === requestingUserId) {
      return true
    }

    // Project owner can modify tasks in their project
    const project = await prisma.project.findFirst({
      where: { id: task.projectId, userId: requestingUserId },
    })
    if (project) {
      return true
    }

    // Admins can modify all tasks
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

export const taskService = new TaskService()
