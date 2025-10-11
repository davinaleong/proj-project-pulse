import bcrypt from 'bcrypt'
import crypto from 'crypto'
import prisma from '../../../config/db'
import {
  CreateUserData,
  UpdateUserData,
  ChangePasswordData,
  UserQuery,
  SafeUser,
} from './user.model'

export class UserService {
  private readonly SALT_ROUNDS = 12
  private readonly MAX_FAILED_ATTEMPTS = 5
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes

  // Get all users with pagination and filtering
  async getUsers(query: UserQuery) {
    const { page, limit, role, status, search, includeProfile } = query
    const skip = (page - 1) * limit

    const where = {
      deletedAt: null,
      ...(role && { role }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    }

    if (includeProfile) {
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            profile: {
              select: {
                id: true,
                bio: true,
                avatarUrl: true,
                timezone: true,
                language: true,
                theme: true,
                visibility: true,
              },
            },
          },
        }),
        prisma.user.count({ where }),
      ])

      return {
        data: users.map((user) => ({
          id: user.id,
          uuid: user.uuid,
          name: user.name,
          email: user.email,
          emailVerifiedAt: user.emailVerifiedAt,
          role: user.role,
          status: user.status,
          lastLoginAt: user.lastLoginAt,
          twoFactorEnabled: user.twoFactorEnabled,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          profile: user.profile,
        })) as SafeUser[],
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      }
    } else {
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          select: {
            id: true,
            uuid: true,
            name: true,
            email: true,
            emailVerifiedAt: true,
            role: true,
            status: true,
            lastLoginAt: true,
            twoFactorEnabled: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.user.count({ where }),
      ])

      return {
        data: users as SafeUser[],
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      }
    }
  }

  // Get user by UUID (safe - no password)
  async getUserByUuid(
    uuid: string,
    includeProfile = false,
  ): Promise<SafeUser | null> {
    if (includeProfile) {
      const user = await prisma.user.findFirst({
        where: {
          uuid,
          deletedAt: null,
        },
        include: {
          profile: {
            select: {
              id: true,
              bio: true,
              avatarUrl: true,
              timezone: true,
              language: true,
              theme: true,
              visibility: true,
            },
          },
        },
      })

      if (!user) return null

      return {
        id: user.id,
        uuid: user.uuid,
        name: user.name,
        email: user.email,
        emailVerifiedAt: user.emailVerifiedAt,
        role: user.role,
        status: user.status,
        lastLoginAt: user.lastLoginAt,
        twoFactorEnabled: user.twoFactorEnabled,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        profile: user.profile,
      } as SafeUser
    } else {
      const user = await prisma.user.findFirst({
        where: {
          uuid,
          deletedAt: null,
        },
        select: {
          id: true,
          uuid: true,
          name: true,
          email: true,
          emailVerifiedAt: true,
          role: true,
          status: true,
          lastLoginAt: true,
          twoFactorEnabled: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      return user as SafeUser | null
    }
  }

  // Get user by email (for authentication - includes password)
  async getUserByEmail(email: string) {
    return prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        deletedAt: null,
      },
    })
  }

  // Create new user
  async createUser(data: CreateUserData): Promise<SafeUser> {
    // Check if email already exists
    const existingUser = await this.getUserByEmail(data.email)
    if (existingUser) {
      throw new Error('Email already exists')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, this.SALT_ROUNDS)

    const user = await prisma.user.create({
      data: {
        ...data,
        email: data.email.toLowerCase(),
        password: hashedPassword,
      },
      select: {
        id: true,
        uuid: true,
        name: true,
        email: true,
        emailVerifiedAt: true,
        role: true,
        status: true,
        lastLoginAt: true,
        twoFactorEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return user as SafeUser
  }

  // Update user
  async updateUser(
    uuid: string,
    data: UpdateUserData,
  ): Promise<SafeUser | null> {
    const user = await this.getUserByUuid(uuid)
    if (!user) return null

    // Check email uniqueness if email is being updated
    if (data.email && data.email !== user.email) {
      const existingUser = await this.getUserByEmail(data.email)
      if (existingUser && existingUser.uuid !== uuid) {
        throw new Error('Email already exists')
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...data,
        ...(data.email && { email: data.email.toLowerCase() }),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        uuid: true,
        name: true,
        email: true,
        emailVerifiedAt: true,
        role: true,
        status: true,
        lastLoginAt: true,
        twoFactorEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return updatedUser as SafeUser
  }

  // Change password
  async changePassword(
    uuid: string,
    data: ChangePasswordData,
  ): Promise<boolean> {
    const user = await prisma.user.findFirst({
      where: { uuid, deletedAt: null },
    })

    if (!user) return false

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      data.currentPassword,
      user.password,
    )
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect')
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(data.newPassword, this.SALT_ROUNDS)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        failedLoginAttempts: 0, // Reset failed attempts
        lockedUntil: null, // Remove any lock
        updatedAt: new Date(),
      },
    })

    return true
  }

  // Soft delete user
  async deleteUser(uuid: string): Promise<boolean> {
    const user = await this.getUserByUuid(uuid)
    if (!user) return false

    await prisma.user.update({
      where: { id: user.id },
      data: { deletedAt: new Date() },
    })

    return true
  }

  // Verify password for login
  async verifyPassword(email: string, password: string) {
    const user = await this.getUserByEmail(email)
    if (!user) return null

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new Error(
        'Account is temporarily locked due to too many failed login attempts',
      )
    }

    // Check if account is active
    if (user.status !== 'ACTIVE') {
      throw new Error('Account is not active')
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      // Increment failed attempts
      const failedAttempts = user.failedLoginAttempts + 1
      const isLocked = failedAttempts >= this.MAX_FAILED_ATTEMPTS

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: failedAttempts,
          ...(isLocked && {
            lockedUntil: new Date(Date.now() + this.LOCKOUT_DURATION),
          }),
        },
      })

      if (isLocked) {
        throw new Error('Account locked due to too many failed login attempts')
      }

      return null
    }

    // Password is correct - reset failed attempts and update login info
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    })

    return {
      id: user.id,
      uuid: user.uuid,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt,
      lastLoginAt: new Date(),
      twoFactorEnabled: user.twoFactorEnabled,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    } as SafeUser
  }

  // Create password reset token
  async createPasswordResetToken(email: string): Promise<string | null> {
    const user = await this.getUserByEmail(email)
    if (!user || user.status !== 'ACTIVE') return null

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Delete any existing tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    })

    // Create new token
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    })

    return token
  }

  // Reset password with token
  async resetPasswordWithToken(
    token: string,
    newPassword: string,
  ): Promise<boolean> {
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    })

    if (!resetToken) {
      throw new Error('Invalid or expired reset token')
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS)

    // Update password and mark token as used
    await Promise.all([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: {
          password: hashedPassword,
          failedLoginAttempts: 0,
          lockedUntil: null,
          updatedAt: new Date(),
        },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ])

    return true
  }

  // Verify email
  async verifyEmail(uuid: string): Promise<boolean> {
    const user = await this.getUserByUuid(uuid)
    if (!user) return false

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: new Date(),
        status: 'ACTIVE', // Activate account when email is verified
        updatedAt: new Date(),
      },
    })

    return true
  }

  // Update login info (IP, timestamp)
  async updateLoginInfo(uuid: string, ipAddress: string): Promise<void> {
    const user = await this.getUserByUuid(uuid)
    if (!user) return

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
      },
    })
  }

  // Check if user has permission
  async hasPermission(uuid: string, requiredRole: string): Promise<boolean> {
    const user = await this.getUserByUuid(uuid)
    if (!user) return false

    const roleHierarchy = {
      USER: 0,
      MANAGER: 1,
      ADMIN: 2,
      SUPERADMIN: 3,
    }

    const userLevel =
      roleHierarchy[user.role as keyof typeof roleHierarchy] ?? 0
    const requiredLevel =
      roleHierarchy[requiredRole as keyof typeof roleHierarchy] ?? 0

    return userLevel >= requiredLevel
  }
}
