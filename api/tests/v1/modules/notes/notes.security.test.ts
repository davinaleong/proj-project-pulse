import request from 'supertest'
import { createApp } from '../../../../src/app'
import { notesTestHelpers } from './notes.helpers'

const app = createApp()

describe('Notes Security & Validation', () => {
  let authToken: string
  let userId: number
  let otherUserToken: string
  let otherUserId: number

  beforeAll(async () => {
    await notesTestHelpers.cleanupDatabase()

    // Setup main test user
    const { user, authToken: token } = await notesTestHelpers.setupTestData()
    userId = user.id
    authToken = token

    // Setup another user for security testing
    const otherUser = await notesTestHelpers.createTestUser({
      name: 'Other User',
      email: 'other@example.com',
    })
    otherUserId = otherUser.id
    otherUserToken = notesTestHelpers.generateMockAuthToken({
      id: otherUser.id,
      email: otherUser.email,
      role: otherUser.role,
    })
  })

  afterAll(async () => {
    await notesTestHelpers.disconnectDatabase()
  })

  describe('Authentication & Authorization', () => {
    let testNoteUuid: string

    beforeAll(async () => {
      const note = await notesTestHelpers.createTestNote(userId, {
        title: 'Security Test Note',
      })
      testNoteUuid = note.uuid
    })

    it('should require authentication for all note operations', async () => {
      // Test all endpoints without authentication
      await request(app).get('/api/v1/notes').expect(401)

      await request(app).get(`/api/v1/notes/${testNoteUuid}`).expect(401)

      await request(app)
        .post('/api/v1/notes')
        .send({ title: 'Test' })
        .expect(401)

      await request(app)
        .put(`/api/v1/notes/${testNoteUuid}`)
        .send({ title: 'Updated' })
        .expect(401)

      await request(app).delete(`/api/v1/notes/${testNoteUuid}`).expect(401)

      await request(app)
        .post(`/api/v1/notes/${testNoteUuid}/restore`)
        .expect(401)
    })

    it('should prevent access to other users notes', async () => {
      // Other user should not be able to access the note
      await request(app)
        .get(`/api/v1/notes/${testNoteUuid}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(404)

      // Other user should not be able to update the note
      await request(app)
        .put(`/api/v1/notes/${testNoteUuid}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({ title: 'Hacked' })
        .expect(404)

      // Other user should not be able to delete the note
      await request(app)
        .delete(`/api/v1/notes/${testNoteUuid}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(404)

      // Other user should not be able to restore the note
      await request(app)
        .post(`/api/v1/notes/${testNoteUuid}/restore`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(404)
    })

    it('should only return notes owned by authenticated user in list', async () => {
      // Create notes for both users
      await notesTestHelpers.createTestNote(otherUserId, {
        title: 'Other User Note',
        status: 'PUBLISHED',
      })

      // User 1 should only see their own notes
      const response1 = await request(app)
        .get('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(
        response1.body.data.every(
          (note: { userId: number }) => note.userId === userId,
        ),
      ).toBe(true)

      // User 2 should only see their own notes
      const response2 = await request(app)
        .get('/api/v1/notes')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(200)

      expect(
        response2.body.data.every(
          (note: { userId: number }) => note.userId === otherUserId,
        ),
      ).toBe(true)
    })

    it('should reject invalid JWT tokens', async () => {
      await request(app)
        .get('/api/v1/notes')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)

      await request(app)
        .get('/api/v1/notes')
        .set('Authorization', 'Bearer ')
        .expect(401)

      await request(app)
        .get('/api/v1/notes')
        .set('Authorization', 'InvalidBearer token')
        .expect(401)
    })
  })

  describe('Input Validation', () => {
    it('should validate note creation data', async () => {
      // Empty title
      await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: '' })
        .expect(400)

      // Title too long
      await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'x'.repeat(256) })
        .expect(400)

      // Invalid status
      await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Test', status: 'INVALID_STATUS' })
        .expect(400)

      // Invalid project ID type
      await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Test', projectId: 'not-a-number' })
        .expect(400)
    })

    it('should validate note update data', async () => {
      const note = await notesTestHelpers.createTestNote(userId, {
        title: 'Update Test Note',
      })

      // Empty title
      await request(app)
        .put(`/api/v1/notes/${note.uuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: '' })
        .expect(400)

      // Invalid status
      await request(app)
        .put(`/api/v1/notes/${note.uuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'INVALID_STATUS' })
        .expect(400)
    })

    it('should validate query parameters', async () => {
      // Invalid page number
      await request(app)
        .get('/api/v1/notes?page=0')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)

      // Invalid limit
      await request(app)
        .get('/api/v1/notes?limit=101')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)

      // Invalid status filter
      await request(app)
        .get('/api/v1/notes?status=INVALID')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)

      // Invalid sort field
      await request(app)
        .get('/api/v1/notes?sortBy=invalidField')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)

      // Invalid sort order
      await request(app)
        .get('/api/v1/notes?sortOrder=invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)
    })

    it('should validate UUID format', async () => {
      // Malformed UUID
      await request(app)
        .get('/api/v1/notes/invalid-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)

      await request(app)
        .put('/api/v1/notes/invalid-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Test' })
        .expect(404)

      await request(app)
        .delete('/api/v1/notes/invalid-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)
    })
  })

  describe('Input Sanitization', () => {
    it('should handle HTML/script content safely', async () => {
      const maliciousData = {
        title: '<script>alert("xss")</script>Test Title',
        description: '"><img src=x onerror=alert("xss")>Description',
        body: 'javascript:alert("xss") Body content',
      }

      const response = await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(maliciousData)
        .expect(201)

      // Data should be stored as-is (sanitization typically happens on output)
      expect(response.body.data.title).toBe(maliciousData.title)
      expect(response.body.data.description).toBe(maliciousData.description)
      expect(response.body.data.body).toBe(maliciousData.body)
    })

    it('should handle special characters in search', async () => {
      // Create a note with special characters
      await notesTestHelpers.createTestNote(userId, {
        title: 'Special chars: !@#$%^&*()[]{}|;:,.<>?',
        body: 'Content with "quotes" and \'apostrophes\'',
      })

      // Search should handle special characters safely
      const response = await request(app)
        .get('/api/v1/notes?search=!@#$%^&*()[]{}|;:,.<>?')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      // Should not cause errors
      expect(response.body.success).toBe(true)
    })

    it('should handle SQL injection attempts in search', async () => {
      const sqlInjectionAttempts = [
        "'; DROP TABLE notes; --",
        "' OR '1'='1",
        "'; INSERT INTO notes (title) VALUES ('hacked'); --",
        "' UNION SELECT * FROM users --",
      ]

      for (const injection of sqlInjectionAttempts) {
        const response = await request(app)
          .get(`/api/v1/notes?search=${encodeURIComponent(injection)}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)

        // Should return empty results, not cause errors
        expect(response.body.success).toBe(true)
        expect(Array.isArray(response.body.data)).toBe(true)
      }
    })
  })

  describe('Rate Limiting & Performance', () => {
    it('should handle large request payloads gracefully', async () => {
      const largeBody = {
        title: 'Large Content Test',
        body: 'x'.repeat(10000), // 10KB body
      }

      const response = await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(largeBody)

      // Should either succeed or fail gracefully (413 Payload Too Large)
      expect([201, 413].includes(response.status)).toBe(true)
    })

    it('should handle rapid successive requests', async () => {
      const promises = []

      // Make 10 rapid requests
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .get('/api/v1/notes')
            .set('Authorization', `Bearer ${authToken}`),
        )
      }

      const responses = await Promise.all(promises)

      // All requests should succeed or be properly rate limited
      responses.forEach((response) => {
        expect([200, 429].includes(response.status)).toBe(true)
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid operations gracefully', async () => {
      // Test various invalid operations that should return proper error responses
      const invalidOperations = [
        // Invalid UUID format
        request(app)
          .get('/api/v1/notes/invalid-uuid-format')
          .set('Authorization', `Bearer ${authToken}`),
        // Non-existent note
        request(app)
          .get('/api/v1/notes/00000000-0000-4000-8000-000000000000')
          .set('Authorization', `Bearer ${authToken}`),
        // Invalid update data
        request(app)
          .put('/api/v1/notes/00000000-0000-4000-8000-000000000000')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ invalidField: 'test' }),
      ]

      const responses = await Promise.all(invalidOperations)

      // All should return proper error responses
      responses.forEach((response) => {
        expect([404, 400, 422].includes(response.status)).toBe(true)
        expect(response.body.success).toBe(false)
      })
    })

    it('should handle malformed JSON payloads', async () => {
      const response = await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('{"title": "test", invalid json}')
        .expect(400)

      expect(response.body.error).toBeDefined()
    })

    it('should handle missing content-type header', async () => {
      const response = await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send('title=test')
        .expect(400)

      expect(response.body.error).toBeDefined()
    })
  })
})
