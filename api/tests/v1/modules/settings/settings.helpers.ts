import {
  PrismaClient,
  UserRole,
  UserStatus,
  SettingVisibility,
} from '@prisma/client'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

export const settingsTestHelpers = {
  async cleanupDatabase() {
    await prisma.setting.deleteMany()
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

  async createTestSetting(
    userId: number,
    overrides?: {
      key?: string
      value?: string
      type?: string
      category?: string
      visibility?: SettingVisibility
    },
  ) {
    return prisma.setting.create({
      data: {
        key: overrides?.key || 'test_setting',
        value: overrides?.value || 'test_value',
        type: overrides?.type || 'string',
        category: overrides?.category || 'test',
        visibility: overrides?.visibility || SettingVisibility.USER,
        userId: userId,
      },
    })
  },

  generateMockAuthToken(user: { id: number; email: string; role: UserRole }) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' },
    )
  },

  async setupTestData() {
    const user = await this.createTestUser()
    const authToken = this.generateMockAuthToken({
      id: user.id,
      email: user.email,
      role: user.role,
    })

    return {
      user,
      authToken,
    }
  },

  async setupAdminTestData() {
    const adminUser = await this.createTestUser({
      name: 'Admin User',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
    })
    const adminToken = this.generateMockAuthToken({
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
    })

    return {
      adminUser,
      adminToken,
    }
  },

  async setupSuperAdminTestData() {
    const superAdminUser = await this.createTestUser({
      name: 'Super Admin User',
      email: 'superadmin@example.com',
      role: UserRole.SUPERADMIN,
    })
    const superAdminToken = this.generateMockAuthToken({
      id: superAdminUser.id,
      email: superAdminUser.email,
      role: superAdminUser.role,
    })

    return {
      superAdminUser,
      superAdminToken,
    }
  },

  async createTestSettings(userId: number) {
    const userSetting = await this.createTestSetting(userId, {
      key: 'user_preference',
      value: 'dark_mode',
      category: 'appearance',
      visibility: SettingVisibility.USER,
    })

    const adminSetting = await this.createTestSetting(userId, {
      key: 'admin_config',
      value: 'enabled',
      category: 'admin',
      visibility: SettingVisibility.ADMIN,
    })

    const systemSetting = await this.createTestSetting(userId, {
      key: 'system_config',
      value: 'production',
      category: 'system',
      visibility: SettingVisibility.SYSTEM,
    })

    return {
      userSetting,
      adminSetting,
      systemSetting,
    }
  },

  async disconnectDatabase() {
    await prisma.$disconnect()
  },
}

export { prisma }
