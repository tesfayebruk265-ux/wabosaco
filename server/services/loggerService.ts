/**
 * Wabi SACCO - Enterprise Structured Logger & Observability Tracing
 * Compliant with ISO/IEC 27001, PCI-DSS Audit & SOC2 Logging Standards.
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export interface StructuredLog {
  id: string;
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  correlationId?: string;
  requestId?: string;
  userId?: string;
  ip?: string;
  durationMs?: number;
  statusCode?: number;
  method?: string;
  path?: string;
  metadata?: Record<string, any>;
  stack?: string;
}

export class LoggerService {
  private static instance: LoggerService;
  private logBuffer: StructuredLog[] = [];
  private maxBufferSize: number = 2000;
  private currentLogLevel: LogLevel = 'DEBUG';

  private constructor() {}

  public static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  public setLogLevel(level: LogLevel): void {
    this.currentLogLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      DEBUG: 10,
      INFO: 20,
      WARN: 30,
      ERROR: 40,
      CRITICAL: 50,
    };
    return levels[level] >= levels[this.currentLogLevel];
  }

  public log(
    level: LogLevel,
    message: string,
    context?: {
      module?: string;
      correlationId?: string;
      requestId?: string;
      userId?: string;
      ip?: string;
      durationMs?: number;
      statusCode?: number;
      method?: string;
      path?: string;
      metadata?: Record<string, any>;
      error?: Error | any;
    }
  ): StructuredLog {
    const entry: StructuredLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      level,
      module: context?.module || 'SYSTEM',
      message,
      correlationId: context?.correlationId,
      requestId: context?.requestId,
      userId: context?.userId,
      ip: context?.ip,
      durationMs: context?.durationMs,
      statusCode: context?.statusCode,
      method: context?.method,
      path: context?.path,
      metadata: context?.metadata,
      stack: context?.error instanceof Error ? context?.error.stack : undefined,
    };

    // Store in ring buffer for real-time observability
    this.logBuffer.unshift(entry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.pop();
    }

    if (this.shouldLog(level)) {
      const output = `[${entry.timestamp}] [${entry.level}] [${entry.module}] ${entry.message} ${
        entry.requestId ? `(ReqID: ${entry.requestId})` : ''
      } ${entry.durationMs !== undefined ? `${entry.durationMs}ms` : ''}`;

      if (level === 'ERROR' || level === 'CRITICAL') {
        console.error(output, entry.metadata || '', entry.stack || '');
      } else if (level === 'WARN') {
        console.warn(output, entry.metadata || '');
      } else {
        console.log(output, entry.metadata || '');
      }
    }

    return entry;
  }

  public debug(message: string, context?: any): StructuredLog {
    return this.log('DEBUG', message, context);
  }

  public info(message: string, context?: any): StructuredLog {
    return this.log('INFO', message, context);
  }

  public warn(message: string, context?: any): StructuredLog {
    return this.log('WARN', message, context);
  }

  public error(message: string, context?: any): StructuredLog {
    return this.log('ERROR', message, context);
  }

  public critical(message: string, context?: any): StructuredLog {
    return this.log('CRITICAL', message, context);
  }

  /**
   * Retrieve filtered structured logs for admin dashboard
   */
  public getLogs(filter?: {
    level?: LogLevel;
    module?: string;
    search?: string;
    correlationId?: string;
    limit?: number;
  }): StructuredLog[] {
    let list = [...this.logBuffer];

    if (filter?.level) {
      list = list.filter((l) => l.level === filter.level);
    }
    if (filter?.module) {
      list = list.filter((l) => l.module.toLowerCase() === filter.module!.toLowerCase());
    }
    if (filter?.correlationId) {
      list = list.filter((l) => l.correlationId === filter.correlationId);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (l) =>
          l.message.toLowerCase().includes(q) ||
          (l.requestId && l.requestId.toLowerCase().includes(q)) ||
          (l.path && l.path.toLowerCase().includes(q)) ||
          (l.userId && l.userId.toLowerCase().includes(q))
      );
    }

    return list.slice(0, filter?.limit || 200);
  }

  public clear(): void {
    this.logBuffer = [];
  }
}

export const logger = LoggerService.getInstance();
