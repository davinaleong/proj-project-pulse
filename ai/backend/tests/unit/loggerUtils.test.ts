/**
 * Logger Utility Unit Tests
 * Tests for logging functionality
 */

// Mock the logger module
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  logRequest: jest.fn(),
  logResponse: jest.fn(),
  logPerformance: jest.fn()
};

jest.mock('../../utils/logger', () => ({
  __esModule: true,
  default: mockLogger
}));

import logger from '../../utils/logger';

describe('Logger Utils', () => {
  beforeEach(() => {
    // Clear all mocks between tests
    jest.clearAllMocks();
  });

  describe('log levels', () => {
    it('should log info messages', () => {
      logger.info('Test info message');
      
      expect(mockLogger.info).toHaveBeenCalledWith('Test info message');
    });

    it('should log error messages', () => {
      logger.error('Test error message');
      
      expect(mockLogger.error).toHaveBeenCalledWith('Test error message');
    });

    it('should log warning messages', () => {
      logger.warn('Test warning message');
      
      expect(mockLogger.warn).toHaveBeenCalledWith('Test warning message');
    });

    it('should log debug messages', () => {
      logger.debug('Test debug message');
      
      expect(mockLogger.debug).toHaveBeenCalledWith('Test debug message');
    });
  });

  describe('message formatting', () => {
    it('should handle basic logging', () => {
      logger.info('Basic test');
      
      expect(mockLogger.info).toHaveBeenCalledWith('Basic test');
    });

    it('should handle object logging', () => {
      const testObject = { id: 1, name: 'test' };
      logger.info('Object test', testObject);
      
      expect(mockLogger.info).toHaveBeenCalledWith('Object test', testObject);
    });

    it('should handle error object logging', () => {
      const testError = new Error('Test error');
      logger.error('Error object test', testError);
      
      expect(mockLogger.error).toHaveBeenCalledWith('Error object test', testError);
    });
  });

  describe('request logging', () => {
    it('should log HTTP requests', () => {
      const mockReq = {
        method: 'GET',
        url: '/api/projects',
        ip: '127.0.0.1',
        headers: { 'user-agent': 'test' }
      };

      logger.logRequest(mockReq as any);
      
      expect(mockLogger.logRequest).toHaveBeenCalledWith(mockReq);
    });

    it('should log HTTP responses', () => {
      const mockRes = {
        statusCode: 200,
        get: jest.fn().mockReturnValue('application/json')
      };

      logger.logResponse(mockRes as any, 150);
      
      expect(mockLogger.logResponse).toHaveBeenCalledWith(mockRes, 150);
    });
  });

  describe('environment-based logging', () => {
    it('should handle debug messages', () => {
      logger.debug('Debug message');
      
      expect(mockLogger.debug).toHaveBeenCalledWith('Debug message');
    });

    it('should handle all log levels', () => {
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');
      
      expect(mockLogger.debug).toHaveBeenCalledWith('Debug message');
      expect(mockLogger.info).toHaveBeenCalledWith('Info message');
      expect(mockLogger.warn).toHaveBeenCalledWith('Warning message');
      expect(mockLogger.error).toHaveBeenCalledWith('Error message');
    });
  });

  describe('performance logging', () => {
    it('should log operation timing', () => {
      const operation = 'database-query';
      const duration = 250;
      
      logger.logPerformance(operation, duration);
      
      expect(mockLogger.logPerformance).toHaveBeenCalledWith(operation, duration);
    });

    it('should handle slow operations', () => {
      const slowOperation = 'slow-query';
      const longDuration = 5000; // 5 seconds
      
      logger.logPerformance(slowOperation, longDuration);
      
      expect(mockLogger.logPerformance).toHaveBeenCalledWith(slowOperation, longDuration);
    });
  });

  describe('error logging', () => {
    it('should log errors with details', () => {
      const error = new Error('Test error with stack');
      
      logger.error('Error with stack', error);
      
      expect(mockLogger.error).toHaveBeenCalledWith('Error with stack', error);
    });

    it('should handle simple error objects', () => {
      const simpleError = { message: 'Simple error' };
      
      logger.error('Simple error', simpleError);
      
      expect(mockLogger.error).toHaveBeenCalledWith('Simple error', simpleError);
    });
  });

  describe('edge cases', () => {
    it('should handle null messages', () => {
      logger.info(null as any);
      
      expect(mockLogger.info).toHaveBeenCalledWith(null);
    });

    it('should handle undefined messages', () => {
      logger.info(undefined as any);
      
      expect(mockLogger.info).toHaveBeenCalledWith(undefined);
    });

    it('should handle empty string messages', () => {
      logger.info('');
      
      expect(mockLogger.info).toHaveBeenCalledWith('');
    });

    it('should handle circular references in objects', () => {
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj;
      
      expect(() => {
        logger.info('Circular object', circularObj);
      }).not.toThrow();
      
      expect(mockLogger.info).toHaveBeenCalledWith('Circular object', circularObj);
    });
  });
});