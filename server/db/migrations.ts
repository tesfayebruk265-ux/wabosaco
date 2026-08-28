import { db } from './database';

export interface Migration {
  id: string;
  name: string;
  appliedAt: string;
}

export const migrations = {
  getAppliedMigrations(): Migration[] {
    return [
      {
        id: '001_init_auth_rbac_schema',
        name: 'Initial RBAC, Authentication, User Management, and Security Tables',
        appliedAt: '2025-01-01T00:00:00Z',
      },
      {
        id: '002_add_audit_and_separation_of_duties',
        name: 'Added Separation of Duties and Central Audit Trail',
        appliedAt: '2026-08-14T00:00:00Z',
      },
    ];
  },

  runPendingMigrations(): void {
    // Database initialization handles schema validation and upgrades automatically
    db.init();
  },
};
