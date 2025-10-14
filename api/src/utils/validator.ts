/**
 * Validator Utility
 *
 * Provides comprehensive input validation, sanitization, and schema validation.
 * Focuses on security and data integrity with detailed error reporting.
 */

import { z } from 'zod'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  sanitizedValue?: unknown
}

export interface ValidationOptions {
  required?: boolean
  minLength?: number
  maxLength?: number
  allowEmpty?: boolean
  trim?: boolean
  customMessage?: string
}

/**
 * String validation utilities
 */
export class StringValidator {
  /**
   * Validate and sanitize a string
   */
  static validate(
    value: unknown,
    options: ValidationOptions = {},
  ): ValidationResult {
    const errors: string[] = []

    // Type check
    if (typeof value !== 'string') {
      if (options.required) {
        errors.push(options.customMessage || 'Value must be a string')
        return { isValid: false, errors }
      }
      return { isValid: true, errors: [], sanitizedValue: undefined }
    }

    // Trim if requested
    const sanitizedValue = options.trim !== false ? value.trim() : value

    // Required check
    if (options.required && (!sanitizedValue || sanitizedValue.length === 0)) {
      errors.push(options.customMessage || 'Value is required')
    }

    // Empty check
    if (!options.allowEmpty && sanitizedValue.length === 0) {
      errors.push(options.customMessage || 'Value cannot be empty')
    }

    // Length checks
    if (options.minLength && sanitizedValue.length < options.minLength) {
      errors.push(
        options.customMessage ||
          `Value must be at least ${options.minLength} characters long`,
      )
    }

    if (options.maxLength && sanitizedValue.length > options.maxLength) {
      errors.push(
        options.customMessage ||
          `Value must be at most ${options.maxLength} characters long`,
      )
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: errors.length === 0 ? sanitizedValue : undefined,
    }
  }

  /**
   * Validate email format
   */
  static validateEmail(email: unknown): ValidationResult {
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

    const stringResult = this.validate(email, { required: true, trim: true })
    if (!stringResult.isValid) {
      return stringResult
    }

    const emailValue = stringResult.sanitizedValue as string

    if (!emailRegex.test(emailValue)) {
      return {
        isValid: false,
        errors: ['Invalid email format'],
      }
    }

    // Additional email security checks
    const errors: string[] = []

    // Check for suspicious patterns
    if (emailValue.includes('..')) {
      errors.push('Email contains consecutive dots')
    }

    if (emailValue.startsWith('.') || emailValue.endsWith('.')) {
      errors.push('Email cannot start or end with a dot')
    }

    if (emailValue.includes(' ')) {
      errors.push('Email cannot contain spaces')
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue:
        errors.length === 0 ? emailValue.toLowerCase() : undefined,
    }
  }

  /**
   * Validate UUID format
   */
  static validateUUID(uuid: unknown): ValidationResult {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

    const stringResult = this.validate(uuid, { required: true, trim: true })
    if (!stringResult.isValid) {
      return stringResult
    }

    const uuidValue = stringResult.sanitizedValue as string

    if (!uuidRegex.test(uuidValue)) {
      return {
        isValid: false,
        errors: ['Invalid UUID format'],
      }
    }

    return {
      isValid: true,
      errors: [],
      sanitizedValue: uuidValue.toLowerCase(),
    }
  }

  /**
   * Validate and sanitize HTML content
   */
  static validateHTML(
    html: unknown,
    options: { allowTags?: string[]; maxLength?: number } = {},
  ): ValidationResult {
    const stringResult = this.validate(html, { required: true })
    if (!stringResult.isValid) {
      return stringResult
    }

    const htmlValue = stringResult.sanitizedValue as string
    const errors: string[] = []

    // Length check
    if (options.maxLength && htmlValue.length > options.maxLength) {
      errors.push(
        `HTML content must be at most ${options.maxLength} characters`,
      )
    }

    // Basic security checks
    const dangerousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<iframe\b[^>]*>/gi,
      /<object\b[^>]*>/gi,
      /<embed\b[^>]*>/gi,
      /<form\b[^>]*>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /on\w+\s*=/gi, // Event handlers like onclick, onload, etc.
    ]

    for (const pattern of dangerousPatterns) {
      if (pattern.test(htmlValue)) {
        errors.push('HTML contains potentially dangerous content')
        break
      }
    }

    // If allowTags is specified, check against allowed tags
    if (options.allowTags && options.allowTags.length > 0) {
      const tagRegex = /<\/?([a-zA-Z0-9]+)(?:\s[^>]*)?>/g
      const matches = htmlValue.match(tagRegex)

      if (matches) {
        for (const match of matches) {
          const tagMatch = match.match(/<\/?([a-zA-Z0-9]+)/)
          if (
            tagMatch &&
            !options.allowTags.includes(tagMatch[1].toLowerCase())
          ) {
            errors.push(`HTML contains disallowed tag: ${tagMatch[1]}`)
            break
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: errors.length === 0 ? htmlValue : undefined,
    }
  }
}

/**
 * Number validation utilities
 */
export class NumberValidator {
  /**
   * Validate and sanitize a number
   */
  static validate(
    value: unknown,
    options: {
      required?: boolean
      min?: number
      max?: number
      integer?: boolean
      positive?: boolean
      customMessage?: string
    } = {},
  ): ValidationResult {
    const errors: string[] = []
    let sanitizedValue: number | undefined

    // Type conversion and validation
    if (typeof value === 'string') {
      const parsed = Number(value)
      if (isNaN(parsed)) {
        if (options.required) {
          errors.push(options.customMessage || 'Value must be a valid number')
        }
        return { isValid: false, errors }
      }
      sanitizedValue = parsed
    } else if (typeof value === 'number') {
      if (isNaN(value) || !isFinite(value)) {
        errors.push(
          options.customMessage || 'Value must be a valid finite number',
        )
        return { isValid: false, errors }
      }
      sanitizedValue = value
    } else {
      if (options.required) {
        errors.push(options.customMessage || 'Value must be a number')
      }
      return { isValid: !options.required, errors }
    }

    // Required check
    if (options.required && sanitizedValue === undefined) {
      errors.push(options.customMessage || 'Value is required')
    }

    if (sanitizedValue !== undefined) {
      // Integer check
      if (options.integer && !Number.isInteger(sanitizedValue)) {
        errors.push(options.customMessage || 'Value must be an integer')
      }

      // Positive check
      if (options.positive && sanitizedValue <= 0) {
        errors.push(options.customMessage || 'Value must be positive')
      }

      // Range checks
      if (options.min !== undefined && sanitizedValue < options.min) {
        errors.push(
          options.customMessage || `Value must be at least ${options.min}`,
        )
      }

      if (options.max !== undefined && sanitizedValue > options.max) {
        errors.push(
          options.customMessage || `Value must be at most ${options.max}`,
        )
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: errors.length === 0 ? sanitizedValue : undefined,
    }
  }
}

/**
 * Array validation utilities
 */
export class ArrayValidator {
  /**
   * Validate and sanitize an array
   */
  static validate<T>(
    value: unknown,
    options: {
      required?: boolean
      minLength?: number
      maxLength?: number
      uniqueItems?: boolean
      itemValidator?: (item: unknown) => ValidationResult
      customMessage?: string
    } = {},
  ): ValidationResult {
    const errors: string[] = []
    let sanitizedValue: T[] | undefined

    // Type check
    if (!Array.isArray(value)) {
      if (options.required) {
        errors.push(options.customMessage || 'Value must be an array')
      }
      return { isValid: !options.required, errors }
    }

    sanitizedValue = value as T[]

    // Required check
    if (options.required && sanitizedValue.length === 0) {
      errors.push(options.customMessage || 'Array cannot be empty')
    }

    // Length checks
    if (options.minLength && sanitizedValue.length < options.minLength) {
      errors.push(
        options.customMessage ||
          `Array must have at least ${options.minLength} items`,
      )
    }

    if (options.maxLength && sanitizedValue.length > options.maxLength) {
      errors.push(
        options.customMessage ||
          `Array must have at most ${options.maxLength} items`,
      )
    }

    // Unique items check
    if (options.uniqueItems) {
      const uniqueItems = new Set(
        sanitizedValue.map((item) => JSON.stringify(item)),
      )
      if (uniqueItems.size !== sanitizedValue.length) {
        errors.push(options.customMessage || 'Array must contain unique items')
      }
    }

    // Validate individual items
    if (options.itemValidator && sanitizedValue.length > 0) {
      const validatedItems: T[] = []
      let hasItemErrors = false

      for (let i = 0; i < sanitizedValue.length; i++) {
        const itemResult = options.itemValidator(sanitizedValue[i])
        if (!itemResult.isValid) {
          errors.push(`Item at index ${i}: ${itemResult.errors.join(', ')}`)
          hasItemErrors = true
        } else if (itemResult.sanitizedValue !== undefined) {
          validatedItems.push(itemResult.sanitizedValue as T)
        }
      }

      if (!hasItemErrors) {
        sanitizedValue = validatedItems
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: errors.length === 0 ? sanitizedValue : undefined,
    }
  }
}

/**
 * Date validation utilities
 */
export class DateValidator {
  /**
   * Validate and sanitize a date
   */
  static validate(
    value: unknown,
    options: {
      required?: boolean
      minDate?: Date
      maxDate?: Date
      format?: 'iso' | 'timestamp'
      customMessage?: string
    } = {},
  ): ValidationResult {
    const errors: string[] = []
    let sanitizedValue: Date | undefined

    // Type conversion and validation
    if (value instanceof Date) {
      if (isNaN(value.getTime())) {
        errors.push(options.customMessage || 'Invalid date')
        return { isValid: false, errors }
      }
      sanitizedValue = value
    } else if (typeof value === 'string') {
      const parsed = new Date(value)
      if (isNaN(parsed.getTime())) {
        errors.push(options.customMessage || 'Invalid date format')
        return { isValid: false, errors }
      }
      sanitizedValue = parsed
    } else if (typeof value === 'number') {
      const parsed = new Date(value)
      if (isNaN(parsed.getTime())) {
        errors.push(options.customMessage || 'Invalid timestamp')
        return { isValid: false, errors }
      }
      sanitizedValue = parsed
    } else {
      if (options.required) {
        errors.push(options.customMessage || 'Date is required')
      }
      return { isValid: !options.required, errors }
    }

    // Required check
    if (options.required && !sanitizedValue) {
      errors.push(options.customMessage || 'Date is required')
    }

    if (sanitizedValue) {
      // Range checks
      if (options.minDate && sanitizedValue < options.minDate) {
        errors.push(
          options.customMessage ||
            `Date must be after ${options.minDate.toISOString()}`,
        )
      }

      if (options.maxDate && sanitizedValue > options.maxDate) {
        errors.push(
          options.customMessage ||
            `Date must be before ${options.maxDate.toISOString()}`,
        )
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: errors.length === 0 ? sanitizedValue : undefined,
    }
  }
}

/**
 * Schema validation utilities using Zod
 */
export class SchemaValidator {
  /**
   * Validate data against a Zod schema
   */
  static validate<T>(data: unknown, schema: z.ZodSchema<T>): ValidationResult {
    try {
      const result = schema.parse(data)
      return {
        isValid: true,
        errors: [],
        sanitizedValue: result,
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.issues.map((err: z.ZodIssue) => {
          const path = err.path.length > 0 ? `${err.path.join('.')}: ` : ''
          return `${path}${err.message}`
        })

        return {
          isValid: false,
          errors,
        }
      }

      return {
        isValid: false,
        errors: ['Unknown validation error'],
      }
    }
  }

  /**
   * Common schemas for API validation
   */
  static readonly schemas = {
    // User schemas
    userCreate: z.object({
      email: z.string().email('Invalid email format').toLowerCase(),
      password: z.string().min(8, 'Password must be at least 8 characters'),
      name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
      role: z.enum(['admin', 'user']).optional().default('user'),
    }),

    userUpdate: z.object({
      email: z.string().email('Invalid email format').toLowerCase().optional(),
      name: z
        .string()
        .min(1, 'Name is required')
        .max(100, 'Name too long')
        .optional(),
      role: z.enum(['admin', 'user']).optional(),
    }),

    // Project schemas
    projectCreate: z.object({
      name: z
        .string()
        .min(1, 'Project name is required')
        .max(100, 'Project name too long'),
      description: z.string().max(500, 'Description too long').optional(),
      status: z
        .enum(['active', 'inactive', 'completed'])
        .optional()
        .default('active'),
      dueDate: z.string().datetime('Invalid date format').optional(),
    }),

    projectUpdate: z.object({
      name: z
        .string()
        .min(1, 'Project name is required')
        .max(100, 'Project name too long')
        .optional(),
      description: z.string().max(500, 'Description too long').optional(),
      status: z.enum(['active', 'inactive', 'completed']).optional(),
      dueDate: z.string().datetime('Invalid date format').optional(),
    }),

    // Task schemas
    taskCreate: z.object({
      title: z
        .string()
        .min(1, 'Task title is required')
        .max(200, 'Task title too long'),
      description: z.string().max(1000, 'Description too long').optional(),
      status: z
        .enum(['todo', 'in_progress', 'completed'])
        .optional()
        .default('todo'),
      priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
      dueDate: z.string().datetime('Invalid date format').optional(),
      projectId: z.string().uuid('Invalid project ID').optional(),
    }),

    taskUpdate: z.object({
      title: z
        .string()
        .min(1, 'Task title is required')
        .max(200, 'Task title too long')
        .optional(),
      description: z.string().max(1000, 'Description too long').optional(),
      status: z.enum(['todo', 'in_progress', 'completed']).optional(),
      priority: z.enum(['low', 'medium', 'high']).optional(),
      dueDate: z.string().datetime('Invalid date format').optional(),
      projectId: z.string().uuid('Invalid project ID').optional(),
    }),

    // Note schemas
    noteCreate: z.object({
      title: z
        .string()
        .min(1, 'Note title is required')
        .max(200, 'Note title too long'),
      content: z
        .string()
        .min(1, 'Note content is required')
        .max(5000, 'Note content too long'),
      tags: z
        .array(z.string().max(50, 'Tag too long'))
        .max(10, 'Too many tags')
        .optional(),
      projectId: z.string().uuid('Invalid project ID').optional(),
    }),

    noteUpdate: z.object({
      title: z
        .string()
        .min(1, 'Note title is required')
        .max(200, 'Note title too long')
        .optional(),
      content: z
        .string()
        .min(1, 'Note content is required')
        .max(5000, 'Note content too long')
        .optional(),
      tags: z
        .array(z.string().max(50, 'Tag too long'))
        .max(10, 'Too many tags')
        .optional(),
      projectId: z.string().uuid('Invalid project ID').optional(),
    }),

    // Auth schemas
    login: z.object({
      email: z.string().email('Invalid email format').toLowerCase(),
      password: z.string().min(1, 'Password is required'),
    }),

    register: z.object({
      email: z.string().email('Invalid email format').toLowerCase(),
      password: z.string().min(8, 'Password must be at least 8 characters'),
      name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
    }),

    // Settings schemas
    settingsUpdate: z.object({
      theme: z.enum(['light', 'dark']).optional(),
      language: z.enum(['en', 'es', 'fr']).optional(),
      notifications: z
        .object({
          email: z.boolean().optional(),
          push: z.boolean().optional(),
          slack: z.boolean().optional(),
        })
        .optional(),
      timezone: z.string().max(50, 'Timezone too long').optional(),
    }),

    // Pagination schemas
    pagination: z.object({
      page: z
        .string()
        .regex(/^\d+$/, 'Page must be a number')
        .transform(Number)
        .refine((n) => n > 0, 'Page must be positive')
        .optional()
        .default(() => 1),
      limit: z
        .string()
        .regex(/^\d+$/, 'Limit must be a number')
        .transform(Number)
        .refine((n) => n > 0 && n <= 100, 'Limit must be between 1 and 100')
        .optional()
        .default(() => 10),
      sortBy: z.string().max(50, 'Sort field too long').optional(),
      sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    }),

    // Search schemas
    search: z.object({
      query: z
        .string()
        .min(1, 'Search query is required')
        .max(200, 'Search query too long'),
      filters: z.record(z.string(), z.string()).optional(),
    }),
  }
}

/**
 * Security-focused validation utilities
 */
export class SecurityValidator {
  /**
   * Validate input for potential security threats
   */
  static validateInput(input: unknown): ValidationResult {
    if (typeof input !== 'string') {
      return { isValid: true, errors: [], sanitizedValue: input }
    }

    const errors: string[] = []
    const securityPatterns = [
      // SQL injection patterns
      {
        pattern:
          /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
        message: 'Input contains SQL keywords',
      },

      // XSS patterns
      {
        pattern: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        message: 'Input contains script tags',
      },
      {
        pattern: /javascript:/gi,
        message: 'Input contains javascript protocol',
      },
      { pattern: /on\w+\s*=/gi, message: 'Input contains event handlers' },

      // Command injection patterns
      {
        pattern: /[;&|`$(){}]/g,
        message: 'Input contains command injection characters',
      },

      // Path traversal patterns
      {
        pattern: /\.\.[/\\]/g,
        message: 'Input contains path traversal sequences',
      },

      // LDAP injection patterns
      {
        pattern: /[()=*&|!]/g,
        message: 'Input contains LDAP injection characters',
      },
    ]

    for (const { pattern, message } of securityPatterns) {
      if (pattern.test(input)) {
        errors.push(message)
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: errors.length === 0 ? input : undefined,
    }
  }

  /**
   * Sanitize string input for safe usage
   */
  static sanitizeString(input: string): string {
    return input
      .replace(/[<>'"&]/g, (char) => {
        const entities: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;',
        }
        return entities[char] || char
      })
      .trim()
  }

  /**
   * Validate file upload security
   */
  static validateFileUpload(
    filename: string,
    mimeType: string,
    size: number,
    options: {
      allowedExtensions?: string[]
      allowedMimeTypes?: string[]
      maxSize?: number
    } = {},
  ): ValidationResult {
    const errors: string[] = []

    // File extension check
    const extension = filename.split('.').pop()?.toLowerCase()
    if (
      options.allowedExtensions &&
      extension &&
      !options.allowedExtensions.includes(extension)
    ) {
      errors.push(`File extension '${extension}' is not allowed`)
    }

    // MIME type check
    if (
      options.allowedMimeTypes &&
      !options.allowedMimeTypes.includes(mimeType)
    ) {
      errors.push(`MIME type '${mimeType}' is not allowed`)
    }

    // File size check
    if (options.maxSize && size > options.maxSize) {
      errors.push(
        `File size exceeds maximum allowed size of ${options.maxSize} bytes`,
      )
    }

    // Dangerous filename patterns
    const dangerousPatterns = [
      /\.\./, // Path traversal
      /[<>:"|?*]/, // Invalid filename characters
      /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, // Windows reserved names
    ]

    for (const pattern of dangerousPatterns) {
      if (pattern.test(filename)) {
        errors.push('Filename contains dangerous patterns')
        break
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue:
        errors.length === 0 ? { filename, mimeType, size } : undefined,
    }
  }
}

/**
 * Main Validator class that combines all validation utilities
 */
export class Validator {
  static string = StringValidator
  static number = NumberValidator
  static array = ArrayValidator
  static date = DateValidator
  static schema = SchemaValidator
  static security = SecurityValidator

  /**
   * Quick validation for common use cases
   */
  static quick = {
    email: (email: unknown) => StringValidator.validateEmail(email),
    uuid: (uuid: unknown) => StringValidator.validateUUID(uuid),
    password: (password: unknown) =>
      StringValidator.validate(password, { required: true, minLength: 8 }),
    positiveInteger: (num: unknown) =>
      NumberValidator.validate(num, {
        required: true,
        integer: true,
        positive: true,
      }),
    nonEmptyString: (str: unknown) =>
      StringValidator.validate(str, { required: true, minLength: 1 }),
    optionalString: (str: unknown) =>
      StringValidator.validate(str, { required: false }),
  }
}
