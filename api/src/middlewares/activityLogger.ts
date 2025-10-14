/**
 * Activity Logger Middleware
 *
 * Tracks user actions and system events across the application.
 * Provides comprehensive logging for auditing, debugging, and analytics.
 */

import { Request, Response, NextFunction } from 'express'
import prisma from '../config/db'
import { logger } from '../utils/logger'

export interface ActivityData {
  action: string
  modelType: string
  modelId?: string
  context?: string
  description?: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, unknown>
}

export interface ActivityLoggerOptions {
  action?: string
  modelType?: string
  modelId?: string | ((req: Request) => string)
  context?: string | ((req: Request) => string)
  description?: string | ((req: Request) => string)
  captureRequestBody?: boolean
  captureResponseBody?: boolean
  excludeFields?: string[]
  async?: boolean
}

/**
 * Main activity logger middleware
 */
export const activityLogger = (options: ActivityLoggerOptions = {}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now()

    // Store original response methods
    const originalSend = res.send
    const originalJson = res.json

    let responseBody: unknown
    let statusCode: number

    // Intercept response to capture data
    res.send = function (body: unknown) {
      responseBody = body
      statusCode = res.statusCode
      return originalSend.call(this, body)
    }

    res.json = function (body: unknown) {
      responseBody = body
      statusCode = res.statusCode
      return originalJson.call(this, body)
    }

    // Continue to next middleware
    next()

    // Log activity after response (if async logging is enabled)
    if (options.async !== false) {
      setImmediate(() => {
        logActivity(req, res, options, {
          responseBody,
          statusCode,
          duration: Date.now() - startTime,
        }).catch((error) => {
          logger.error('Failed to log activity:', error)
        })
      })
    } else {
      // Synchronous logging (blocks response)
      res.on('finish', async () => {
        try {
          await logActivity(req, res, options, {
            responseBody,
            statusCode,
            duration: Date.now() - startTime,
          })
        } catch (error) {
          logger.error('Failed to log activity:', error)
        }
      })
    }
  }
}

/**
 * Log activity to database
 */
async function logActivity(
  req: Request,
  res: Response,
  options: ActivityLoggerOptions,
  responseData: {
    responseBody?: unknown
    statusCode?: number
    duration?: number
  },
) {
  try {
    // Skip logging if no user (for public endpoints)
    if (!req.user && !options.action) {
      return
    }

    const activityData: ActivityData = {
      action: options.action || determineAction(req),
      modelType: options.modelType || determineModelType(req),
      modelId:
        typeof options.modelId === 'function'
          ? options.modelId(req)
          : options.modelId || extractModelId(req),
      context:
        typeof options.context === 'function'
          ? options.context(req)
          : options.context,
      description:
        typeof options.description === 'function'
          ? options.description(req)
          : options.description || generateDescription(req, options),
      ipAddress: getClientIpAddress(req),
      userAgent: req.get('User-Agent'),
      metadata: {
        method: req.method,
        url: req.originalUrl,
        statusCode: responseData.statusCode,
        duration: responseData.duration,
        ...(options.captureRequestBody && {
          requestBody: sanitizeData(req.body, options.excludeFields),
        }),
        ...(options.captureResponseBody && {
          responseBody: sanitizeData(
            responseData.responseBody,
            options.excludeFields,
          ),
        }),
      },
    }

    // Capture old/new values for UPDATE operations
    if (options.action === 'UPDATE' && req.body) {
      activityData.newValues = sanitizeData(req.body, options.excludeFields)
      // Old values would need to be captured before the update in the controller
      if (req.originalData) {
        activityData.oldValues = sanitizeData(
          req.originalData,
          options.excludeFields,
        )
      }
    }

    // Save to database
    await prisma.activity.create({
      data: {
        userId: req.user?.id || 0, // Use 0 for system activities
        action: activityData.action,
        modelType: activityData.modelType,
        modelId: activityData.modelId || '',
        context: activityData.context,
        description: activityData.description,
        oldValues: activityData.oldValues,
        newValues: activityData.newValues,
        ipAddress: activityData.ipAddress,
        userAgent: activityData.userAgent,
        // metadata would need to be added to the schema if needed
      },
    })

    logger.info('Activity logged', {
      userId: req.user?.id,
      action: activityData.action,
      modelType: activityData.modelType,
      modelId: activityData.modelId,
    })
  } catch (error) {
    logger.error('Failed to save activity log:', error)
  }
}

/**
 * Determine action from HTTP method and route
 */
function determineAction(req: Request): string {
  const method = req.method.toUpperCase()

  switch (method) {
    case 'POST':
      return 'CREATE'
    case 'GET':
      return 'READ'
    case 'PUT':
    case 'PATCH':
      return 'UPDATE'
    case 'DELETE':
      return 'DELETE'
    default:
      return method
  }
}

/**
 * Determine model type from route
 */
function determineModelType(req: Request): string {
  const path = req.route?.path || req.path

  // Extract model type from path patterns like /api/v1/users/:id
  const pathSegments = path.split('/').filter(Boolean)

  if (pathSegments.length >= 3) {
    const modelSegment = pathSegments[2] // assumes /api/v1/modelType
    return modelSegment.charAt(0).toUpperCase() + modelSegment.slice(1, -1) // Remove 's' and capitalize
  }

  return 'Unknown'
}

/**
 * Extract model ID from request parameters
 */
function extractModelId(req: Request): string | undefined {
  return req.params.id || req.params.uuid || req.body.id || req.body.uuid
}

/**
 * Generate description for the activity
 */
function generateDescription(
  req: Request,
  options: ActivityLoggerOptions,
): string {
  const action = options.action || determineAction(req)
  const modelType = options.modelType || determineModelType(req)
  const modelId = extractModelId(req)

  let description = `${action} ${modelType}`
  if (modelId) {
    description += ` (ID: ${modelId})`
  }

  return description
}

/**
 * Get client IP address from request
 */
function getClientIpAddress(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    'unknown'
  )
}

/**
 * Sanitize data by removing sensitive fields
 */
function sanitizeData(
  data: unknown,
  excludeFields: string[] = [],
): Record<string, unknown> | undefined {
  if (!data || typeof data !== 'object') {
    return undefined
  }

  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'key',
    ...excludeFields,
  ]
  const sanitized = { ...(data as Record<string, unknown>) }

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]'
    }
  }

  return sanitized
}

/**
 * Quick logging functions for common activities
 */
export const logUserActivity = (action: string, description?: string) =>
  activityLogger({
    action,
    modelType: 'User',
    description,
    async: true,
  })

export const logProjectActivity = (action: string, description?: string) =>
  activityLogger({
    action,
    modelType: 'Project',
    description,
    captureRequestBody: true,
    async: true,
  })

export const logTaskActivity = (action: string, description?: string) =>
  activityLogger({
    action,
    modelType: 'Task',
    description,
    captureRequestBody: true,
    async: true,
  })

export const logNoteActivity = (action: string, description?: string) =>
  activityLogger({
    action,
    modelType: 'Note',
    description,
    captureRequestBody: true,
    excludeFields: ['content'], // Don't log full note content
    async: true,
  })

export const logSecurityActivity = (action: string, description?: string) =>
  activityLogger({
    action,
    modelType: 'Security',
    description,
    captureRequestBody: false, // Never capture request body for security events
    async: false, // Log security events synchronously
  })

// Middleware for automatic activity logging based on route
export const autoActivityLogger = activityLogger({
  async: true,
  captureRequestBody: true,
  excludeFields: ['password', 'token', 'secret'],
})

export default activityLogger
