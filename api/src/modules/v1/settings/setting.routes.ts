import { Router } from 'express'
import { settingController } from './setting.controller'
import { auth } from '../../../middlewares/auth'

const router = Router()

// Apply authentication middleware to all routes
router.use(auth)

// Public user routes (accessible by authenticated users for their own settings)
router.get('/my', settingController.getMySettings.bind(settingController))
router.post('/', settingController.createSetting.bind(settingController))
router.get('/', settingController.getSettings.bind(settingController))
router.get('/:id', settingController.getSettingById.bind(settingController))
router.put('/:id', settingController.updateSetting.bind(settingController))
router.delete('/:id', settingController.deleteSetting.bind(settingController))

// Admin routes (require admin privileges)
router.get(
  '/users/:userId',
  settingController.getUserSettings.bind(settingController),
)
router.get(
  '/system/settings',
  settingController.getSystemSettings.bind(settingController),
)
router.get(
  '/admin/stats',
  settingController.getSettingsStats.bind(settingController),
)

export default router
