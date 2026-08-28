/**
 * Wabi SACCO - DevOps, Observability & Performance Benchmark Client Service
 */

import { apiClient as api } from './apiClient';

export interface BenchmarkResult {
  id: string;
  scenario: string;
  concurrencyUsers: number;
  totalRequests: number;
  succeededRequests: number;
  failedRequests: number;
  successRatePercentage: number;
  durationMs: number;
  throughputRps: number;
  latency: {
    minMs: number;
    maxMs: number;
    avgMs: number;
    p50Ms: number;
    p90Ms: number;
    p95Ms: number;
    p99Ms: number;
  };
  resourceImpact: {
    initialMemoryMb: number;
    peakMemoryMb: number;
    memoryDeltaMb: number;
    cpuUserMs: number;
    cpuSystemMs: number;
  };
  cacheStats: {
    hits: number;
    misses: number;
    hitRatio: number;
  };
  timestamp: string;
  status: 'COMPLETED' | 'FAILED';
}

export interface CacheTelemetry {
  keysCount: number;
  hits: number;
  misses: number;
  hitRatio: number;
  sets: number;
  evictions: number;
  invalidations: number;
  memoryEstimatedBytes: number;
  topKeys: Array<{ key: string; sizeBytes: number; tags: string[]; expiresAt: number | null; hitCount: number }>;
}

export interface QueueTelemetry {
  queued: number;
  active: number;
  completed: number;
  failed: number;
  dlq: number;
  byPriority: Record<string, number>;
  throughputPerMinute: number;
}

export interface QueueJobItem {
  id: string;
  type: string;
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'DLQ';
  payload: any;
  result?: any;
  error?: string;
  attempts: number;
  maxRetries: number;
  processAt: number;
  createdAt: number;
  durationMs?: number;
}

export interface SystemMetricsData {
  timestamp: string;
  uptimeSeconds: number;
  process: {
    memoryMb: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
    cpu: {
      userSeconds: number;
      systemSeconds: number;
    };
    eventLoopLagMs: number;
  };
  http: {
    totalRequests: number;
    activeRequests: number;
    errorCount: number;
    statusCodes: Record<string, number>;
    latencyP50Ms: number;
    latencyP90Ms: number;
    latencyP95Ms: number;
    latencyP99Ms: number;
    avgLatencyMs: number;
  };
  database: {
    operationsTotal: number;
    readsTotal: number;
    writesTotal: number;
    avgQueryLatencyMs: number;
  };
  queue: {
    queued: number;
    active: number;
    completed: number;
    failed: number;
    dlq: number;
  };
  cache: {
    hitRatio: number;
    hits: number;
    misses: number;
  };
}

export interface StructuredLog {
  id: string;
  timestamp: string;
  level: string;
  message: string;
  module?: string;
  correlationId?: string;
  requestId?: string;
  statusCode?: number;
  durationMs?: number;
  method?: string;
  path?: string;
  ip?: string;
  userId?: string;
  metadata?: any;
}

export interface StoredFileRecord {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  hashSha256: string;
  storageProvider: string;
  storagePath: string;
  category: string;
  uploadedByName: string;
  uploadedAt: string;
}

export const devopsService = {
  // Metrics & Prometheus
  async getMetrics(): Promise<SystemMetricsData> {
    const res = await api.get<{ success: boolean; data: SystemMetricsData }>('/devops/metrics');
    return res.data;
  },

  // Benchmarking
  async runBenchmark(params: {
    scenarioName: 'DEPOSITS' | 'WITHDRAWALS' | 'LOAN_APPLICATIONS' | 'LOGIN' | 'REPORTS' | 'MIXED_ENTERPRISE';
    concurrencyUsers: number;
    totalRequests: number;
  }): Promise<BenchmarkResult> {
    const res = await api.post<{ success: boolean; data: BenchmarkResult }>('/devops/benchmark/run', params);
    return res.data;
  },

  async getBenchmarkHistory(): Promise<{ data: BenchmarkResult[]; isBusy: boolean }> {
    const res = await api.get<{ success: boolean; data: BenchmarkResult[]; isBusy: boolean }>('/devops/benchmark/history');
    return { data: res.data, isBusy: res.isBusy };
  },

  // Cache Management
  async getCacheStats(): Promise<CacheTelemetry> {
    const res = await api.get<{ success: boolean; data: CacheTelemetry }>('/devops/cache/stats');
    return res.data;
  },

  async warmUpCache(): Promise<{ warmedKeys: string[]; durationMs: number }> {
    const res = await api.post<{ success: boolean; data: { warmedKeys: string[]; durationMs: number } }>('/devops/cache/warmup', {});
    return res.data;
  },

  async invalidateTag(tag: string): Promise<number> {
    const res = await api.post<{ success: boolean; keysCleared: number }>('/devops/cache/invalidate-tag', { tag });
    return res.keysCleared;
  },

  async clearCache(): Promise<void> {
    await api.post('/devops/cache/clear', {});
  },

  // Queue Management
  async getQueueStats(): Promise<QueueTelemetry> {
    const res = await api.get<{ success: boolean; data: QueueTelemetry }>('/devops/queues/stats');
    return res.data;
  },

  async getQueueJobs(params?: { status?: string; type?: string; priority?: string; limit?: number }): Promise<QueueJobItem[]> {
    const query = new URLSearchParams(params as any).toString();
    const res = await api.get<{ success: boolean; data: QueueJobItem[] }>(`/devops/queues/jobs?${query}`);
    return res.data;
  },

  async enqueueTestJob(type: string, payload: any, priority: string = 'NORMAL'): Promise<QueueJobItem> {
    const res = await api.post<{ success: boolean; data: QueueJobItem }>('/devops/queues/enqueue', {
      type,
      payload,
      priority,
    });
    return res.data;
  },

  async retryDlqJob(jobId: string): Promise<void> {
    await api.post(`/devops/queues/retry/${jobId}`, {});
  },

  async purgeQueue(status?: string): Promise<number> {
    const res = await api.post<{ success: boolean; purgedCount: number }>('/devops/queues/purge', { status });
    return res.purgedCount;
  },

  // Logs
  async getLogs(params?: { level?: string; module?: string; search?: string; limit?: number }): Promise<StructuredLog[]> {
    const query = new URLSearchParams(params as any).toString();
    const res = await api.get<{ success: boolean; data: StructuredLog[] }>(`/devops/logs?${query}`);
    return res.data;
  },

  // Storage
  async getStorageFiles(): Promise<StoredFileRecord[]> {
    const res = await api.get<{ success: boolean; data: StoredFileRecord[] }>('/devops/storage/files');
    return res.data;
  },

  async generateSignedUrl(fileId: string, ttlSeconds: number = 3600): Promise<{ signedUrl: string; expiresAt: string; token: string }> {
    const res = await api.post<{ success: boolean; data: { signedUrl: string; expiresAt: string; token: string } }>('/devops/storage/signed-url', {
      fileId,
      ttlSeconds,
    });
    return res.data;
  },
};
