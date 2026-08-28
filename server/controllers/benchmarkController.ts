/**
 * Wabi SACCO - DevOps, Observability & Performance Benchmark Controller
 */

import { Request, Response } from 'express';
import { benchmark, BenchmarkScenarioConfig } from '../services/benchmarkService';
import { cache } from '../services/cacheService';
import { queue, JobType, JobPriority } from '../services/queueService';
import { logger, LogLevel } from '../services/loggerService';
import { metrics } from '../services/metricsService';
import { storage } from '../services/storageService';
import { db } from '../db/database';

export const benchmarkController = {
  /**
   * Run high concurrency load test benchmark
   */
  async runLoadTest(req: Request, res: Response): Promise<void> {
    try {
      const {
        scenarioName = 'MIXED_ENTERPRISE',
        concurrencyUsers = 500,
        totalRequests = 5000,
      } = req.body as BenchmarkScenarioConfig;

      if (concurrencyUsers > 10000) {
        res.status(400).json({
          success: false,
          error: { message: 'Maximum supported concurrency test ceiling is 10,000 virtual users.' },
        });
        return;
      }

      const result = await benchmark.runBenchmark({
        scenarioName,
        concurrencyUsers: Number(concurrencyUsers),
        totalRequests: Number(totalRequests),
      });

      res.status(200).json({
        success: true,
        data: result,
        message: `Benchmark completed for ${concurrencyUsers} users across ${totalRequests} requests.`,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { message: err.message || 'Benchmark execution error' },
      });
    }
  },

  /**
   * Retrieve historical benchmark test results
   */
  getBenchmarkHistory(req: Request, res: Response): void {
    const history = benchmark.getHistory();
    res.status(200).json({
      success: true,
      data: history,
      isBusy: benchmark.isBusy(),
    });
  },

  /**
   * Get telemetry metrics (JSON)
   */
  getMetrics(req: Request, res: Response): void {
    const data = metrics.getMetrics();
    res.status(200).json({
      success: true,
      data,
    });
  },

  /**
   * Prometheus scrape format
   */
  getPrometheusMetrics(req: Request, res: Response): void {
    const text = metrics.getPrometheusMetrics();
    res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.status(200).send(text);
  },

  /**
   * Cache telemetry
   */
  getCacheStats(req: Request, res: Response): void {
    const stats = cache.getStats();
    res.status(200).json({
      success: true,
      data: stats,
    });
  },

  /**
   * Trigger cache warm-up
   */
  async warmUpCache(req: Request, res: Response): Promise<void> {
    const result = await cache.warmUp(db);
    res.status(200).json({
      success: true,
      data: result,
      message: `Warmed ${result.warmedKeys.length} critical lookup caches in ${result.durationMs}ms`,
    });
  },

  /**
   * Invalidate cache by tag
   */
  invalidateCacheTag(req: Request, res: Response): void {
    const { tag } = req.body;
    if (!tag) {
      res.status(400).json({ success: false, error: { message: 'Tag name is required' } });
      return;
    }
    const count = cache.invalidateTag(tag);
    res.status(200).json({
      success: true,
      message: `Cleared ${count} keys matching tag "${tag}"`,
      keysCleared: count,
    });
  },

  /**
   * Clear cache entirely
   */
  clearCache(req: Request, res: Response): void {
    cache.clear();
    res.status(200).json({
      success: true,
      message: 'Centralized enterprise cache flushed successfully',
    });
  },

  /**
   * Queue metrics
   */
  getQueueStats(req: Request, res: Response): void {
    const stats = queue.getStats();
    res.status(200).json({
      success: true,
      data: stats,
    });
  },

  /**
   * List background queue jobs
   */
  getQueueJobs(req: Request, res: Response): void {
    const { status, type, priority, limit } = req.query;
    const jobs = queue.getJobs({
      status: status as any,
      type: type as any,
      priority: priority as any,
      limit: limit ? parseInt(limit as string, 10) : 50,
    });
    res.status(200).json({
      success: true,
      data: jobs,
    });
  },

  /**
   * Enqueue a test background job
   */
  enqueueJob(req: Request, res: Response): void {
    const { type = 'REPORT_GENERATION', payload = {}, priority = 'NORMAL', delayMs = 0 } = req.body;
    const job = queue.enqueue(type as JobType, payload, {
      priority: priority as JobPriority,
      delayMs: Number(delayMs),
    });
    res.status(201).json({
      success: true,
      data: job,
      message: `Job ${job.id} enqueued successfully.`,
    });
  },

  /**
   * Retry failed DLQ job
   */
  retryDlqJob(req: Request, res: Response): void {
    const { id } = req.params;
    const success = queue.retryDlqJob(id);
    if (success) {
      res.status(200).json({ success: true, message: `Job ${id} re-enqueued for processing.` });
    } else {
      res.status(404).json({ success: false, error: { message: 'Job not found in Dead-Letter Queue (DLQ).' } });
    }
  },

  /**
   * Purge queue
   */
  purgeQueue(req: Request, res: Response): void {
    const { status } = req.body;
    const count = queue.purgeJobs(status);
    res.status(200).json({
      success: true,
      message: `Purged ${count} jobs from queue`,
      purgedCount: count,
    });
  },

  /**
   * Structured logs endpoint
   */
  getLogs(req: Request, res: Response): void {
    const { level, module, search, correlationId, limit } = req.query;
    const logs = logger.getLogs({
      level: level as LogLevel,
      module: module as string,
      search: search as string,
      correlationId: correlationId as string,
      limit: limit ? parseInt(limit as string, 10) : 100,
    });
    res.status(200).json({
      success: true,
      data: logs,
    });
  },

  /**
   * Storage files list
   */
  getStorageFiles(req: Request, res: Response): void {
    const files = storage.listFiles();
    res.status(200).json({
      success: true,
      data: files,
    });
  },

  /**
   * Generate signed download URL
   */
  generateSignedUrl(req: Request, res: Response): void {
    const { fileId, ttlSeconds = 3600 } = req.body;
    const file = storage.getFile(fileId);
    if (!file) {
      res.status(404).json({ success: false, error: { message: 'File not found' } });
      return;
    }
    const signed = storage.generateSignedUrl(fileId, { expiresInSeconds: ttlSeconds });
    res.status(200).json({
      success: true,
      data: signed,
    });
  },
};
