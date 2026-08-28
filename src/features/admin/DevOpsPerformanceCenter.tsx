/**
 * Wabi SACCO - DevOps, Observability & Performance Benchmark Center
 * Real-time Telemetry, Load Testing Runner (100-5000 Users), LRU Cache Control, Queue/DLQ Inspector, Storage & Logs.
 */

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Zap,
  Cpu,
  HardDrive,
  Database,
  Layers,
  RefreshCw,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Flame,
  FileCode,
  Lock,
  Search,
  Filter,
  Trash2,
  TrendingUp,
  Server,
  KeyRound,
  FileText,
  Clock,
  ShieldCheck,
  Check,
} from 'lucide-react';
import {
  devopsService,
  BenchmarkResult,
  CacheTelemetry,
  QueueTelemetry,
  QueueJobItem,
  SystemMetricsData,
  StructuredLog,
  StoredFileRecord,
} from '../../services/devopsService';
import { useToast } from '../../providers/ToastProvider';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

type DevOpsTab = 'telemetry' | 'benchmark' | 'cache' | 'queues' | 'storage' | 'logs';

export const DevOpsPerformanceCenter: React.FC = () => {
  const { success, error, warning, info } = useToast();
  const [activeTab, setActiveTab] = useState<DevOpsTab>('telemetry');
  const [isLoading, setIsLoading] = useState(true);

  // Telemetry State
  const [metrics, setMetrics] = useState<SystemMetricsData | null>(null);

  // Benchmark State
  const [benchmarks, setBenchmarks] = useState<BenchmarkResult[]>([]);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [scenarioName, setScenarioName] = useState<'MIXED_ENTERPRISE' | 'DEPOSITS' | 'WITHDRAWALS' | 'LOAN_APPLICATIONS' | 'LOGIN' | 'REPORTS'>('MIXED_ENTERPRISE');
  const [concurrencyUsers, setConcurrencyUsers] = useState<number>(500);
  const [totalRequests, setTotalRequests] = useState<number>(5000);
  const [latestBenchmark, setLatestBenchmark] = useState<BenchmarkResult | null>(null);

  // Cache State
  const [cacheStats, setCacheStats] = useState<CacheTelemetry | null>(null);
  const [tagToInvalidate, setTagToInvalidate] = useState('');
  const [isWarmingCache, setIsWarmingCache] = useState(false);

  // Queue State
  const [queueStats, setQueueStats] = useState<QueueTelemetry | null>(null);
  const [queueJobs, setQueueJobs] = useState<QueueJobItem[]>([]);
  const [queueStatusFilter, setQueueStatusFilter] = useState<string>('ALL');

  // Storage State
  const [storageFiles, setStorageFiles] = useState<StoredFileRecord[]>([]);
  const [signedUrlResult, setSignedUrlResult] = useState<{ fileId: string; url: string; expiresAt: string } | null>(null);

  // Logs State
  const [logs, setLogs] = useState<StructuredLog[]>([]);
  const [logFilterLevel, setLogFilterLevel] = useState<string>('ALL');
  const [logSearchQuery, setLogSearchQuery] = useState('');

  // Initial load & Polling
  useEffect(() => {
    loadAllData();
    const interval = setInterval(() => {
      if (activeTab === 'telemetry') refreshTelemetry();
      if (activeTab === 'queues') refreshQueues();
      if (activeTab === 'cache') refreshCache();
    }, 5000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        refreshTelemetry(),
        refreshBenchmarks(),
        refreshCache(),
        refreshQueues(),
        refreshStorage(),
        refreshLogs(),
      ]);
    } catch (err: any) {
      error('Failed to load performance telemetry: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTelemetry = async () => {
    try {
      const data = await devopsService.getMetrics();
      setMetrics(data);
    } catch {}
  };

  const refreshBenchmarks = async () => {
    try {
      const res = await devopsService.getBenchmarkHistory();
      setBenchmarks(res.data);
      if (res.data.length > 0 && !latestBenchmark) {
        setLatestBenchmark(res.data[0]);
      }
    } catch {}
  };

  const refreshCache = async () => {
    try {
      const data = await devopsService.getCacheStats();
      setCacheStats(data);
    } catch {}
  };

  const refreshQueues = async () => {
    try {
      const stats = await devopsService.getQueueStats();
      setQueueStats(stats);
      const jobs = await devopsService.getQueueJobs({
        status: queueStatusFilter === 'ALL' ? undefined : queueStatusFilter,
        limit: 30,
      });
      setQueueJobs(jobs);
    } catch {}
  };

  const refreshStorage = async () => {
    try {
      const files = await devopsService.getStorageFiles();
      setStorageFiles(files);
    } catch {}
  };

  const refreshLogs = async () => {
    try {
      const logList = await devopsService.getLogs({
        level: logFilterLevel === 'ALL' ? undefined : logFilterLevel,
        search: logSearchQuery || undefined,
        limit: 40,
      });
      setLogs(logList);
    } catch {}
  };

  // Actions
  const handleRunBenchmark = async () => {
    setIsBenchmarking(true);
    info(`Initiating load simulation: ${concurrencyUsers} virtual users...`);
    try {
      const res = await devopsService.runBenchmark({
        scenarioName,
        concurrencyUsers: Number(concurrencyUsers),
        totalRequests: Number(totalRequests),
      });
      setLatestBenchmark(res);
      await refreshBenchmarks();
      await refreshTelemetry();
      success(`Load benchmark completed: ${res.throughputRps} RPS (P95: ${res.latency.p95Ms}ms)`);
    } catch (err: any) {
      error('Benchmark failed: ' + err.message);
    } finally {
      setIsBenchmarking(false);
    }
  };

  const handleWarmupCache = async () => {
    setIsWarmingCache(true);
    try {
      const res = await devopsService.warmUpCache();
      await refreshCache();
      success(`Successfully pre-warmed ${res.warmedKeys.length} lookup caches in ${res.durationMs}ms`);
    } catch (err: any) {
      error('Cache warm-up error: ' + err.message);
    } finally {
      setIsWarmingCache(false);
    }
  };

  const handleInvalidateTag = async () => {
    if (!tagToInvalidate) return;
    try {
      const count = await devopsService.invalidateTag(tagToInvalidate);
      setTagToInvalidate('');
      await refreshCache();
      success(`Cleared ${count} keys matching tag "${tagToInvalidate}"`);
    } catch (err: any) {
      error('Tag invalidation failed: ' + err.message);
    }
  };

  const handleClearCache = async () => {
    try {
      await devopsService.clearCache();
      await refreshCache();
      success('Centralized enterprise cache flushed successfully');
    } catch (err: any) {
      error('Clear cache failed: ' + err.message);
    }
  };

  const handleEnqueueTestJob = async (type: string, priority: string = 'NORMAL') => {
    try {
      await devopsService.enqueueTestJob(type, { timestamp: Date.now(), initiatedBy: 'DevOps Console' }, priority);
      await refreshQueues();
      success(`Enqueued background worker task: ${type}`);
    } catch (err: any) {
      error('Failed to enqueue job: ' + err.message);
    }
  };

  const handleRetryDlq = async (jobId: string) => {
    try {
      await devopsService.retryDlqJob(jobId);
      await refreshQueues();
      success(`Re-enqueued DLQ job: ${jobId}`);
    } catch (err: any) {
      error('DLQ retry failed: ' + err.message);
    }
  };

  const handlePurgeQueue = async () => {
    try {
      const count = await devopsService.purgeQueue();
      await refreshQueues();
      success(`Purged ${count} completed/DLQ background jobs`);
    } catch (err: any) {
      error('Purge queue failed: ' + err.message);
    }
  };

  const handleGenerateSignedUrl = async (fileId: string) => {
    try {
      const res = await devopsService.generateSignedUrl(fileId, 3600);
      setSignedUrlResult({ fileId, url: res.signedUrl, expiresAt: res.expiresAt });
      success('Generated cryptographically signed URL with 1-hour expiration token');
    } catch (err: any) {
      error('Signed URL generation failed: ' + err.message);
    }
  };

  if (isLoading && !metrics) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-semibold text-slate-600">Connecting to Core Telemetry & Observability Bus...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <Zap className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black tracking-tight text-slate-900">
              Production DevOps & Performance Engineering Center
            </h2>
            <Badge variant="success" size="sm">Phase 21 Verified</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time latency percentiles, sliding-window rate limiters, multi-user stress simulations, LRU cache tagging, and DLQ background workers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadAllData}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Refresh Telemetry
          </Button>
          <a
            href="/api/metrics"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <FileCode className="w-3.5 h-3.5 text-slate-500" />
            Prometheus Scrape
          </a>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { id: 'telemetry', label: 'Live Telemetry & Health', icon: Activity },
          { id: 'benchmark', label: 'Load Testing Simulation (100-5000u)', icon: Flame },
          { id: 'cache', label: 'Enterprise LRU Cache', icon: Database },
          { id: 'queues', label: 'Async Queue & DLQ Workers', icon: Layers },
          { id: 'storage', label: 'Content-Addressed Storage & CDN', icon: HardDrive },
          { id: 'logs', label: 'Structured HTTP Log Stream', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as DevOpsTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* 1. LIVE TELEMETRY & SUB-SYSTEM HEALTH */}
      {/* ========================================================= */}
      {activeTab === 'telemetry' && metrics && (
        <div className="space-y-6">
          {/* Key Metric Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
                <span>P95 HTTP Latency</span>
                <Clock className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {metrics.http.latencyP95Ms} ms
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <span>P50: {metrics.http.latencyP50Ms}ms</span>
                <span>•</span>
                <span>P99: {metrics.http.latencyP99Ms}ms</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
                <span>Node Heap Used</span>
                <Cpu className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {metrics.process.memoryMb.heapUsed} MB
              </div>
              <div className="text-[11px] text-slate-500">
                RSS: {metrics.process.memoryMb.rss} MB / Total: {metrics.process.memoryMb.heapTotal} MB
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
                <span>Cache Hit Ratio</span>
                <Database className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {metrics.cache.hitRatio}%
              </div>
              <div className="text-[11px] text-slate-500">
                Hits: {metrics.cache.hits} / Misses: {metrics.cache.misses}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
                <span>Queue Worker Pool</span>
                <Layers className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {metrics.queue.active} active / {metrics.queue.queued} queued
              </div>
              <div className="text-[11px] text-slate-500">
                Completed: {metrics.queue.completed} | DLQ: {metrics.queue.dlq}
              </div>
            </div>
          </div>

          {/* Subsystem Health Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* HTTP Engine Status */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  HTTP Request Engine & Status Codes
                </h3>
                <Badge variant="success" size="sm">200 OK Dominant</Badge>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Requests</span>
                  <span className="text-lg font-black text-slate-900">{metrics.http.totalRequests}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Avg Latency</span>
                  <span className="text-lg font-black text-slate-900">{metrics.http.avgLatencyMs} ms</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Event Loop Lag</span>
                  <span className="text-lg font-black text-slate-900">{metrics.process.eventLoopLagMs} ms</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-slate-600">Response Code Breakdown:</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {Object.entries(metrics.http.statusCodes).map(([code, count]) => (
                    <div
                      key={code}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${
                        code.startsWith('2')
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : code.startsWith('3')
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : code.startsWith('4')
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      HTTP {code}: <span className="font-black">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* In-Memory Database Indexing Telemetry */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Database className="w-4 h-4 text-purple-600" />
                  Database Query & Index Plan Performance
                </h3>
                <Badge variant="info" size="sm">O(1) Memory Hash Indexes</Badge>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">DB Operations</span>
                  <span className="text-lg font-black text-slate-900">{metrics.database.operationsTotal}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Reads Total</span>
                  <span className="text-lg font-black text-slate-900">{metrics.database.readsTotal}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Writes Total</span>
                  <span className="text-lg font-black text-slate-900">{metrics.database.writesTotal}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Average Query Execution:</span>
                  <span className="font-mono font-bold text-emerald-600">{metrics.database.avgQueryLatencyMs} ms</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Direct key-value lookups indexed by `usersById`, `membersById`, `savingAccountsByNo`.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. LOAD TESTING & STRESS SIMULATION (100-5000 USERS) */}
      {/* ========================================================= */}
      {activeTab === 'benchmark' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Benchmark Configuration Panel */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-600" />
                Configure Concurrency Load Test
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Scenario Target</label>
                  <select
                    value={scenarioName}
                    onChange={(e: any) => setScenarioName(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="MIXED_ENTERPRISE">Mixed Enterprise SACCO Workload</option>
                    <option value="DEPOSITS">High-Throughput Financial Deposits</option>
                    <option value="WITHDRAWALS">Withdrawals & Balance Checks</option>
                    <option value="LOAN_APPLICATIONS">Loan Eligibility & Amortization Engine</option>
                    <option value="LOGIN">High Concurrency Token Authentication</option>
                    <option value="REPORTS">Heavy Aggregation Financial Reports</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Virtual Concurrent Users ({concurrencyUsers} Users)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[100, 500, 1000, 5000].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setConcurrencyUsers(count)}
                        className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          concurrencyUsers === count
                            ? 'bg-orange-600 text-white border-orange-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {count}u
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Total Simulated Requests</label>
                  <select
                    value={totalRequests}
                    onChange={(e) => setTotalRequests(Number(e.target.value))}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value={1000}>1,000 requests</option>
                    <option value={5000}>5,000 requests</option>
                    <option value={10000}>10,000 requests</option>
                    <option value={20000}>20,000 requests</option>
                  </select>
                </div>

                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                    onClick={handleRunBenchmark}
                    isLoading={isBenchmarking}
                    leftIcon={<Play className="w-4 h-4" />}
                  >
                    Execute Stress Benchmark
                  </Button>
                </div>
              </div>
            </div>

            {/* Latest Run Results */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Benchmark Execution Telemetry
                </h3>
                {latestBenchmark && (
                  <Badge variant="success" size="sm">
                    {latestBenchmark.successRatePercentage}% Success
                  </Badge>
                )}
              </div>

              {latestBenchmark ? (
                <div className="space-y-4">
                  {/* Top Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-orange-50/50 border border-orange-100">
                      <span className="text-[10px] uppercase font-bold text-orange-600 block">Throughput (RPS)</span>
                      <span className="text-xl font-black text-slate-900">{latestBenchmark.throughputRps} req/s</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">P95 Latency</span>
                      <span className="text-xl font-black text-emerald-600">{latestBenchmark.latency.p95Ms} ms</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">P99 Latency</span>
                      <span className="text-xl font-black text-slate-900">{latestBenchmark.latency.p99Ms} ms</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Memory Delta</span>
                      <span className="text-xl font-black text-slate-900">+{latestBenchmark.resourceImpact.memoryDeltaMb} MB</span>
                    </div>
                  </div>

                  {/* Latency Percentile Breakdown */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <span className="text-xs font-bold text-slate-700 block">Latency Distribution Breakdown:</span>
                    <div className="grid grid-cols-5 gap-2 text-center text-xs">
                      <div className="p-2 bg-white rounded-lg border border-slate-200/80">
                        <span className="text-[10px] text-slate-400 block font-bold">Min</span>
                        <span className="font-mono font-bold text-slate-800">{latestBenchmark.latency.minMs}ms</span>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-slate-200/80">
                        <span className="text-[10px] text-slate-400 block font-bold">P50 (Median)</span>
                        <span className="font-mono font-bold text-slate-800">{latestBenchmark.latency.p50Ms}ms</span>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-slate-200/80">
                        <span className="text-[10px] text-slate-400 block font-bold">P90</span>
                        <span className="font-mono font-bold text-slate-800">{latestBenchmark.latency.p90Ms}ms</span>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-slate-200/80">
                        <span className="text-[10px] text-slate-400 block font-bold">P95</span>
                        <span className="font-mono font-bold text-emerald-600">{latestBenchmark.latency.p95Ms}ms</span>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-slate-200/80">
                        <span className="text-[10px] text-slate-400 block font-bold">P99</span>
                        <span className="font-mono font-bold text-amber-600">{latestBenchmark.latency.p99Ms}ms</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 text-xs font-semibold">
                  No benchmarks executed yet. Click "Execute Stress Benchmark" to begin.
                </div>
              )}
            </div>
          </div>

          {/* Benchmark History Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Historical Load Test Runs</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Run ID</th>
                    <th className="py-2.5 px-3">Scenario</th>
                    <th className="py-2.5 px-3">Virtual Users</th>
                    <th className="py-2.5 px-3">Total Requests</th>
                    <th className="py-2.5 px-3">Throughput (RPS)</th>
                    <th className="py-2.5 px-3">P95 Latency</th>
                    <th className="py-2.5 px-3">Success Rate</th>
                    <th className="py-2.5 px-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {benchmarks.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{b.id}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-700">{b.scenario}</td>
                      <td className="py-2.5 px-3 font-bold text-orange-600">{b.concurrencyUsers} users</td>
                      <td className="py-2.5 px-3 text-slate-600">{b.totalRequests.toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{b.throughputRps} rps</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-600">{b.latency.p95Ms} ms</td>
                      <td className="py-2.5 px-3">
                        <span className="text-emerald-700 font-bold">{b.successRatePercentage}%</span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-500">{new Date(b.timestamp).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. CENTRALIZED LRU CACHE LAYER */}
      {/* ========================================================= */}
      {activeTab === 'cache' && cacheStats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Cache Hit Ratio</span>
              <span className="text-2xl font-black text-purple-600">{cacheStats.hitRatio}%</span>
              <span className="text-xs text-slate-500">Hits: {cacheStats.hits} / Misses: {cacheStats.misses}</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Cached Keys</span>
              <span className="text-2xl font-black text-slate-900">{cacheStats.keysCount} keys</span>
              <span className="text-xs text-slate-500">Estimated RAM: {(cacheStats.memoryEstimatedBytes / 1024).toFixed(1)} KB</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Invalidations / Evictions</span>
              <span className="text-2xl font-black text-slate-900">{cacheStats.invalidations} / {cacheStats.evictions}</span>
              <span className="text-xs text-slate-500">Sets Recorded: {cacheStats.sets}</span>
            </div>
          </div>

          {/* Actions & Tag Invalidation */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Cache Invalidation & Warm-up Operations</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Invalidate by Tag</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. system_settings, savings, chart_of_accounts"
                    value={tagToInvalidate}
                    onChange={(e) => setTagToInvalidate(e.target.value)}
                    className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200"
                  />
                  <Button variant="outline" size="sm" onClick={handleInvalidateTag}>
                    Invalidate Tag
                  </Button>
                </div>
              </div>

              <div className="flex items-end gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={handleWarmupCache}
                  isLoading={isWarmingCache}
                >
                  Pre-Warm Lookup Tables
                </Button>
                <Button variant="danger" size="sm" onClick={handleClearCache}>
                  Flush Entire Cache
                </Button>
              </div>
            </div>
          </div>

          {/* Top Cached Keys Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Active High-Priority Cache Registry</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Cache Key</th>
                    <th className="py-2.5 px-3">Tags</th>
                    <th className="py-2.5 px-3">Size (Bytes)</th>
                    <th className="py-2.5 px-3">Hit Count</th>
                    <th className="py-2.5 px-3 text-right">TTL Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cacheStats.topKeys.map((k) => (
                    <tr key={k.key} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{k.key}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex gap-1 flex-wrap">
                          {k.tags.map((t) => (
                            <span key={t} className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{k.sizeBytes} B</td>
                      <td className="py-2.5 px-3 font-bold text-purple-700">{k.hitCount} hits</td>
                      <td className="py-2.5 px-3 text-right">
                        {k.expiresAt ? (
                          <span className="text-slate-600">Expires in {Math.max(0, Math.round((k.expiresAt - Date.now()) / 1000))}s</span>
                        ) : (
                          <Badge variant="success" size="sm">Persistent</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. ASYNCHRONOUS WORKER QUEUES & DEAD-LETTER QUEUE (DLQ) */}
      {/* ========================================================= */}
      {activeTab === 'queues' && queueStats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Pending Queue</span>
              <span className="text-2xl font-black text-slate-900">{queueStats.queued}</span>
              <span className="text-xs text-slate-500">Active Workers: {queueStats.active}</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Completed Jobs</span>
              <span className="text-2xl font-black text-emerald-600">{queueStats.completed}</span>
              <span className="text-xs text-slate-500">Throughput: {queueStats.throughputPerMinute}/min</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Dead-Letter Queue (DLQ)</span>
              <span className={`text-2xl font-black ${queueStats.dlq > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                {queueStats.dlq}
              </span>
              <span className="text-xs text-slate-500">Total Failed: {queueStats.failed}</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Test Job Launcher</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleEnqueueTestJob('REPORT_GENERATION', 'HIGH')}>
                  + Report
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleEnqueueTestJob('SMS_DELIVERY', 'CRITICAL')}>
                  + SMS
                </Button>
                <Button size="sm" variant="danger" onClick={handlePurgeQueue}>
                  Purge
                </Button>
              </div>
            </div>
          </div>

          {/* Job Queue Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Background Worker Jobs & DLQ Inspector</h3>
              <div className="flex items-center gap-2">
                <select
                  value={queueStatusFilter}
                  onChange={(e) => setQueueStatusFilter(e.target.value)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="DLQ">Dead-Letter Queue (DLQ)</option>
                </select>
                <Button variant="outline" size="sm" onClick={refreshQueues}>
                  Refresh
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Job ID</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Priority</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Attempts</th>
                    <th className="py-2.5 px-3">Duration</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {queueJobs.map((j) => (
                    <tr key={j.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{j.id}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-700">{j.type}</td>
                      <td className="py-2.5 px-3">
                        <Badge
                          variant={j.priority === 'CRITICAL' ? 'danger' : j.priority === 'HIGH' ? 'warning' : 'info'}
                          size="sm"
                        >
                          {j.priority}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`font-bold ${
                            j.status === 'COMPLETED'
                              ? 'text-emerald-600'
                              : j.status === 'DLQ'
                              ? 'text-rose-600'
                              : j.status === 'PROCESSING'
                              ? 'text-blue-600'
                              : 'text-slate-600'
                          }`}
                        >
                          {j.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {j.attempts} / {j.maxRetries}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{j.durationMs ? `${j.durationMs} ms` : '-'}</td>
                      <td className="py-2.5 px-3 text-right">
                        {j.status === 'DLQ' && (
                          <Button variant="outline" size="sm" onClick={() => handleRetryDlq(j.id)}>
                            Retry DLQ
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. STORAGE & CRYPTOGRAPHICALLY-SIGNED URLS */}
      {/* ========================================================= */}
      {activeTab === 'storage' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-blue-600" />
              Content-Addressed Document Repository & Signed URL Generator
            </h3>
            <p className="text-xs text-slate-500">
              Files are indexed with SHA-256 cryptographic hashes for instant deduplication. Time-limited signed URLs prevent unauthorized asset distribution.
            </p>

            {signedUrlResult && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800">Generated Signed URL (Expires: {new Date(signedUrlResult.expiresAt).toLocaleTimeString()})</span>
                  <Badge variant="success" size="sm">Valid HMAC Token</Badge>
                </div>
                <div className="font-mono text-[11px] bg-white p-2 rounded border border-emerald-200 text-slate-700 break-all select-all">
                  {signedUrlResult.url}
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">File ID</th>
                    <th className="py-2.5 px-3">Original Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Size</th>
                    <th className="py-2.5 px-3">SHA-256 Hash</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {storageFiles.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{f.id}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-700">{f.originalName}</td>
                      <td className="py-2.5 px-3">
                        <Badge variant="info" size="sm">{f.category}</Badge>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{(f.sizeBytes / 1024 / 1024).toFixed(2)} MB</td>
                      <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500">{f.hashSha256.substring(0, 16)}...</td>
                      <td className="py-2.5 px-3 text-right">
                        <Button variant="outline" size="sm" onClick={() => handleGenerateSignedUrl(f.id)}>
                          Generate Signed URL
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. STRUCTURED LOG STREAM & CORRELATION IDS */}
      {/* ========================================================= */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                Structured JSON Application Log Stream
              </h3>

              <div className="flex items-center gap-2">
                <select
                  value={logFilterLevel}
                  onChange={(e) => {
                    setLogFilterLevel(e.target.value);
                    refreshLogs();
                  }}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200"
                >
                  <option value="ALL">All Levels</option>
                  <option value="INFO">INFO</option>
                  <option value="WARN">WARN</option>
                  <option value="ERROR">ERROR</option>
                </select>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search logs or correlation IDs..."
                    value={logSearchQuery}
                    onChange={(e) => setLogSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && refreshLogs()}
                    className="text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 w-48 sm:w-64"
                  />
                </div>

                <Button variant="outline" size="sm" onClick={refreshLogs}>
                  Refresh
                </Button>
              </div>
            </div>

            <div className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-[500px] space-y-2">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <div key={log.id} className="leading-relaxed hover:bg-slate-900/60 p-1.5 rounded flex items-start gap-2">
                    <span className="text-slate-500 whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span
                      className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                        log.level === 'ERROR'
                          ? 'bg-rose-900 text-rose-300'
                          : log.level === 'WARN'
                          ? 'bg-amber-900 text-amber-300'
                          : 'bg-blue-900 text-blue-300'
                      }`}
                    >
                      {log.level}
                    </span>
                    {log.correlationId && (
                      <span className="text-slate-400 text-[10px]">[{log.correlationId.substring(0, 8)}]</span>
                    )}
                    <span className="text-slate-300">{log.message}</span>
                    {log.durationMs && (
                      <span className="text-emerald-400 text-[10px] ml-auto whitespace-nowrap">{log.durationMs}ms</span>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-slate-500 text-center py-6">No logs matching active filter criteria.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
