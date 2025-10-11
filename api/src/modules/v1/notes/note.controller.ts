import { Request, Response, NextFunction } from 'express'
import { NoteService } from './note.service'
import {
  createNoteSchema,
  updateNoteSchema,
  noteQuerySchema,
} from './note.model'
import { ZodError } from 'zod'

export class NoteController {
  private noteService: NoteService

  constructor() {
    this.noteService = new NoteService()
  }

  // GET /notes - Get all notes for authenticated user
  async getNotes(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' })
      }

      const query = noteQuerySchema.parse(req.query)
      const result = await this.noteService.getNotes(userId, query)

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      })
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: error.issues,
        })
      }
      next(error)
    }
  }

  // GET /notes/:uuid - Get single note by UUID
  async getNoteByUuid(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' })
      }

      const { uuid } = req.params
      const note = await this.noteService.getNoteByUuid(uuid, userId)

      if (!note) {
        return res.status(404).json({ error: 'Note not found' })
      }

      res.json({
        success: true,
        data: note,
      })
    } catch (error) {
      next(error)
    }
  }

  // POST /notes - Create new note
  async createNote(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' })
      }

      const data = createNoteSchema.parse(req.body)
      const note = await this.noteService.createNote(userId, data)

      res.status(201).json({
        success: true,
        data: note,
        message: 'Note created successfully',
      })
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Invalid note data',
          details: error.issues,
        })
      }
      next(error)
    }
  }

  // PUT /notes/:uuid - Update note
  async updateNote(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' })
      }

      const { uuid } = req.params
      const data = updateNoteSchema.parse(req.body)

      const note = await this.noteService.updateNote(uuid, userId, data)

      if (!note) {
        return res.status(404).json({ error: 'Note not found' })
      }

      res.json({
        success: true,
        data: note,
        message: 'Note updated successfully',
      })
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Invalid note data',
          details: error.issues,
        })
      }
      next(error)
    }
  }

  // DELETE /notes/:uuid - Soft delete note
  async deleteNote(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' })
      }

      const { uuid } = req.params
      const deleted = await this.noteService.deleteNote(uuid, userId)

      if (!deleted) {
        return res.status(404).json({ error: 'Note not found' })
      }

      res.json({
        success: true,
        message: 'Note deleted successfully',
      })
    } catch (error) {
      next(error)
    }
  }

  // POST /notes/:uuid/restore - Restore soft-deleted note
  async restoreNote(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' })
      }

      const { uuid } = req.params
      const note = await this.noteService.restoreNote(uuid, userId)

      if (!note) {
        return res.status(404).json({ error: 'Note not found or not deleted' })
      }

      res.json({
        success: true,
        data: note,
        message: 'Note restored successfully',
      })
    } catch (error) {
      next(error)
    }
  }

  // GET /projects/:projectId/notes - Get notes by project
  async getNotesByProject(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' })
      }

      const { projectId } = req.params
      const projectIdInt = parseInt(projectId, 10)

      if (isNaN(projectIdInt)) {
        return res.status(400).json({ error: 'Invalid project ID' })
      }

      const notes = await this.noteService.getNotesByProject(
        projectIdInt,
        userId,
      )

      res.json({
        success: true,
        data: notes,
      })
    } catch (error) {
      next(error)
    }
  }
}
