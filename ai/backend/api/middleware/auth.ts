/**
 * Authentication Middleware
 * Handles JWT token validation and user context
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../types/api';
import { createAPIError } from './errorHandler';

interface JWTPayload {
  sub: string;
  email?: string;
  roles?: string[];
  iat: number;
  exp: number;
}

/**
 * Authentication middleware
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authReq = req as AuthenticatedRequest;
  try {
    // Skip auth for health checks and public endpoints
    if (authReq.path.includes('/health') || authReq.path.includes('/ping')) {
      return next();
    }

    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createAPIError('Missing or invalid authorization header', 401, 'MISSING_TOKEN');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      throw createAPIError('No token provided', 401, 'MISSING_TOKEN');
    }

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    
    // Set user context
    authReq.user = {
      id: decoded.sub,
      email: decoded.email,
      roles: decoded.roles || []
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(createAPIError('Invalid token', 401, 'INVALID_TOKEN'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(createAPIError('Token expired', 401, 'TOKEN_EXPIRED'));
    } else {
      next(error);
    }
  }
}

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authReq = req as AuthenticatedRequest;
  try {
    const authHeader = authReq.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      if (token) {
        const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
        const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
        
        authReq.user = {
          id: decoded.sub,
          email: decoded.email,
          roles: decoded.roles || []
        };
      }
    }

    next();
  } catch (error) {
    // For optional auth, we don't fail on invalid tokens
    next();
  }
}

/**
 * Role-based authorization middleware
 */
export function requireRoles(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return next(createAPIError('Authentication required', 401, 'AUTH_REQUIRED'));
    }

    const userRoles = authReq.user.roles || [];
    const hasRequiredRole = roles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      return next(createAPIError(
        `Access denied. Required roles: ${roles.join(', ')}`,
        403,
        'INSUFFICIENT_PERMISSIONS'
      ));
    }

    next();
  };
}

/**
 * API key authentication middleware (alternative to JWT)
 */
export function apiKeyAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      throw createAPIError('API key required', 401, 'MISSING_API_KEY');
    }

    // Validate API key (in production, check against database)
    const validApiKeys = (process.env.VALID_API_KEYS || '').split(',');
    
    if (!validApiKeys.includes(apiKey)) {
      throw createAPIError('Invalid API key', 401, 'INVALID_API_KEY');
    }

    // Set a basic user context for API key users
    const authReq = req as AuthenticatedRequest;
    authReq.user = {
      id: `api-key-${apiKey.substring(0, 8)}`,
      roles: ['api-user']
    };

    next();
  } catch (error) {
    next(error);
  }
}