/**
 * Simple Authentication Routes for Next.js Integration
 * Provides JWT tokens and shared secret information for small projects
 */

import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { azureConfig } from '../../config/environment';
import { APIResponse } from '../types/api';
import { asyncHandler } from '../utils/asyncHandler';
import { createAPIError } from '../middleware/errorHandler';

const router = Router();

interface SimpleTokenRequest {
  clientId?: string;
  expiresIn?: string;
}

interface SimpleTokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  issued_at: string;
}

interface AuthInfoResponse {
  authMethods: string[];
  jwtExpiration: string;
  corsOrigins: string[];
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}

// Simple validation for token request
const simpleTokenValidation = [
  body('clientId')
    .optional()
    .isString()
    .isLength({ min: 3, max: 50 })
    .withMessage('Client ID must be between 3 and 50 characters'),
    
  body('expiresIn')
    .optional()
    .isString()
    .matches(/^(\d+[smhd]|\d+)$/)
    .withMessage('ExpiresIn must be a valid duration (e.g., 1h, 30m, 86400)')
];

/**
 * POST /auth/token
 * Issues a simple JWT token for external clients (optional)
 */
router.post('/token', simpleTokenValidation, asyncHandler(async (req: Request, res: Response) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createAPIError('Invalid request parameters', 400, 'VALIDATION_ERROR', {
      errors: errors.array()
    });
  }

  const { clientId = 'external-client', expiresIn = '1h' } = req.body as SimpleTokenRequest;

  // Generate unique subject
  const subject = `external:${clientId}:${Date.now()}`;
  
  // Calculate expiration
  const now = Math.floor(Date.now() / 1000);
  const expirationSeconds = parseExpiresIn(expiresIn);
  const exp = now + expirationSeconds;

  // Simple JWT payload
  const payload = {
    sub: subject,
    iat: now,
    exp: exp,
    aud: 'project-pulse-ai',
    iss: 'project-pulse-auth',
    client_id: clientId
  };

  // Sign JWT with secret
  const token = jwt.sign(payload, azureConfig.security.jwtSecret, {
    algorithm: 'HS256'
  });

  const response: APIResponse<SimpleTokenResponse> = {
    success: true,
    data: {
      access_token: token,
      token_type: 'Bearer',
      expires_in: expirationSeconds,
      issued_at: new Date().toISOString()
    },
    metadata: {
      timestamp: new Date().toISOString(),
      requestId: `token_${Date.now()}`
    }
  };

  res.status(200).json(response);
}));

/**
 * POST /auth/verify
 * Verifies a JWT token
 */
router.post('/verify', asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    throw createAPIError('Token is required', 400, 'MISSING_TOKEN');
  }

  try {
    const decoded = jwt.verify(token, azureConfig.security.jwtSecret);
    
    const response: APIResponse = {
      success: true,
      data: {
        valid: true,
        decoded: decoded
      },
      metadata: {
        timestamp: new Date().toISOString()
      }
    };

    res.status(200).json(response);
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw createAPIError('Invalid token', 401, 'INVALID_TOKEN');
    } else if (error instanceof jwt.TokenExpiredError) {
      throw createAPIError('Token expired', 401, 'TOKEN_EXPIRED');
    } else {
      throw error;
    }
  }
}));

/**
 * GET /auth/info
 * Provides authentication information (public endpoint)
 */
router.get('/info', asyncHandler(async (req: Request, res: Response) => {
  const authInfo: AuthInfoResponse = {
    authMethods: ['shared-secret', 'jwt-token'],
    jwtExpiration: '1h',
    corsOrigins: azureConfig.server.corsOrigins,
    rateLimit: {
      windowMs: azureConfig.security.rateLimitWindowMs,
      maxRequests: azureConfig.security.rateLimitMaxRequests
    }
  };

  const response: APIResponse<AuthInfoResponse> = {
    success: true,
    data: authInfo,
    message: 'Authentication methods: Use X-Shared-Secret header for Next.js or JWT tokens for external clients',
    metadata: {
      timestamp: new Date().toISOString()
    }
  };

  res.status(200).json(response);
}));

/**
 * GET /auth/shared-secret
 * Returns shared secret information for development (only in development mode)
 */
router.get('/shared-secret', asyncHandler(async (req: Request, res: Response) => {
  if (azureConfig.server.environment !== 'development') {
    throw createAPIError('Shared secret info only available in development mode', 403, 'FORBIDDEN');
  }

  const response: APIResponse = {
    success: true,
    data: {
      header: 'X-Shared-Secret',
      value: azureConfig.security.sharedSecret,
      usage: 'Include this header in requests from your Next.js app'
    },
    message: 'For Next.js integration: Include X-Shared-Secret header with this value',
    metadata: {
      timestamp: new Date().toISOString()
    }
  };

  res.status(200).json(response);
}));

/**
 * Helper function to parse expiration strings
 */
function parseExpiresIn(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd]?)$/);
  if (!match) {
    return 3600; // Default to 1 hour
  }

  const value = parseInt(match[1]);
  const unit = match[2] || 's';

  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 3600;
    case 'd': return value * 86400;
    default: return value;
  }
}

export default router;