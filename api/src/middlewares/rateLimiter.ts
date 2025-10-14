/**
 * Rate Limiter Middleware
 *
 * Provides configurable rate limiting for different endpoints and user types.
 * Supports multiple strategies and storage backends.
 */

import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'
import { RateLimitError } from './errorHandler'

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  message?: string
  statusCode?: number
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  keyGenerator?: (req: Request) => string
  skip?: (req: Request) => boolean
  onLimitReached?: (req: Request, rateLimitInfo: RateLimitInfo) => void
}

export interface RateLimitInfo {
  limit: number
  current: number
  remaining: number
  resetTime: number
  windowStart: number
}

export interface RateLimitStore {
  get(key: string): Promise<RateLimitInfo | null>
  set(key: string, info: RateLimitInfo): Promise<void>
  increment(key: string, config: RateLimitConfig): Promise<RateLimitInfo>
  reset(key: string): Promise<void>
}

/**
 * In-memory rate limit store (for development/testing)
 */
class MemoryStore implements RateLimitStore {
  private store = new Map<string, RateLimitInfo>()
  private timers = new Map<string, NodeJS.Timeout>()

  async get(key: string): Promise<RateLimitInfo | null> {
    return this.store.get(key) || null
  }

  async set(key: string, info: RateLimitInfo): Promise<void> {
    this.store.set(key, info)
    this.setExpiry(key, info.resetTime)
  }

  async increment(
    key: string,
    config: RateLimitConfig,
  ): Promise<RateLimitInfo> {
    const now = Date.now()
    const existing = this.store.get(key)

    if (!existing || now >= existing.resetTime) {
      // Create new window
      const info: RateLimitInfo = {
        limit: config.maxRequests,
        current: 1,
        remaining: config.maxRequests - 1,
        resetTime: now + config.windowMs,
        windowStart: now,
      }

      this.store.set(key, info)
      this.setExpiry(key, info.resetTime)
      return info
    }

    // Increment existing window
    const updated: RateLimitInfo = {
      ...existing,
      current: existing.current + 1,
      remaining: Math.max(0, existing.remaining - 1),
    }

    this.store.set(key, updated)
    return updated
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key)
    const timer = this.timers.get(key)
    if (timer) {
      clearTimeout(timer)
      this.timers.delete(key)
    }
  }

  private setExpiry(key: string, resetTime: number): void {
    const timer = this.timers.get(key)
    if (timer) {
      clearTimeout(timer)
    }

    const timeout = setTimeout(() => {
      this.store.delete(key)
      this.timers.delete(key)
    }, resetTime - Date.now())

    this.timers.set(key, timeout)
  }
}

/**
 * Redis rate limit store (for production)
 */
class RedisStore implements RateLimitStore {
  // This would integrate with Redis client
  // Implementation depends on Redis library used (ioredis, node-redis, etc.)

  async get(_key: string): Promise<RateLimitInfo | null> {
    // Redis implementation
    throw new Error('Redis store not implemented')
  }

  async set(_key: string, _info: RateLimitInfo): Promise<void> {
    // Redis implementation
    throw new Error('Redis store not implemented')
  }

  async increment(
    _key: string,
    _config: RateLimitConfig,
  ): Promise<RateLimitInfo> {
    // Redis implementation using INCR and EXPIRE
    throw new Error('Redis store not implemented')
  }

  async reset(_key: string): Promise<void> {
    // Redis implementation
    throw new Error('Redis store not implemented')
  }
}

/**
 * Default rate limit configurations
 */
export const rateLimitConfigs = {
  // General API rate limiting
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many requests from this IP, please try again later',
  },

  // Authentication endpoints (stricter)
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts, please try again later',
  },

  // Password reset (very strict)
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Too many password reset attempts, please try again later',
  },

  // File uploads
  upload: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: 'Too many upload attempts, please try again later',
  },

  // Admin endpoints
  admin: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 50,
    message: 'Admin rate limit exceeded',
  },
} as const

/**
 * Key generators for different rate limiting strategies
 */
export const keyGenerators = {
  // Rate limit by IP address
  byIP: (req: Request) => `ip:${req.ip}`,

  // Rate limit by user ID
  byUser: (req: Request) => `user:${req.user?.id || 'anonymous'}`,

  // Rate limit by IP + endpoint
  byIPAndEndpoint: (req: Request) =>
    `ip-endpoint:${req.ip}:${req.route?.path || req.path}`,

  // Rate limit by user + endpoint
  byUserAndEndpoint: (req: Request) =>
    `user-endpoint:${req.user?.id || 'anonymous'}:${req.route?.path || req.path}`,

  // Custom key generator
  custom: (keyFn: (req: Request) => string) => keyFn,
}

/**
 * Main rate limiter middleware factory
 */
export const createRateLimiter = (
  config: RateLimitConfig,
  store?: RateLimitStore,
): ((req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  const limitStore = store || new MemoryStore()
  const keyGen = config.keyGenerator || keyGenerators.byIP

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if this request should be skipped
      if (config.skip && config.skip(req)) {
        return next()
      }

      const key = keyGen(req)
      const rateLimitInfo = await limitStore.increment(key, config)

      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': rateLimitInfo.limit.toString(),
        'X-RateLimit-Remaining': rateLimitInfo.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimitInfo.resetTime).toISOString(),
        'X-RateLimit-Window': config.windowMs.toString(),
      })

      // Check if limit exceeded
      if (rateLimitInfo.current > rateLimitInfo.limit) {
        // Log rate limit violation
        logger.security('Rate limit exceeded', {
          key,
          limit: rateLimitInfo.limit,
          current: rateLimitInfo.current,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.originalUrl,
          userId: req.user?.id,
        })

        // Call onLimitReached callback if provided
        if (config.onLimitReached) {
          config.onLimitReached(req, rateLimitInfo)
        }

        // Add Retry-After header
        const retryAfter = Math.ceil(
          (rateLimitInfo.resetTime - Date.now()) / 1000,
        )
        res.set('Retry-After', retryAfter.toString())

        throw new RateLimitError(
          config.message || 'Too many requests, please try again later',
        )
      }

      next()
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw error
      }

      logger.error('Rate limiter error:', error as Error)
      // If rate limiter fails, allow request to proceed
      next()
    }
  }
}

/**
 * Pre-configured rate limiters
 */
export const generalRateLimit = createRateLimiter(rateLimitConfigs.general)

export const authRateLimit = createRateLimiter({
  ...rateLimitConfigs.auth,
  keyGenerator: keyGenerators.byIP,
  onLimitReached: (req, info) => {
    logger.security('Authentication rate limit exceeded', {
      ip: req.ip,
      attempts: info.current,
      limit: info.limit,
    })
  },
})

export const passwordResetRateLimit = createRateLimiter({
  ...rateLimitConfigs.passwordReset,
  keyGenerator: keyGenerators.byIP,
  onLimitReached: (req, info) => {
    logger.security('Password reset rate limit exceeded', {
      ip: req.ip,
      attempts: info.current,
      limit: info.limit,
    })
  },
})

export const uploadRateLimit = createRateLimiter({
  ...rateLimitConfigs.upload,
  keyGenerator: keyGenerators.byUser,
  skip: (req) => req.user?.role === 'ADMIN' || req.user?.role === 'SUPERADMIN',
})

export const adminRateLimit = createRateLimiter({
  ...rateLimitConfigs.admin,
  keyGenerator: keyGenerators.byUser,
})

/**
 * Adaptive rate limiter that adjusts based on user role
 */
export const adaptiveRateLimit = createRateLimiter(
  {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // Default for regular users
    keyGenerator: keyGenerators.byUser,
    message: 'Rate limit exceeded for your user type',
  },
  new MemoryStore(),
)

// Override maxRequests based on user role
const originalAdaptive = adaptiveRateLimit
export const adaptiveRateLimitWithRoles = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Adjust rate limits based on user role
  const user = req.user
  let maxRequests = 100 // Default

  if (user) {
    switch (user.role) {
      case 'SUPERADMIN':
        maxRequests = 1000
        break
      case 'ADMIN':
        maxRequests = 500
        break
      case 'MANAGER':
        maxRequests = 250
        break
      case 'USER':
      default:
        maxRequests = 100
        break
    }
  }

  // Create custom rate limiter with adjusted limits
  const customLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests,
    keyGenerator: keyGenerators.byUser,
    message: `Rate limit exceeded for ${user?.role || 'anonymous'} user`,
  })

  return customLimiter(req, res, next)
}

/**
 * Burst rate limiter for handling traffic spikes
 */
export const burstRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20, // Allow burst of 20 requests per minute
  keyGenerator: keyGenerators.byIP,
  message: 'Burst rate limit exceeded, please slow down',
})

/**
 * Per-endpoint rate limiters
 */
export const endpointRateLimiters = {
  '/api/v1/auth/login': authRateLimit,
  '/api/v1/auth/register': authRateLimit,
  '/api/v1/auth/forgot-password': passwordResetRateLimit,
  '/api/v1/auth/reset-password': passwordResetRateLimit,
  '/api/v1/upload': uploadRateLimit,
  '/api/v1/admin': adminRateLimit,
}

export default createRateLimiter
