import { Router } from 'express'
import { noteController } from './note.controller'
import { auth } from '../../../middlewares/auth'

const router = Router()

// Apply authentication to all routes
router.use(auth)

// Main note routes
router.get('/', noteController.getNotes.bind(noteController))
router.post('/', noteController.createNote.bind(noteController))
router.get('/:uuid', noteController.getNoteByUuid.bind(noteController))
router.put('/:uuid', noteController.updateNote.bind(noteController))
router.delete('/:uuid', noteController.deleteNote.bind(noteController))
router.post('/:uuid/restore', noteController.restoreNote.bind(noteController))

export default router
