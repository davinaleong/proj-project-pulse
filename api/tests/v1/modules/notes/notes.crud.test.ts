import request from 'supertest'
import { createApp } from '../../../../src/app'
import { notesTestHelpers } from './notes.helpers'

const app = createApp()

describe('Notes CRUD Operations', () => {
  beforeAll(async () => {
    await notesTestHelpers.cleanupDatabase()
  })

  afterAll(async () => {
    await notesTestHelpers.disconnectDatabase()
  })

  describe('POST /api/v1/notes', () => {
    let localUserId: number
    let localProjectId: number
    let localAuthToken: string

    beforeEach(async () => {
      await notesTestHelpers.cleanupDatabase()
      const {
        user,
        project,
        authToken: token,
      } = await notesTestHelpers.setupTestData()
      localUserId = user.id
      localProjectId = project.id
      localAuthToken = token
    })

    it('should create a new note successfully', async () => {
      const noteData = {
        title: 'Test Note',
        description: 'Test Description',
        body: 'Test Body Content',
        status: 'DRAFT',
      }

      const response = await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${localAuthToken}`)
        .send(noteData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.title).toBe(noteData.title)
      expect(response.body.data.description).toBe(noteData.description)
      expect(response.body.data.body).toBe(noteData.body)
      expect(response.body.data.status).toBe(noteData.status)
      expect(response.body.data.uuid).toBeDefined()
    })

    it('should create note without optional fields', async () => {
      const noteData = {
        title: 'Minimal Note',
      }

      const response = await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${localAuthToken}`)
        .send(noteData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.title).toBe(noteData.title)
      expect(response.body.data.description).toBeNull()
      expect(response.body.data.body).toBeNull()
      expect(response.body.data.status).toBe('DRAFT') // Default status
    })

    it('should return 400 when title is missing', async () => {
      const noteData = {
        description: 'Description without title',
      }

      await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${localAuthToken}`)
        .send(noteData)
        .expect(400)
    })

    it('should return 401 without authentication', async () => {
      const noteData = {
        title: 'Test Note',
      }

      await request(app).post('/api/v1/notes').send(noteData).expect(401)
    })

    it('should create note with project association', async () => {
      const noteData = {
        title: 'Project Note',
        projectId: localProjectId,
      }

      const response = await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${localAuthToken}`)
        .send(noteData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.projectId).toBe(localProjectId)
    })
  })

  describe('GET /api/v1/notes/:uuid', () => {
    let localUserId: number
    let localAuthToken: string
    let noteId: string

    beforeEach(async () => {
      await notesTestHelpers.cleanupDatabase()
      const {
        user,
        authToken: token,
      } = await notesTestHelpers.setupTestData()
      localUserId = user.id
      localAuthToken = token

      // Create a note for testing
      const note = await notesTestHelpers.createTestNote(localUserId, {
        title: 'Test Note for Reading',
      })
      noteId = note.uuid
    })

    it('should get specific note by UUID', async () => {
      const response = await request(app)
        .get(`/api/v1/notes/${noteId}`)
        .set('Authorization', `Bearer ${localAuthToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.uuid).toBe(noteId)
    })

    it('should return 404 for non-existent note', async () => {
      await request(app)
        .get('/api/v1/notes/non-existent-uuid')
        .set('Authorization', `Bearer ${localAuthToken}`)
        .expect(404)
    })

    it('should return 401 without authentication', async () => {
      await request(app).get(`/api/v1/notes/${noteId}`).expect(401)
    })
  })

  describe('PUT /api/v1/notes/:uuid', () => {
    let localUserId: number
    let localAuthToken: string
    let noteId: string

    beforeEach(async () => {
      await notesTestHelpers.cleanupDatabase()
      const {
        user,
        authToken: token,
      } = await notesTestHelpers.setupTestData()
      localUserId = user.id
      localAuthToken = token

      // Create a note for testing
      const note = await notesTestHelpers.createTestNote(localUserId, {
        title: 'Test Note for Updating',
      })
      noteId = note.uuid
    })

    it('should update note successfully', async () => {
      const updateData = {
        title: 'Updated Note Title',
        description: 'Updated Description',
        body: 'Updated Body Content',
        status: 'PUBLISHED',
      }

      await request(app)
        .put(`/api/v1/notes/${noteId}`)
        .set('Authorization', `Bearer ${localAuthToken}`)
        .send(updateData)
        .expect(200)

      // Verify the update
      const response = await request(app)
        .get(`/api/v1/notes/${noteId}`)
        .set('Authorization', `Bearer ${localAuthToken}`)
        .expect(200)

      expect(response.body.data.title).toBe(updateData.title)
      expect(response.body.data.description).toBe(updateData.description)
      expect(response.body.data.body).toBe(updateData.body)
      expect(response.body.data.status).toBe(updateData.status)
    })

    it('should update partial fields', async () => {
      const updateData = {
        title: 'Partially Updated Title',
      }

      await request(app)
        .put(`/api/v1/notes/${noteId}`)
        .set('Authorization', `Bearer ${localAuthToken}`)
        .send(updateData)
        .expect(200)
    })

    it('should return 404 for non-existent note', async () => {
      const updateData = {
        title: 'Updated Title',
      }

      await request(app)
        .put('/api/v1/notes/non-existent-uuid')
        .set('Authorization', `Bearer ${localAuthToken}`)
        .send(updateData)
        .expect(404)
    })

    it('should return 401 without authentication', async () => {
      const updateData = {
        title: 'Updated Title',
      }

      await request(app)
        .put(`/api/v1/notes/${noteId}`)
        .send(updateData)
        .expect(401)
    })

    it('should not allow updating other user notes', async () => {
      // Create another user's note
      const otherUser = await notesTestHelpers.createTestUser({
        email: 'other-user@example.com',
        password: 'password',
      })
      const note = await notesTestHelpers.createTestNote(otherUser.id, {
        title: 'Other User Note',
      })

      const updateData = {
        title: 'Hacked Title',
      }

      await request(app)
        .put(`/api/v1/notes/${note.uuid}`)
        .set('Authorization', `Bearer ${localAuthToken}`)
        .send(updateData)
        .expect(404) // Should not find note for current user
    })
  })

  describe('DELETE /api/v1/notes/:uuid', () => {
    let localUserId: number
    let localAuthToken: string
    let noteToDeleteId: string

    beforeEach(async () => {
      await notesTestHelpers.cleanupDatabase()
      const {
        user,
        authToken: token,
      } = await notesTestHelpers.setupTestData()
      localUserId = user.id
      localAuthToken = token

      // Create a note specifically for deletion testing
      const noteToDelete = await notesTestHelpers.createTestNote(localUserId, {
        title: 'Note to Delete',
      })
      noteToDeleteId = noteToDelete.uuid
    })

    it('should delete note successfully', async () => {
      await request(app)
        .delete(`/api/v1/notes/${noteToDeleteId}`)
        .set('Authorization', `Bearer ${localAuthToken}`)
        .expect(200)

      // Verify deletion by trying to get the note
      await request(app)
        .get(`/api/v1/notes/${noteToDeleteId}`)
        .set('Authorization', `Bearer ${localAuthToken}`)
        .expect(404)
    })

    it('should return 404 for non-existent note', async () => {
      await request(app)
        .delete('/api/v1/notes/non-existent-uuid')
        .set('Authorization', `Bearer ${localAuthToken}`)
        .expect(404)
    })

    it('should return 401 without authentication', async () => {
      await request(app).delete(`/api/v1/notes/${noteToDeleteId}`).expect(401)
    })
  })
})
