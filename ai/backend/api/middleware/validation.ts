/**
 * Validation Middleware
 * Common validation functions and middleware
 */

import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { APIResponse } from '../types/api';
import { createAPIError } from './errorHandler';

/**
 * Validation middleware that processes express-validator results
 */
export function validationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Skip validation for GET requests to health endpoints
  if (req.method === 'GET' && req.path.includes('/health')) {
    return next();
  }

  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : undefined,
      message: error.msg,
      value: error.type === 'field' ? error.value : undefined,
      location: error.type === 'field' ? error.location : undefined
    }));

    const errorResponse: APIResponse<null> = {
      success: false,
      error: 'Validation failed',
      message: 'One or more fields contain invalid data',
      details: formattedErrors,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: (req as any).context?.requestId
      }
    };

    res.status(400).json(errorResponse);
    return;
  }

  next();
}

/**
 * Content type validation middleware
 */
export function validateContentType(allowedTypes: string[] = ['application/json']) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip for GET requests and multipart uploads
    if (req.method === 'GET' || req.headers['content-type']?.includes('multipart/')) {
      return next();
    }

    const contentType = req.headers['content-type']?.split(';')[0];
    
    if (!contentType || !allowedTypes.includes(contentType)) {
      return next(createAPIError(
        `Invalid content type. Allowed types: ${allowedTypes.join(', ')}`,
        415,
        'INVALID_CONTENT_TYPE'
      ));
    }

    next();
  };
}

/**
 * Request size validation middleware
 */
export function validateRequestSize(maxSizeInMB: number = 10) {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.headers['content-length'];
    
    if (contentLength) {
      const sizeInMB = parseInt(contentLength) / (1024 * 1024);
      
      if (sizeInMB > maxSizeInMB) {
        return next(createAPIError(
          `Request too large. Maximum size: ${maxSizeInMB}MB`,
          413,
          'REQUEST_TOO_LARGE'
        ));
      }
    }

    next();
  };
}

/**
 * Custom validation helpers
 */
export const customValidators = {
  /**
   * Validate array of strings
   */
  isStringArray: (value: any) => {
    return Array.isArray(value) && value.every(item => typeof item === 'string');
  },

  /**
   * Validate date range
   */
  isValidDateRange: (value: any) => {
    if (!value || typeof value !== 'object') return false;
    if (!value.start || !value.end) return false;
    
    const start = new Date(value.start);
    const end = new Date(value.end);
    
    return !isNaN(start.getTime()) && !isNaN(end.getTime()) && start < end;
  },

  /**
   * Validate chat message format
   */
  isChatMessage: (value: any) => {
    return (
      value &&
      typeof value === 'object' &&
      typeof value.role === 'string' &&
      ['system', 'user', 'assistant'].includes(value.role) &&
      typeof value.content === 'string' &&
      value.content.length > 0
    );
  },

  /**
   * Validate search type
   */
  isValidSearchType: (value: any) => {
    return ['semantic', 'basic', 'hybrid', 'vector'].includes(value);
  },

  /**
   * Validate temperature parameter
   */
  isValidTemperature: (value: any) => {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0 && num <= 2;
  },

  /**
   * Validate project ID format
   */
  isValidProjectId: (value: any) => {
    return typeof value === 'string' && /^[a-zA-Z0-9_-]+$/.test(value);
  }
};

/**
 * Sanitization helpers
 */
export const sanitizers = {
  /**
   * Sanitize HTML content
   */
  sanitizeHtml: (value: string): string => {
    return value
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim();
  },

  /**
   * Sanitize search query
   */
  sanitizeSearchQuery: (value: string): string => {
    return value
      .replace(/[<>"']/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 500); // Limit length
  },

  /**
   * Sanitize user input
   */
  sanitizeUserInput: (value: string): string => {
    return value
      .replace(/[<>"'&]/g, '')
      .trim()
      .substring(0, 1000); // Limit length
  }
};