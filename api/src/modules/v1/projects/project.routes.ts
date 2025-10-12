import { Router } from 'express'
import { projectController } from './project.controller'
import { auth } from '../../../middlewares/auth'

const router = Router()

// Apply authentication to all routes
router.use(auth)

// Project CRUD routes
router.post('/', projectController.createProject.bind(projectController))
router.get('/', projectController.getProjects.bind(projectController))
router.get('/stats', projectController.getProjectStats.bind(projectController))
router.get('/:id', projectController.getProjectById.bind(projectController))
router.get(
  '/uuid/:uuid',
  projectController.getProjectByUuid.bind(projectController),
)
router.put('/:id', projectController.updateProject.bind(projectController))
router.delete('/:id', projectController.deleteProject.bind(projectController))

// User-specific project routes
router.get(
  '/user/:userId',
  projectController.getUserProjects.bind(projectController),
)
router.get(
  '/user/:userId/stats',
  projectController.getUserProjectStats.bind(projectController),
)

export default router
