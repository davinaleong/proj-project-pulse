import request from 'supertest'
import { createApp } from '../../../../src/app'
import { sessionsTestHelpers, prisma } from './sessions.helpers'

const app = createApp()

describe('Sessions Management', () => {
  let authToken: string
  let userId: number
  let sessionId: number

  beforeAll(async () => {
    await sessionsTestHelpers.cleanupDatabase()
    const {
      user,
      session,
      authToken: token,
    } = await sessionsTestHelpers.setupTestData()
    userId = user.id
    sessionId = session.id
    authToken = token
  })

  afterAll(async () => {
    await sessionsTestHelpers.disconnectDatabase()
  })

  describe('DELETE /api/v1/sessions/:id', () => {
    let sessionToRevoke: number

    beforeEach(async () => {
      // Create a session to revoke
      const session = await sessionsTestHelpers.createTestSession(userId, {
        userAgent: 'Browser to revoke',
        ipAddress: '192.168.1.2',
        token: 'session-to-revoke-token',
      })
      sessionToRevoke = session.id
    })

    afterEach(async () => {
      // Clean up test session if it still exists
      await prisma.session.deleteMany({
        where: { id: sessionToRevoke },
      })
    })

    it('should revoke session successfully', async () => {
      const response = await request(app)
        .delete(`/api/v1/sessions/${sessionToRevoke}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Session revoked successfully')

      // Verify session was revoked in database
      const revokedSession = await prisma.session.findUnique({
        where: { id: sessionToRevoke },
      })
      expect(revokedSession?.revokedAt).toBeDefined()
      expect(revokedSession?.revokedAt).not.toBeNull()
    })

    it('should return 404 for non-existent session', async () => {
      const response = await request(app)
        .delete('/api/v1/sessions/99999')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
    })

    it('should return 400 for invalid session id', async () => {
      const response = await request(app)
        .delete('/api/v1/sessions/invalid')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(400)
    })

    it('should not allow revoking other users sessions', async () => {
      // Create another user and their session
      const otherUser = await sessionsTestHelpers.createTestUser({
        email: 'other@example.com',
        uuid: 'other-user-uuid',
      })
      const otherSession = await sessionsTestHelpers.createTestSession(
        otherUser.id,
      )

      const response = await request(app)
        .delete(`/api/v1/sessions/${otherSession.id}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404) // Should not find session for different user
    })

    it('should handle already revoked sessions gracefully', async () => {
      // First revocation
      await request(app)
        .delete(`/api/v1/sessions/${sessionToRevoke}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      // Second revocation attempt
      const response = await request(app)
        .delete(`/api/v1/sessions/${sessionToRevoke}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect([200, 404].includes(response.status)).toBe(true) // Either already revoked or not found
    })
  })

  describe('DELETE /api/v1/sessions', () => {
    let additionalSessions: number[]

    beforeEach(async () => {
      // Create multiple sessions for the user
      const sessions = await sessionsTestHelpers.createMultipleSessions(
        userId,
        3,
        [
          {
            userAgent: 'Browser 1',
            ipAddress: '192.168.1.10',
            token: 'session-token-1',
          },
          {
            userAgent: 'Browser 2',
            ipAddress: '192.168.1.11',
            token: 'session-token-2',
          },
          {
            userAgent: 'Browser 3',
            ipAddress: '192.168.1.12',
            token: 'session-token-3',
          },
        ],
      )
      additionalSessions = sessions.map((s) => s.id)
    })

    afterEach(async () => {
      // Clean up additional sessions
      await prisma.session.deleteMany({
        where: {
          id: { in: additionalSessions },
        },
      })
    })

    it('should revoke all user sessions except current', async () => {
      const response = await request(app)
        .delete('/api/v1/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-session-id', sessionId.toString())

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.revokedCount).toBeGreaterThan(0)

      // Verify current session is still active
      const currentSession = await prisma.session.findUnique({
        where: { id: sessionId },
      })
      expect(currentSession?.revokedAt).toBeNull()

      // Verify other sessions were revoked
      const otherSessions = await prisma.session.findMany({
        where: {
          userId,
          id: { not: sessionId },
        },
      })

      otherSessions.forEach((session) => {
        expect(session.revokedAt).not.toBeNull()
      })
    })

    it('should handle case when no additional sessions exist', async () => {
      // Clean up all additional sessions first
      await prisma.session.deleteMany({
        where: {
          userId,
          id: { not: sessionId },
        },
      })

      const response = await request(app)
        .delete('/api/v1/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-session-id', sessionId.toString())

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.revokedCount).toBe(0)
    })

    it('should require session ID header', async () => {
      const response = await request(app)
        .delete('/api/v1/sessions')
        .set('Authorization', `Bearer ${authToken}`)
      // Missing x-session-id header

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })

    it('should validate session ID header format', async () => {
      const response = await request(app)
        .delete('/api/v1/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-session-id', 'invalid-session-id')

      expect(response.status).toBe(400)
    })
  })

  describe('Session Lifecycle Management', () => {
    it('should handle session expiration logic', async () => {
      // Create an old session (simulate expired)
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 30) // 30 days ago

      const expiredSession = await sessionsTestHelpers.createTestSession(
        userId,
        {
          lastActiveAt: oldDate,
          userAgent: 'Expired Browser',
          token: 'expired-session-token',
        },
      )

      // Try to access sessions - expired ones might be filtered or marked
      const response = await request(app)
        .get('/api/v1/sessions')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)

      // Clean up
      await prisma.session.delete({ where: { id: expiredSession.id } })
    })

    it('should handle concurrent session revocations', async () => {
      const sessions = await sessionsTestHelpers.createMultipleSessions(
        userId,
        2,
      )

      // Attempt to revoke the same session concurrently
      const revokePromises = sessions.map((session) =>
        request(app)
          .delete(`/api/v1/sessions/${session.id}`)
          .set('Authorization', `Bearer ${authToken}`),
      )

      const responses = await Promise.all(revokePromises)

      // All requests should succeed (or handle gracefully)
      responses.forEach((response) => {
        expect([200, 404].includes(response.status)).toBe(true)
      })
    })

    it('should maintain session activity tracking', async () => {
      const testSession = await sessionsTestHelpers.createTestSession(userId, {
        userAgent: 'Activity Test Browser',
        token: 'activity-test-token',
      })

      // Update activity multiple times
      for (let i = 0; i < 3; i++) {
        await request(app)
          .put(`/api/v1/sessions/${testSession.id}/activity`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)

        // Small delay between updates
        await new Promise((resolve) => setTimeout(resolve, 10))
      }

      // Verify session activity was tracked
      const updatedSession = await prisma.session.findUnique({
        where: { id: testSession.id },
      })

      expect(updatedSession?.lastActiveAt).toBeDefined()

      // Clean up
      await prisma.session.delete({ where: { id: testSession.id } })
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed requests gracefully', async () => {
      const response = await request(app)
        .delete('/api/v1/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-session-id', sessionId.toString())
        .set('Content-Type', 'application/json')
        .send('invalid json')

      expect(response.status).toBe(200) // DELETE shouldn't require body
    })

    it('should handle database constraints properly', async () => {
      // Try to access a session that doesn't exist
      const response = await request(app)
        .put('/api/v1/sessions/999999/activity')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
    })
  })
})
