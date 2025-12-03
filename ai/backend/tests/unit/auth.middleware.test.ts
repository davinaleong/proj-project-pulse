/**
 * Auth Middleware Tests - Working Version
 */

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../../api/middleware/auth';
import { AuthenticatedRequest } from '../../api/types/api';
import { createMockRequest, createMockResponse } from '../utils/testUtils';

// Mock jsonwebtoken
jest.mock('jsonwebtoken');
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('Auth Middleware', () => {
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    res = createMockResponse();
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('public routes', () => {
    it('should allow access to /health without authentication', async () => {
      const req = { ...createMockRequest(), path: '/health' } as AuthenticatedRequest;
      
      await authMiddleware(req, res as Response, next);
      
      expect(next).toHaveBeenCalledWith();
    });

    it('should allow access to /auth/ without authentication', async () => {
      const req = { ...createMockRequest(), path: '/auth/login' } as AuthenticatedRequest;
      
      await authMiddleware(req, res as Response, next);
      
      expect(next).toHaveBeenCalledWith();
    });

    it('should allow access to /ping without authentication', async () => {
      const req = { ...createMockRequest(), path: '/ping' } as AuthenticatedRequest;
      
      await authMiddleware(req, res as Response, next);
      
      expect(next).toHaveBeenCalledWith();
    });

    it('should allow access to /api/v1 without authentication', async () => {
      const req = { ...createMockRequest(), path: '/api/v1' } as AuthenticatedRequest;
      
      await authMiddleware(req, res as Response, next);
      
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('JWT authentication', () => {
    it('should authenticate valid JWT token', async () => {
      const token = 'valid.jwt.token';
      const payload = { id: 'test-user', client_id: 'test-client' };
      
      const req = {
        ...createMockRequest(),
        path: '/api/v1/search',
        headers: { authorization: `Bearer ${token}` }
      } as AuthenticatedRequest;
      
      (mockJwt.verify as jest.Mock).mockReturnValueOnce(payload);
      
      await authMiddleware(req, res as Response, next);
      
      expect(mockJwt.verify).toHaveBeenCalledWith(token, expect.any(String));
      expect(req.user).toEqual({
        id: 'test-user',
        client_id: 'test-client',
      });
      expect(next).toHaveBeenCalledWith();
    });

    it('should reject invalid JWT token', async () => {
      const token = 'invalid.jwt.token';
      const req = {
        ...createMockRequest(),
        path: '/api/v1/search',
        headers: { authorization: `Bearer ${token}` }
      } as AuthenticatedRequest;
      
      const error = new Error('Invalid token');
      (mockJwt.verify as jest.Mock).mockImplementationOnce(() => {
        throw error;
      });

      await authMiddleware(req, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should reject expired JWT token', async () => {
      const token = 'expired.jwt.token';
      const req = {
        ...createMockRequest(),
        path: '/api/v1/search',
        headers: { authorization: `Bearer ${token}` }
      } as AuthenticatedRequest;
      
      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';
      (mockJwt.verify as jest.Mock).mockImplementationOnce(() => {
        throw error;
      });

      await authMiddleware(req, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('shared secret authentication', () => {
    it('should authenticate valid shared secret', async () => {
      const req = {
        ...createMockRequest(),
        path: '/api/v1/search',
        headers: { 'x-shared-secret': 'your-super-secret-shared-key-here' }
      } as AuthenticatedRequest;
      
      await authMiddleware(req, res as Response, next);
      
      expect(req.user).toEqual({
        id: 'system',
        client_id: 'shared-secret',
      });
      expect(next).toHaveBeenCalledWith();
    });

    it('should reject invalid shared secret', async () => {
      const req = {
        ...createMockRequest(),
        path: '/api/v1/search',
        headers: { 'x-shared-secret': 'invalid-secret' }
      } as AuthenticatedRequest;

      await authMiddleware(req, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('missing authentication', () => {
    it('should reject requests without authentication', async () => {
      const req = {
        ...createMockRequest(),
        path: '/api/v1/search',
        headers: {}
      } as AuthenticatedRequest;

      await authMiddleware(req, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should reject malformed authorization header', async () => {
      const req = {
        ...createMockRequest(),
        path: '/api/v1/search',
        headers: { authorization: 'InvalidFormat token' }
      } as AuthenticatedRequest;

      await authMiddleware(req, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('error handling', () => {
    it('should handle JWT verification errors gracefully', async () => {
      const token = 'malformed-token';
      const req = {
        ...createMockRequest(),
        path: '/api/v1/search',
        headers: { authorization: `Bearer ${token}` }
      } as AuthenticatedRequest;
      
      const error = new Error('JWT malformed');
      (mockJwt.verify as jest.Mock).mockImplementationOnce(() => {
        throw error;
      });

      await authMiddleware(req, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle middleware errors', async () => {
      const req = {
        ...createMockRequest(),
        path: '/api/v1/search',
        headers: {}
      } as AuthenticatedRequest;

      await authMiddleware(req, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});