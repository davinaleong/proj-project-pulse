/**
 * Error Handler Middleware
 *
 * Centralized error handling for the application.
 * Provides consistent error responses, logging, and security.
 */

import { Request, Response, NextFunction } from 'express'
import { Prisma } from '@prisma/client'
import { logger } from '../utils/logger'
import { createErrorResponse } from '../utils/response'
import { ENV } from '../config/env'

export interface AppError extends Error {
  statusCode?: number
  code?: string
  details?: Record<string, unknown>
  isOperational?: boolean
}

export class CustomError extends Error implements AppError {
  statusCode: number
  code: string
  details?: Record<string, unknown>
  isOperational: boolean

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'CustomError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

// Specific error classes
export class ValidationError extends CustomError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 400, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends CustomError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR')
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends CustomError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR')
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends CustomError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends CustomError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 409, 'CONFLICT_ERROR', details)
    this.name = 'ConflictError'
  }
}

export class RateLimitError extends CustomError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR')
    this.name = 'RateLimitError'
  }
}

/**
 * Main error handler middleware
 */
export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // If response was already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(error)
  }

  // Log error details
  logError(error, req)

  // Determine error response
  const errorResponse = getErrorResponse(error)

  // Send error response
  return createErrorResponse(
    res,
    errorResponse.message,
    errorResponse.details,
    errorResponse.statusCode,
  )
}

/**
 * Get standardized error response
 */
function getErrorResponse(error: AppError) {
  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error)
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return {
      statusCode: 400,
      message: 'Invalid data provided',
      details:
        ENV.NODE_ENV === 'development'
          ? { originalError: error.message }
          : undefined,
    }
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return {
      statusCode: 500,
      message: 'Database connection error',
      details:
        ENV.NODE_ENV === 'development'
          ? { originalError: error.message }
          : undefined,
    }
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return {
      statusCode: 401,
      message: 'Invalid token',
      details: undefined,
    }
  }

  if (error.name === 'TokenExpiredError') {
    return {
      statusCode: 401,
      message: 'Token expired',
      details: undefined,
    }
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    return {
      statusCode: 400,
      message: error.message,
      details: (error as ValidationError).details,
    }
  }

  // Handle custom errors
  if (error.isOperational) {
    return {
      statusCode: error.statusCode || 500,
      message: error.message,
      details: ENV.NODE_ENV === 'development' ? error.details : undefined,
    }
  }

  // Handle mongoose/other ODM errors
  if (error.name === 'CastError') {
    return {
      statusCode: 400,
      message: 'Invalid ID format',
      details: undefined,
    }
  }

  if (
    error.name === 'MongoError' &&
    (error as { code: number }).code === 11000
  ) {
    return {
      statusCode: 409,
      message: 'Duplicate field value',
      details: undefined,
    }
  }

  // Default error response
  return {
    statusCode: error.statusCode || 500,
    message:
      ENV.NODE_ENV === 'production' ? 'Internal server error' : error.message,
    details:
      ENV.NODE_ENV === 'development'
        ? {
            stack: error.stack,
            name: error.name,
          }
        : undefined,
  }
}

/**
 * Handle Prisma-specific errors
 */
function handlePrismaError(error: Prisma.PrismaClientKnownRequestError) {
  switch (error.code) {
    case 'P2000':
      return {
        statusCode: 400,
        message: 'The provided value is too long for the field',
        details:
          ENV.NODE_ENV === 'development'
            ? { field: error.meta?.target }
            : undefined,
      }

    case 'P2001':
      return {
        statusCode: 404,
        message: 'Record not found',
        details: undefined,
      }

    case 'P2002':
      return {
        statusCode: 409,
        message: 'A record with this value already exists',
        details:
          ENV.NODE_ENV === 'development'
            ? { field: error.meta?.target }
            : undefined,
      }

    case 'P2003':
      return {
        statusCode: 400,
        message: 'Foreign key constraint failed',
        details:
          ENV.NODE_ENV === 'development'
            ? { field: error.meta?.field_name }
            : undefined,
      }

    case 'P2025':
      return {
        statusCode: 404,
        message: 'Record not found or already deleted',
        details: undefined,
      }

    default:
      return {
        statusCode: 500,
        message: 'Database operation failed',
        details:
          ENV.NODE_ENV === 'development'
            ? { code: error.code, meta: error.meta }
            : undefined,
      }
  }
}

/**
 * Log error with appropriate level and context
 */
function logError(error: AppError, req: Request) {
  const errorContext = {
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id,
    statusCode: error.statusCode,
    errorCode: error.code,
    stack: error.stack,
  }

  // Determine log level based on error type
  if (error.statusCode && error.statusCode < 500) {
    // Client errors (4xx) - usually not server issues
    logger.warn(`Client error: ${error.message}`, errorContext)
  } else {
    // Server errors (5xx) - require attention
    logger.error(`Server error: ${error.message}`, errorContext)
  }

  // Log to external monitoring service in production
  if (
    ENV.NODE_ENV === 'production' &&
    (!error.statusCode || error.statusCode >= 500)
  ) {
    // Integration with services like Sentry, DataDog, etc.
    // Example: Sentry.captureException(error, { contexts: { request: errorContext } })
  }
}

/**
 * Handle uncaught exceptions
 */
export const handleUncaughtException = (error: Error) => {
  logger.error('Uncaught Exception:', {
    message: error.message,
    stack: error.stack,
  })

  // Graceful shutdown
  process.exit(1)
}

/**
 * Handle unhandled promise rejections
 */
export const handleUnhandledRejection = (
  reason: unknown,
  promise: Promise<unknown>,
) => {
  logger.error('Unhandled Rejection:', {
    reason,
    promise,
  })

  // Graceful shutdown
  process.exit(1)
}

/**
 * Async error wrapper for route handlers
 */
export const asyncHandler = <T extends Request, U extends Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<void> | void,
) => {
  return (req: T, res: U, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

/**
 * Not found handler for undefined routes
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`)
  next(error)
}

/**
 * Setup global error handlers
 */
export const setupGlobalErrorHandlers = () => {
  process.on('uncaughtException', handleUncaughtException)
  process.on('unhandledRejection', handleUnhandledRejection)
}

export default errorHandler
