import { Router } from 'express'
import { profileController } from './profile.controller'
import { authenticate } from '../../../middlewares/auth'
import { activityLogger } from '../../../middlewares/activityLogger'

const router = Router()

// Apply authentication to all profile routes
router.use(authenticate)

// Profile CRUD routes
router.post(
  '/',
  activityLogger,
  profileController.createProfile.bind(profileController),
)
router.get('/me', profileController.getMyProfile.bind(profileController))
router.get(
  '/public',
  profileController.getPublicProfiles.bind(profileController),
)
router.get(
  '/settings',
  profileController.getProfileSettings.bind(profileController),
)
router.put(
  '/settings',
  activityLogger,
  profileController.updateProfileSettings.bind(profileController),
)
router.get('/:uuid', profileController.getProfile.bind(profileController))
router.put(
  '/:uuid',
  activityLogger,
  profileController.updateProfile.bind(profileController),
)
router.delete(
  '/:uuid',
  activityLogger,
  profileController.deleteProfile.bind(profileController),
)
router.get(
  '/:uuid/stats',
  profileController.getProfileStats.bind(profileController),
)

export default router
