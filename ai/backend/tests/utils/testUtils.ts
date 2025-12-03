/**
 * Test Utilities
 * Common utilities and helpers for testing
 */

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../../api/types/api';

/**
 * Create mock Express Request object
 */
export function createMockRequest(overrides: Partial<Request> = {}): Partial<Request> {
  return {
    method: 'GET',
    url: '/test',
    path: '/test',
    headers: {},
    body: {},
    query: {},
    params: {},
    ip: '127.0.0.1',
    ...overrides
  };
}

/**
 * Create mock Express Response object
 */
export function createMockResponse(): Partial<Response> {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
    header: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
    sendStatus: jest.fn().mockReturnThis(),
    locals: {}
  };
  return res;
}

/**
 * Create mock Authenticated Request object
 */
export function createMockAuthRequest(overrides: Partial<AuthenticatedRequest> = {}): Partial<AuthenticatedRequest> {
  return {
    ...createMockRequest(),
    user: {
      id: 'test-user',
      client_id: 'test-client',
      source: 'jwt-token'
    },
    context: {
      requestId: 'test-request-id',
      startTime: Date.now()
    },
    ...overrides
  };
}

/**
 * Create mock Next function
 */
export function createMockNext() {
  return jest.fn();
}

/**
 * Wait for specified time (for async testing)
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate test JWT token
 */
export function generateTestJWT(payload: any = { id: 'test-user', source: 'test' }): string {
  // Use the same secret as the application
  const testSecret = 'your-super-secret-jwt-key-here';
  return jwt.sign(payload, testSecret, { expiresIn: '1h' });
}

/**
 * Mock environment variables
 */
export function mockEnv(env: Record<string, string>) {
  const originalEnv = process.env;
  
  beforeEach(() => {
    process.env = { ...originalEnv, ...env };
  });
  
  afterEach(() => {
    process.env = originalEnv;
  });
}