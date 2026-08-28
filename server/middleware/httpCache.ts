/**
 * Wabi SACCO - HTTP Caching & ETag Conditional Header Middleware
 * Computes deterministic ETags and returns 304 Not Modified when payloads match client cache.
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export function httpCacheMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Only apply ETag validation to GET and HEAD requests
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return next();
  }

  const originalJson = res.json.bind(res);

  res.json = function (body: any): Response {
    try {
      const jsonString = JSON.stringify(body);
      const hash = crypto.createHash('md5').update(jsonString).digest('hex');
      const etag = `W/"${hash}"`;

      res.setHeader('ETag', etag);

      // Check client conditional headers
      const clientETag = req.headers['if-none-match'];
      if (clientETag && clientETag === etag) {
        return res.status(304).end();
      }
    } catch {
      // ignore serialization error and fallback to standard json
    }

    return originalJson(body);
  };

  next();
}
