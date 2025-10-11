import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { PrismaClient, User } from '@prisma/client'
import {
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
  AuthUser,
  AuthTokens,
  LoginResponse,
  RegisterResponse,
  RefreshTokenResponse,
  JwtPayload,
} from './auth.types'

const prisma = new PrismaClient()

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'
  private readonly JWT_REFRESH_SECRET =
    process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret'
  private readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m'
  private readonly JWT_REFRESH_EXPIRES_IN =
    process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  private readonly BCRYPT_ROUNDS = 12

  // Login user
  async login(
    data: LoginRequest,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<LoginResponse> {
    const { email, password } = data

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    })

    if (!user) {
      throw new Error('Invalid email or password')
    }

    // Check if user is banned
    if (user.status === 'BANNED') {
      throw new Error('Account has been banned')
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const lockDuration = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / (1000 * 60),
      )
      throw new Error(`Account is locked. Try again in ${lockDuration} minutes`)
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      await this.handleFailedLogin(user.id)
      throw new Error('Invalid email or password')
    }

    // Reset failed login attempts on successful login
    await this.resetFailedLoginAttempts(user.id)

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
      },
    })

    // Generate tokens
    const tokens = await this.generateTokens(user)

    // Create session
    await this.createSession(user.id, tokens.accessToken, userAgent, ipAddress)

    return {
      user: this.formatUser(user),
      tokens,
    }
  }

  // Register new user
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const { name, email, password } = data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, this.BCRYPT_ROUNDS)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        status: 'PENDING', // Requires email verification
      },
    })

    // Create profile
    await prisma.profile.create({
      data: {
        userId: user.id,
        timezone: 'UTC',
        language: 'en',
        theme: 'LIGHT',
        visibility: 'PRIVATE',
      },
    })

    // Generate email verification token
    await this.generateEmailVerificationToken(user.id)

    return {
      user: this.formatUser(user),
      message:
        'Registration successful. Please check your email to verify your account.',
    }
  }

  // Refresh access token
  async refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const { refreshToken } = data

    try {
      // Verify refresh token
      const payload = jwt.verify(
        refreshToken,
        this.JWT_REFRESH_SECRET,
      ) as JwtPayload

      // Find user
      const user = await prisma.user.findUnique({
        where: { uuid: payload.uuid },
      })

      if (!user || user.status === 'BANNED') {
        throw new Error('Invalid refresh token')
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user)

      return { tokens }
    } catch {
      throw new Error('Invalid refresh token')
    }
  }

  // Logout user
  async logout(accessToken: string): Promise<void> {
    try {
      // Find and revoke session
      const session = await prisma.session.findFirst({
        where: {
          token: accessToken,
          revokedAt: null,
        },
      })

      if (session) {
        await prisma.session.update({
          where: { id: session.id },
          data: { revokedAt: new Date() },
        })
      }
    } catch {
      // Token might be invalid, but we still want to attempt cleanup
      console.warn('Logout cleanup failed')
    }
  }

  // Forgot password
  async forgotPassword(
    data: ForgotPasswordRequest,
  ): Promise<{ message: string }> {
    const { email } = data

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      // Don't reveal if email exists for security
      return {
        message: 'If the email exists, a password reset link has been sent.',
      }
    }

    // Generate reset token
    await this.generatePasswordResetToken(user.id)

    return {
      message: 'If the email exists, a password reset link has been sent.',
    }
  }

  // Reset password
  async resetPassword(
    data: ResetPasswordRequest,
  ): Promise<{ message: string }> {
    const { token, password } = data

    // Find valid reset token
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token,
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
      include: { user: true },
    })

    if (!resetToken) {
      throw new Error('Invalid or expired reset token')
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, this.BCRYPT_ROUNDS)

    // Update user password
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: {
        password: hashedPassword,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    })

    // Mark token as used
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    })

    // Revoke all sessions
    await prisma.session.updateMany({
      where: { userId: resetToken.userId },
      data: { revokedAt: new Date() },
    })

    return { message: 'Password has been reset successfully' }
  }

  // Verify email
  async verifyEmail(data: VerifyEmailRequest): Promise<{ message: string }> {
    const { token } = data

    // Find valid verification token
    const verificationToken = await prisma.passwordResetToken.findFirst({
      where: {
        token,
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
      include: { user: true },
    })

    if (!verificationToken) {
      throw new Error('Invalid or expired verification token')
    }

    // Update user status
    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: {
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
      },
    })

    // Mark token as used
    await prisma.passwordResetToken.update({
      where: { id: verificationToken.id },
      data: { usedAt: new Date() },
    })

    return { message: 'Email has been verified successfully' }
  }

  // Helper methods
  private async generateTokens(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = {
      uuid: user.uuid,
      email: user.email,
      role: user.role,
    }

    const accessToken = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    } as jwt.SignOptions)

    const refreshToken = jwt.sign(payload, this.JWT_REFRESH_SECRET, {
      expiresIn: this.JWT_REFRESH_EXPIRES_IN,
    } as jwt.SignOptions)

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
    }
  }

  private async createSession(
    userId: number,
    token: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<void> {
    await prisma.session.create({
      data: {
        userId,
        token,
        userAgent,
        ipAddress,
        lastActiveAt: new Date(),
      },
    })
  }

  private async handleFailedLogin(userId: number): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) return

    const attempts = user.failedLoginAttempts + 1
    const lockDuration = this.calculateLockDuration(attempts)

    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: attempts,
        lockedUntil:
          lockDuration > 0 ? new Date(Date.now() + lockDuration) : null,
      },
    })
  }

  private calculateLockDuration(attempts: number): number {
    if (attempts >= 5) return 30 * 60 * 1000 // 30 minutes
    if (attempts >= 3) return 15 * 60 * 1000 // 15 minutes
    return 0
  }

  private async resetFailedLoginAttempts(userId: number): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    })
  }

  private async generatePasswordResetToken(userId: number): Promise<void> {
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Delete existing unused tokens
    await prisma.passwordResetToken.deleteMany({
      where: {
        userId,
        usedAt: null,
      },
    })

    // Create new token
    await prisma.passwordResetToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    })
  }

  private async generateEmailVerificationToken(userId: number): Promise<void> {
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await prisma.passwordResetToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    })
  }

  private formatUser(user: User): AuthUser {
    return {
      id: user.id,
      uuid: user.uuid,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }
}
