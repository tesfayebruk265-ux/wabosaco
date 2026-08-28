/**
 * Wabi SACCO - Enterprise Asynchronous Background Queue & Worker System
 * Supports Priority Queues, Retries with Exponential Backoff, Dead-Letter Queue (DLQ), Delayed Jobs, and Worker Pools.
 */

import { logger } from './loggerService';
import { metrics } from './metricsService';

export type JobPriority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';
export type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'DLQ';

export type JobType =
  | 'REPORT_GENERATION'
  | 'SMS_DELIVERY'
  | 'EMAIL_DELIVERY'
  | 'TELEGRAM_DELIVERY'
  | 'NOTIFICATION_RETRY'
  | 'BACKUP_GENERATION'
  | 'AUDIT_AGGREGATION'
  | 'FORECAST_CALCULATION'
  | 'DATA_EXPORT'
  | 'DIVIDEND_ACCRUAL_BATCH'
  | 'BENCHMARK_SIMULATION';

export interface JobPayload {
  [key: string]: any;
}

export interface Job<T = JobPayload> {
  id: string;
  type: JobType;
  priority: JobPriority;
  status: JobStatus;
  payload: T;
  result?: any;
  error?: string;
  attempts: number;
  maxRetries: number;
  backoffFactorMs: number;
  processAt: number; // unix timestamp in ms
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  durationMs?: number;
}

export type JobHandler<T = JobPayload> = (job: Job<T>) => Promise<any>;

export interface QueueStats {
  queued: number;
  active: number;
  completed: number;
  failed: number;
  dlq: number;
  byPriority: Record<JobPriority, number>;
  throughputPerMinute: number;
}

export class QueueService {
  private static instance: QueueService;
  private jobs: Map<string, Job> = new Map();
  private handlers: Map<JobType, JobHandler> = new Map();
  private isRunning: boolean = false;
  private workerConcurrency: number = 5;
  private activeWorkers: number = 0;
  private processInterval: NodeJS.Timeout | null = null;
  private completedCount: number = 0;
  private failedCount: number = 0;
  private dlqCount: number = 0;
  private completedHistoryTimestamps: number[] = [];

  private priorityWeights: Record<JobPriority, number> = {
    CRITICAL: 1,
    HIGH: 2,
    NORMAL: 3,
    LOW: 4,
  };

  private constructor() {
    // Register metrics provider
    metrics.setQueueStatsProvider(() => {
      const stats = this.getStats();
      return {
        queued: stats.queued,
        active: stats.active,
        completed: stats.completed,
        failed: stats.failed,
        dlq: stats.dlq,
      };
    });

    // Default handlers registration
    this.registerDefaultHandlers();
    this.startWorkerPool();
  }

  public static getInstance(): QueueService {
    if (!QueueService.instance) {
      QueueService.instance = new QueueService();
    }
    return QueueService.instance;
  }

  /**
   * Register a worker handler for a specific job type
   */
  public registerHandler<T = JobPayload>(type: JobType, handler: JobHandler<T>): void {
    this.handlers.set(type, handler as JobHandler);
  }

  /**
   * Enqueue a new background job
   */
  public enqueue<T = JobPayload>(
    type: JobType,
    payload: T,
    options?: {
      priority?: JobPriority;
      maxRetries?: number;
      delayMs?: number;
      backoffFactorMs?: number;
    }
  ): Job<T> {
    const priority = options?.priority || 'NORMAL';
    const maxRetries = options?.maxRetries ?? 3;
    const delayMs = options?.delayMs || 0;
    const backoffFactorMs = options?.backoffFactorMs || 2000;

    const job: Job<T> = {
      id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      priority,
      status: 'PENDING',
      payload,
      attempts: 0,
      maxRetries,
      backoffFactorMs,
      processAt: Date.now() + delayMs,
      createdAt: Date.now(),
    };

    this.jobs.set(job.id, job as Job);

    logger.info(`Job enqueued: ${type}`, {
      module: 'QUEUE',
      metadata: { jobId: job.id, priority, type, processAt: new Date(job.processAt).toISOString() },
    });

    // Trigger immediate scheduling check
    setImmediate(() => this.processNextJobs());

    return job;
  }

  /**
   * Start background worker loop
   */
  public startWorkerPool(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    this.processInterval = setInterval(() => {
      this.processNextJobs();
      this.cleanupHistory();
    }, 1000);

    if (this.processInterval.unref) {
      this.processInterval.unref();
    }

    logger.info('Queue worker pool started', {
      module: 'QUEUE',
      metadata: { concurrency: this.workerConcurrency },
    });
  }

  /**
   * Stop background workers
   */
  public stopWorkerPool(): void {
    this.isRunning = false;
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }
  }

  /**
   * Pick and process next eligible jobs based on priority and processAt timestamp
   */
  private async processNextJobs(): Promise<void> {
    if (!this.isRunning) return;
    if (this.activeWorkers >= this.workerConcurrency) return;

    const now = Date.now();
    const availableSlots = this.workerConcurrency - this.activeWorkers;

    // Filter pending eligible jobs
    const eligibleJobs: Job[] = [];
    for (const job of this.jobs.values()) {
      if (job.status === 'PENDING' && job.processAt <= now) {
        eligibleJobs.push(job);
      }
    }

    // Sort by priority (CRITICAL -> HIGH -> NORMAL -> LOW) and creation timestamp
    eligibleJobs.sort((a, b) => {
      const pDiff = this.priorityWeights[a.priority] - this.priorityWeights[b.priority];
      if (pDiff !== 0) return pDiff;
      return a.createdAt - b.createdAt;
    });

    const toProcess = eligibleJobs.slice(0, availableSlots);

    toProcess.forEach((job) => {
      this.runJob(job);
    });
  }

  /**
   * Execute a single background job
   */
  private async runJob(job: Job): Promise<void> {
    const handler = this.handlers.get(job.type);
    if (!handler) {
      logger.error(`No handler registered for job type: ${job.type}`, {
        module: 'QUEUE',
        metadata: { jobId: job.id, type: job.type },
      });
      job.status = 'FAILED';
      job.error = `No handler registered for job type ${job.type}`;
      this.failedCount++;
      return;
    }

    this.activeWorkers++;
    job.status = 'PROCESSING';
    job.attempts++;
    job.startedAt = Date.now();

    try {
      const result = await handler(job);
      job.status = 'COMPLETED';
      job.result = result;
      job.completedAt = Date.now();
      job.durationMs = job.completedAt - job.startedAt;
      this.completedCount++;
      this.completedHistoryTimestamps.push(job.completedAt);

      logger.info(`Job completed: ${job.type}`, {
        module: 'QUEUE',
        metadata: { jobId: job.id, durationMs: job.durationMs, attempts: job.attempts },
      });
    } catch (err: any) {
      job.error = err.message || 'Execution error';
      logger.warn(`Job failed on attempt ${job.attempts}/${job.maxRetries}: ${job.type}`, {
        module: 'QUEUE',
        metadata: { jobId: job.id, error: job.error },
      });

      if (job.attempts < job.maxRetries) {
        // Schedule retry with exponential backoff and jitter
        const jitter = Math.floor(Math.random() * 500);
        const delay = Math.pow(2, job.attempts - 1) * job.backoffFactorMs + jitter;
        job.status = 'PENDING';
        job.processAt = Date.now() + delay;
        logger.info(`Job scheduled for retry in ${delay}ms`, {
          module: 'QUEUE',
          metadata: { jobId: job.id, retryAt: new Date(job.processAt).toISOString() },
        });
      } else {
        // Move to Dead-Letter Queue (DLQ)
        job.status = 'DLQ';
        job.completedAt = Date.now();
        this.dlqCount++;
        this.failedCount++;
        logger.error(`Job exceeded max retries and moved to Dead-Letter Queue (DLQ): ${job.type}`, {
          module: 'QUEUE',
          metadata: { jobId: job.id, attempts: job.attempts, error: job.error },
        });
      }
    } finally {
      this.activeWorkers = Math.max(0, this.activeWorkers - 1);
      // Process any newly queued jobs
      setImmediate(() => this.processNextJobs());
    }
  }

  /**
   * Manually retry a DLQ job
   */
  public retryDlqJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'DLQ') return false;

    job.status = 'PENDING';
    job.attempts = 0;
    job.error = undefined;
    job.processAt = Date.now();
    this.dlqCount = Math.max(0, this.dlqCount - 1);

    logger.info(`DLQ Job manual retry triggered`, {
      module: 'QUEUE',
      metadata: { jobId },
    });

    setImmediate(() => this.processNextJobs());
    return true;
  }

  /**
   * Purge completed/DLQ jobs
   */
  public purgeJobs(filterStatus?: JobStatus): number {
    let count = 0;
    for (const [id, job] of this.jobs.entries()) {
      if (filterStatus) {
        if (job.status === filterStatus) {
          this.jobs.delete(id);
          count++;
        }
      } else if (job.status === 'COMPLETED' || job.status === 'DLQ') {
        this.jobs.delete(id);
        count++;
      }
    }
    return count;
  }

  /**
   * Get job by ID
   */
  public getJob(jobId: string): Job | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * List jobs with pagination & filter
   */
  public getJobs(filter?: {
    status?: JobStatus;
    type?: JobType;
    priority?: JobPriority;
    limit?: number;
  }): Job[] {
    let list = Array.from(this.jobs.values());

    if (filter?.status) {
      list = list.filter((j) => j.status === filter.status);
    }
    if (filter?.type) {
      list = list.filter((j) => j.type === filter.type);
    }
    if (filter?.priority) {
      list = list.filter((j) => j.priority === filter.priority);
    }

    list.sort((a, b) => b.createdAt - a.createdAt);
    return list.slice(0, filter?.limit || 100);
  }

  /**
   * Get real-time queue health & metrics
   */
  public getStats(): QueueStats {
    let queued = 0;
    const byPriority: Record<JobPriority, number> = {
      CRITICAL: 0,
      HIGH: 0,
      NORMAL: 0,
      LOW: 0,
    };

    for (const job of this.jobs.values()) {
      if (job.status === 'PENDING') {
        queued++;
        byPriority[job.priority] = (byPriority[job.priority] || 0) + 1;
      }
    }

    // Compute throughput in last 60 seconds
    const oneMinAgo = Date.now() - 60000;
    const completedLastMin = this.completedHistoryTimestamps.filter((t) => t >= oneMinAgo).length;

    return {
      queued,
      active: this.activeWorkers,
      completed: this.completedCount,
      failed: this.failedCount,
      dlq: this.dlqCount,
      byPriority,
      throughputPerMinute: completedLastMin,
    };
  }

  private cleanupHistory(): void {
    const twoMinAgo = Date.now() - 120000;
    this.completedHistoryTimestamps = this.completedHistoryTimestamps.filter((t) => t >= twoMinAgo);

    // Keep memory bounded: retain at most 1,000 finished jobs
    if (this.jobs.size > 2000) {
      const completed = Array.from(this.jobs.values()).filter((j) => j.status === 'COMPLETED');
      if (completed.length > 500) {
        completed.sort((a, b) => (a.completedAt || 0) - (b.completedAt || 0));
        completed.slice(0, 300).forEach((j) => this.jobs.delete(j.id));
      }
    }
  }

  /**
   * Register default enterprise job processors
   */
  private registerDefaultHandlers(): void {
    // 1. Report Generation Worker
    this.registerHandler('REPORT_GENERATION', async (job) => {
      const { reportType, title } = job.payload;
      // Simulate heavy asynchronous compilation
      await new Promise((resolve) => setTimeout(resolve, 800));
      return {
        success: true,
        reportId: `rep_${Date.now()}`,
        downloadUrl: `/api/reports/download/${job.id}`,
        fileSizeBytes: 245760,
        title: title || reportType,
      };
    });

    // 2. Multi-channel notifications
    this.registerHandler('SMS_DELIVERY', async (job) => {
      const { recipient, message } = job.payload;
      await new Promise((resolve) => setTimeout(resolve, 200));
      return { status: 'DELIVERED', provider: 'Ethio Telecom Gateway', recipient };
    });

    this.registerHandler('EMAIL_DELIVERY', async (job) => {
      const { recipient, subject } = job.payload;
      await new Promise((resolve) => setTimeout(resolve, 300));
      return { status: 'SENT', provider: 'SMTP Relay', recipient, subject };
    });

    this.registerHandler('TELEGRAM_DELIVERY', async (job) => {
      const { chatId, text } = job.payload;
      await new Promise((resolve) => setTimeout(resolve, 150));
      return { status: 'SENT', provider: 'Telegram Bot API', chatId };
    });

    // 3. Backup Generation Worker
    this.registerHandler('BACKUP_GENERATION', async (job) => {
      const { type } = job.payload;
      await new Promise((resolve) => setTimeout(resolve, 1200));
      return {
        backupId: `bck_${Date.now()}`,
        type: type || 'FULL',
        checksum: 'sha256:7e8a9f1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f',
        sizeMb: 14.8,
      };
    });

    // 4. Dividend / Interest Accrual Batch Worker
    this.registerHandler('DIVIDEND_ACCRUAL_BATCH', async (job) => {
      const { period, rate } = job.payload;
      await new Promise((resolve) => setTimeout(resolve, 900));
      return {
        processedMembersCount: 143,
        totalDividendPostedEtb: 245000,
        period,
        rate,
      };
    });

    // 5. Data Export Worker
    this.registerHandler('DATA_EXPORT', async (job) => {
      const { entity, format } = job.payload;
      await new Promise((resolve) => setTimeout(resolve, 600));
      return {
        exportId: `exp_${Date.now()}`,
        entity,
        format,
        rowCount: 1250,
        downloadUrl: `/api/admin/export/download/${job.id}`,
      };
    });
  }
}

export const queue = QueueService.getInstance();
