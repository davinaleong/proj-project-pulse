/**
 * Authentication Middleware Unit Tests
 * Tests for JWT and shared secret authentication
 */

import { authMiddleware } from '../../api/middleware/auth';
import { createMockRequest, createMockResponse, createMockNext, generateTestJWT } from '../utils/testUtils';

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
  sign: jest.fn()
}));

// Mock config
jest.mock('../../config/environment', () => ({
  azureConfig: {
    security: {
      jwtSecret: 'test-jwt-secret',
      sharedSecret: 'test-shared-secret'
    }
  }
}));

const jwt = require('jsonwebtoken');

describe('Auth Middleware', () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    req = createMockRequest();
    res = createMockResponse();
    next = createMockNext();
    jest.clearAllMocks();
  });

  describe('public routes', () => {
    const publicPaths = ['/health', '/auth/', '/ping', '/api/v1'];

    publicPaths.forEach(path => {
      it(`should allow access to ${path} without authentication`, async () => {
        req.path = path;
        
        await authMiddleware(req, res, next);
        
        expect(next).toHaveBeenCalledWith();
        expect(res.status).not.toHaveBeenCalled();
      });
    });
  });

  describe('JWT authentication', () => {
    it('should authenticate valid JWT token', async () => {
      const token = generateTestJWT({ sub: 'test-user' });
      req.headers = { authorization: `Bearer ${token}` };
      req.path = '/api/v1/search';

      jwt.verify.mockReturnValue({ sub: 'test-user', client_id: 'test-client' });

      await authMiddleware(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith(token, 'test-jwt-secret');
      expect(req.user).toEqual({
        id: 'test-user',
        client_id: 'test-client',
        source: 'jwt-token'
      });
      expect(next).toHaveBeenCalledWith();
    });

    it('should reject invalid JWT token', async () => {
      req.headers = { authorization: 'Bearer invalid-token' };
      req.path = '/api/v1/search';

      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid or expired token',
        message: 'JWT verification failed',
        metadata: expect.objectContaining({
          timestamp: expect.any(String)
        })
      });
    });

    it('should reject expired JWT token', async () => {
      req.headers = { authorization: 'Bearer expired-token' };
      req.path = '/api/v1/search';

      jwt.verify.mockImplementation(() => {
        const error = new Error('Token expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token has expired',
        message: 'Please obtain a new token',
        metadata: expect.objectContaining({
          timestamp: expect.any(String)
        })
      });
    });
  });

  describe('shared secret authentication', () => {
    it('should authenticate valid shared secret', async () => {
      req.headers = { 'x-shared-secret': 'test-shared-secret' };
      req.path = '/api/v1/search';

      await authMiddleware(req, res, next);

      expect(req.user).toEqual({
        id: "nextjs-app",
        source: "shared-secret"
      });
      expect(next).toHaveBeenCalledWith();
    });

    it('should reject invalid shared secret', async () => {
      req.headers = { 'x-shared-secret': 'wrong-secret' };
      req.path = '/api/v1/search';

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid shared secret',
        message: 'Authentication failed',
        metadata: expect.objectContaining({
          timestamp: expect.any(String)
        })
      });
    });
  });

  describe('missing authentication', () => {
    it('should reject requests without authentication', async () => {
      req.path = '/api/v1/search';
      req.headers = {};

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required',
        message: 'No valid authentication method provided. Use Bearer token or X-Shared-Secret header.',
        metadata: expect.objectContaining({
          timestamp: expect.any(String)
        })
      });
    });

    it('should reject malformed authorization header', async () => {
      req.headers = { authorization: 'InvalidFormat token' };
      req.path = '/api/v1/search';

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required',
        message: 'No valid authentication method provided. Use Bearer token or X-Shared-Secret header.',
        metadata: expect.objectContaining({
          timestamp: expect.any(String)
        })
      });
    });
  });

  describe('error handling', () => {
    it('should handle JWT verification errors gracefully', async () => {
      req.headers = { authorization: 'Bearer test-token' };
      req.path = '/api/v1/search';

      jwt.verify.mockImplementation(() => {
        throw new Error('Unexpected JWT error');
      });

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid or expired token',
        message: 'JWT verification failed',
        metadata: expect.objectContaining({
          timestamp: expect.any(String)
        })
      });
    });

    it('should handle middleware errors', async () => {
      // Mock an internal error
      const originalProcess = process.env;
      delete process.env;

      req.path = '/api/v1/search';
      req.headers = { authorization: 'Bearer token' };

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      
      process.env = originalProcess;
    });
  });
});