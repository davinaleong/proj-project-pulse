/**
 * Response formatting utilities
 */

export interface SuccessResponse<T = any> {
  success: true;
  data?: T;
  message?: string;
  timestamp: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    status: number;
    details?: any;
  };
  timestamp: string;
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

/**
 * Format successful API response
 */
export function formatResponse<T>(
  data?: T,
  message?: string
): SuccessResponse<T> {
  const response: SuccessResponse<T> = {
    success: true,
    timestamp: new Date().toISOString()
  };

  if (data !== undefined && data !== null) {
    response.data = data;
  }

  if (message !== undefined) {
    response.message = message;
  }

  return response;
}

/**
 * Format error API response
 */
export function formatErrorResponse(
  message: string,
  status: number = 500,
  code?: string,
  details?: any
): ErrorResponse {
  return {
    success: false,
    error: {
      message,
      status,
      ...(code !== undefined && { code }),
      ...(details && { details })
    },
    timestamp: new Date().toISOString()
  };
}