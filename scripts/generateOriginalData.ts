import { originalDataGeneratorService } from '../server/services/originalDataGeneratorService';
import { db } from '../server/db/database';
import { logger } from '../server/services/loggerService';

async function main() {
  console.log('Initiating original data generation for Wabi SACCO...');
  const summary = await originalDataGeneratorService.generateOriginalData({
    memberCount: 30,
    includeLoans: true,
    includeSavings: true,
    includeShares: true,
    includeSupportTickets: true,
    monthsOfHistory: 6,
    adminUserId: 'usr_admin_1',
  });

  console.log('Original Data Generation Completed Successfully:');
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error('Failed to generate original data:', err);
  process.exit(1);
});
