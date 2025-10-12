import { Router } from 'express'
import { taskController } from './task.controller'
import { auth } from '../../../middlewares/auth'

const router = Router()

// Apply authentication to all routes
router.use(auth)

// Task CRUD routes
router.post('/', taskController.createTask.bind(taskController))
router.get('/', taskController.getTasks.bind(taskController))
router.get('/stats', taskController.getTaskStats.bind(taskController))
router.get('/:id', taskController.getTaskById.bind(taskController))
router.get('/uuid/:uuid', taskController.getTaskByUuid.bind(taskController))
router.put('/:id', taskController.updateTask.bind(taskController))
router.delete('/:id', taskController.deleteTask.bind(taskController))

// Project-specific task routes
router.get(
  '/project/:projectId',
  taskController.getProjectTasks.bind(taskController),
)

// User-specific task routes
router.get('/user/:userId', taskController.getUserTasks.bind(taskController))
router.get(
  '/user/:userId/stats',
  taskController.getUserTaskStats.bind(taskController),
)

export default router
