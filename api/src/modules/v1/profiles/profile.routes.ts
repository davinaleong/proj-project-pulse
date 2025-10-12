import { Router } from 'express'
import { ProfileController } from './profile.controller'

const router = Router()
const profileController = new ProfileController()

// Profile routes
router.post('/', profileController.createProfile.bind(profileController))
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
  profileController.updateProfileSettings.bind(profileController),
)
router.get('/:uuid', profileController.getProfile.bind(profileController))
router.put('/:uuid', profileController.updateProfile.bind(profileController))
router.delete('/:uuid', profileController.deleteProfile.bind(profileController))
router.get(
  '/:uuid/stats',
  profileController.getProfileStats.bind(profileController),
)

export default router
