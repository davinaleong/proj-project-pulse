import request from 'supertest'
import { createApp } from '../../../../src/app'
import { notesTestHelpers, prisma } from './notes.helpers'

const app = createApp()

describe('Notes CRUD Operations', () => {
  let authToken: string
  let userId: number
  let projectId: number
  let noteId: string

  beforeAll(async () => {
    await notesTestHelpers.cleanupDatabase()
    const {
      user,
      project,
      authToken: token,
    } = await notesTestHelpers.setupTestData()
    userId = user.id
    projectId = project.id
    authToken = token
  })

  afterAll(async () => {
    await notesTestHelpers.disconnectDatabase()
  })

  describe('POST /api/v1/notes', () => {
    it('should create a new note successfully', async () => {
      const noteData = {
        title: 'Test Note',
        description: 'This is a test note',
        body: 'Note body content',
        status: 'DRAFT',
        projectId: projectId,
      }

      const response = await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(noteData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.title).toBe(noteData.title)
      expect(response.body.data.description).toBe(noteData.description)
      expect(response.body.data.body).toBe(noteData.body)
      expect(response.body.data.status).toBe(noteData.status)
      expect(response.body.data.projectId).toBe(projectId)
      expect(response.body.data.userId).toBe(userId)
      expect(response.body.data.uuid).toBeDefined()

      noteId = response.body.data.uuid
    })

    it('should create a note with minimal data (only title)', async () => {
      const noteData = {
        title: 'Minimal Note',
      }

      const response = await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(noteData)
        .expect(201)

      expect(response.body.data.title).toBe(noteData.title)
      expect(response.body.data.status).toBe('DRAFT') // default status
      expect(response.body.data.description).toBeNull()
      expect(response.body.data.body).toBeNull()
      expect(response.body.data.projectId).toBeNull()
    })

    it('should return 400 for invalid note data', async () => {
      const invalidData = {
        title: '', // empty title should fail
        status: 'INVALID_STATUS',
      }

      const response = await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400)

      expect(response.body.error).toBe('Invalid note data')
      expect(response.body.details).toBeDefined()
    })

    it('should return 400 for title too long', async () => {
      const noteData = {
        title: 'a'.repeat(256), // exceeds max length
      }

      const response = await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(noteData)
        .expect(400)

      expect(response.body.error).toBe('Invalid note data')
    })

    it('should return 401 for unauthenticated request', async () => {
      const noteData = {
        title: 'Test Note',
      }

      await request(app).post('/api/v1/notes').send(noteData).expect(401)
    })

    it('should handle invalid projectId', async () => {
      const noteData = {
        title: 'Test Note',
        projectId: 99999, // non-existent project
      }

      // This should still create the note but with invalid projectId
      // The foreign key constraint will be handled by Prisma
      const response = await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(noteData)

      // Depending on your constraint handling, this might be 400 or 500
      expect([400, 500].includes(response.status)).toBe(true)
    })
  })

  describe('GET /api/v1/notes/:uuid', () => {
    it('should get specific note by UUID', async () => {
      const response = await request(app)
        .get(`/api/v1/notes/${noteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.uuid).toBe(noteId)
      expect(response.body.data.title).toBe('Test Note')
    })

    it('should return 404 for non-existent note', async () => {
      const fakeUuid = '550e8400-e29b-41d4-a716-446655440000'

      const response = await request(app)
        .get(`/api/v1/notes/${fakeUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)

      expect(response.body.error).toBe('Note not found')
    })

    it('should return 401 for unauthenticated request', async () => {
      await request(app).get(`/api/v1/notes/${noteId}`).expect(401)
    })

    it('should not allow access to other users notes', async () => {
      // Create another user and note
      const otherUser = await notesTestHelpers.createTestUser({
        name: 'Other User',
        email: 'other@example.com',
      })

      const otherNote = await notesTestHelpers.createTestNote(otherUser.id, {
        title: 'Other User Note',
      })

      const response = await request(app)
        .get(`/api/v1/notes/${otherNote.uuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)

      expect(response.body.error).toBe('Note not found')

      // Cleanup
      await notesTestHelpers.cleanupDatabase()
      const {
        user,
        project,
        authToken: token,
      } = await notesTestHelpers.setupTestData()
      userId = user.id
      projectId = project.id
      authToken = token
    })
  })

  describe('PUT /api/v1/notes/:uuid', () => {
    it('should update note successfully', async () => {
      const updateData = {
        title: 'Updated Test Note',
        description: 'Updated description',
        status: 'PUBLISHED',
      }

      const response = await request(app)
        .put(`/api/v1/notes/${noteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.title).toBe(updateData.title)
      expect(response.body.data.description).toBe(updateData.description)
      expect(response.body.data.status).toBe(updateData.status)
    })

    it('should update only provided fields', async () => {
      const partialUpdate = {
        body: 'Updated body content only',
      }

      const response = await request(app)
        .put(`/api/v1/notes/${noteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(partialUpdate)
        .expect(200)

      expect(response.body.data.body).toBe(partialUpdate.body)
      expect(response.body.data.title).toBe('Updated Test Note') // should remain unchanged
    })

    it('should return 404 for non-existent note', async () => {
      const fakeUuid = '550e8400-e29b-41d4-a716-446655440000'

      const response = await request(app)
        .put(`/api/v1/notes/${fakeUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated' })
        .expect(404)

      expect(response.body.error).toBe('Note not found')
    })

    it('should return 400 for invalid update data', async () => {
      const invalidData = {
        title: '', // empty title
        status: 'INVALID_STATUS',
      }

      const response = await request(app)
        .put(`/api/v1/notes/${noteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400)

      expect(response.body.error).toBe('Invalid note data')
    })

    it('should return 401 for unauthenticated request', async () => {
      await request(app)
        .put(`/api/v1/notes/${noteId}`)
        .send({ title: 'Updated' })
        .expect(401)
    })
  })

  describe('DELETE /api/v1/notes/:uuid', () => {
    let noteToDelete: string

    beforeAll(async () => {
      // Create a note specifically for deletion testing
      const note = await notesTestHelpers.createTestNote(userId, {
        title: 'Note to Delete',
      })
      noteToDelete = note.uuid
    })

    it('should soft delete note successfully', async () => {
      const response = await request(app)
        .delete(`/api/v1/notes/${noteToDelete}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Note deleted successfully')

      // Verify note is soft deleted
      const deletedNote = await prisma.note.findFirst({
        where: { uuid: noteToDelete },
      })
      expect(deletedNote?.deletedAt).not.toBeNull()
    })

    it('should return 404 when trying to delete already deleted note', async () => {
      const response = await request(app)
        .delete(`/api/v1/notes/${noteToDelete}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)

      expect(response.body.error).toBe('Note not found')
    })

    it('should return 404 for non-existent note', async () => {
      const fakeUuid = '550e8400-e29b-41d4-a716-446655440000'

      const response = await request(app)
        .delete(`/api/v1/notes/${fakeUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)

      expect(response.body.error).toBe('Note not found')
    })

    it('should return 401 for unauthenticated request', async () => {
      await request(app).delete(`/api/v1/notes/${noteId}`).expect(401)
    })
  })
})
