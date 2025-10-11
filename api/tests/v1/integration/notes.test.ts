import request from 'supertest'
import { createApp } from '../../../src/app'
import prisma from '../../../src/config/db'
import { Application } from 'express'

describe('Notes Integration Tests', () => {
  let app: Application
  let authToken: string
  let user1Id: number
  let user2Id: number
  let project1Id: number
  let project2Id: number

  beforeAll(async () => {
    app = createApp()

    // Create test users
    const user1 = await prisma.user.create({
      data: {
        name: 'User One',
        email: 'user1@example.com',
        password: 'hashedpassword',
        role: 'USER',
        status: 'ACTIVE',
      },
    })
    user1Id = user1.id

    const user2 = await prisma.user.create({
      data: {
        name: 'User Two',
        email: 'user2@example.com',
        password: 'hashedpassword',
        role: 'USER',
        status: 'ACTIVE',
      },
    })
    user2Id = user2.id

    // Create test projects
    const project1 = await prisma.project.create({
      data: {
        title: 'Project One',
        description: 'First test project',
        userId: user1Id,
        stage: 'PLANNING',
      },
    })
    project1Id = project1.id

    const project2 = await prisma.project.create({
      data: {
        title: 'Project Two',
        description: 'Second test project',
        userId: user2Id,
        stage: 'IMPLEMENTATION',
      },
    })
    project2Id = project2.id

    authToken = 'mock-jwt-token-user1'
  })

  afterAll(async () => {
    // Clean up test data
    await prisma.note.deleteMany({
      where: { userId: { in: [user1Id, user2Id] } },
    })
    await prisma.project.deleteMany({
      where: { userId: { in: [user1Id, user2Id] } },
    })
    await prisma.user.deleteMany({ where: { id: { in: [user1Id, user2Id] } } })
    await prisma.$disconnect()
  })

  describe('Full Workflow Integration', () => {
    let noteUuid: string

    it('should complete full CRUD workflow', async () => {
      // 1. Create note
      const createResponse = await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Integration Test Note',
          description: 'Testing full workflow',
          body: 'Initial content',
          status: 'DRAFT',
          projectId: project1Id,
        })
        .expect(201)

      noteUuid = createResponse.body.data.uuid
      expect(createResponse.body.data.title).toBe('Integration Test Note')

      // 2. Read note
      const readResponse = await request(app)
        .get(`/api/v1/notes/${noteUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(readResponse.body.data.uuid).toBe(noteUuid)
      expect(readResponse.body.data.title).toBe('Integration Test Note')

      // 3. Update note
      const updateResponse = await request(app)
        .put(`/api/v1/notes/${noteUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Integration Note',
          status: 'PUBLISHED',
        })
        .expect(200)

      expect(updateResponse.body.data.title).toBe('Updated Integration Note')
      expect(updateResponse.body.data.status).toBe('PUBLISHED')

      // 4. Verify update in list
      const listResponse = await request(app)
        .get('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      const updatedNote = listResponse.body.data.find(
        (note: { uuid: string }) => note.uuid === noteUuid,
      )
      expect(updatedNote.title).toBe('Updated Integration Note')

      // 5. Delete note
      await request(app)
        .delete(`/api/v1/notes/${noteUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      // 6. Verify deletion
      await request(app)
        .get(`/api/v1/notes/${noteUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)

      // 7. Restore note
      const restoreResponse = await request(app)
        .post(`/api/v1/notes/${noteUuid}/restore`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(restoreResponse.body.data.uuid).toBe(noteUuid)

      // 8. Verify restoration
      await request(app)
        .get(`/api/v1/notes/${noteUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
    })
  })

  describe('Multi-user Isolation', () => {
    let user1NoteUuid: string
    let user2NoteUuid: string

    beforeAll(async () => {
      // Create notes for different users
      const user1Note = await prisma.note.create({
        data: {
          title: 'User 1 Note',
          userId: user1Id,
          status: 'DRAFT',
        },
      })
      user1NoteUuid = user1Note.uuid

      const user2Note = await prisma.note.create({
        data: {
          title: 'User 2 Note',
          userId: user2Id,
          status: 'DRAFT',
        },
      })
      user2NoteUuid = user2Note.uuid
    })

    it('should not allow user to access other users notes', async () => {
      // User 1 trying to access User 2's note
      await request(app)
        .get(`/api/v1/notes/${user2NoteUuid}`)
        .set('Authorization', `Bearer ${authToken}`) // user1 token
        .expect(404)

      // User 1 trying to update User 2's note
      await request(app)
        .put(`/api/v1/notes/${user2NoteUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Hacked!' })
        .expect(404)

      // User 1 trying to delete User 2's note
      await request(app)
        .delete(`/api/v1/notes/${user2NoteUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)
    })

    it('should only return notes belonging to authenticated user', async () => {
      const response = await request(app)
        .get('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`) // user1 token
        .expect(200)

      // Should only contain user1's notes
      const noteIds = response.body.data.map(
        (note: { uuid: string }) => note.uuid,
      )
      expect(noteIds).toContain(user1NoteUuid)
      expect(noteIds).not.toContain(user2NoteUuid)
    })
  })

  describe('Project Association', () => {
    it('should create note with valid project association', async () => {
      const response = await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Project Associated Note',
          projectId: project1Id, // user1's project
        })
        .expect(201)

      expect(response.body.data.projectId).toBe(project1Id)
      expect(response.body.data.project).toBeDefined()
      expect(response.body.data.project.title).toBe('Project One')
    })

    it('should handle null project association', async () => {
      const response = await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Unassociated Note',
          projectId: null,
        })
        .expect(201)

      expect(response.body.data.projectId).toBeNull()
      expect(response.body.data.project).toBeNull()
    })

    it('should prevent association with other users projects', async () => {
      const response = await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Cross-user Project Note',
          projectId: project2Id, // user2's project
        })

      // Should fail due to foreign key constraint or validation
      expect([400, 500].includes(response.status)).toBe(true)
    })
  })

  describe('Search and Filter Integration', () => {
    beforeAll(async () => {
      // Create notes with different statuses and content for filtering
      await prisma.note.createMany({
        data: [
          {
            title: 'Published Marketing Note',
            description: 'Marketing strategy for Q4',
            body: 'Content about marketing campaigns',
            status: 'PUBLISHED',
            userId: user1Id,
            projectId: project1Id,
          },
          {
            title: 'Draft Technical Note',
            description: 'Technical documentation draft',
            body: 'API documentation and code examples',
            status: 'DRAFT',
            userId: user1Id,
          },
          {
            title: 'Private Personal Note',
            description: 'Personal thoughts and ideas',
            body: 'Private content not for sharing',
            status: 'PRIVATE',
            userId: user1Id,
          },
        ],
      })
    })

    it('should filter by status correctly', async () => {
      const draftResponse = await request(app)
        .get('/api/v1/notes?status=DRAFT')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(
        draftResponse.body.data.every(
          (note: { status: string }) => note.status === 'DRAFT',
        ),
      ).toBe(true)

      const publishedResponse = await request(app)
        .get('/api/v1/notes?status=PUBLISHED')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(
        publishedResponse.body.data.every(
          (note: { status: string }) => note.status === 'PUBLISHED',
        ),
      ).toBe(true)
    })

    it('should search across title, description, and body', async () => {
      // Search for "marketing"
      const marketingResponse = await request(app)
        .get('/api/v1/notes?search=marketing')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(marketingResponse.body.data.length).toBeGreaterThan(0)
      const foundNote = marketingResponse.body.data[0]
      expect(
        foundNote.title.toLowerCase().includes('marketing') ||
          foundNote.description?.toLowerCase().includes('marketing') ||
          foundNote.body?.toLowerCase().includes('marketing'),
      ).toBe(true)

      // Search for "API" (should find technical note)
      const apiResponse = await request(app)
        .get('/api/v1/notes?search=API')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(apiResponse.body.data.length).toBeGreaterThan(0)
    })

    it('should combine filters correctly', async () => {
      const response = await request(app)
        .get(
          `/api/v1/notes?status=PUBLISHED&projectId=${project1Id}&search=marketing`,
        )
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      response.body.data.forEach(
        (note: { status: string; projectId: number }) => {
          expect(note.status).toBe('PUBLISHED')
          expect(note.projectId).toBe(project1Id)
        },
      )
    })
  })

  describe('Pagination Integration', () => {
    beforeAll(async () => {
      // Create multiple notes for pagination testing
      const notes = Array.from({ length: 15 }, (_, i) => ({
        title: `Pagination Test Note ${i + 1}`,
        description: `Description for note ${i + 1}`,
        userId: user1Id,
        status: 'DRAFT' as const,
      }))

      await prisma.note.createMany({ data: notes })
    })

    it('should handle pagination correctly', async () => {
      // First page
      const page1Response = await request(app)
        .get('/api/v1/notes?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(page1Response.body.pagination.page).toBe(1)
      expect(page1Response.body.pagination.limit).toBe(5)
      expect(page1Response.body.data.length).toBe(5)
      expect(page1Response.body.pagination.total).toBeGreaterThanOrEqual(15)

      // Second page
      const page2Response = await request(app)
        .get('/api/v1/notes?page=2&limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(page2Response.body.pagination.page).toBe(2)
      expect(page2Response.body.data.length).toBe(5)

      // Verify different notes on different pages
      const page1Ids = page1Response.body.data.map(
        (note: { uuid: string }) => note.uuid,
      )
      const page2Ids = page2Response.body.data.map(
        (note: { uuid: string }) => note.uuid,
      )
      expect(page1Ids.some((id: string) => page2Ids.includes(id))).toBe(false)
    })

    it('should handle empty pages gracefully', async () => {
      const response = await request(app)
        .get('/api/v1/notes?page=999&limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.data).toEqual([])
      expect(response.body.pagination.page).toBe(999)
    })
  })

  describe('Error Recovery Integration', () => {
    it('should handle transaction rollback on constraint violations', async () => {
      // Attempt to create note with invalid foreign key
      const response = await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Invalid Project Note',
          projectId: 99999, // Non-existent project
        })

      expect([400, 500].includes(response.status)).toBe(true)

      // Verify no partial data was created
      const notesResponse = await request(app)
        .get('/api/v1/notes?search=Invalid Project Note')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(notesResponse.body.data.length).toBe(0)
    })

    it('should maintain data consistency during failures', async () => {
      const note = await prisma.note.create({
        data: {
          title: 'Consistency Test Note',
          userId: user1Id,
          status: 'DRAFT',
        },
      })

      // Mock a database error during update
      const originalUpdate = prisma.note.update
      prisma.note.update = jest
        .fn()
        .mockRejectedValueOnce(new Error('Database error'))

      const response = await request(app)
        .put(`/api/v1/notes/${note.uuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Should Not Update' })
        .expect(500)

      // Restore original method
      prisma.note.update = originalUpdate

      // Verify note was not updated
      const unchangedNote = await prisma.note.findUnique({
        where: { id: note.id },
      })
      expect(unchangedNote?.title).toBe('Consistency Test Note')

      // Cleanup
      await prisma.note.delete({ where: { id: note.id } })
    })
  })
})
