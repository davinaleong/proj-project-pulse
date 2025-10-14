/**
 * Crypto Utility
 *
 * Provides secure encryption, hashing, and token generation functions.
 * Uses industry-standard algorithms and best practices.
 */

import crypto from 'crypto'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { ENV } from '../config/env'

export interface TokenPayload {
  uuid: string
  email: string
  role: string
  [key: string]: unknown
}

export interface TokenOptions {
  expiresIn?: string
  issuer?: string
  audience?: string
}

export interface EncryptionResult {
  encrypted: string
  iv: string
  tag: string
}

/**
 * Password hashing utilities
 */
export class PasswordCrypto {
  private static readonly SALT_ROUNDS = 12

  /**
   * Hash a password using bcrypt
   */
  static async hash(password: string): Promise<string> {
    if (!password || password.length < 1) {
      throw new Error('Password cannot be empty')
    }

    return bcrypt.hash(password, this.SALT_ROUNDS)
  }

  /**
   * Verify a password against its hash
   */
  static async verify(password: string, hash: string): Promise<boolean> {
    if (!password || !hash) {
      return false
    }

    try {
      return await bcrypt.compare(password, hash)
    } catch {
      return false
    }
  }

  /**
   * Check password strength
   */
  static checkStrength(password: string): {
    score: number
    feedback: string[]
    isValid: boolean
  } {
    const feedback: string[] = []
    let score = 0

    if (!password) {
      return { score: 0, feedback: ['Password is required'], isValid: false }
    }

    // Length check
    if (password.length >= 8) {
      score += 1
    } else {
      feedback.push('Password must be at least 8 characters long')
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
      score += 1
    } else {
      feedback.push('Password must contain at least one uppercase letter')
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
      score += 1
    } else {
      feedback.push('Password must contain at least one lowercase letter')
    }

    // Number check
    if (/\d/.test(password)) {
      score += 1
    } else {
      feedback.push('Password must contain at least one number')
    }

    // Special character check
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/.test(password)) {
      score += 1
    } else {
      feedback.push('Password must contain at least one special character')
    }

    // Common patterns check
    const commonPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /admin/i,
      /letmein/i,
    ]

    if (commonPatterns.some((pattern) => pattern.test(password))) {
      score -= 1
      feedback.push('Password contains common patterns')
    }

    const isValid = score >= 4 && password.length >= 8
    return { score, feedback, isValid }
  }
}

/**
 * JWT token utilities
 */
export class TokenCrypto {
  private static readonly DEFAULT_EXPIRY: string = '24h'

  /**
   * Generate a JWT token
   */
  static generate(payload: TokenPayload, options?: TokenOptions): string {
    const signOptions: jwt.SignOptions = {}

    if (options?.expiresIn || this.DEFAULT_EXPIRY) {
      // @ts-expect-error - JWT types issue with string expiresIn
      signOptions.expiresIn = options?.expiresIn || this.DEFAULT_EXPIRY
    }

    if (options?.issuer) {
      signOptions.issuer = options.issuer
    } else {
      signOptions.issuer = 'project-pulse-api'
    }

    if (options?.audience) {
      signOptions.audience = options.audience
    } else {
      signOptions.audience = 'project-pulse-client'
    }

    return jwt.sign(payload, ENV.JWT_SECRET, signOptions)
  }

  /**
   * Verify and decode a JWT token
   */
  static verify(token: string): TokenPayload {
    try {
      return jwt.verify(token, ENV.JWT_SECRET) as TokenPayload
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token has expired')
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token')
      }
      throw new Error('Token verification failed')
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  static decode(token: string): TokenPayload | null {
    try {
      return jwt.decode(token) as TokenPayload
    } catch {
      return null
    }
  }

  /**
   * Generate a refresh token
   */
  static generateRefresh(payload: TokenPayload): string {
    return this.generate(payload, { expiresIn: '7d' })
  }

  /**
   * Generate a short-lived access token
   */
  static generateAccess(payload: TokenPayload): string {
    return this.generate(payload, { expiresIn: '15m' })
  }
}

/**
 * Encryption utilities for sensitive data
 */
export class EncryptionCrypto {
  private static readonly ALGORITHM = 'aes-256-gcm'
  private static readonly KEY_LENGTH = 32
  private static readonly IV_LENGTH = 16

  /**
   * Generate encryption key from password
   */
  private static deriveKey(password: string, salt: string): Buffer {
    return crypto.pbkdf2Sync(password, salt, 10000, this.KEY_LENGTH, 'sha256')
  }

  /**
   * Encrypt data
   */
  static encrypt(data: string, password?: string): EncryptionResult {
    const key = password
      ? this.deriveKey(password, ENV.JWT_SECRET)
      : Buffer.from(
          ENV.JWT_SECRET.padEnd(this.KEY_LENGTH, '0').substring(
            0,
            this.KEY_LENGTH,
          ),
        )

    const iv = crypto.randomBytes(this.IV_LENGTH)
    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv)

    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const tag = cipher.getAuthTag()

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
    }
  }

  /**
   * Decrypt data
   */
  static decrypt(
    encryptionResult: EncryptionResult,
    password?: string,
  ): string {
    const key = password
      ? this.deriveKey(password, ENV.JWT_SECRET)
      : Buffer.from(
          ENV.JWT_SECRET.padEnd(this.KEY_LENGTH, '0').substring(
            0,
            this.KEY_LENGTH,
          ),
        )

    const iv = Buffer.from(encryptionResult.iv, 'hex')
    const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv)
    decipher.setAuthTag(Buffer.from(encryptionResult.tag, 'hex'))

    let decrypted = decipher.update(encryptionResult.encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  }
}

/**
 * Random token generation utilities
 */
export class RandomCrypto {
  /**
   * Generate cryptographically secure random string
   */
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex')
  }

  /**
   * Generate URL-safe random string
   */
  static generateUrlSafeToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('base64url')
  }

  /**
   * Generate numeric code (for 2FA, etc.)
   */
  static generateNumericCode(digits: number = 6): string {
    const max = Math.pow(10, digits) - 1
    const min = Math.pow(10, digits - 1)
    return Math.floor(Math.random() * (max - min + 1) + min).toString()
  }

  /**
   * Generate UUID v4
   */
  static generateUUID(): string {
    return crypto.randomUUID()
  }

  /**
   * Generate password reset token
   */
  static generateResetToken(): string {
    return this.generateSecureToken(32)
  }

  /**
   * Generate API key
   */
  static generateApiKey(): string {
    const prefix = 'pk_'
    const key = this.generateSecureToken(24)
    return `${prefix}${key}`
  }

  /**
   * Generate session ID
   */
  static generateSessionId(): string {
    return this.generateSecureToken(48)
  }
}

/**
 * Hashing utilities for various purposes
 */
export class HashCrypto {
  /**
   * Generate MD5 hash (for non-security purposes only)
   */
  static md5(data: string): string {
    return crypto.createHash('md5').update(data).digest('hex')
  }

  /**
   * Generate SHA-256 hash
   */
  static sha256(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex')
  }

  /**
   * Generate SHA-512 hash
   */
  static sha512(data: string): string {
    return crypto.createHash('sha512').update(data).digest('hex')
  }

  /**
   * Generate HMAC signature
   */
  static hmacSha256(data: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(data).digest('hex')
  }

  /**
   * Verify HMAC signature
   */
  static verifyHmacSha256(
    data: string,
    signature: string,
    secret: string,
  ): boolean {
    const expectedSignature = this.hmacSha256(data, secret)
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex'),
    )
  }

  /**
   * Generate content hash for integrity checking
   */
  static contentHash(content: string): string {
    return this.sha256(content)
  }

  /**
   * Generate file hash
   */
  static fileHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex')
  }
}

/**
 * Two-factor authentication utilities
 */
export class TwoFactorCrypto {
  /**
   * Generate 2FA secret
   */
  static generateSecret(): string {
    return RandomCrypto.generateSecureToken(20)
  }

  /**
   * Generate backup codes
   */
  static generateBackupCodes(count: number = 10): string[] {
    return Array.from({ length: count }, () =>
      RandomCrypto.generateNumericCode(8),
    )
  }

  /**
   * Hash backup code for storage
   */
  static hashBackupCode(code: string): string {
    return HashCrypto.sha256(code + ENV.JWT_SECRET)
  }

  /**
   * Verify backup code
   */
  static verifyBackupCode(code: string, hash: string): boolean {
    return this.hashBackupCode(code) === hash
  }
}

/**
 * Utility functions
 */
export const cryptoUtils = {
  /**
   * Constant time string comparison
   */
  safeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false
    }

    try {
      return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
    } catch {
      return false
    }
  },

  /**
   * Generate secure random number
   */
  secureRandom(min: number, max: number): number {
    const range = max - min + 1
    const bytes = Math.ceil(Math.log2(range) / 8)
    const maxValue = Math.pow(256, bytes)
    const randomValue = crypto.randomBytes(bytes).readUIntBE(0, bytes)

    if (randomValue >= maxValue - (maxValue % range)) {
      return this.secureRandom(min, max)
    }

    return min + (randomValue % range)
  },

  /**
   * Mask sensitive data for logging
   */
  maskSensitive(data: string, visibleChars: number = 4): string {
    if (data.length <= visibleChars * 2) {
      return '*'.repeat(data.length)
    }

    const start = data.substring(0, visibleChars)
    const end = data.substring(data.length - visibleChars)
    const middle = '*'.repeat(data.length - visibleChars * 2)

    return `${start}${middle}${end}`
  },
}

// Export main classes and utilities
export {
  PasswordCrypto as Password,
  TokenCrypto as Token,
  EncryptionCrypto as Encryption,
  RandomCrypto as Random,
  HashCrypto as Hash,
  TwoFactorCrypto as TwoFactor,
}

export default {
  Password: PasswordCrypto,
  Token: TokenCrypto,
  Encryption: EncryptionCrypto,
  Random: RandomCrypto,
  Hash: HashCrypto,
  TwoFactor: TwoFactorCrypto,
  utils: cryptoUtils,
}
