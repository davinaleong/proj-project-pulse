/**
 * Request Logging Middleware
 * Logs all incoming requests with performance metrics
 */

import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest, RequestContext } from '../types/api';
import { v4 as uuidv4 } from 'uuid';

/**
 * Request logging and context middleware
 */
export function requestLogger(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();
  const requestId = uuidv4();
  
  // Set request context
  req.context = {
    requestId,
    startTime,
    user: req.user
  };

  // Log incoming request
  console.log(`📥 [${requestId}] ${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  });

  // Log query parameters and body for non-GET requests
  if (Object.keys(req.query).length > 0) {
    console.log(`📋 [${requestId}] Query:`, req.query);
  }

  if (req.method !== 'GET' && req.body && Object.keys(req.body).length > 0) {
    // Don't log sensitive data
    const safeBody = { ...req.body };
    if (safeBody.password) safeBody.password = '[REDACTED]';
    if (safeBody.token) safeBody.token = '[REDACTED]';
    if (safeBody.apiKey) safeBody.apiKey = '[REDACTED]';
    
    console.log(`📝 [${requestId}] Body:`, safeBody);
  }

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(body: any) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    
    // Log response
    console.log(`📤 [${requestId}] ${statusCode} ${req.method} ${req.path} - ${duration}ms`, {
      success: body?.success !== false,
      error: body?.error,
      userId: req.user?.id
    });

    // Log slow requests
    if (duration > 5000) {
      console.warn(`🐌 [${requestId}] SLOW REQUEST: ${duration}ms`);
    }

    // Log errors
    if (statusCode >= 400) {
      console.error(`❌ [${requestId}] ERROR ${statusCode}:`, {
        error: body?.error,
        message: body?.message,
        path: req.path,
        method: req.method
      });
    }

    return originalJson.call(this, body);
  };

  next();
}

/**
 * Performance monitoring middleware
 */
export function performanceLogger(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const startTime = process.hrtime.bigint();
  
  res.on('finish', () => {
    const duration = Number(process.hrtime.bigint() - startTime) / 1000000; // Convert to milliseconds
    const requestId = req.context?.requestId || 'unknown';
    
    // Log performance metrics
    const metrics = {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: Math.round(duration * 100) / 100, // Round to 2 decimal places
      contentLength: res.get('content-length') || 0,
      userId: req.user?.id,
      userAgent: req.headers['user-agent']
    };

    console.log(`⏱️  [${requestId}] Performance:`, metrics);
    
    // Alert on very slow requests
    if (duration > 10000) {
      console.error(`🚨 [${requestId}] VERY SLOW REQUEST: ${duration}ms`);
    }
  });

  next();
}

/**
 * Request size monitoring middleware
 */
export function requestSizeLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const contentLength = req.headers['content-length'];
  
  if (contentLength) {
    const sizeInMB = parseInt(contentLength) / (1024 * 1024);
    const requestId = (req as AuthenticatedRequest).context?.requestId || 'unknown';
    
    if (sizeInMB > 1) {
      console.warn(`📦 [${requestId}] Large request: ${sizeInMB.toFixed(2)}MB`);
    }
    
    if (sizeInMB > 10) {
      console.error(`🚨 [${requestId}] Very large request: ${sizeInMB.toFixed(2)}MB`);
    }
  }

  next();
}