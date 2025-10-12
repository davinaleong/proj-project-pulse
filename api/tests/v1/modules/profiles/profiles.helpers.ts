import {
  PrismaClient,
  UserRole,
  UserStatus,
  Theme,
  Visibility,
} from '@prisma/client'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

export const profilesTestHelpers = {
  async cleanupDatabase() {
    await prisma.profile.deleteMany()
    await prisma.user.deleteMany()
  },

  async createTestUser(overrides?: {
    name?: string
    email?: string
    password?: string
    role?: UserRole
    status?: UserStatus
  }) {
    const hashedPassword = await bcrypt.hash(
      overrides?.password || 'TestPassword123!',
      12,
    )
    return prisma.user.create({
      data: {
        name: overrides?.name || 'Test User',
        email: overrides?.email || 'test@example.com',
        password: hashedPassword,
        role: overrides?.role || UserRole.USER,
        status: overrides?.status || UserStatus.ACTIVE,
      },
    })
  },

  async createTestProfile(
    userId: number,
    overrides?: {
      bio?: string
      avatarUrl?: string
      coverUrl?: string
      timezone?: string
      language?: string
      theme?: Theme
      visibility?: Visibility
      socialLinks?: object
      notifications?: object
    },
  ) {
    return prisma.profile.create({
      data: {
        userId: userId,
        bio: overrides?.bio || 'Test bio for user profile',
        avatarUrl: overrides?.avatarUrl || null,
        coverUrl: overrides?.coverUrl || null,
        timezone: overrides?.timezone || 'UTC',
        language: overrides?.language || 'en',
        theme: overrides?.theme || Theme.LIGHT,
        visibility: overrides?.visibility || Visibility.PUBLIC,
        socialLinks: overrides?.socialLinks || {
          website: 'https://example.com',
          github: 'https://github.com/testuser',
        },
        notifications: overrides?.notifications || {
          email: {
            projects: true,
            tasks: true,
            notes: true,
            mentions: true,
          },
          push: {
            projects: false,
            tasks: true,
            notes: false,
            mentions: true,
          },
          frequency: 'immediate',
        },
      },
    })
  },

  async createMultipleTestProfiles() {
    const users = await Promise.all([
      this.createTestUser({ name: 'Alice Smith', email: 'alice@example.com' }),
      this.createTestUser({ name: 'Bob Johnson', email: 'bob@example.com' }),
      this.createTestUser({
        name: 'Charlie Brown',
        email: 'charlie@example.com',
      }),
    ])

    const profiles = await Promise.all([
      this.createTestProfile(users[0].id, {
        bio: 'Frontend developer passionate about UX',
        theme: Theme.LIGHT,
        visibility: Visibility.PUBLIC,
        socialLinks: {
          website: 'https://alice.dev',
          linkedin: 'https://linkedin.com/in/alice',
        },
      }),
      this.createTestProfile(users[1].id, {
        bio: 'Backend engineer and DevOps enthusiast',
        theme: Theme.DARK,
        visibility: Visibility.PUBLIC,
        socialLinks: {
          github: 'https://github.com/bob',
          twitter: 'https://twitter.com/bob',
        },
      }),
      this.createTestProfile(users[2].id, {
        bio: 'Full-stack developer',
        theme: Theme.LIGHT,
        visibility: Visibility.PRIVATE,
        socialLinks: {
          website: 'https://charlie.dev',
        },
      }),
    ])

    return { users, profiles }
  },

  generateValidJWT(userId: number, role: UserRole = UserRole.USER) {
    return jwt.sign(
      { id: userId, role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' },
    )
  },

  async setupTestData() {
    const user = await this.createTestUser()
    const adminUser = await this.createTestUser({
      name: 'Admin User',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
    })

    const profile = await this.createTestProfile(user.id)
    const adminProfile = await this.createTestProfile(adminUser.id, {
      bio: 'System administrator',
      visibility: Visibility.PUBLIC,
    })

    const authToken = this.generateValidJWT(user.id)
    const adminToken = this.generateValidJWT(adminUser.id, UserRole.ADMIN)

    return {
      user,
      adminUser,
      profile,
      adminProfile,
      authToken,
      adminToken,
    }
  },

  async disconnectDatabase() {
    await prisma.$disconnect()
  },

  generateInvalidToken() {
    return 'invalid.jwt.token'
  },

  generateExpiredToken(userId: number) {
    return jwt.sign(
      { id: userId, role: UserRole.USER },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '-1h' }, // Expired token
    )
  },

  createValidProfileData() {
    return {
      bio: 'Software developer with 5+ years experience',
      timezone: 'America/New_York',
      language: 'en',
      theme: 'LIGHT',
      visibility: 'PUBLIC',
      socialLinks: {
        website: 'https://johndoe.dev',
        github: 'https://github.com/johndoe',
        linkedin: 'https://linkedin.com/in/johndoe',
      },
      notifications: {
        email: {
          projects: true,
          tasks: true,
          notes: false,
          mentions: true,
        },
        push: {
          projects: false,
          tasks: true,
          notes: false,
          mentions: true,
        },
        frequency: 'daily',
      },
    }
  },

  createInvalidProfileData() {
    return {
      bio: 'x'.repeat(501), // Bio too long
      timezone: 'Invalid/Timezone',
      language: 'invalid',
      theme: 'INVALID_THEME',
      visibility: 'INVALID_VISIBILITY',
      socialLinks: {
        website: 'not-a-valid-url',
        github: 'invalid-url',
        invalidPlatform: 'https://example.com',
      },
    }
  },
}

export { prisma }
