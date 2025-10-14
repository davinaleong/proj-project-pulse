/**
 * Database Configuration
 *
 * Provides type-safe Prisma client setup with connection management,
 * error handling, and development-friendly logging.
 */

import { PrismaClient } from '@prisma/client'
import { ENV, isDev, isProd, isTest } from './env'

declare global {
  // Allow attaching to global in development to prevent multiple clients
  var __prismaClient__: PrismaClient | undefined
}

/**
 * Database connection error with additional context
 */
export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly originalError?: unknown,
  ) {
    super(message)
    this.name = 'DatabaseError'
  }
}

/**
 * Prisma client configuration based on environment
 */
function createPrismaClient(): PrismaClient {
  const config: ConstructorParameters<typeof PrismaClient>[0] = {
    datasourceUrl: ENV.DATABASE_URL,
  }

  // Environment-specific configurations
  if (isDev) {
    config.log = [
      { emit: 'stdout', level: 'error' },
      { emit: 'stdout', level: 'info' },
      { emit: 'stdout', level: 'warn' },
    ]
  } else if (isTest) {
    // Minimal logging in test environment with connection limits
    config.log = [{ emit: 'stdout', level: 'error' }]
    // Limit connections for tests to prevent pool exhaustion
    config.datasourceUrl = ENV.DATABASE_URL + (ENV.DATABASE_URL.includes('?') ? '&' : '?') + 'connection_limit=5&pool_timeout=10'
  } else if (isProd) {
    // Production logging
    config.log = [
      { emit: 'stdout', level: 'error' },
      { emit: 'stdout', level: 'warn' },
    ]
  }

  const client = new PrismaClient(config)
  return client
}

/**
 * Get or create Prisma client singleton
 */
function getPrismaClient(): PrismaClient {
  if (isProd) {
    // In production, always create a new client
    return createPrismaClient()
  } else {
    // In development/test, use global singleton to prevent multiple clients
    if (!global.__prismaClient__) {
      global.__prismaClient__ = createPrismaClient()
    }
    return global.__prismaClient__
  }
}

// Create the singleton client
const prisma = getPrismaClient()

/**
 * Connect to the database with proper error handling
 */
export async function connectDb(): Promise<PrismaClient> {
  try {
    console.log('🔗 Connecting to database...')
    await prisma.$connect()

    // Test the connection
    await prisma.$queryRaw`SELECT 1`

    console.log('✅ Database connected successfully')
    return prisma
  } catch (error) {
    const message = 'Failed to connect to database'
    console.error('❌ ' + message + ':', error)

    throw new DatabaseError(message, 'connect', error)
  }
}

/**
 * Disconnect from the database gracefully
 */
export async function disconnectDb(): Promise<void> {
  try {
    console.log('🔌 Disconnecting from database...')
    await prisma.$disconnect()
    console.log('✅ Database disconnected successfully')
  } catch (error) {
    const message = 'Error disconnecting from database'
    console.error('❌ ' + message + ':', error)

    throw new DatabaseError(message, 'disconnect', error)
  }
}

/**
 * Health check for database connection
 */
export async function checkDatabaseHealth(): Promise<{
  connected: boolean
  latency?: number
  error?: string
}> {
  try {
    const start = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const latency = Date.now() - start

    return {
      connected: true,
      latency,
    }
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Execute database operations with retry logic
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000,
): Promise<T> {
  let lastError: Error = new Error('No attempts made')

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt === maxRetries) {
        break
      }

      console.warn(
        `⚠️  Database operation failed (attempt ${attempt}/${maxRetries}):`,
        lastError.message,
      )

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt))
    }
  }

  throw new DatabaseError(
    `Database operation failed after ${maxRetries} attempts`,
    'retry',
    lastError,
  )
}

/**
 * Transaction wrapper with error handling
 */
export async function withTransaction<T>(
  callback: (
    prisma: Omit<
      PrismaClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'
    >,
  ) => Promise<T>,
): Promise<T> {
  try {
    return await prisma.$transaction(callback)
  } catch (error) {
    const message = 'Transaction failed'
    console.error('❌ ' + message + ':', error)

    throw new DatabaseError(message, 'transaction', error)
  }
}

/**
 * Clean up database resources (useful for tests)
 */
export async function cleanupDatabase(): Promise<void> {
  if (!isTest) {
    throw new Error('cleanupDatabase should only be called in test environment')
  }

  try {
    // Clear all data in test database
    const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname='public'
    `

    for (const { tablename } of tablenames) {
      if (tablename !== '_prisma_migrations') {
        await prisma.$executeRawUnsafe(
          `TRUNCATE TABLE "public"."${tablename}" CASCADE`,
        )
      }
    }
  } catch (error) {
    console.error('Error cleaning up database:', error)
    throw error
  }
}

// Graceful shutdown handling
process.on('beforeExit', () => {
  disconnectDb().catch(console.error)
})

process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...')
  await disconnectDb()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...')
  await disconnectDb()
  process.exit(0)
})

export default prisma
