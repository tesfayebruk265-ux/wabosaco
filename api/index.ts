import express from 'express';
import apiRouter from '../server/routes/api';
import { attachRequestId } from '../server/middleware/auth';
import { migrations } from '../server/db/migrations';
import { db } from '../server/db/database';
import { cache } from '../server/services/cacheService';
import { logger } from '../server/services/loggerService';
import { securityHeaders, sanitizeRequest } from '../server/middleware/security';
import { responseCompression } from '../server/middleware/compression';
import { originalDataGeneratorService } from '../server/services/originalDataGeneratorService';
import { telegramBotService } from '../server/services/telegramBotService';

let isInitialized = false;

async function initializeApp() {
  if (isInitialized) return;

  try {
    // 1. Run migrations
    migrations.runPendingMigrations();

    // 2. Ensure initial operational dataset exists
    const currentMembers = db.getMembers();
    if (currentMembers.length === 0) {
      await originalDataGeneratorService.generateOriginalData({
        memberCount: 30,
        includeLoans: true,
        includeSavings: true,
        includeShares: true,
        includeSupportTickets: true,
        monthsOfHistory: 6,
      });
    }

    // 3. Warm up cache
    await cache.warmUp(db);

    // 4. Start Telegram Bot polling
    telegramBotService.startPolling();

    isInitialized = true;
  } catch (err: any) {
    console.error('Initialization error in Vercel Serverless Function:', err);
  }
}

const app = express();

// Security and compression middleware
app.use(securityHeaders);
app.use(responseCompression);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeRequest);
app.use(attachRequestId);

// Initialize DB on request if not yet initialized
app.use(async (req, res, next) => {
  if (!isInitialized) {
    await initializeApp();
  }
  next();
});

// API Routes
app.use('/api', apiRouter);

// Export for Vercel Serverless Function
export default app;
