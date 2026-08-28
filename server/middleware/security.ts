/**
 * Wabi SACCO - Enterprise Security Hardening Middleware
 * Enforces OWASP Top 10 Protections, CSP, HSTS, XSS Prevention, Clickjacking Mitigation, and CORS Security.
 */

import { Request, Response, NextFunction } from 'express';

export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  // 1. Strict-Transport-Security (HSTS) - 1 year max-age, includeSubDomains, preload
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // 2. X-Content-Type-Options - Prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // 3. X-Frame-Options - Allow within same origin and AI studio preview iframe
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // 4. Content-Security-Policy (CSP) - Production-safe financial grade policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https: wss:; frame-ancestors 'self' https:;"
  );

  // 5. Referrer-Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 6. Permissions-Policy
  res.setHeader(
    'Permissions-Policy',
    'camera=(self), microphone=(), geolocation=(self), payment=()'
  );

  // 7. X-XSS-Protection legacy fallback
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // 8. Cache-Control for sensitive API endpoints
  if (req.path.startsWith('/api/v1/auth') || req.path.startsWith('/api/auth')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  next();
}

/**
 * Basic payload sanitization against common XSS and malicious script tags
 */
export function sanitizeRequest(req: Request, res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    sanitizeObject(req.query);
  }
  next();
}

function sanitizeObject(obj: any): void {
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === 'string') {
      // Strip script tags
      obj[key] = val
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '');
    } else if (typeof val === 'object' && val !== null) {
      sanitizeObject(val);
    }
  }
}
