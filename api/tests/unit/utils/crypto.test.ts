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

      const decoded = TokenCrypto.verify(token)
      expect(decoded.isValid).toBe(true)
      expect(decoded.payload?.iss).toBe('test-issuer')
      expect(decoded.payload?.aud).toBe('test-audience')
    })
  })

  describe('verify', () => {
    it('should verify valid token', () => {
      const token = TokenCrypto.generate(testPayload)
      const result = TokenCrypto.verify(token)

      expect(result.isValid).toBe(true)
      expect(result.payload).toMatchObject(testPayload)
      expect(result.error).toBeUndefined()
    })

    it('should reject invalid token', () => {
      const invalidToken = 'invalid.token.here'
      const result = TokenCrypto.verify(invalidToken)

      expect(result.isValid).toBe(false)
      expect(result.payload).toBeUndefined()
      expect(result.error).toBeDefined()
    })

    it('should handle expired token gracefully', () => {
      // Create a token that expires immediately
      const expiredToken = TokenCrypto.generate(testPayload, {
        expiresIn: '0s',
      })

      // Wait a moment to ensure expiration
      setTimeout(() => {
        const result = TokenCrypto.verify(expiredToken)
        expect(result.isValid).toBe(false)
        expect(result.error).toContain('expired')
      }, 100)
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

  describe('refresh', () => {
    it('should refresh valid token', () => {
      const originalToken = TokenCrypto.generate(testPayload)
      const refreshed = TokenCrypto.refresh(originalToken)

      expect(refreshed.isValid).toBe(true)
      expect(refreshed.token).toBeDefined()
      expect(refreshed.token).not.toBe(originalToken)

      if (refreshed.payload) {
        expect(refreshed.payload.uuid).toBe(testPayload.uuid)
        expect(refreshed.payload.email).toBe(testPayload.email)
      }
    })

    it('should reject refresh of invalid token', () => {
      const invalidToken = 'invalid.token.here'
      const refreshed = TokenCrypto.refresh(invalidToken)

      expect(refreshed.isValid).toBe(false)
      expect(refreshed.token).toBeUndefined()
      expect(refreshed.error).toBeDefined()
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

  describe('encryptString', () => {
    it('should return base64 encoded string', () => {
      const result = EncryptionCrypto.encryptString(testData)

      expect(typeof result).toBe('string')
      expect(result).not.toBe(testData)

      // Should be valid base64
      expect(() => Buffer.from(result, 'base64')).not.toThrow()
    })
  })

  describe('decryptString', () => {
    it('should decrypt base64 encoded string', () => {
      const encrypted = EncryptionCrypto.encryptString(testData)
      const decrypted = EncryptionCrypto.decryptString(encrypted)

      expect(decrypted).toBe(testData)
    })

    it('should handle invalid base64 string', () => {
      const invalidString = 'not-valid-base64!'

      expect(() => {
        EncryptionCrypto.decryptString(invalidString)
      }).toThrow()
    })
  })
})

describe('RandomCrypto', () => {
  describe('generateBytes', () => {
    it('should generate random bytes of specified length', () => {
      const length = 32
      const bytes = RandomCrypto.generateBytes(length)

      expect(bytes).toBeDefined()
      expect(bytes.length).toBe(length)
    })

    it('should generate different bytes on each call', () => {
      const bytes1 = RandomCrypto.generateBytes(16)
      const bytes2 = RandomCrypto.generateBytes(16)

      expect(bytes1).not.toEqual(bytes2)
    })
  })

  describe('generateHex', () => {
    it('should generate hex string of specified length', () => {
      const length = 32
      const hex = RandomCrypto.generateHex(length)

      expect(hex).toBeDefined()
      expect(hex.length).toBe(length * 2) // hex is twice the byte length
      expect(/^[0-9a-f]+$/i.test(hex)).toBe(true)
    })
  })

  describe('generateBase64', () => {
    it('should generate base64 string', () => {
      const length = 32
      const base64 = RandomCrypto.generateBase64(length)

      expect(base64).toBeDefined()
      expect(typeof base64).toBe('string')

      // Should be valid base64
      expect(() => Buffer.from(base64, 'base64')).not.toThrow()
    })
  })

  describe('generateString', () => {
    it('should generate string with default charset', () => {
      const length = 20
      const str = RandomCrypto.generateString(length)

      expect(str).toBeDefined()
      expect(str.length).toBe(length)
      expect(/^[A-Za-z0-9]+$/.test(str)).toBe(true) // default charset
    })

    it('should generate string with custom charset', () => {
      const length = 10
      const charset = '0123456789'
      const str = RandomCrypto.generateString(length, charset)

      expect(str).toBeDefined()
      expect(str.length).toBe(length)
      expect(/^[0-9]+$/.test(str)).toBe(true)
    })
  })

  describe('generateNumber', () => {
    it('should generate number within range', () => {
      const min = 10
      const max = 100
      const num = RandomCrypto.generateNumber(min, max)

      expect(num).toBeGreaterThanOrEqual(min)
      expect(num).toBeLessThanOrEqual(max)
      expect(Number.isInteger(num)).toBe(true)
    })

    it('should handle single value range', () => {
      const value = 42
      const num = RandomCrypto.generateNumber(value, value)

      expect(num).toBe(value)
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

  describe('generatePassword', () => {
    it('should generate password with default options', () => {
      const password = RandomCrypto.generatePassword()

      expect(password).toBeDefined()
      expect(password.length).toBe(16) // default length

      // Should contain mixed case, numbers, and symbols
      expect(/[a-z]/.test(password)).toBe(true)
      expect(/[A-Z]/.test(password)).toBe(true)
      expect(/[0-9]/.test(password)).toBe(true)
      expect(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)).toBe(true)
    })

    it('should generate password with custom length', () => {
      const length = 24
      const password = RandomCrypto.generatePassword(length)

      expect(password.length).toBe(length)
    })

    it('should exclude symbols when specified', () => {
      const password = RandomCrypto.generatePassword(16, {
        includeSymbols: false,
      })

      expect(password).toBeDefined()
      expect(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)).toBe(false)
      expect(/[a-zA-Z0-9]/.test(password)).toBe(true)
    })

    it('should exclude similar characters when specified', () => {
      const password = RandomCrypto.generatePassword(16, {
        excludeSimilar: true,
      })

      expect(password).toBeDefined()
      // Should not contain 0, O, I, l, etc.
      expect(/[0OIl]/.test(password)).toBe(false)
    })
  })
})
