import { Router } from 'express'
import { UserController } from './user.controller'
import { auth } from '../../../middlewares/auth'
import { adminOnly, managerOrAdmin } from '../../../middlewares/auth'

const router = Router()
const userController = new UserController()

// Public routes (no authentication required)
router.post('/login', userController.login)
router.post('/register', userController.createUser)
router.post('/forgot-password', userController.requestPasswordReset)
router.post('/reset-password', userController.resetPassword)
router.patch('/verify-email/:uuid', userController.verifyEmail)

// Protected routes (authentication required)
router.use(auth) // Apply auth middleware to all routes below

// Current user routes
router.get('/me', userController.getCurrentUser)
router.patch('/me/password', userController.changePassword)

// Admin/Manager routes
router.get('/', managerOrAdmin, userController.getUsers)
router.get('/:uuid', managerOrAdmin, userController.getUserByUuid)
router.patch('/:uuid', managerOrAdmin, userController.updateUser)
router.delete('/:uuid', adminOnly, userController.deleteUser)
router.get('/:uuid/permissions', managerOrAdmin, userController.checkPermission)

export { router as userRoutes }
