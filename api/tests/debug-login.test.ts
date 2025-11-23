import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import { createApp } from '../src/app'
import { e2eTestHelpers, prisma } from './v1/e2e/e2e.helpers'

const app = createApp()

describe('Debug Login Test', () => {
  beforeAll(async () => {
    await e2eTestHelpers.cleanupDatabase()
  })

  afterAll(async () => {
    await e2eTestHelpers.cleanupDatabase()
    await e2eTestHelpers.disconnectDatabase()
  })

  it('should debug exact test failure', async () => {
    // Clean up any previous test data that might interfere (exactly like the failing test)
    await e2eTestHelpers.cleanupDatabase()
    const { user } = await e2eTestHelpers.createAuthenticatedUser()

    console.error('Created user:', { 
      id: user.id, 
      email: user.email, 
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt
    })

    // Check the password stored in database to make sure it's correct
    const userFromDb = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true, status: true, lockedUntil: true, failedLoginAttempts: true }
    })
    console.error('User from DB:', userFromDb)

    // First device login attempt (this is where it fails)
    const device1Response = await request(app)
      .post('/api/v1/auth/login')
      .set('User-Agent', 'Device1/1.0')
      .send({
        email: user.email,
        password: 'TestPassword123!',
      })

    console.error('Device 1 Status:', device1Response.status)
    console.error('Device 1 Body:', JSON.stringify(device1Response.body, null, 2))
    
    if (device1Response.status !== 200) {
      // Stop here and investigate
      throw new Error(`First login failed: ${JSON.stringify(device1Response.body)}`)
    }
  })
})