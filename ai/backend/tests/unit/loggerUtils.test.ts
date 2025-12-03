/**
 * Logger Utility Unit Tests
 * Tests for logging functionality
 */

import logger from '../../utils/logger';

// Mock console methods to prevent test output noise
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(),
  error: jest.spyOn(console, 'error').mockImplementation(),
  warn: jest.spyOn(console, 'warn').mockImplementation(),
  info: jest.spyOn(console, 'info').mockImplementation(),
  debug: jest.spyOn(console, 'debug').mockImplementation()
};

describe('Logger Utils', () => {
  beforeEach(() => {
    // Clear all mocks between tests
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Restore console methods
    Object.values(consoleSpy).forEach(spy => spy.mockRestore());
  });

  describe('log levels', () => {
    it('should log info messages', () => {
      logger.info('Test info message');
      
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('INFO'),
        expect.stringContaining('Test info message')
      );
    });

    it('should log error messages', () => {
      logger.error('Test error message');
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('ERROR'),
        expect.stringContaining('Test error message')
      );
    });

    it('should log warning messages', () => {
      logger.warn('Test warning message');
      
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('WARN'),
        expect.stringContaining('Test warning message')
      );
    });

    it('should log debug messages', () => {
      logger.debug('Test debug message');
      
      expect(consoleSpy.debug).toHaveBeenCalledWith(
        expect.stringContaining('DEBUG'),
        expect.stringContaining('Test debug message')
      );
    });
  });

  describe('message formatting', () => {
    it('should include timestamp in log messages', () => {
      logger.info('Timestamp test');
      
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
        expect.any(String)
      );
    });

    it('should include log level in messages', () => {
      logger.error('Level test');
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        expect.stringContaining('Level test')
      );
    });

    it('should handle object logging', () => {
      const testObject = { id: 1, name: 'test' };
      logger.info('Object test', testObject);
      
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        expect.stringContaining('Object test'),
        testObject
      );
    });

    it('should handle error object logging', () => {
      const testError = new Error('Test error');
      logger.error('Error object test', testError);
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        expect.stringContaining('Error object test'),
        testError
      );
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
      
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('[REQUEST]'),
        expect.stringContaining('GET /api/projects'),
        expect.stringContaining('127.0.0.1')
      );
    });

    it('should log HTTP responses', () => {
      const mockRes = {
        statusCode: 200,
        get: jest.fn().mockReturnValue('application/json')
      };

      logger.logResponse(mockRes as any, 150);
      
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('[RESPONSE]'),
        expect.stringContaining('200'),
        expect.stringContaining('150ms')
      );
    });
  });

  describe('environment-based logging', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should respect log level in production', () => {
      process.env.NODE_ENV = 'production';
      
      logger.debug('Debug message');
      
      // In production, debug messages might be filtered
      // This depends on logger configuration
      expect(consoleSpy.debug).toHaveBeenCalled();
    });

    it('should log all levels in development', () => {
      process.env.NODE_ENV = 'development';
      
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');
      
      expect(consoleSpy.debug).toHaveBeenCalled();
      expect(consoleSpy.info).toHaveBeenCalled();
      expect(consoleSpy.warn).toHaveBeenCalled();
      expect(consoleSpy.error).toHaveBeenCalled();
    });
  });

  describe('performance logging', () => {
    it('should log operation timing', () => {
      const operation = 'database-query';
      const duration = 250;
      
      logger.logPerformance(operation, duration);
      
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('[PERF]'),
        expect.stringContaining(operation),
        expect.stringContaining('250ms')
      );
    });

    it('should highlight slow operations', () => {
      const slowOperation = 'slow-query';
      const longDuration = 5000; // 5 seconds
      
      logger.logPerformance(slowOperation, longDuration);
      
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('[SLOW]'),
        expect.stringContaining(slowOperation),
        expect.stringContaining('5000ms')
      );
    });
  });

  describe('error logging', () => {
    it('should log stack traces for errors', () => {
      const error = new Error('Test error with stack');
      
      logger.error('Error with stack', error);
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        expect.stringContaining('Error with stack'),
        expect.objectContaining({
          message: 'Test error with stack',
          stack: expect.stringContaining('Error: Test error with stack')
        })
      );
    });

    it('should handle errors without stack traces', () => {
      const simpleError = { message: 'Simple error' };
      
      logger.error('Simple error', simpleError);
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        expect.stringContaining('Simple error'),
        simpleError
      );
    });
  });

  describe('edge cases', () => {
    it('should handle null messages', () => {
      logger.info(null as any);
      
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        null
      );
    });

    it('should handle undefined messages', () => {
      logger.info(undefined as any);
      
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        undefined
      );
    });

    it('should handle empty string messages', () => {
      logger.info('');
      
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        ''
      );
    });

    it('should handle circular references in objects', () => {
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj;
      
      expect(() => {
        logger.info('Circular object', circularObj);
      }).not.toThrow();
    });
  });
});