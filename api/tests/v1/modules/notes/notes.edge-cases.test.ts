import request from 'supertest'
import { createApp } from '../../../../src/app'
import { notesTestHelpers } from './notes.helpers'

const app = createApp()

describe('Notes Edge Cases & Error Handling', () => {
  let authToken: string
  let userId: number

  beforeAll(async () => {
    await notesTestHelpers.cleanupDatabase()
    const { user, authToken: token } = await notesTestHelpers.setupTestData()
    userId = user.id
    authToken = token
  })

  afterAll(async () => {
    await notesTestHelpers.disconnectDatabase()
  })

  describe('Non-existent Resources', () => {
    it('should handle requests for non-existent notes', async () => {
      const nonExistentUuid = '00000000-0000-4000-8000-000000000000'

      await request(app)
        .get(`/api/v1/notes/${nonExistentUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)

      await request(app)
        .put(`/api/v1/notes/${nonExistentUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated' })
        .expect(404)

      await request(app)
        .delete(`/api/v1/notes/${nonExistentUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)

      await request(app)
        .post(`/api/v1/notes/${nonExistentUuid}/restore`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)
    })

    it('should handle requests with non-existent project IDs', async () => {
      const response = await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Note',
          projectId: 999999, // Non-existent project
        })
        .expect(400)

      expect(response.body.error).toContain('project')
    })

    it('should handle updates to already deleted notes', async () => {
      const note = await notesTestHelpers.createTestNote(userId, {
        title: 'To Be Deleted',
      })

      // Delete the note first
      await request(app)
        .delete(`/api/v1/notes/${note.uuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      // Try to update the deleted note
      await request(app)
        .put(`/api/v1/notes/${note.uuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated After Delete' })
        .expect(404)

      // Try to delete again
      await request(app)
        .delete(`/api/v1/notes/${note.uuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)
    })
  })

  describe('Concurrent Operations', () => {
    it('should handle concurrent updates to same note', async () => {
      const note = await notesTestHelpers.createTestNote(userId, {
        title: 'Concurrent Test',
      })

      // Make multiple concurrent update requests
      const updatePromises = [
        request(app)
          .put(`/api/v1/notes/${note.uuid}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ title: 'Update 1' }),
        request(app)
          .put(`/api/v1/notes/${note.uuid}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ title: 'Update 2' }),
        request(app)
          .put(`/api/v1/notes/${note.uuid}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ title: 'Update 3' }),
      ]

      const responses = await Promise.all(updatePromises)

      // At least one should succeed
      const successfulUpdates = responses.filter((r) => r.status === 200)
      expect(successfulUpdates.length).toBeGreaterThan(0)

      // Check final state
      const finalNote = await request(app)
        .get(`/api/v1/notes/${note.uuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(['Update 1', 'Update 2', 'Update 3']).toContain(
        finalNote.body.data.title,
      )
    })

    it('should handle concurrent delete and update operations', async () => {
      const note = await notesTestHelpers.createTestNote(userId, {
        title: 'Concurrent Delete Test',
      })

      // Concurrent delete and update
      const [deleteResponse, updateResponse] = await Promise.all([
        request(app)
          .delete(`/api/v1/notes/${note.uuid}`)
          .set('Authorization', `Bearer ${authToken}`),
        request(app)
          .put(`/api/v1/notes/${note.uuid}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ title: 'Concurrent Update' }),
      ])

      // One should succeed, one should fail
      const statuses = [deleteResponse.status, updateResponse.status].sort()
      expect(statuses).toEqual([200, 404])
    })

    it('should handle concurrent creation of notes with same title', async () => {
      const noteData = {
        title: 'Duplicate Title Test',
        description: 'Testing concurrent creation',
      }

      // Create multiple notes with same title concurrently
      const createPromises = Array(5)
        .fill(null)
        .map(() =>
          request(app)
            .post('/api/v1/notes')
            .set('Authorization', `Bearer ${authToken}`)
            .send(noteData),
        )

      const responses = await Promise.all(createPromises)

      // All should succeed (duplicate titles are allowed)
      responses.forEach((response) => {
        expect(response.status).toBe(201)
      })

      // Verify all notes were created
      const allNotes = await request(app)
        .get('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      const duplicateNotes = allNotes.body.data.filter(
        (note: { title: string }) => note.title === noteData.title,
      )
      expect(duplicateNotes.length).toBe(5)
    })
  })

  describe('Boundary Values', () => {
    it('should handle empty and whitespace-only content', async () => {
      const testCases = [
        { title: '   ', expectedStatus: 400 }, // Only whitespace
        { title: 'Valid', description: '   ', expectedStatus: 201 }, // Whitespace description
        { title: 'Valid', body: '', expectedStatus: 201 }, // Empty body
        { title: 'Valid', body: '   ', expectedStatus: 201 }, // Whitespace body
      ]

      for (const testCase of testCases) {
        const response = await request(app)
          .post('/api/v1/notes')
          .set('Authorization', `Bearer ${authToken}`)
          .send(testCase)

        expect(response.status).toBe(testCase.expectedStatus)
      }
    })

    it('should handle maximum field lengths', async () => {
      const maxLengthData = {
        title: 'x'.repeat(255), // Maximum allowed title length
        description: 'x'.repeat(500), // Test description length
        body: 'x'.repeat(10000), // Test large body
      }

      const response = await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(maxLengthData)
        .expect(201)

      expect(response.body.data.title).toBe(maxLengthData.title)
      expect(response.body.data.description).toBe(maxLengthData.description)
      expect(response.body.data.body).toBe(maxLengthData.body)
    })

    it('should handle edge case pagination values', async () => {
      // Create some test notes
      await Promise.all([
        notesTestHelpers.createTestNote(userId, { title: 'Note 1' }),
        notesTestHelpers.createTestNote(userId, { title: 'Note 2' }),
        notesTestHelpers.createTestNote(userId, { title: 'Note 3' }),
      ])

      // Test edge cases
      const testCases = [
        { page: 1, limit: 1 }, // Minimum pagination
        { page: 999, limit: 1 }, // Page beyond available data
        { page: 1, limit: 100 }, // Maximum limit
      ]

      for (const { page, limit } of testCases) {
        const response = await request(app)
          .get(`/api/v1/notes?page=${page}&limit=${limit}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)

        expect(response.body.success).toBe(true)
        expect(Array.isArray(response.body.data)).toBe(true)
        expect(response.body.pagination).toBeDefined()
      }
    })
  })

  describe('Data Type Edge Cases', () => {
    it('should handle invalid data types gracefully', async () => {
      const invalidDataCases = [
        { title: 123 }, // Number instead of string
        { title: true }, // Boolean instead of string
        { title: ['array'] }, // Array instead of string
        { title: { object: true } }, // Object instead of string
        { projectId: 'string' }, // String instead of number
        { projectId: 3.14 }, // Float instead of integer
      ]

      for (const invalidData of invalidDataCases) {
        const response = await request(app)
          .post('/api/v1/notes')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidData)

        expect([400, 422].includes(response.status)).toBe(true)
      }
    })

    it('should handle null and undefined values', async () => {
      const nullDataCases = [
        { title: null },
        { title: undefined },
        { description: null },
        { body: null },
      ]

      for (const nullData of nullDataCases) {
        const response = await request(app)
          .post('/api/v1/notes')
          .set('Authorization', `Bearer ${authToken}`)
          .send(nullData)

        // Should handle gracefully (either accept null or reject with 400)
        expect([400, 422].includes(response.status)).toBe(true)
      }
    })

    it('should handle Unicode and special characters', async () => {
      const unicodeData = {
        title: '测试标题 🚀 emoji test',
        description: 'Descripción con acentós y símbolos: ñ, ü, ç',
        body: 'Mixed content: 日本語 العربية русский 🎉🎊🎈',
      }

      const response = await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(unicodeData)
        .expect(201)

      expect(response.body.data.title).toBe(unicodeData.title)
      expect(response.body.data.description).toBe(unicodeData.description)
      expect(response.body.data.body).toBe(unicodeData.body)
    })
  })

  describe('Complex Scenarios', () => {
    it('should handle rapid creation and deletion cycles', async () => {
      const cycleCount = 10
      const noteUuids: string[] = []

      // Rapid create-delete cycles
      for (let i = 0; i < cycleCount; i++) {
        // Create note
        const createResponse = await request(app)
          .post('/api/v1/notes')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ title: `Cycle Note ${i}` })
          .expect(201)

        noteUuids.push(createResponse.body.data.uuid)

        // Immediately delete
        await request(app)
          .delete(`/api/v1/notes/${createResponse.body.data.uuid}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)
      }

      // Verify all notes are in deleted state
      for (const uuid of noteUuids) {
        await request(app)
          .get(`/api/v1/notes/${uuid}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404)
      }
    })

    it('should handle restore operations on non-deleted notes', async () => {
      const note = await notesTestHelpers.createTestNote(userId, {
        title: 'Active Note',
      })

      // Try to restore an active note
      const response = await request(app)
        .post(`/api/v1/notes/${note.uuid}/restore`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)

      expect(response.body.error).toContain('not deleted')
    })

    it('should handle bulk operations with mixed valid/invalid data', async () => {
      // This test assumes bulk operations exist in the API
      // If not implemented, this would verify individual operations in bulk
      const notes = await Promise.all([
        notesTestHelpers.createTestNote(userId, { title: 'Note 1' }),
        notesTestHelpers.createTestNote(userId, { title: 'Note 2' }),
        notesTestHelpers.createTestNote(userId, { title: 'Note 3' }),
      ])

      // Mix of valid and invalid operations
      const results = await Promise.allSettled([
        // Valid delete
        request(app)
          .delete(`/api/v1/notes/${notes[0].uuid}`)
          .set('Authorization', `Bearer ${authToken}`),
        // Invalid delete (non-existent)
        request(app)
          .delete('/api/v1/notes/00000000-0000-4000-8000-000000000000')
          .set('Authorization', `Bearer ${authToken}`),
        // Valid update
        request(app)
          .put(`/api/v1/notes/${notes[1].uuid}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ title: 'Updated Note 2' }),
        // Invalid update (deleted note)
        request(app)
          .put(`/api/v1/notes/${notes[0].uuid}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ title: 'Should fail' }),
      ])

      // Verify mixed success/failure results
      const responses = results
        .map((result) => (result.status === 'fulfilled' ? result.value : null))
        .filter((r): r is NonNullable<typeof r> => r !== null)

      expect(responses.some((r) => r.status === 200)).toBe(true) // Some succeeded
      expect(responses.some((r) => r.status === 404)).toBe(true) // Some failed
    })
  })

  describe('Memory and Resource Management', () => {
    it('should handle operations when system is under load', async () => {
      // Create many operations simultaneously to simulate load
      const heavyLoadPromises = Array(50)
        .fill(null)
        .map((_, index) =>
          request(app)
            .post('/api/v1/notes')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ title: `Load Test Note ${index}` }),
        )

      const responses = await Promise.allSettled(heavyLoadPromises)

      // Most should succeed, but some might be rate limited
      const successfulResponses = responses.filter(
        (result) =>
          result.status === 'fulfilled' && result.value.status === 201,
      )

      expect(successfulResponses.length).toBeGreaterThan(0)
    })

    it('should cleanup resources properly after errors', async () => {
      // Test that the system remains stable after various operations
      const testOperations = []

      // Create some notes
      for (let i = 0; i < 5; i++) {
        testOperations.push(
          request(app)
            .post('/api/v1/notes')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ title: `Cleanup Test ${i}` }),
        )
      }

      // Mix in some operations that will fail
      testOperations.push(
        request(app)
          .get('/api/v1/notes/invalid-uuid')
          .set('Authorization', `Bearer ${authToken}`),
      )

      testOperations.push(
        request(app)
          .delete('/api/v1/notes/00000000-0000-4000-8000-000000000000')
          .set('Authorization', `Bearer ${authToken}`),
      )

      // Execute all operations
      await Promise.allSettled(testOperations)

      // System should still be functional
      const healthCheck = await request(app)
        .get('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(healthCheck.body.success).toBe(true)
    })
  })
})
