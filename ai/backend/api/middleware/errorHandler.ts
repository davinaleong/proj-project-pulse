/**
 * Error Handling Middleware
 * Centralized error handling with proper logging and response formatting
 */

import { Request, Response, NextFunction } from 'express';
import { APIResponse, APIError } from '../types/api';

/**
 * Global error handler middleware
 */
export function errorHandler(
  error: APIError | Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log the error
  console.error('API Error:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    requestId: (req as any).context?.requestId,
    timestamp: new Date().toISOString()
  });

  // Determine status code
  let statusCode = 500;
  if ('statusCode' in error && typeof error.statusCode === 'number') {
    statusCode = error.statusCode;
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
  } else if (error.name === 'ForbiddenError') {
    statusCode = 403;
  } else if (error.name === 'NotFoundError') {
    statusCode = 404;
  }

  // Prepare error response
  const errorResponse: APIResponse<null> = {
    success: false,
    error: getErrorMessage(error, statusCode),
    message: error.message,
    metadata: {
      timestamp: new Date().toISOString(),
      requestId: (req as any).context?.requestId,
      errorCode: 'code' in error ? error.code : undefined
    }
  };

  // Add details for validation errors
  if ('details' in error && error.details) {
    errorResponse.details = error.details;
  }

  // Don't leak sensitive information in production
  if (process.env.NODE_ENV === 'production') {
    delete errorResponse.metadata.errorCode;
    if (statusCode === 500) {
      errorResponse.message = 'Internal server error';
    }
  }

  res.status(statusCode).json(errorResponse);
}

/**
 * Get appropriate error message based on status code
 */
function getErrorMessage(error: Error, statusCode: number): string {
  switch (statusCode) {
    case 400:
      return 'Bad Request';
    case 401:
      return 'Unauthorized';
    case 403:
      return 'Forbidden';
    case 404:
      return 'Not Found';
    case 429:
      return 'Too Many Requests';
    case 500:
    default:
      return 'Internal Server Error';
  }
}

/**
 * Create an API error with status code
 */
export function createAPIError(
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: any
): APIError {
  const error = new Error(message) as APIError;
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  return error;
}

/**
 * Async error wrapper
 */
export function asyncErrorHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}