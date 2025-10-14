/**
 * Crypto Utility Tests
 *
 * Comprehensive unit tests for password hashing, JWT tokens,
 * encryption/decryption, and random generation utilities.
 */

import {
  PasswordCrypto,
  TokenCrypto,
  EncryptionCrypto,
  RandomCrypto,
} from '../../../src/utils/crypto'

// Mock environment for consistent testing
jest.mock('../../../src/config/env', () => ({
  ENV: {
    JWT_SECRET: 'test-jwt-secret-key-that-is-very-long-and-secure',
    ENCRYPTION_KEY: 'test-encryption-key-32-chars-12',
  },
}))

describe('PasswordCrypto', () => {
  describe('hash', () => {
    it('should hash a password successfully', async () => {
      const password = 'testPassword123!'
      const hash = await PasswordCrypto.hash(password)

      expect(hash).toBeDefined()
      expect(typeof hash).toBe('string')
      expect(hash).not.toBe(password)
      expect(hash.length).toBeGreaterThan(50) // bcrypt hashes are typically 60 characters
    })

    it('should generate different hashes for the same password', async () => {
      const password = 'testPassword123!'
      const hash1 = await PasswordCrypto.hash(password)
      const hash2 = await PasswordCrypto.hash(password)

      expect(hash1).not.toBe(hash2)
    })

    it('should handle empty password', async () => {
      const hash = await PasswordCrypto.hash('')
      expect(hash).toBeDefined()
      expect(typeof hash).toBe('string')
    })
  })

  describe('verify', () => {
    it('should verify correct password', async () => {
      const password = 'testPassword123!'
      const hash = await PasswordCrypto.hash(password)
      const isValid = await PasswordCrypto.verify(password, hash)

      expect(isValid).toBe(true)
    })

    it('should reject incorrect password', async () => {
      const password = 'testPassword123!'
      const wrongPassword = 'wrongPassword456!'
      const hash = await PasswordCrypto.hash(password)
      const isValid = await PasswordCrypto.verify(wrongPassword, hash)

      expect(isValid).toBe(false)
    })

    it('should handle invalid hash format', async () => {
      const password = 'testPassword123!'
      const invalidHash = 'invalid-hash'
      const isValid = await PasswordCrypto.verify(password, invalidHash)

      expect(isValid).toBe(false)
    })
  })

  describe('checkStrength', () => {
    it('should rate strong password highly', () => {
      const strongPassword = 'MyStr0ng!P@ssw0rd123'
      const result = PasswordCrypto.checkStrength(strongPassword)

      expect(result.isValid).toBe(true)
      expect(result.score).toBeGreaterThanOrEqual(4)
      expect(result.feedback).toHaveLength(0)
    })

    it('should identify weak password', () => {
      const weakPassword = '123'
      const result = PasswordCrypto.checkStrength(weakPassword)

      expect(result.isValid).toBe(false)
      expect(result.score).toBeLessThan(4)
      expect(result.feedback.length).toBeGreaterThan(0)
    })

    it('should provide specific feedback for missing requirements', () => {
      const passwordNoNumber = 'NoNumberPassword!'
      const result = PasswordCrypto.checkStrength(passwordNoNumber)

      expect(result.feedback).toContain(
        'Password must contain at least one number',
      )
    })

    it('should detect common patterns', () => {
      const commonPassword = 'password123'
      const result = PasswordCrypto.checkStrength(commonPassword)

      expect(result.feedback).toContain('Password contains common patterns')
    })
  })
})

describe('TokenCrypto', () => {
  const testPayload = {
    uuid: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    role: 'user',
  }

  describe('generate', () => {
    it('should generate a valid JWT token', () => {
      const token = TokenCrypto.generate(testPayload)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.').length).toBe(3) // JWT has 3 parts
    })

    it('should generate tokens with custom options', () => {
      const options = {
        expiresIn: '1h',
        issuer: 'test-issuer',
        audience: 'test-audience',
      }

      const token = TokenCrypto.generate(testPayload, options)
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.').length).toBe(3)
    })
  })

  describe('verify', () => {
    it('should verify valid token', () => {
      const token = TokenCrypto.generate(testPayload)
      const result = TokenCrypto.verify(token)

      expect(result).toMatchObject(testPayload)
    })

    it('should handle invalid token', () => {
      const invalidToken = 'invalid.token.here'

      expect(() => {
        TokenCrypto.verify(invalidToken)
      }).toThrow()
    })
  })

  describe('decode', () => {
    it('should decode token without verification', () => {
      const token = TokenCrypto.generate(testPayload)
      const decoded = TokenCrypto.decode(token)

      expect(decoded).toMatchObject(testPayload)
    })

    it('should return null for invalid token format', () => {
      const invalidToken = 'not-a-jwt-token'
      const decoded = TokenCrypto.decode(invalidToken)

      expect(decoded).toBeNull()
    })
  })

  describe('generateRefresh', () => {
    it('should generate refresh token', () => {
      const refreshToken = TokenCrypto.generateRefresh(testPayload)

      expect(refreshToken).toBeDefined()
      expect(typeof refreshToken).toBe('string')
      expect(refreshToken.split('.').length).toBe(3)
    })
  })

  describe('generateAccess', () => {
    it('should generate access token', () => {
      const accessToken = TokenCrypto.generateAccess(testPayload)

      expect(accessToken).toBeDefined()
      expect(typeof accessToken).toBe('string')
      expect(accessToken.split('.').length).toBe(3)
    })
  })
})

describe('EncryptionCrypto', () => {
  const testData = 'This is sensitive data that needs encryption!'

  describe('encrypt', () => {
    it('should encrypt data successfully', () => {
      const result = EncryptionCrypto.encrypt(testData)

      expect(result).toBeDefined()
      expect(result.encrypted).toBeDefined()
      expect(result.iv).toBeDefined()
      expect(result.tag).toBeDefined()
      expect(result.encrypted).not.toBe(testData)
    })

    it('should generate different results for same data', () => {
      const result1 = EncryptionCrypto.encrypt(testData)
      const result2 = EncryptionCrypto.encrypt(testData)

      expect(result1.encrypted).not.toBe(result2.encrypted)
      expect(result1.iv).not.toBe(result2.iv)
    })

    it('should handle empty string', () => {
      const result = EncryptionCrypto.encrypt('')

      expect(result).toBeDefined()
      expect(result.encrypted).toBeDefined()
    })
  })

  describe('decrypt', () => {
    it('should decrypt data successfully', () => {
      const encrypted = EncryptionCrypto.encrypt(testData)
      const decrypted = EncryptionCrypto.decrypt(encrypted)

      expect(decrypted).toBe(testData)
    })

    it('should handle invalid encryption data', () => {
      const invalidData = {
        encrypted: 'invalid',
        iv: 'invalid',
        tag: 'invalid',
      }

      expect(() => {
        EncryptionCrypto.decrypt(invalidData)
      }).toThrow()
    })
  })
})

describe('RandomCrypto', () => {
  describe('generateSecureToken', () => {
    it('should generate secure token of default length', () => {
      const token = RandomCrypto.generateSecureToken()

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.length).toBeGreaterThan(0)
    })

    it('should generate secure token of specified length', () => {
      const length = 16
      const token = RandomCrypto.generateSecureToken(length)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
    })

    it('should generate different tokens on each call', () => {
      const token1 = RandomCrypto.generateSecureToken()
      const token2 = RandomCrypto.generateSecureToken()

      expect(token1).not.toBe(token2)
    })
  })

  describe('generateUrlSafeToken', () => {
    it('should generate URL-safe token', () => {
      const token = RandomCrypto.generateUrlSafeToken()

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.length).toBeGreaterThan(0)

      // Should not contain URL-unsafe characters
      expect(token).not.toMatch(/[+/=]/)
    })
  })

  describe('generateNumericCode', () => {
    it('should generate numeric code of default length', () => {
      const code = RandomCrypto.generateNumericCode()

      expect(code).toBeDefined()
      expect(typeof code).toBe('string')
      expect(code.length).toBe(6) // default length
      expect(/^\d+$/.test(code)).toBe(true) // only digits
    })

    it('should generate numeric code of specified length', () => {
      const length = 4
      const code = RandomCrypto.generateNumericCode(length)

      expect(code).toBeDefined()
      expect(code.length).toBe(length)
      expect(/^\d+$/.test(code)).toBe(true)
    })
  })

  describe('generateUUID', () => {
    it('should generate valid UUID v4', () => {
      const uuid = RandomCrypto.generateUUID()

      expect(uuid).toBeDefined()
      expect(typeof uuid).toBe('string')

      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      expect(uuidRegex.test(uuid)).toBe(true)
    })

    it('should generate unique UUIDs', () => {
      const uuid1 = RandomCrypto.generateUUID()
      const uuid2 = RandomCrypto.generateUUID()

      expect(uuid1).not.toBe(uuid2)
    })
  })

  describe('generateResetToken', () => {
    it('should generate reset token', () => {
      const token = RandomCrypto.generateResetToken()

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.length).toBeGreaterThan(0)
    })

    it('should generate unique reset tokens', () => {
      const token1 = RandomCrypto.generateResetToken()
      const token2 = RandomCrypto.generateResetToken()

      expect(token1).not.toBe(token2)
    })
  })
})
