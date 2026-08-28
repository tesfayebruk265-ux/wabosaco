/**
 * Wabi SACCO - Financial Transaction Idempotency Middleware
 * Enforces `Idempotency-Key` validation on mutation endpoints to prevent double-charges and duplicate payouts.
 */

import { Request, Response, NextFunction } from 'express';
import { cache } from '../services/cacheService';
import { logger } from '../services/loggerService';

export function idempotencyMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Only apply to state-modifying requests
  if (req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'PATCH') {
    return next();
  }

  const idempotencyKey = req.headers['idempotency-key'] || req.headers['x-idempotency-key'];
  if (!idempotencyKey || typeof idempotencyKey !== 'string') {
    // If not provided, continue normally
    return next();
  }

  const cacheKey = `idempotency:${req.baseUrl || ''}:${req.path}:${idempotencyKey}`;
  const cachedResponse = cache.get<{ statusCode: number; headers: Record<string, any>; body: any }>(cacheKey);

  if (cachedResponse) {
    logger.info(`Idempotent request intercepted. Returning cached response.`, {
      module: 'IDEMPOTENCY',
      metadata: { idempotencyKey, path: req.path },
    });

    res.setHeader('X-Idempotent-Replay', 'true');
    res.status(cachedResponse.statusCode).json(cachedResponse.body);
    return;
  }

  // Intercept response to store in cache
  const originalJson = res.json.bind(res);
  res.json = function (body: any): Response {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      cache.set(
        cacheKey,
        {
          statusCode: res.statusCode,
          headers: {},
          body,
        },
        { ttlSeconds: 86400, tags: ['idempotency'] } // Cache for 24 hours
      );
    }
    return originalJson(body);
  };

  next();
}
