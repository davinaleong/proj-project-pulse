import request from 'supertest'
import { createApp } from '../../../../src/app'
import { notesTestHelpers } from './notes.helpers'

const app = createApp()

describe('Notes Search & Filtering', () => {
  let authToken: string
  let userId: number
  let projectId: number

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

    // Create additional test notes for search/filter testing
    await notesTestHelpers.createMultipleTestNotes(userId, projectId)
  })

  afterAll(async () => {
    await notesTestHelpers.disconnectDatabase()
  })

  describe('GET /api/v1/notes', () => {
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

    it('should search notes by title', async () => {
      const response = await request(app)
        .get('/api/v1/notes?search=Published')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.data.length).toBeGreaterThan(0)
      const foundNote = response.body.data.find((note: any) =>
        note.title.toLowerCase().includes('published'),
      )
      expect(foundNote).toBeDefined()
    })

    it('should search notes by description', async () => {
      const response = await request(app)
        .get('/api/v1/notes?search=description')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.data.length).toBeGreaterThan(0)
      const foundNote = response.body.data.find((note: any) =>
        note.description?.toLowerCase().includes('description'),
      )
      expect(foundNote).toBeDefined()
    })

    it('should handle case-insensitive search', async () => {
      const response = await request(app)
        .get('/api/v1/notes?search=PUBLISHED')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.data.length).toBeGreaterThan(0)
      const foundNote = response.body.data.find((note: any) =>
        note.title.toLowerCase().includes('published'),
      )
      expect(foundNote).toBeDefined()
    })

    it('should return empty array for search with no matches', async () => {
      const response = await request(app)
        .get('/api/v1/notes?search=nonexistentkeyword')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.data).toEqual([])
      expect(response.body.pagination.total).toBe(0)
    })

    it('should combine multiple filters', async () => {
      const response = await request(app)
        .get(`/api/v1/notes?status=PUBLISHED&projectId=${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(
        response.body.data.every(
          (note: any) =>
            note.status === 'PUBLISHED' && note.projectId === projectId,
        ),
      ).toBe(true)
    })

    it('should combine search with filters', async () => {
      const response = await request(app)
        .get('/api/v1/notes?status=PUBLISHED&search=note')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(
        response.body.data.every((note: any) => note.status === 'PUBLISHED'),
      ).toBe(true)

      if (response.body.data.length > 0) {
        const hasSearchTerm = response.body.data.some(
          (note: any) =>
            note.title.toLowerCase().includes('note') ||
            note.description?.toLowerCase().includes('note') ||
            note.body?.toLowerCase().includes('note'),
        )
        expect(hasSearchTerm).toBe(true)
      }
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

    it('should handle pagination with filters', async () => {
      const response = await request(app)
        .get('/api/v1/notes?status=DRAFT&page=1&limit=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.pagination.page).toBe(1)
      expect(response.body.pagination.limit).toBe(1)
      expect(response.body.data.length).toBeLessThanOrEqual(1)

      if (response.body.data.length > 0) {
        expect(response.body.data[0].status).toBe('DRAFT')
      }
    })

    it('should sort notes by creation date (newest first) by default', async () => {
      const response = await request(app)
        .get('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      if (response.body.data.length > 1) {
        const dates = response.body.data.map(
          (note: any) => new Date(note.createdAt),
        )
        const sortedDates = [...dates].sort((a, b) => b.getTime() - a.getTime())
        expect(dates).toEqual(sortedDates)
      }
    })

    it('should handle sorting by different fields', async () => {
      const response = await request(app)
        .get('/api/v1/notes?sortBy=title&sortOrder=asc')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      if (response.body.data.length > 1) {
        const titles = response.body.data.map((note: any) => note.title)
        const sortedTitles = [...titles].sort()
        expect(titles).toEqual(sortedTitles)
      }
    })

    it('should return 400 for invalid query parameters', async () => {
      const response = await request(app)
        .get('/api/v1/notes?page=0&limit=101') // invalid page and limit
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)

      expect(response.body.error).toBe('Invalid query parameters')
    })

    it('should return 400 for invalid status filter', async () => {
      const response = await request(app)
        .get('/api/v1/notes?status=INVALID_STATUS')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)

      expect(response.body.error).toBe('Invalid query parameters')
    })

    it('should return 401 for unauthenticated request', async () => {
      await request(app).get('/api/v1/notes').expect(401)
    })

    it('should only return notes owned by the authenticated user', async () => {
      // Create another user with notes
      const otherUser = await notesTestHelpers.createTestUser({
        name: 'Other User',
        email: 'other@example.com',
      })

      await notesTestHelpers.createTestNote(otherUser.id, {
        title: 'Other User Note',
        status: 'PUBLISHED',
      })

      const response = await request(app)
        .get('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      // All returned notes should belong to the authenticated user
      expect(
        response.body.data.every((note: any) => note.userId === userId),
      ).toBe(true)

      // Should not find the other user's note
      const otherUserNote = response.body.data.find(
        (note: any) => note.title === 'Other User Note',
      )
      expect(otherUserNote).toBeUndefined()
    })
  })
})
