import request from 'supertest'
import { createApp } from '../../../src/app'
import prisma from '../../../src/config/db'
import { Application } from 'express'

describe('Notes Module', () => {
  let app: Application
  let authToken: string
  let userId: number
  let projectId: number
  let noteId: string

  beforeAll(async () => {
    app = createApp()

    // Create test user
    const user = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'USER',
        status: 'ACTIVE',
      },
    })
    userId = user.id

    // Create test project
    const project = await prisma.project.create({
      data: {
        title: 'Test Project',
        description: 'Test project for notes',
        userId: userId,
        stage: 'PLANNING',
      },
    })
    projectId = project.id

    // Mock auth token (in real implementation, this would come from auth service)
    authToken = 'mock-jwt-token'
  })

  afterAll(async () => {
    // Clean up test data
    await prisma.note.deleteMany({ where: { userId } })
    await prisma.project.deleteMany({ where: { userId } })
    await prisma.user.delete({ where: { id: userId } })
    await prisma.$disconnect()
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

  describe('GET /api/v1/notes', () => {
    beforeAll(async () => {
      // Create additional test notes for pagination testing
      await prisma.note.createMany({
        data: [
          {
            title: 'Published Note',
            description: 'Published note description',
            status: 'PUBLISHED',
            userId: userId,
            projectId: projectId,
          },
          {
            title: 'Private Note',
            description: 'Private note description',
            status: 'PRIVATE',
            userId: userId,
          },
          {
            title: 'Searchable Content',
            body: 'This note contains searchable keywords',
            status: 'DRAFT',
            userId: userId,
          },
        ],
      })
    })

    it('should get all notes for authenticated user', async () => {
      const response = await request(app)
        .get('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeInstanceOf(Array)
      expect(response.body.pagination).toBeDefined()
      expect(response.body.pagination.page).toBe(1)
      expect(response.body.pagination.limit).toBe(20)
      expect(response.body.data.length).toBeGreaterThan(0)
    })

    it('should filter notes by status', async () => {
      const response = await request(app)
        .get('/api/v1/notes?status=PUBLISHED')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(
        response.body.data.every((note: any) => note.status === 'PUBLISHED'),
      ).toBe(true)
    })

    it('should filter notes by projectId', async () => {
      const response = await request(app)
        .get(`/api/v1/notes?projectId=${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(
        response.body.data.every((note: any) => note.projectId === projectId),
      ).toBe(true)
    })

    it('should search notes by content', async () => {
      const response = await request(app)
        .get('/api/v1/notes?search=searchable')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.data.length).toBeGreaterThan(0)
      const foundNote = response.body.data.find(
        (note: any) =>
          note.title.toLowerCase().includes('searchable') ||
          note.body?.toLowerCase().includes('searchable'),
      )
      expect(foundNote).toBeDefined()
    })

    it('should handle pagination', async () => {
      const response = await request(app)
        .get('/api/v1/notes?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.pagination.page).toBe(1)
      expect(response.body.pagination.limit).toBe(2)
      expect(response.body.data.length).toBeLessThanOrEqual(2)
    })

    it('should return 400 for invalid query parameters', async () => {
      const response = await request(app)
        .get('/api/v1/notes?page=0&limit=101') // invalid page and limit
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)

      expect(response.body.error).toBe('Invalid query parameters')
    })

    it('should return 401 for unauthenticated request', async () => {
      await request(app).get('/api/v1/notes').expect(401)
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
      const otherUser = await prisma.user.create({
        data: {
          name: 'Other User',
          email: 'other@example.com',
          password: 'hashedpassword',
          role: 'USER',
          status: 'ACTIVE',
        },
      })

      const otherNote = await prisma.note.create({
        data: {
          title: 'Other User Note',
          userId: otherUser.id,
          status: 'DRAFT',
        },
      })

      const response = await request(app)
        .get(`/api/v1/notes/${otherNote.uuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)

      expect(response.body.error).toBe('Note not found')

      // Cleanup
      await prisma.note.delete({ where: { id: otherNote.id } })
      await prisma.user.delete({ where: { id: otherUser.id } })
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
      const note = await prisma.note.create({
        data: {
          title: 'Note to Delete',
          userId: userId,
          status: 'DRAFT',
        },
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

  describe('POST /api/v1/notes/:uuid/restore', () => {
    let deletedNoteUuid: string

    beforeAll(async () => {
      // Create and delete a note for restoration testing
      const note = await prisma.note.create({
        data: {
          title: 'Note to Restore',
          userId: userId,
          status: 'DRAFT',
          deletedAt: new Date(),
        },
      })
      deletedNoteUuid = note.uuid
    })

    it('should restore deleted note successfully', async () => {
      const response = await request(app)
        .post(`/api/v1/notes/${deletedNoteUuid}/restore`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Note restored successfully')
      expect(response.body.data.uuid).toBe(deletedNoteUuid)

      // Verify note is restored
      const restoredNote = await prisma.note.findFirst({
        where: { uuid: deletedNoteUuid },
      })
      expect(restoredNote?.deletedAt).toBeNull()
    })

    it('should return 404 for non-deleted note', async () => {
      const response = await request(app)
        .post(`/api/v1/notes/${noteId}/restore`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)

      expect(response.body.error).toBe('Note not found or not deleted')
    })

    it('should return 404 for non-existent note', async () => {
      const fakeUuid = '550e8400-e29b-41d4-a716-446655440000'

      const response = await request(app)
        .post(`/api/v1/notes/${fakeUuid}/restore`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)

      expect(response.body.error).toBe('Note not found or not deleted')
    })

    it('should return 401 for unauthenticated request', async () => {
      await request(app)
        .post(`/api/v1/notes/${deletedNoteUuid}/restore`)
        .expect(401)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Mock database error
      jest
        .spyOn(prisma.note, 'findMany')
        .mockRejectedValueOnce(new Error('Database connection failed'))

      const response = await request(app)
        .get('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500)

      expect(response.body.error).toBeDefined()

      // Restore mock
      jest.restoreAllMocks()
    })

    it('should handle malformed UUID in params', async () => {
      const response = await request(app)
        .get('/api/v1/notes/invalid-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)

      expect(response.body.error).toBe('Note not found')
    })

    it('should handle large request body', async () => {
      const largeBody = {
        title: 'Test Note',
        body: 'x'.repeat(10000), // Very large body
      }

      const response = await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(largeBody)

      // Should either succeed or fail gracefully depending on body size limits
      expect([200, 201, 413].includes(response.status)).toBe(true)
    })

    it('should handle concurrent updates correctly', async () => {
      // Create a note for concurrent testing
      const note = await prisma.note.create({
        data: {
          title: 'Concurrent Test Note',
          userId: userId,
          status: 'DRAFT',
        },
      })

      // Simulate concurrent updates
      const update1 = request(app)
        .put(`/api/v1/notes/${note.uuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Update 1' })

      const update2 = request(app)
        .put(`/api/v1/notes/${note.uuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Update 2' })

      const [response1, response2] = await Promise.all([update1, update2])

      // Both should succeed (last write wins)
      expect([200, 404].includes(response1.status)).toBe(true)
      expect([200, 404].includes(response2.status)).toBe(true)

      // Cleanup
      await prisma.note.delete({ where: { id: note.id } })
    })

    it('should validate input sanitization', async () => {
      const maliciousData = {
        title: '<script>alert("xss")</script>',
        description: '"><img src=x onerror=alert("xss")>',
        body: 'javascript:alert("xss")',
      }

      const response = await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(maliciousData)
        .expect(201)

      // Data should be stored as-is (sanitization should happen on output)
      expect(response.body.data.title).toBe(maliciousData.title)
      expect(response.body.data.description).toBe(maliciousData.description)
      expect(response.body.data.body).toBe(maliciousData.body)
    })
  })
})
