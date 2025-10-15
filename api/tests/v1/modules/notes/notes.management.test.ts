import request from 'supertest'
import { createApp } from '../../../../src/app'
import { notesTestHelpers, prisma } from './notes.helpers'

const app = createApp()

describe('Notes Management', () => {
  let authToken: string
  let userId: number

  beforeAll(async () => {
    await notesTestHelpers.cleanupDatabase()
    const testData = await notesTestHelpers.setupTestData()
    userId = testData.user.id
    authToken = testData.authToken
  })

  afterAll(async () => {
    await notesTestHelpers.disconnectDatabase()
  })

  describe('POST /api/v1/notes/:uuid/restore', () => {
    let deletedNoteUuid: string
    let activeNoteUuid: string

    beforeAll(async () => {
      // Create and delete a note for restoration testing
      const deletedNote = await notesTestHelpers.createTestNote(userId, {
        title: 'Note to Restore',
        deletedAt: new Date(),
      })
      deletedNoteUuid = deletedNote.uuid

      // Create an active note for negative testing
      const activeNote = await notesTestHelpers.createTestNote(userId, {
        title: 'Active Note',
      })
      activeNoteUuid = activeNote.uuid
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
        .post(`/api/v1/notes/${activeNoteUuid}/restore`)
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

    it('should not allow restoring other users deleted notes', async () => {
      // Create another user and a deleted note
      const otherUser = await notesTestHelpers.createTestUser({
        name: 'Other User',
        email: 'other@example.com',
      })

      const otherDeletedNote = await notesTestHelpers.createTestNote(
        otherUser.id,
        {
          title: 'Other User Deleted Note',
          deletedAt: new Date(),
        },
      )

      const response = await request(app)
        .post(`/api/v1/notes/${otherDeletedNote.uuid}/restore`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)

      expect(response.body.error).toBe('Note not found or not deleted')
    })

    it('should handle malformed UUID', async () => {
      const response = await request(app)
        .post('/api/v1/notes/invalid-uuid/restore')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)

      expect(response.body.error).toBe('Note not found or not deleted')
    })
  })

  describe('Soft Delete Verification', () => {
    let noteForDeletionTest: string
    let localUserId: number
    let localAuthToken: string

    beforeAll(async () => {
      // Create a dedicated user for this test scope
      const { user, authToken: token } = await notesTestHelpers.setupTestData()
      localUserId = user.id
      localAuthToken = token

      const note = await notesTestHelpers.createTestNote(localUserId, {
        title: 'Note for Deletion Test',
      })
      noteForDeletionTest = note.uuid
    })

    it('should verify note is properly soft deleted', async () => {
      // First, delete the note
      await request(app)
        .delete(`/api/v1/notes/${noteForDeletionTest}`)
        .set('Authorization', `Bearer ${localAuthToken}`)
        .expect(200)

      // Verify note appears deleted in API
      await request(app)
        .get(`/api/v1/notes/${noteForDeletionTest}`)
        .set('Authorization', `Bearer ${localAuthToken}`)
        .expect(404)

      // Verify note still exists in database with deletedAt timestamp
      const deletedNote = await prisma.note.findFirst({
        where: { uuid: noteForDeletionTest },
      })
      expect(deletedNote).not.toBeNull()
      expect(deletedNote?.deletedAt).not.toBeNull()

      // Verify note doesn't appear in list
      const response = await request(app)
        .get('/api/v1/notes')
        .set('Authorization', `Bearer ${localAuthToken}`)
        .expect(200)

      const foundNote = response.body.data.find(
        (note: { uuid: string }) => note.uuid === noteForDeletionTest,
      )
      expect(foundNote).toBeUndefined()
    })

    it('should restore note and make it visible again', async () => {
      // Restore the note
      await request(app)
        .post(`/api/v1/notes/${noteForDeletionTest}/restore`)
        .set('Authorization', `Bearer ${localAuthToken}`)
        .expect(200)

      // Verify note is accessible again
      const response = await request(app)
        .get(`/api/v1/notes/${noteForDeletionTest}`)
        .set('Authorization', `Bearer ${localAuthToken}`)
        .expect(200)

      expect(response.body.data.uuid).toBe(noteForDeletionTest)
      expect(response.body.data.title).toBe('Note for Deletion Test')

      // Verify note appears in list again
      const listResponse = await request(app)
        .get('/api/v1/notes')
        .set('Authorization', `Bearer ${localAuthToken}`)
        .expect(200)

      const foundNote = listResponse.body.data.find(
        (note: { uuid: string }) => note.uuid === noteForDeletionTest,
      )
      expect(foundNote).toBeDefined()
    })
  })

  describe('Note Lifecycle Management', () => {
    let lifecycleNoteUuid: string
    let localUserId: number
    let localAuthToken: string

    beforeAll(async () => {
      // Create a dedicated user for this test scope
      const { user, authToken: token } = await notesTestHelpers.setupTestData()
      localUserId = user.id
      localAuthToken = token

      const note = await notesTestHelpers.createTestNote(localUserId, {
        title: 'Lifecycle Test Note',
        status: 'DRAFT',
      })
      lifecycleNoteUuid = note.uuid
    })

    it('should handle complete note lifecycle (create -> update -> delete -> restore)', async () => {
      // 1. Verify note exists and is in DRAFT status
      let response = await request(app)
        .get(`/api/v1/notes/${lifecycleNoteUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.data.status).toBe('DRAFT')

      // 2. Update note to PUBLISHED
      response = await request(app)
        .put(`/api/v1/notes/${lifecycleNoteUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'PUBLISHED' })
        .expect(200)

      expect(response.body.data.status).toBe('PUBLISHED')

      // 3. Delete the note
      await request(app)
        .delete(`/api/v1/notes/${lifecycleNoteUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      // 4. Verify note is not accessible
      await request(app)
        .get(`/api/v1/notes/${lifecycleNoteUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)

      // 5. Restore the note
      await request(app)
        .post(`/api/v1/notes/${lifecycleNoteUuid}/restore`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      // 6. Verify note is accessible again with preserved data
      response = await request(app)
        .get(`/api/v1/notes/${lifecycleNoteUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.data.uuid).toBe(lifecycleNoteUuid)
      expect(response.body.data.title).toBe('Lifecycle Test Note')
      expect(response.body.data.status).toBe('PUBLISHED') // Status should be preserved
    })
  })

  describe('Bulk Operations', () => {
    const bulkTestNotes: string[] = []

    beforeAll(async () => {
      // Create multiple notes for bulk operations testing
      for (let i = 1; i <= 5; i++) {
        const note = await notesTestHelpers.createTestNote(userId, {
          title: `Bulk Test Note ${i}`,
          status: i % 2 === 0 ? 'PUBLISHED' : 'DRAFT',
        })
        bulkTestNotes.push(note.uuid)
      }
    })

    it('should handle multiple note deletions', async () => {
      // Delete multiple notes
      for (const noteUuid of bulkTestNotes.slice(0, 3)) {
        await request(app)
          .delete(`/api/v1/notes/${noteUuid}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)
      }

      // Verify all deleted notes are not accessible
      for (const noteUuid of bulkTestNotes.slice(0, 3)) {
        await request(app)
          .get(`/api/v1/notes/${noteUuid}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404)
      }

      // Verify remaining notes are still accessible
      for (const noteUuid of bulkTestNotes.slice(3)) {
        await request(app)
          .get(`/api/v1/notes/${noteUuid}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)
      }
    })

    it('should handle multiple note restorations', async () => {
      // Restore multiple notes
      for (const noteUuid of bulkTestNotes.slice(0, 3)) {
        await request(app)
          .post(`/api/v1/notes/${noteUuid}/restore`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)
      }

      // Verify all restored notes are accessible again
      for (const noteUuid of bulkTestNotes.slice(0, 3)) {
        await request(app)
          .get(`/api/v1/notes/${noteUuid}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)
      }
    })
  })
})
