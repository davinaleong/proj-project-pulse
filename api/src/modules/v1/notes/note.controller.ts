import { Request, Response, NextFunction } from 'express'
import { NoteService } from './note.service'
import {
  createNoteSchema,
  updateNoteSchema,
  noteQuerySchema,
} from './note.model'
import { ZodError } from 'zod'
import {
  createSuccessResponse,
  createErrorResponse,
} from '../../../utils/response'

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
        return createErrorResponse(
          res,
          'User not authenticated',
          undefined,
          401,
        )
      }

      const query = noteQuerySchema.parse(req.query)
      const result = await this.noteService.getNotes(userId, query)

      return createSuccessResponse(res, 'Notes retrieved successfully', {
        notes: result.data,
        pagination: result.pagination,
      })
    } catch (error) {
      if (error instanceof ZodError) {
        return createErrorResponse(
          res,
          'Invalid query parameters',
          error.issues,
          400,
        )
      }
      next(error)
    }
  }

  // GET /notes/:uuid - Get single note by UUID
  async getNoteByUuid(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return createErrorResponse(
          res,
          'User not authenticated',
          undefined,
          401,
        )
      }

      const { uuid } = req.params
      const note = await this.noteService.getNoteByUuid(uuid, userId)

      if (!note) {
        return createErrorResponse(res, 'Note not found', undefined, 404)
      }

      return createSuccessResponse(res, 'Note retrieved successfully', note)
    } catch (error) {
      next(error)
    }
  }

  // POST /notes - Create new note
  async createNote(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return createErrorResponse(
          res,
          'User not authenticated',
          undefined,
          401,
        )
      }

      const data = createNoteSchema.parse(req.body)
      const note = await this.noteService.createNote(userId, data)

      return createSuccessResponse(res, 'Note created successfully', note, 201)
    } catch (error) {
      if (error instanceof ZodError) {
        return createErrorResponse(res, 'Invalid note data', error.issues, 400)
      }
      next(error)
    }
  }

  // PUT /notes/:uuid - Update note
  async updateNote(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return createErrorResponse(
          res,
          'User not authenticated',
          undefined,
          401,
        )
      }

      const { uuid } = req.params
      const data = updateNoteSchema.parse(req.body)

      const note = await this.noteService.updateNote(uuid, userId, data)

      if (!note) {
        return createErrorResponse(res, 'Note not found', undefined, 404)
      }

      return createSuccessResponse(res, 'Note updated successfully', note)
    } catch (error) {
      if (error instanceof ZodError) {
        return createErrorResponse(res, 'Invalid note data', error.issues, 400)
      }
      next(error)
    }
  }

  // DELETE /notes/:uuid - Soft delete note
  async deleteNote(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return createErrorResponse(
          res,
          'User not authenticated',
          undefined,
          401,
        )
      }

      const { uuid } = req.params
      const deleted = await this.noteService.deleteNote(uuid, userId)

      if (!deleted) {
        return createErrorResponse(res, 'Note not found', undefined, 404)
      }

      return createSuccessResponse(res, 'Note deleted successfully')
    } catch (error) {
      next(error)
    }
  }

  // POST /notes/:uuid/restore - Restore soft-deleted note
  async restoreNote(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return createErrorResponse(
          res,
          'User not authenticated',
          undefined,
          401,
        )
      }

      const { uuid } = req.params
      const note = await this.noteService.restoreNote(uuid, userId)

      if (!note) {
        return createErrorResponse(
          res,
          'Note not found or not deleted',
          undefined,
          404,
        )
      }

      return createSuccessResponse(res, 'Note restored successfully', note)
    } catch (error) {
      next(error)
    }
  }

  // GET /projects/:projectId/notes - Get notes by project
  async getNotesByProject(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id
      if (!userId) {
        return createErrorResponse(
          res,
          'User not authenticated',
          undefined,
          401,
        )
      }

      const { projectId } = req.params
      const projectIdInt = parseInt(projectId, 10)

      if (isNaN(projectIdInt)) {
        return createErrorResponse(res, 'Invalid project ID', undefined, 400)
      }

      const notes = await this.noteService.getNotesByProject(
        projectIdInt,
        userId,
      )

      return createSuccessResponse(res, 'Notes retrieved successfully', notes)
    } catch (error) {
      next(error)
    }
  }
}

export const noteController = new NoteController()
