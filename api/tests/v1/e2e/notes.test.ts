import request from 'supertest'
import { createApp } from '../../../src/app'
import prisma from '../../../src/config/db'
import { Application } from 'express'

describe('Notes API E2E Tests', () => {
  let app: Application
  let authToken: string
  let userId: number

  beforeAll(async () => {
    app = createApp()

    // Setup test user
    const user = await prisma.user.create({
      data: {
        name: 'E2E Test User',
        email: 'e2e@example.com',
        password: 'hashedpassword',
        role: 'USER',
        status: 'ACTIVE',
      },
    })
    userId = user.id
    authToken = 'mock-jwt-token'
  })

  afterAll(async () => {
    // Cleanup
    await prisma.note.deleteMany({ where: { userId } })
    await prisma.user.delete({ where: { id: userId } })
    await prisma.$disconnect()
  })

  describe('API Health and Availability', () => {
    it('should have healthy API endpoints', async () => {
      // Check main health endpoint
      await request(app).get('/health').expect(200)

      // Check v1 API health
      await request(app).get('/api/v1/health').expect(200)
    })

    it('should handle OPTIONS requests for CORS', async () => {
      await request(app).options('/api/v1/notes').expect(200)
    })
  })

  describe('Real-world Usage Scenarios', () => {
    let projectNoteUuid: string
    let personalNoteUuid: string

    it('should handle typical user workflow: project notes', async () => {
      // Create project
      const project = await prisma.project.create({
        data: {
          title: 'E2E Test Project',
          description: 'Project for E2E testing',
          userId: userId,
          stage: 'PLANNING',
        },
      })

      // Create project meeting notes
      const meetingNoteResponse = await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Project Kickoff Meeting',
          description: 'Notes from the initial project meeting',
          body: `
            ## Attendees
            - John Doe (PM)
            - Jane Smith (Developer)
            - Bob Wilson (Designer)
            
            ## Agenda
            1. Project overview
            2. Timeline discussion
            3. Resource allocation
            
            ## Action Items
            - [ ] Create wireframes
            - [ ] Set up development environment
            - [ ] Schedule weekly standup
          `,
          status: 'PUBLISHED',
          projectId: project.id,
        })
        .expect(201)

      projectNoteUuid = meetingNoteResponse.body.data.uuid

      // Create project technical notes
      await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Technical Architecture',
          description: 'System design and architecture decisions',
          body: `
            ## Tech Stack
            - Frontend: React + TypeScript
            - Backend: Node.js + Express
            - Database: PostgreSQL
            - ORM: Prisma
            
            ## Architecture Decisions
            1. Microservices vs Monolith: Starting with monolith
            2. Authentication: JWT tokens
            3. API Design: RESTful with GraphQL consideration
          `,
          status: 'DRAFT',
          projectId: project.id,
        })
        .expect(201)

      // Cleanup project
      await prisma.project.delete({ where: { id: project.id } })
    })

    it('should handle personal note-taking workflow', async () => {
      // Create personal learning note
      const learningNoteResponse = await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'JavaScript Learning Notes',
          description: 'Personal notes on JavaScript concepts',
          body: `
            ## ES6+ Features
            - Arrow functions
            - Destructuring
            - Promises and async/await
            - Modules
            
            ## Advanced Concepts
            - Closures
            - Prototypal inheritance
            - Event loop
            - Memory management
          `,
          status: 'PRIVATE',
        })
        .expect(201)

      personalNoteUuid = learningNoteResponse.body.data.uuid

      // Update note with new learnings
      await request(app)
        .put(`/api/v1/notes/${personalNoteUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          body: `
            ## ES6+ Features
            - Arrow functions ✓
            - Destructuring ✓
            - Promises and async/await ✓
            - Modules ✓
            
            ## Advanced Concepts
            - Closures ✓
            - Prototypal inheritance (in progress)
            - Event loop
            - Memory management
            
            ## New Topics
            - Web Workers
            - Service Workers
            - WebAssembly basics
          `,
        })
        .expect(200)
    })

    it('should handle knowledge base workflow', async () => {
      // Create public knowledge base entries
      const troubleshootingNote = await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Database Connection Troubleshooting',
          description: 'Common database connection issues and solutions',
          body: `
            ## Common Issues
            
            ### Connection Timeout
            **Symptoms:** Database queries hang indefinitely
            **Solution:** Check connection pool settings
            
            ### Authentication Failed
            **Symptoms:** Access denied errors
            **Solution:** Verify credentials and permissions
            
            ### Port Not Available
            **Symptoms:** ECONNREFUSED errors
            **Solution:** Check if database service is running
          `,
          status: 'PUBLIC',
        })
        .expect(201)

      // Search knowledge base
      const searchResponse = await request(app)
        .get('/api/v1/notes?search=database connection&status=PUBLIC')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(searchResponse.body.data.length).toBeGreaterThan(0)
      const foundNote = searchResponse.body.data.find(
        (note: { uuid: string }) =>
          note.uuid === troubleshootingNote.body.data.uuid,
      )
      expect(foundNote).toBeDefined()
    })
  })

  describe('Performance and Load Testing', () => {
    it('should handle bulk note creation', async () => {
      const notes = Array.from({ length: 10 }, (_, i) => ({
        title: `Bulk Note ${i + 1}`,
        description: `Description for bulk note ${i + 1}`,
        status: 'DRAFT',
      }))

      // Create multiple notes concurrently
      const promises = notes.map((note) =>
        request(app)
          .post('/api/v1/notes')
          .set('Authorization', `Bearer ${authToken}`)
          .send(note),
      )

      const responses = await Promise.all(promises)

      // All should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(201)
      })

      // Verify all notes were created
      const listResponse = await request(app)
        .get('/api/v1/notes?search=Bulk Note')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(listResponse.body.data.length).toBe(10)
    })

    it('should handle rapid sequential requests', async () => {
      // Create a note for rapid updates
      const noteResponse = await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Rapid Update Test',
          description: 'Testing rapid sequential updates',
          status: 'DRAFT',
        })
        .expect(201)

      const noteUuid = noteResponse.body.data.uuid

      // Perform rapid sequential updates
      const updatePromises = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .put(`/api/v1/notes/${noteUuid}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            description: `Updated description ${i + 1}`,
          }),
      )

      const updateResponses = await Promise.allSettled(updatePromises)

      // Most should succeed (some might conflict)
      const successes = updateResponses.filter(
        (result) =>
          result.status === 'fulfilled' && result.value.status === 200,
      )
      expect(successes.length).toBeGreaterThan(0)
    })
  })

  describe('Data Validation and Security', () => {
    it('should prevent SQL injection attempts', async () => {
      const maliciousData = {
        title: "'; DROP TABLE notes; --",
        description: "1' OR '1'='1",
        body: 'UNION SELECT * FROM users',
      }

      const response = await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(maliciousData)
        .expect(201)

      // Data should be stored safely
      expect(response.body.data.title).toBe(maliciousData.title)

      // Verify database integrity
      const notesCount = await prisma.note.count({ where: { userId } })
      expect(notesCount).toBeGreaterThan(0) // Table still exists
    })

    it('should handle extremely large content', async () => {
      const largeContent = 'x'.repeat(50000) // 50KB of content

      const response = await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Large Content Test',
          body: largeContent,
        })

      // Should either succeed or fail gracefully
      expect([201, 413].includes(response.status)).toBe(true)

      if (response.status === 201) {
        expect(response.body.data.body).toBe(largeContent)
      }
    })

    it('should validate UUID format in routes', async () => {
      const invalidUuids = [
        'not-a-uuid',
        '123',
        'invalid-uuid-format',
        '550e8400-e29b-41d4-a716', // incomplete UUID
      ]

      for (const invalidUuid of invalidUuids) {
        const response = await request(app)
          .get(`/api/v1/notes/${invalidUuid}`)
          .set('Authorization', `Bearer ${authToken}`)

        expect(response.status).toBe(404)
      }
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should handle network timeouts gracefully', async () => {
      // Simulate slow request by creating many notes
      const slowRequest = request(app)
        .get('/api/v1/notes?limit=100')
        .set('Authorization', `Bearer ${authToken}`)
        .timeout(5000) // 5 second timeout

      await expect(slowRequest).resolves.toBeDefined()
    })

    it('should handle malformed JSON requests', async () => {
      const response = await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400)

      expect(response.body.error).toBeDefined()
    })

    it('should handle missing required headers', async () => {
      // Missing Content-Type
      const response1 = await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Test' })

      expect([200, 201, 400].includes(response1.status)).toBe(true)

      // Missing Authorization
      const response2 = await request(app)
        .post('/api/v1/notes')
        .send({ title: 'Test' })
        .expect(401)

      expect(response2.body.error).toBeDefined()
    })
  })

  describe('API Documentation Compliance', () => {
    it('should return consistent response format', async () => {
      // Create note
      const createResponse = await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Format Test Note',
          description: 'Testing response format',
        })
        .expect(201)

      // Check create response format
      expect(createResponse.body).toHaveProperty('success', true)
      expect(createResponse.body).toHaveProperty('data')
      expect(createResponse.body).toHaveProperty('message')
      expect(createResponse.body.data).toHaveProperty('uuid')
      expect(createResponse.body.data).toHaveProperty('title')
      expect(createResponse.body.data).toHaveProperty('createdAt')
      expect(createResponse.body.data).toHaveProperty('updatedAt')

      const noteUuid = createResponse.body.data.uuid

      // Check list response format
      const listResponse = await request(app)
        .get('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(listResponse.body).toHaveProperty('success', true)
      expect(listResponse.body).toHaveProperty('data')
      expect(listResponse.body).toHaveProperty('pagination')
      expect(listResponse.body.pagination).toHaveProperty('page')
      expect(listResponse.body.pagination).toHaveProperty('limit')
      expect(listResponse.body.pagination).toHaveProperty('total')
      expect(listResponse.body.pagination).toHaveProperty('pages')

      // Check error response format
      const errorResponse = await request(app)
        .get('/api/v1/notes/invalid-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)

      expect(errorResponse.body).toHaveProperty('error')
    })

    it('should include proper HTTP status codes', async () => {
      const noteResponse = await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Status Code Test' })
        .expect(201) // Created

      const noteUuid = noteResponse.body.data.uuid

      await request(app)
        .get(`/api/v1/notes/${noteUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200) // OK

      await request(app)
        .put(`/api/v1/notes/${noteUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated' })
        .expect(200) // OK

      await request(app)
        .delete(`/api/v1/notes/${noteUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200) // OK

      await request(app)
        .get(`/api/v1/notes/${noteUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404) // Not Found

      await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: '' }) // Invalid data
        .expect(400) // Bad Request

      await request(app)
        .get('/api/v1/notes')
        // Missing auth
        .expect(401) // Unauthorized
    })
  })
})
