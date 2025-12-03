/**
 * Authentication Routes
 * Handles JWT token issuance and validation using API keys
 */

import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { azureConfig } from '../../config/environment';
import { APIResponse } from '../types/api';
import { asyncHandler } from '../utils/asyncHandler';
import { createAPIError } from '../middleware/errorHandler';

const router = Router();

interface TokenRequest {
  apiKey: string;
  clientId?: string;
  scopes?: string[];
  expiresIn?: string;
}

interface TokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  issued_at: string;
  scope: string[];
}

// Validation rules for token request
const tokenValidation = [
  body('apiKey')
    .isString()
    .isLength({ min: 10 })
    .withMessage('API key must be a valid string with at least 10 characters'),
  
  body('clientId')
    .optional()
    .isString()
    .isLength({ min: 3, max: 50 })
    .withMessage('Client ID must be between 3 and 50 characters'),
  
  body('scopes')
    .optional()
    .isArray()
    .withMessage('Scopes must be an array of strings'),
    
  body('expiresIn')
    .optional()
    .isString()
    .matches(/^(\d+[smhd]|\d+)$/)
    .withMessage('ExpiresIn must be a valid duration (e.g., 1h, 30m, 86400)')
];

/**
 * POST /auth/token
 * Issues a JWT token in exchange for a valid API key
 */
router.post('/token', tokenValidation, asyncHandler(async (req: Request, res: Response) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createAPIError('Invalid request parameters', 400, 'VALIDATION_ERROR', {
      errors: errors.array()
    });
  }

  const { apiKey, clientId = 'anonymous', scopes = ['read', 'search'], expiresIn = '1h' } = req.body as TokenRequest;

  // Validate API key
  const validApiKeys = azureConfig.security.validApiKeys;
  if (!validApiKeys.includes(apiKey)) {
    throw createAPIError('Invalid API key', 401, 'INVALID_API_KEY');
  }

  // Generate unique subject (user identifier)
  const subject = `client:${clientId}:${Date.now()}`;
  
  // Calculate expiration
  const now = Math.floor(Date.now() / 1000);
  const expirationSeconds = parseExpiresIn(expiresIn);
  const exp = now + expirationSeconds;

  // JWT payload following best practices
  const payload = {
    sub: subject,           // Subject (user identifier)
    iat: now,              // Issued at
    exp: exp,              // Expiration time
    aud: 'project-pulse-ai', // Audience
    iss: 'project-pulse-auth', // Issuer
    scope: scopes.join(' '), // Scopes as space-separated string
    client_id: clientId,    // Client identifier
    jti: generateJTI()      // JWT ID for tracking/revocation
  };

  // Sign JWT with secret
  const token = jwt.sign(payload, azureConfig.security.jwtSecret, {
    algorithm: 'HS256'
  });

  // Response following OAuth 2.0 standards
  const response: APIResponse<TokenResponse> = {
    success: true,
    data: {
      access_token: token,
      token_type: 'Bearer',
      expires_in: expirationSeconds,
      issued_at: new Date(now * 1000).toISOString(),
      scope: scopes
    },
    metadata: {
      timestamp: new Date().toISOString(),
      requestId: (req as any).context?.requestId
    }
  };

  // Security headers
  res.set({
    'Cache-Control': 'no-store',
    'Pragma': 'no-cache'
  });

  res.json(response);
}));

/**
 * POST /auth/verify
 * Verifies and decodes a JWT token (for debugging/testing)
 */
router.post('/verify', [
  body('token')
    .isString()
    .isLength({ min: 10 })
    .withMessage('Token must be a valid JWT string')
], asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createAPIError('Invalid token format', 400, 'VALIDATION_ERROR');
  }

  const { token } = req.body;

  try {
    const decoded = jwt.verify(token, azureConfig.security.jwtSecret) as any;
    
    const response: APIResponse<any> = {
      success: true,
      data: {
        valid: true,
        payload: decoded,
        expires_at: new Date(decoded.exp * 1000).toISOString(),
        time_remaining: decoded.exp - Math.floor(Date.now() / 1000)
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: (req as any).context?.requestId
      }
    };

    res.json(response);
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw createAPIError('Invalid token', 401, 'INVALID_TOKEN');
    } else if (error instanceof jwt.TokenExpiredError) {
      throw createAPIError('Token expired', 401, 'TOKEN_EXPIRED');
    } else {
      throw createAPIError('Token verification failed', 401, 'VERIFICATION_FAILED');
    }
  }
}));

/**
 * GET /auth/info
 * Returns authentication configuration information (public)
 */
router.get('/info', asyncHandler(async (req: Request, res: Response) => {
  const response: APIResponse<any> = {
    success: true,
    data: {
      token_endpoint: '/api/v1/auth/token',
      verify_endpoint: '/api/v1/auth/verify',
      supported_scopes: ['read', 'search', 'chat', 'rag', 'analytics'],
      token_type: 'Bearer',
      algorithms: ['HS256'],
      default_expiration: '1h',
      max_expiration: '24h'
    },
    metadata: {
      timestamp: new Date().toISOString(),
      requestId: (req as any).context?.requestId
    }
  };

  res.json(response);
}));

/**
 * Parse expires_in string to seconds
 */
function parseExpiresIn(expiresIn: string): number {
  if (!expiresIn) return 3600; // 1 hour default

  // If it's just a number, treat as seconds
  if (/^\d+$/.test(expiresIn)) {
    return Math.min(parseInt(expiresIn), 86400); // Max 24 hours
  }

  // Parse duration strings like '1h', '30m', '3600s'
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 3600;

  const [, value, unit] = match;
  const num = parseInt(value);

  switch (unit) {
    case 's': return Math.min(num, 86400);           // seconds
    case 'm': return Math.min(num * 60, 86400);      // minutes
    case 'h': return Math.min(num * 3600, 86400);    // hours  
    case 'd': return Math.min(num * 86400, 86400);   // days (max 1 day)
    default: return 3600;
  }
}

/**
 * Generate a unique JWT ID for tracking
 */
function generateJTI(): string {
  return `jwt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export { router as authRouter };