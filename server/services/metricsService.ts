/**
 * Wabi SACCO - Enterprise Observability & System Metrics Collector
 * Computes Latency Percentiles (P50, P90, P95, P99), RPS, Resource Utilization, and Prometheus-ready Metrics.
 */

import os from 'os';
import { cache } from './cacheService';

export interface LatencyHistogram {
  count: number;
  min: number;
  max: number;
  avg: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
}

export interface SystemMetrics {
  timestamp: string;
  uptimeSeconds: number;
  cpu: {
    cores: number;
    loadAverage1m: number;
    processCpuPercentage: number;
  };
  memory: {
    rssBytes: number;
    rssMb: number;
    heapTotalBytes: number;
    heapTotalMb: number;
    heapUsedBytes: number;
    heapUsedMb: number;
    systemTotalMb: number;
    systemFreeMb: number;
    systemUsagePercentage: number;
  };
  http: {
    totalRequests: number;
    activeRequests: number;
    requestsPerSecond: number;
    status2xx: number;
    status3xx: number;
    status4xx: number;
    status5xx: number;
    errorRatePercentage: number;
    latency: LatencyHistogram;
  };
  database: {
    readOps: number;
    writeOps: number;
    slowQueriesCount: number;
    avgQueryLatencyMs: number;
  };
  cache: {
    hits: number;
    misses: number;
    hitRatio: number;
    keys: number;
    memoryMb: number;
  };
  queues: {
    totalQueued: number;
    activeWorkers: number;
    completedJobs: number;
    failedJobs: number;
    dlqJobs: number;
  };
}

export class MetricsService {
  private static instance: MetricsService;
  private startTime: number = Date.now();
  private totalRequests: number = 0;
  private activeRequests: number = 0;
  private status2xx: number = 0;
  private status3xx: number = 0;
  private status4xx: number = 0;
  private status5xx: number = 0;

  // Latency tracking (sliding window of last 1,000 requests)
  private latencies: number[] = [];
  private maxLatencySamples: number = 1000;

  // RPS calculation
  private requestWindow: number[] = []; // timestamps of requests in last 10s

  // Database ops tracking
  private dbReadOps: number = 0;
  private dbWriteOps: number = 0;
  private slowQueries: number = 0;
  private dbLatencies: number[] = [];

  // Queue references
  private queueStatsProvider?: () => { queued: number; active: number; completed: number; failed: number; dlq: number };

  private previousCpuUsage = process.cpuUsage();
  private previousCpuTime = Date.now();

  private constructor() {
    // Background prune of request window
    const interval = setInterval(() => {
      const cutoff = Date.now() - 10000;
      this.requestWindow = this.requestWindow.filter((t) => t > cutoff);
    }, 5000);
    if (interval.unref) interval.unref();
  }

  public static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService();
    }
    return MetricsService.instance;
  }

  public setQueueStatsProvider(provider: () => { queued: number; active: number; completed: number; failed: number; dlq: number }): void {
    this.queueStatsProvider = provider;
  }

  /**
   * Track start of an HTTP request
   */
  public startRequest(): () => void {
    this.activeRequests++;
    this.totalRequests++;
    const now = Date.now();
    this.requestWindow.push(now);

    return () => {
      this.activeRequests = Math.max(0, this.activeRequests - 1);
    };
  }

  /**
   * Record completion of an HTTP request
   */
  public recordRequest(statusCode: number, durationMs: number): void {
    if (statusCode >= 200 && statusCode < 300) this.status2xx++;
    else if (statusCode >= 300 && statusCode < 400) this.status3xx++;
    else if (statusCode >= 400 && statusCode < 500) this.status4xx++;
    else if (statusCode >= 500) this.status5xx++;

    this.latencies.push(durationMs);
    if (this.latencies.length > this.maxLatencySamples) {
      this.latencies.shift();
    }
  }

  /**
   * Track Database read/write ops
   */
  public recordDbOp(type: 'read' | 'write', durationMs: number): void {
    if (type === 'read') this.dbReadOps++;
    else this.dbWriteOps++;

    if (durationMs > 50) {
      this.slowQueries++;
    }

    this.dbLatencies.push(durationMs);
    if (this.dbLatencies.length > 500) {
      this.dbLatencies.shift();
    }
  }

  /**
   * Compute percentile helper
   */
  private calculatePercentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
  }

  /**
   * Compute Latency Histogram
   */
  public getLatencyHistogram(): LatencyHistogram {
    if (this.latencies.length === 0) {
      return { count: 0, min: 0, max: 0, avg: 0, p50: 0, p90: 0, p95: 0, p99: 0 };
    }

    const sorted = [...this.latencies].sort((a, b) => a - b);
    const sum = sorted.reduce((acc, val) => acc + val, 0);

    return {
      count: sorted.length,
      min: parseFloat(sorted[0].toFixed(2)),
      max: parseFloat(sorted[sorted.length - 1].toFixed(2)),
      avg: parseFloat((sum / sorted.length).toFixed(2)),
      p50: parseFloat(this.calculatePercentile(sorted, 50).toFixed(2)),
      p90: parseFloat(this.calculatePercentile(sorted, 90).toFixed(2)),
      p95: parseFloat(this.calculatePercentile(sorted, 95).toFixed(2)),
      p99: parseFloat(this.calculatePercentile(sorted, 99).toFixed(2)),
    };
  }

  /**
   * Compute Current Process CPU Percentage
   */
  private getProcessCpuPercent(): number {
    const currentUsage = process.cpuUsage(this.previousCpuUsage);
    const now = Date.now();
    const elapsedMs = now - this.previousCpuTime;

    this.previousCpuUsage = process.cpuUsage();
    this.previousCpuTime = now;

    if (elapsedMs <= 0) return 0;
    const totalMicros = currentUsage.user + currentUsage.system;
    const percent = (totalMicros / (elapsedMs * 1000)) * 100;
    return parseFloat(Math.min(100, Math.max(0, percent)).toFixed(2));
  }

  /**
   * Get all live system telemetry
   */
  public getMetrics(): SystemMetrics {
    const memUsage = process.memoryUsage();
    const totalSysMem = os.totalmem();
    const freeSysMem = os.freemem();
    const usedSysMem = totalSysMem - freeSysMem;

    const cacheStats = cache.getStats();

    const queueStats = this.queueStatsProvider
      ? this.queueStatsProvider()
      : { queued: 0, active: 0, completed: 0, failed: 0, dlq: 0 };

    const totalErrors = this.status4xx + this.status5xx;
    const errorRate =
      this.totalRequests > 0
        ? parseFloat(((totalErrors / this.totalRequests) * 100).toFixed(2))
        : 0;

    const rps = parseFloat((this.requestWindow.length / 10).toFixed(1));

    const avgDbLatency =
      this.dbLatencies.length > 0
        ? parseFloat((this.dbLatencies.reduce((a, b) => a + b, 0) / this.dbLatencies.length).toFixed(2))
        : 0;

    return {
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      cpu: {
        cores: os.cpus().length,
        loadAverage1m: parseFloat((os.loadavg()[0] || 0).toFixed(2)),
        processCpuPercentage: this.getProcessCpuPercent(),
      },
      memory: {
        rssBytes: memUsage.rss,
        rssMb: parseFloat((memUsage.rss / 1024 / 1024).toFixed(2)),
        heapTotalBytes: memUsage.heapTotal,
        heapTotalMb: parseFloat((memUsage.heapTotal / 1024 / 1024).toFixed(2)),
        heapUsedBytes: memUsage.heapUsed,
        heapUsedMb: parseFloat((memUsage.heapUsed / 1024 / 1024).toFixed(2)),
        systemTotalMb: parseFloat((totalSysMem / 1024 / 1024).toFixed(2)),
        systemFreeMb: parseFloat((freeSysMem / 1024 / 1024).toFixed(2)),
        systemUsagePercentage: parseFloat(((usedSysMem / totalSysMem) * 100).toFixed(2)),
      },
      http: {
        totalRequests: this.totalRequests,
        activeRequests: this.activeRequests,
        requestsPerSecond: rps,
        status2xx: this.status2xx,
        status3xx: this.status3xx,
        status4xx: this.status4xx,
        status5xx: this.status5xx,
        errorRatePercentage: errorRate,
        latency: this.getLatencyHistogram(),
      },
      database: {
        readOps: this.dbReadOps,
        writeOps: this.dbWriteOps,
        slowQueriesCount: this.slowQueries,
        avgQueryLatencyMs: avgDbLatency,
      },
      cache: {
        hits: cacheStats.hits,
        misses: cacheStats.misses,
        hitRatio: cacheStats.hitRatio,
        keys: cacheStats.keysCount,
        memoryMb: parseFloat((cacheStats.memoryEstimatedBytes / 1024 / 1024).toFixed(3)),
      },
      queues: {
        totalQueued: queueStats.queued,
        activeWorkers: queueStats.active,
        completedJobs: queueStats.completed,
        failedJobs: queueStats.failed,
        dlqJobs: queueStats.dlq,
      },
    };
  }

  /**
   * Export Prometheus text format
   */
  public getPrometheusMetrics(): string {
    const m = this.getMetrics();
    return [
      `# HELP wabi_uptime_seconds Application uptime in seconds`,
      `# TYPE wabi_uptime_seconds counter`,
      `wabi_uptime_seconds ${m.uptimeSeconds}`,
      ``,
      `# HELP wabi_http_requests_total Total number of HTTP requests`,
      `# TYPE wabi_http_requests_total counter`,
      `wabi_http_requests_total{status="2xx"} ${m.http.status2xx}`,
      `wabi_http_requests_total{status="3xx"} ${m.http.status3xx}`,
      `wabi_http_requests_total{status="4xx"} ${m.http.status4xx}`,
      `wabi_http_requests_total{status="5xx"} ${m.http.status5xx}`,
      ``,
      `# HELP wabi_http_requests_active Current active in-flight requests`,
      `# TYPE wabi_http_requests_active gauge`,
      `wabi_http_requests_active ${m.http.activeRequests}`,
      ``,
      `# HELP wabi_http_latency_ms HTTP request latency in ms`,
      `# TYPE wabi_http_latency_ms summary`,
      `wabi_http_latency_ms{quantile="0.5"} ${m.http.latency.p50}`,
      `wabi_http_latency_ms{quantile="0.9"} ${m.http.latency.p90}`,
      `wabi_http_latency_ms{quantile="0.95"} ${m.http.latency.p95}`,
      `wabi_http_latency_ms{quantile="0.99"} ${m.http.latency.p99}`,
      `wabi_http_latency_ms_avg ${m.http.latency.avg}`,
      ``,
      `# HELP wabi_memory_heap_used_bytes V8 Heap Used in bytes`,
      `# TYPE wabi_memory_heap_used_bytes gauge`,
      `wabi_memory_heap_used_bytes ${m.memory.heapUsedBytes}`,
      ``,
      `# HELP wabi_cache_hit_ratio_percent Cache hit ratio`,
      `# TYPE wabi_cache_hit_ratio_percent gauge`,
      `wabi_cache_hit_ratio_percent ${m.cache.hitRatio}`,
      ``,
      `# HELP wabi_db_ops_total Database read and write operations`,
      `# TYPE wabi_db_ops_total counter`,
      `wabi_db_ops_total{type="read"} ${m.database.readOps}`,
      `wabi_db_ops_total{type="write"} ${m.database.writeOps}`,
      ``,
      `# HELP wabi_queue_jobs Queue state counts`,
      `# TYPE wabi_queue_jobs gauge`,
      `wabi_queue_jobs{state="queued"} ${m.queues.totalQueued}`,
      `wabi_queue_jobs{state="completed"} ${m.queues.completedJobs}`,
      `wabi_queue_jobs{state="failed"} ${m.queues.failedJobs}`,
      `wabi_queue_jobs{state="dlq"} ${m.queues.dlqJobs}`,
    ].join('\n');
  }
}

export const metrics = MetricsService.getInstance();
