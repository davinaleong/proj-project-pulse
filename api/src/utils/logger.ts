/**
 * Logger Utility
 *
 * Provides structured logging with multiple levels and configurable output.
 * Supports different environments and external logging services.
 */

import { Request, Response, NextFunction } from 'express'
import { Request, Response, NextFunction } from 'express'
import { ENV } from '../config/env'

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  VERBOSE = 4,
}

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, unknown>
  error?: Error
  metadata?: Record<string, unknown>
}

export interface LoggerConfig {
  level: LogLevel
  format: 'json' | 'text'
  colorize: boolean
  includeTimestamp: boolean
  includeStackTrace: boolean
}

class Logger {
  private config: LoggerConfig

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      level: this.getLogLevelFromEnv(),
      format: ENV.NODE_ENV === 'development' ? 'text' : 'json',
      colorize: ENV.NODE_ENV === 'development',
      includeTimestamp: true,
      includeStackTrace: ENV.NODE_ENV === 'development',
      ...config,
    }
  }

  private getLogLevelFromEnv(): LogLevel {
    const envLevel = ENV.LOG_LEVEL?.toUpperCase()
    switch (envLevel) {
      case 'ERROR':
        return LogLevel.ERROR
      case 'WARN':
        return LogLevel.WARN
      case 'INFO':
        return LogLevel.INFO
      case 'DEBUG':
        return LogLevel.DEBUG
      case 'VERBOSE':
        return LogLevel.VERBOSE
      default:
        return ENV.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.config.level
  }

  private formatMessage(entry: LogEntry): string {
    if (this.config.format === 'json') {
      return JSON.stringify({
        level: LogLevel[entry.level],
        message: entry.message,
        timestamp: entry.timestamp,
        ...(entry.context && { context: entry.context }),
        ...(entry.metadata && { metadata: entry.metadata }),
        ...(entry.error &&
          this.config.includeStackTrace && {
            error: {
              message: entry.error.message,
              stack: entry.error.stack,
              name: entry.error.name,
            },
          }),
      })
    }

    // Text format
    const levelName = LogLevel[entry.level].padEnd(7)
    const timestamp = this.config.includeTimestamp
      ? `[${entry.timestamp}] `
      : ''
    const colorize = this.config.colorize ? this.getColorCode(entry.level) : ''
    const resetColor = this.config.colorize ? '\x1b[0m' : ''

    let message = `${timestamp}${colorize}${levelName}${resetColor} ${entry.message}`

    if (entry.context && Object.keys(entry.context).length > 0) {
      message += ` ${JSON.stringify(entry.context)}`
    }

    if (entry.error && this.config.includeStackTrace) {
      message += `\n${entry.error.stack}`
    }

    return message
  }

  private getColorCode(level: LogLevel): string {
    switch (level) {
      case LogLevel.ERROR:
        return '\x1b[31m' // Red
      case LogLevel.WARN:
        return '\x1b[33m' // Yellow
      case LogLevel.INFO:
        return '\x1b[36m' // Cyan
      case LogLevel.DEBUG:
        return '\x1b[37m' // White
      case LogLevel.VERBOSE:
        return '\x1b[90m' // Gray
      default:
        return ''
    }
  }

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
  ) {
    if (!this.shouldLog(level)) {
      return
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      metadata: {
        pid: process.pid,
        env: ENV.NODE_ENV,
      },
    }

    const formattedMessage = this.formatMessage(entry)

    // Output to appropriate stream
    if (level === LogLevel.ERROR) {
      console.error(formattedMessage)
    } else {
      console.log(formattedMessage)
    }

    // Send to external logging service in production
    if (ENV.NODE_ENV === 'production') {
      this.sendToExternalService(entry)
    }
  }

  private sendToExternalService(entry: LogEntry) {
    // Integration with external logging services
    // Examples: Winston transports, DataDog, CloudWatch, etc.
    // This is a placeholder for production logging integration

    try {
      // Example for structured logging service
      if (entry.level <= LogLevel.WARN) {
        // Send critical logs to monitoring service
        // await monitoringService.log(entry)
      }
    } catch (error) {
      // Fallback - don't let logging errors crash the application
      console.error('Failed to send log to external service:', error)
    }
  }

  // Public logging methods
  error(message: string, context?: Record<string, unknown> | Error) {
    if (context instanceof Error) {
      const entry: LogEntry = {
        level: LogLevel.ERROR,
        message,
        timestamp: new Date().toISOString(),
        error: context,
        metadata: { pid: process.pid, env: ENV.NODE_ENV },
      }

      if (this.shouldLog(LogLevel.ERROR)) {
        const formattedMessage = this.formatMessage(entry)
        console.error(formattedMessage)

        if (ENV.NODE_ENV === 'production') {
          this.sendToExternalService(entry)
        }
      }
    } else {
      this.log(LogLevel.ERROR, message, context)
    }
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log(LogLevel.WARN, message, context)
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log(LogLevel.INFO, message, context)
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log(LogLevel.DEBUG, message, context)
  }

  verbose(message: string, context?: Record<string, unknown>) {
    this.log(LogLevel.VERBOSE, message, context)
  }

  // Utility methods
  child(_defaultContext: Record<string, unknown>): Logger {
    return new Logger({
      ...this.config,
      // Override methods to include default context
    })
  }

  // Performance logging
  time(label: string): void {
    console.time(label)
  }

  timeEnd(label: string): void {
    console.timeEnd(label)
  }

  // HTTP request logging
  http(
    req: { method: string; url: string; statusCode?: number },
    duration?: number,
  ) {
    const message = `${req.method} ${req.url}`
    const context = {
      method: req.method,
      url: req.url,
      statusCode: req.statusCode,
      ...(duration && { duration: `${duration}ms` }),
    }

    if (req.statusCode && req.statusCode >= 400) {
      this.warn(message, context)
    } else {
      this.info(message, context)
    }
  }

  // Database query logging
  query(query: string, duration?: number, error?: Error) {
    const context = {
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      ...(duration && { duration: `${duration}ms` }),
    }

    if (error) {
      this.error(`Database query failed: ${error.message}`, {
        ...context,
        error,
      })
    } else if (duration && duration > 1000) {
      this.warn('Slow database query', context)
    } else {
      this.debug('Database query executed', context)
    }
  }

  // Security event logging
  security(event: string, context?: Record<string, unknown>) {
    this.warn(`Security Event: ${event}`, {
      ...context,
      security: true,
      timestamp: new Date().toISOString(),
    })
  }

  // Business event logging
  business(event: string, context?: Record<string, unknown>) {
    this.info(`Business Event: ${event}`, {
      ...context,
      business: true,
      timestamp: new Date().toISOString(),
    })
  }
}

// Create default logger instance
export const logger = new Logger()

// Factory function for creating custom loggers
export const createLogger = (config?: Partial<LoggerConfig>): Logger => {
  return new Logger(config)
}

// Express middleware for HTTP request logging
export const httpLoggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const start = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - start
    logger.http(
      {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
      },
      duration,
    )
  })

  next()
}

export default logger
