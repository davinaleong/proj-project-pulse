/**
 * Logger utility for application-wide logging
 */

export interface LogLevel {
  ERROR: 'ERROR';
  WARN: 'WARN';
  INFO: 'INFO';
  DEBUG: 'DEBUG';
}

export interface Logger {
  info(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
  logRequest(req: any): void;
  logResponse(res: any, duration?: number): void;
  logPerformance(operation: string, duration: number): void;
}

class AppLogger implements Logger {
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private formatMessage(level: string, message: string): string {
    return `${this.getTimestamp()} [${level}] ${message}`;
  }

  info(message: string, ...args: any[]): void {
    console.info(this.formatMessage('INFO', message), ...args);
  }

  error(message: string, ...args: any[]): void {
    console.error(this.formatMessage('ERROR', message), ...args);
  }

  warn(message: string, ...args: any[]): void {
    console.warn(this.formatMessage('WARN', message), ...args);
  }

  debug(message: string, ...args: any[]): void {
    console.debug(this.formatMessage('DEBUG', message), ...args);
  }

  logRequest(req: any): void {
    const { method, url, ip, headers } = req;
    this.info(`[REQUEST] ${method} ${url} from ${ip}`, {
      userAgent: headers['user-agent']
    });
  }

  logResponse(res: any, duration?: number): void {
    const statusCode = res.statusCode;
    const contentType = res.get('content-type');
    const message = duration 
      ? `[RESPONSE] ${statusCode} (${duration}ms)`
      : `[RESPONSE] ${statusCode}`;
    
    this.info(message, { contentType });
  }

  logPerformance(operation: string, duration: number): void {
    const message = `[PERF] ${operation} completed in ${duration}ms`;
    
    if (duration > 3000) {
      this.warn(`[SLOW] ${operation} took ${duration}ms - consider optimization`);
    } else {
      this.info(message);
    }
  }
}

const logger = new AppLogger();

export default logger;