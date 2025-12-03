/**
 * Simple Authentication Middleware for Small Projects
 * Handles shared secret and optional JWT validation
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../types/api';
import { createAPIError } from './errorHandler';

interface JWTPayload {
  sub: string;
  scope?: string;
  client_id?: string;
  iat: number;
  exp: number;
}

/**
 * Simple authentication middleware for Next.js integration
 * Supports both shared secret and JWT token authentication
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authReq = req as AuthenticatedRequest;
  try {
    // Skip auth for health checks, auth endpoints, and public endpoints
    if (authReq.path.includes('/health') || 
        authReq.path.includes('/auth/') || 
        authReq.path.includes('/ping') ||
        authReq.path === '/api/v1') {
      return next();
    }

    const authHeader = req.headers.authorization;
    const sharedSecret = req.headers['x-shared-secret'] as string;
    
    // Method 1: Shared secret authentication (simple for Next.js)
    if (sharedSecret) {
      const { azureConfig } = require('../../config/environment');
      
      if (sharedSecret !== azureConfig.security.sharedSecret) {
        throw createAPIError('Invalid shared secret', 401, 'INVALID_SHARED_SECRET');
      }
      
      // Set basic authenticated context
      authReq.user = {
        id: 'nextjs-app',
        source: 'shared-secret'
      };
      
      return next();
    }
    
    // Method 2: JWT token authentication (for external clients)
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      if (!token) {
        throw createAPIError('No token provided', 401, 'MISSING_TOKEN');
      }

      const { azureConfig } = require('../../config/environment');
      const decoded = jwt.verify(token, azureConfig.security.jwtSecret) as JWTPayload;
      
      authReq.user = {
        id: decoded.sub,
        client_id: decoded.client_id,
        scope: decoded.scope,
        source: 'jwt-token'
      };
      
      return next();
    }
    
    // No valid authentication method found
    throw createAPIError('Authentication required. Use shared secret or JWT token.', 401, 'AUTH_REQUIRED');
    
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(createAPIError('Invalid JWT token', 401, 'INVALID_TOKEN'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(createAPIError('JWT token expired', 401, 'TOKEN_EXPIRED'));
    } else {
      next(error);
    }
  }
}

/**
 * Optional authentication middleware (doesn't fail if no auth)
 * Useful for endpoints that can work with or without authentication
 */
export function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authReq = req as AuthenticatedRequest;
  try {
    const authHeader = authReq.headers.authorization;
    const sharedSecret = authReq.headers['x-shared-secret'] as string;
    
    // Try shared secret first
    if (sharedSecret) {
      const { azureConfig } = require('../../config/environment');
      if (sharedSecret === azureConfig.security.sharedSecret) {
        authReq.user = {
          id: 'nextjs-app',
          source: 'shared-secret'
        };
      }
    }
    // Try JWT token if no shared secret
    else if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      if (token) {
        const { azureConfig } = require('../../config/environment');
        const decoded = jwt.verify(token, azureConfig.security.jwtSecret) as JWTPayload;
        authReq.user = {
          id: decoded.sub,
          client_id: decoded.client_id,
          scope: decoded.scope,
          source: 'jwt-token'
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
 * Simple authorization check for authenticated users
 */
export function requireAuth() {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      return next(createAPIError('Authentication required', 401, 'AUTH_REQUIRED'));
    }
    next();
  };
}

/**
 * Shared secret middleware for Next.js integration
 * This is the recommended method for same-repo communication
 */
export function sharedSecretMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const sharedSecret = req.headers['x-shared-secret'] as string;
    
    if (!sharedSecret) {
      throw createAPIError('Shared secret required', 401, 'MISSING_SHARED_SECRET');
    }

    const { azureConfig } = require('../../config/environment');
    
    if (sharedSecret !== azureConfig.security.sharedSecret) {
      throw createAPIError('Invalid shared secret', 401, 'INVALID_SHARED_SECRET');
    }

    // Set authenticated context for Next.js app
    const authReq = req as AuthenticatedRequest;
    authReq.user = {
      id: 'nextjs-app',
      source: 'shared-secret'
    };

    next();
  } catch (error) {
    next(error);
  }
}