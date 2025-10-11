import { Router } from 'express'
import { NoteController } from './note.controller'

const router = Router()
const noteController = new NoteController()

// Main note routes
router.get('/', noteController.getNotes.bind(noteController))
router.post('/', noteController.createNote.bind(noteController))
router.get('/:uuid', noteController.getNoteByUuid.bind(noteController))
router.put('/:uuid', noteController.updateNote.bind(noteController))
router.delete('/:uuid', noteController.deleteNote.bind(noteController))
router.post('/:uuid/restore', noteController.restoreNote.bind(noteController))

export default router
