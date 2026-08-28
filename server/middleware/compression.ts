/**
 * Wabi SACCO - Fast Gzip & Deflate Response Compression Middleware
 * Reduces network payload transfer sizes by 60-80% for large JSON payloads and tabular exports.
 */

import { Request, Response, NextFunction } from 'express';
import zlib from 'zlib';

export function responseCompression(req: Request, res: Response, next: NextFunction): void {
  const acceptEncoding = req.headers['accept-encoding'] || '';
  if (!acceptEncoding || typeof acceptEncoding !== 'string') {
    return next();
  }

  const isGzipSupported = acceptEncoding.includes('gzip');
  const isDeflateSupported = acceptEncoding.includes('deflate');

  if (!isGzipSupported && !isDeflateSupported) {
    return next();
  }

  // Intercept res.json and res.send
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  res.json = function (body: any): Response {
    const jsonStr = JSON.stringify(body);
    // Only compress payloads larger than 1KB
    if (jsonStr.length < 1024) {
      return originalJson(body);
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Vary', 'Accept-Encoding');

    if (isGzipSupported) {
      res.setHeader('Content-Encoding', 'gzip');
      zlib.gzip(Buffer.from(jsonStr, 'utf-8'), (err, compressed) => {
        if (err) {
          return originalJson(body);
        }
        res.setHeader('Content-Length', compressed.length);
        originalSend(compressed);
      });
      return res;
    } else {
      res.setHeader('Content-Encoding', 'deflate');
      zlib.deflate(Buffer.from(jsonStr, 'utf-8'), (err, compressed) => {
        if (err) {
          return originalJson(body);
        }
        res.setHeader('Content-Length', compressed.length);
        originalSend(compressed);
      });
      return res;
    }
  };

  next();
}
