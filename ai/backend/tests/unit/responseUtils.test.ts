/**
 * Response Utility Unit Tests
 * Tests for response helpers and formatting
 */

import { formatResponse, formatErrorResponse } from '../../utils/response';

describe('Response Utils', () => {
  describe('formatResponse', () => {
    it('should format successful response with data', () => {
      const data = { id: 1, name: 'Test Project' };
      const response = formatResponse(data, 'Project retrieved successfully');

      expect(response).toEqual({
        success: true,
        message: 'Project retrieved successfully',
        data: { id: 1, name: 'Test Project' },
        timestamp: expect.any(String)
      });
    });

    it('should format response without message', () => {
      const data = { items: [] as any[] };
      const response = formatResponse(data);

      expect(response).toEqual({
        success: true,
        data: { items: [] },
        timestamp: expect.any(String)
      });
      expect(response.message).toBeUndefined();
    });

    it('should format response without data', () => {
      const response = formatResponse(null, 'Operation completed');

      expect(response).toEqual({
        success: true,
        message: 'Operation completed',
        timestamp: expect.any(String)
      });
      expect(response.data).toBeUndefined();
    });

    it('should include valid ISO timestamp', () => {
      const response = formatResponse({ test: true });
      
      expect(response.timestamp).toBeValidISODate();
    });
  });

  describe('formatErrorResponse', () => {
    it('should format error response with message', () => {
      const response = formatErrorResponse(
        'Resource not found',
        404,
        'NOT_FOUND'
      );

      expect(response).toEqual({
        success: false,
        error: {
          message: 'Resource not found',
          code: 'NOT_FOUND',
          status: 404
        },
        timestamp: expect.any(String)
      });
    });

    it('should format error response with default status', () => {
      const response = formatErrorResponse('Internal error');

      expect(response).toEqual({
        success: false,
        error: {
          message: 'Internal error',
          status: 500
        },
        timestamp: expect.any(String)
      });
    });

    it('should format error response with details', () => {
      const details = { field: 'email', reason: 'invalid format' };
      const response = formatErrorResponse(
        'Validation failed',
        400,
        'VALIDATION_ERROR',
        details
      );

      expect(response).toEqual({
        success: false,
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          status: 400,
          details: { field: 'email', reason: 'invalid format' }
        },
        timestamp: expect.any(String)
      });
    });

    it('should include valid ISO timestamp', () => {
      const response = formatErrorResponse('Test error');
      
      expect(response.timestamp).toBeValidISODate();
    });

    it('should handle Error objects', () => {
      const error = new Error('Database connection failed');
      const response = formatErrorResponse(error.message, 500, 'DB_ERROR');

      expect(response.error.message).toBe('Database connection failed');
    });
  });

  describe('response consistency', () => {
    it('should always include success field', () => {
      const successResponse = formatResponse({ data: true });
      const errorResponse = formatErrorResponse('Error');

      expect(successResponse).toHaveProperty('success', true);
      expect(errorResponse).toHaveProperty('success', false);
    });

    it('should always include timestamp field', () => {
      const successResponse = formatResponse({ data: true });
      const errorResponse = formatErrorResponse('Error');

      expect(successResponse).toHaveProperty('timestamp');
      expect(errorResponse).toHaveProperty('timestamp');
      expect(successResponse.timestamp).toBeValidISODate();
      expect(errorResponse.timestamp).toBeValidISODate();
    });

    it('should maintain consistent structure', () => {
      const successResponse = formatResponse({ data: true });
      const errorResponse = formatErrorResponse('Error');

      // Success response structure
      expect(Object.keys(successResponse).sort()).toEqual(
        ['success', 'data', 'timestamp'].sort()
      );

      // Error response structure  
      expect(Object.keys(errorResponse).sort()).toEqual(
        ['success', 'error', 'timestamp'].sort()
      );
    });
  });

  describe('edge cases', () => {
    it('should handle null data gracefully', () => {
      const response = formatResponse(null);
      
      expect(response.success).toBe(true);
      expect(response.data).toBeUndefined();
    });

    it('should handle undefined data gracefully', () => {
      const response = formatResponse(undefined);
      
      expect(response.success).toBe(true);
      expect(response.data).toBeUndefined();
    });

    it('should handle empty string message', () => {
      const response = formatResponse({ data: true }, '');
      
      expect(response.message).toBe('');
    });

    it('should handle complex nested data', () => {
      const complexData = {
        user: { id: 1, profile: { name: 'John', settings: { theme: 'dark' } } },
        projects: [{ id: 1, tasks: [{ id: 1, subtasks: [] as any[] }] }]
      };

      const response = formatResponse(complexData);
      
      expect(response.data).toEqual(complexData);
      expect(response.success).toBe(true);
    });

    it('should handle empty error code', () => {
      const response = formatErrorResponse('Error', 400, '');
      
      expect(response.error.code).toBe('');
    });

    it('should handle zero status code', () => {
      const response = formatErrorResponse('Error', 0);
      
      expect(response.error.status).toBe(0);
    });
  });
});