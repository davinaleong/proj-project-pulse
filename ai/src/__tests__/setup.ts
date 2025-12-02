// Jest setup file for frontend-only app
import { jest } from '@jest/globals';

// Frontend-only test environment - no Azure dependencies
process.env.NODE_ENV = 'test';

// Mock global fetch for any remaining API calls
if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ message: 'Mock response' }),
    })
  ) as jest.Mock;
}

// Mock any remaining external dependencies (no longer needed)
// All services are now mocked internally for frontend-only operation
jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Global test timeout
jest.setTimeout(30000);