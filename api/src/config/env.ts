/**
 * Environment Configuration
 *
 * Provides type-safe access to environment variables with validation,
 * automatic .env file loading, and development-friendly error messages.
 */

import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

const rootDir = path.resolve(__dirname, '../../')

/**
 * Environment variable validation with detailed error messages
 */
class EnvValidationError extends Error {
  constructor(
    message: string,
    public readonly missingVars: string[] = [],
  ) {
    super(message)
    this.name = 'EnvValidationError'
  }
}

/**
 * Choose .env file based on NODE_ENV with fallback priority
 */
function resolveEnvFile(): string {
  const nodeEnv = process.env.NODE_ENV

  // Priority order for env files
  const envFiles = {
    test: ['.env.test', '.env.test.local', '.env'],
    development: ['.env.local', '.env.development', '.env'],
    production: ['.env.production', '.env'],
  }

  const files = envFiles[nodeEnv as keyof typeof envFiles] || ['.env']

  for (const file of files) {
    const envPath = path.join(rootDir, file)
    if (fs.existsSync(envPath)) {
      return file
    }
  }

  return '.env' // fallback
}

/**
 * Load environment variables with proper error handling
 */
function loadEnvironment(): void {
  const envFile = resolveEnvFile()
  const envPath = path.join(rootDir, envFile)

  if (fs.existsSync(envPath)) {
    console.log(`✓ Loading environment variables from ${envFile}`)
    const result = dotenv.config({ path: envPath })

    if (result.error) {
      console.warn(
        `⚠ Warning: Error reading ${envFile}:`,
        result.error.message,
      )
    }
  } else {
    console.warn(
      `⚠ Warning: Environment file ${envFile} not found. Using process.env variables only.`,
    )
  }
}

/**
 * Validate required environment variable
 */
function requiredEnv(name: string, description?: string): string {
  const value = process.env[name]
  if (!value || value.trim() === '') {
    const desc = description ? ` (${description})` : ''
    throw new EnvValidationError(
      `Environment variable ${name} is required but was not provided${desc}`,
    )
  }
  return value.trim()
}

/**
 * Get optional environment variable with default
 */
function optionalEnv(name: string, defaultValue: string): string {
  const value = process.env[name]
  return value && value.trim() !== '' ? value.trim() : defaultValue
}

/**
 * Get numeric environment variable with validation
 */
function numericEnv(
  name: string,
  defaultValue: number,
  min?: number,
  max?: number,
): number {
  const value = process.env[name]
  const parsed = value ? parseInt(value, 10) : defaultValue

  if (isNaN(parsed)) {
    throw new EnvValidationError(
      `Environment variable ${name} must be a valid number, got: ${value}`,
    )
  }

  if (min !== undefined && parsed < min) {
    throw new EnvValidationError(
      `Environment variable ${name} must be at least ${min}, got: ${parsed}`,
    )
  }

  if (max !== undefined && parsed > max) {
    throw new EnvValidationError(
      `Environment variable ${name} must be at most ${max}, got: ${parsed}`,
    )
  }

  return parsed
}

/**
 * Get boolean environment variable
 */
function booleanEnv(name: string, defaultValue: boolean): boolean {
  const value = process.env[name]
  if (!value) return defaultValue

  const normalized = value.toLowerCase().trim()
  return normalized === 'true' || normalized === '1' || normalized === 'yes'
}

/**
 * Validate NODE_ENV and ensure it's one of the allowed values
 */
function validateNodeEnv(): 'development' | 'test' | 'production' {
  const nodeEnv = process.env.NODE_ENV
  const validEnvs = ['development', 'test', 'production'] as const

  if (
    !nodeEnv ||
    !validEnvs.includes(nodeEnv as 'development' | 'test' | 'production')
  ) {
    console.warn(
      `⚠ Warning: NODE_ENV="${nodeEnv}" is not recognized. Defaulting to "development"`,
    )
    return 'development'
  }

  return nodeEnv as (typeof validEnvs)[number]
}

// Load environment variables
loadEnvironment()

export type Env = {
  NODE_ENV: 'development' | 'test' | 'production'
  PORT: number
  DATABASE_URL: string
  JWT_SECRET: string
  LOG_LEVEL: string
  CORS_ORIGIN: string
  RATE_LIMIT_WINDOW_MS: number
  RATE_LIMIT_MAX_REQUESTS: number
  SESSION_TIMEOUT_MINUTES: number
  PASSWORD_SALT_ROUNDS: number
  ENCRYPTION_KEY?: string
  DEBUG: boolean
}

/**
 * Validate all environment variables and create typed configuration
 */
function createEnvironmentConfig(): Env {
  try {
    return {
      NODE_ENV: validateNodeEnv(),
      PORT: numericEnv('PORT', 3000, 1, 65535),
      DATABASE_URL: requiredEnv('DATABASE_URL', 'PostgreSQL connection string'),
      JWT_SECRET: requiredEnv('JWT_SECRET', 'JSON Web Token signing secret'),
      LOG_LEVEL: optionalEnv('LOG_LEVEL', 'info'),
      CORS_ORIGIN: optionalEnv('CORS_ORIGIN', 'http://localhost:5173'),
      RATE_LIMIT_WINDOW_MS: numericEnv('RATE_LIMIT_WINDOW_MS', 900000, 1000), // 15 minutes default
      RATE_LIMIT_MAX_REQUESTS: numericEnv('RATE_LIMIT_MAX_REQUESTS', 100, 1),
      SESSION_TIMEOUT_MINUTES: numericEnv('SESSION_TIMEOUT_MINUTES', 60, 1),
      PASSWORD_SALT_ROUNDS: numericEnv('PASSWORD_SALT_ROUNDS', 12, 8, 20),
      ENCRYPTION_KEY: process.env.ENCRYPTION_KEY?.trim(),
      DEBUG: booleanEnv('DEBUG', false),
    }
  } catch (error) {
    if (error instanceof EnvValidationError) {
      console.error('❌ Environment Configuration Error:')
      console.error(`   ${error.message}`)
      console.error(
        '\n💡 Please check your .env file and ensure all required variables are set.',
      )

      if (process.env.NODE_ENV !== 'test') {
        console.error('\n📝 Example .env file:')
        console.error('   NODE_ENV=development')
        console.error('   PORT=3000')
        console.error(
          '   DATABASE_URL=postgresql://user:password@localhost:5432/project_pulse',
        )
        console.error('   JWT_SECRET=your-super-secret-jwt-key')
        console.error('   LOG_LEVEL=info')
      }
    } else {
      console.error(
        '❌ Unexpected error during environment configuration:',
        error,
      )
    }

    process.exit(1)
  }
}

export const ENV: Env = createEnvironmentConfig()

// Convenience exports for environment checks
export const isDev = ENV.NODE_ENV === 'development'
export const isTest = ENV.NODE_ENV === 'test'
export const isProd = ENV.NODE_ENV === 'production'

// Validation helper for runtime checks
export function validateEnvironment(): void {
  if (
    !ENV.DATABASE_URL.startsWith('postgresql://') &&
    !ENV.DATABASE_URL.startsWith('postgres://')
  ) {
    throw new EnvValidationError(
      'DATABASE_URL must be a valid PostgreSQL connection string',
    )
  }

  if (ENV.JWT_SECRET.length < 32) {
    console.warn(
      '⚠ Warning: JWT_SECRET should be at least 32 characters long for security',
    )
  }

  if (isProd && ENV.DEBUG) {
    console.warn('⚠ Warning: DEBUG mode is enabled in production')
  }
}

// Log current environment on import (except in test)
if (!isTest) {
  console.log(`🚀 Environment: ${ENV.NODE_ENV}`)
  console.log(`🌐 Server will run on port: ${ENV.PORT}`)
  console.log(`📊 Log level: ${ENV.LOG_LEVEL}`)

  // Validate environment in production
  if (isProd) {
    validateEnvironment()
  }
}

export { EnvValidationError }
export default ENV
