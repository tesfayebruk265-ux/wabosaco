import express from 'express';
import path from 'path';
import apiRouter from './server/routes/api';
import { attachRequestId } from './server/middleware/auth';
import { migrations } from './server/db/migrations';
import { schedulerService } from './server/services/schedulerService';
import { db } from './server/db/database';
import { cache } from './server/services/cacheService';
import { queue } from './server/services/queueService';
import { logger } from './server/services/loggerService';
import { metrics } from './server/services/metricsService';
import { securityHeaders, sanitizeRequest } from './server/middleware/security';
import { responseCompression } from './server/middleware/compression';
import { idempotencyMiddleware } from './server/middleware/idempotency';
import { httpCacheMiddleware } from './server/middleware/httpCache';
import { standardApiRateLimit } from './server/middleware/rateLimiter';
import { originalDataGeneratorService } from './server/services/originalDataGeneratorService';
import { telegramBotService } from './server/services/telegramBotService';

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

async function startServer() {
  // 1. Run database schema initialization & pending migrations
  migrations.runPendingMigrations();

  // 2. Ensure authentic original data is populated if only fake / demo data or empty
  try {
    const currentMembers = db.getMembers();
    const hasDemoOnlyOrEmpty =
      currentMembers.length === 0 ||
      currentMembers.some((m) => m.id === 'mbr_000088' || m.id === 'mbr_000143');

    if (hasDemoOnlyOrEmpty) {
      logger.info('Purging old fake/demo data and generating original operational data...');
      await originalDataGeneratorService.generateOriginalData({
        memberCount: 30,
        includeLoans: true,
        includeSavings: true,
        includeShares: true,
        includeSupportTickets: true,
        monthsOfHistory: 6,
      });
      logger.info('Original operational dataset successfully generated with balanced GL entries.');
    }
  } catch (err: any) {
    logger.error(`Error during initial original data generation: ${err.message}`);
  }

  // 3. Pre-warm enterprise cache with system settings, products & COA
  await cache.warmUp(db);

  // 4. Start background notification scheduler runner & queue worker pool
  schedulerService.startAutoRunner(60000);
  queue.startWorkerPool();

  // 5. Start Wabi SACCO Telegram Bot polling listener
  telegramBotService.startPolling();

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // 4. Production Security Hardening Headers & CORS
  app.use(securityHeaders);

  // 5. Native Gzip & Deflate Response Compression
  app.use(responseCompression);

  // 6. JSON & URL-encoded body parsers with limits
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 7. Request Input Sanitization
  app.use(sanitizeRequest);

  // 8. Global request tracking, correlation ID & performance metrics
  app.use(attachRequestId);
  app.use((req, res, next) => {
    const correlationId = (req.headers['x-correlation-id'] as string) || req.requestId;
    (req as any).correlationId = correlationId;
    res.setHeader('X-Correlation-ID', correlationId);

    const endRequest = metrics.startRequest();
    const startHr = process.hrtime();
    const t0 = Date.now();

    res.on('finish', () => {
      endRequest();
      const diff = process.hrtime(startHr);
      const durationMs = parseFloat(((diff[0] * 1e9 + diff[1]) / 1e6).toFixed(2));
      metrics.recordRequest(res.statusCode, durationMs);

      // Log API requests
      if (req.url.startsWith('/api')) {
        const level = res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'INFO';
        logger.log(level, `${req.method} ${req.originalUrl || req.url} -> ${res.statusCode}`, {
          module: 'HTTP',
          correlationId,
          requestId: req.requestId,
          statusCode: res.statusCode,
          durationMs,
          method: req.method,
          path: req.originalUrl || req.url,
          ip: req.ip,
          userId: (req as any).user?.id,
        });
      }
    });

    next();
  });

  // 9. HTTP Caching Headers & ETag Conditional Validation
  app.use(httpCacheMiddleware);

  // 10. Financial Transaction Idempotency
  app.use(idempotencyMiddleware);

  // 11. Sliding-Window Rate Limiter
  app.use('/api', standardApiRateLimit);

  // 12. Mount API Router on both /api/v1 and /api
  app.use('/api/v1', apiRouter);
  app.use('/api', apiRouter);

  // 13. Standardized Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    const statusCode = err.statusCode || err.status || 500;
    const correlationId = (req as any).correlationId || req.requestId;

    logger.error(`Unhandled API Exception: ${err.message || 'Internal error'}`, {
      module: 'API_ERROR',
      correlationId,
      requestId: req.requestId,
      statusCode,
      method: req.method,
      path: req.url,
      error: err,
    });

    res.status(statusCode).json({
      success: false,
      statusCode,
      error: {
        code: err.code || 'INTERNAL_SERVER_ERROR',
        message: err.message || 'An unexpected error occurred on the server.',
        details: err.details,
      },
      correlationId,
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    });
  });

  // 14. Vite middleware in dev vs static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`[Wabi SACCO Core] Production server listening on http://0.0.0.0:${PORT}`, {
      module: 'SERVER',
      metadata: { port: PORT, env: process.env.NODE_ENV || 'production' },
    });
  });
}

startServer().catch((err) => {
  console.error('Fatal backend startup failure:', err);
  process.exit(1);
});
