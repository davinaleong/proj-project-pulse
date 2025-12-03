/**
 * Async Handler Utility
 * Wraps async route handlers to catch errors automatically
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps async route handlers and automatically catches errors
 * @param fn Async route handler function
 * @returns Express middleware function
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Wraps async middleware and automatically catches errors
 * @param fn Async middleware function
 * @returns Express middleware function
 */
export function asyncMiddleware(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Creates a timeout wrapper for async operations
 * @param fn Async function to wrap
 * @param timeoutMs Timeout in milliseconds
 * @returns Promise that resolves or rejects within timeout
 */
export function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    })
  ]);
}

/**
 * Retry wrapper for async operations
 * @param fn Async function to retry
 * @param maxRetries Maximum number of retries
 * @param delay Delay between retries in milliseconds
 * @returns Promise that resolves on success or rejects after max retries
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Exponential backoff
      const backoffDelay = delay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
  
  throw lastError!;
}