import { db } from '../db/database';
import { notificationService } from './notificationService';

export interface SchedulerRunResult {
  timestamp: string;
  monthlySavingRemindersSent: number;
  upcomingLoanRemindersSent: number;
  overdueLoanAlertsSent: number;
  broadcastsExecuted: number;
  errors: string[];
}

export class SchedulerService {
  private isRunning = false;

  // =========================================================================
  // 1. RUN ALL AUTOMATED REMINDERS & SCHEDULED JOBS
  // =========================================================================
  public async runAllAutomatedReminders(): Promise<SchedulerRunResult> {
    if (this.isRunning) {
      return {
        timestamp: new Date().toISOString(),
        monthlySavingRemindersSent: 0,
        upcomingLoanRemindersSent: 0,
        overdueLoanAlertsSent: 0,
        broadcastsExecuted: 0,
        errors: ['Scheduler run already in progress'],
      };
    }

    this.isRunning = true;
    const result: SchedulerRunResult = {
      timestamp: new Date().toISOString(),
      monthlySavingRemindersSent: 0,
      upcomingLoanRemindersSent: 0,
      overdueLoanAlertsSent: 0,
      broadcastsExecuted: 0,
      errors: [],
    };

    try {
      // 1. Execute Due Scheduled Broadcasts
      result.broadcastsExecuted = await this.executePendingBroadcasts();

      // 2. Monthly Regular Savings Reminder
      result.monthlySavingRemindersSent = await this.generateMonthlySavingReminders();

      // 3. Upcoming Loan Installment Reminders & Overdue Alerts
      const loanReminders = await this.generateLoanDueReminders();
      result.upcomingLoanRemindersSent = loanReminders.upcomingSent;
      result.overdueLoanAlertsSent = loanReminders.overdueSent;
    } catch (err: any) {
      result.errors.push(err.message || 'Error during scheduler execution');
    } finally {
      this.isRunning = false;
    }

    return result;
  }

  // =========================================================================
  // 2. PENDING BROADCASTS RUNNER
  // =========================================================================
  public async executePendingBroadcasts(): Promise<number> {
    const broadcasts = db.getScheduledBroadcasts();
    const now = new Date();
    let executedCount = 0;

    for (const bcast of broadcasts) {
      if (bcast.status === 'PENDING') {
        const shouldRun =
          bcast.scheduleType === 'IMMEDIATE' ||
          (bcast.scheduledAt && new Date(bcast.scheduledAt) <= now);

        if (shouldRun) {
          try {
            await notificationService.executeBroadcast(bcast.id);
            executedCount++;

            // If recurring, calculate and schedule next run
            if (bcast.scheduleType === 'RECURRING' && bcast.recurringPattern) {
              this.scheduleNextRecurringRun(bcast);
            }
          } catch (e: any) {
            console.error(`Error executing broadcast ${bcast.broadcastNo}:`, e);
          }
        }
      }
    }

    return executedCount;
  }

  private scheduleNextRecurringRun(bcast: any) {
    const nextDate = new Date();
    switch (bcast.recurringPattern) {
      case 'DAILY':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'WEEKLY':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'MONTHLY':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'QUARTERLY':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'YEARLY':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }

    // Clone for next run
    db.createScheduledBroadcast({
      ...bcast,
      id: `bcast_${Date.now()}`,
      broadcastNo: db.getNextBroadcastNo(),
      scheduledAt: nextDate.toISOString(),
      status: 'PENDING',
      sentCount: 0,
      successCount: 0,
      failureCount: 0,
      createdAt: new Date().toISOString(),
      executedAt: null,
    });
  }

  // =========================================================================
  // 3. MONTHLY REGULAR SAVINGS REMINDERS
  // =========================================================================
  public async generateMonthlySavingReminders(): Promise<number> {
    const members = db.getMembers().filter((m) => m.status === 'ACTIVE');
    const savingAccounts = db.getSavingAccounts().filter((a) => a.productCode === 'REGULAR' && a.status === 'ACTIVE');
    const txns = db.getFinancialTransactions();

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed
    const endOfMonthDate = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];

    let remindersSent = 0;

    for (const member of members) {
      const regularAcc = savingAccounts.find((a) => a.memberId === member.id || a.membershipNo === member.membershipNo);
      if (!regularAcc) continue;

      // Check if member already deposited in current calendar month
      const hasDepositedThisMonth = txns.some((t) => {
        if (t.accountId !== regularAcc.id && t.memberId !== member.id) return false;
        if (t.type !== 'DEPOSIT' || t.status !== 'POSTED') return false;
        const txDate = new Date(t.timestamp);
        return txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth;
      });

      if (!hasDepositedThisMonth) {
        const prod = db.getSavingProducts().find((p) => p.id === regularAcc.productId || p.code === regularAcc.productCode);
        const minDeposit = prod ? prod.minMonthlyDeposit : 500;

        await notificationService.publish({
          eventCode: 'MONTHLY_SAVING_REMINDER',
          category: 'SAVINGS',
          recipientUserId: member.userId,
          recipientMemberId: member.id,
          recipientName: member.fullName,
          recipientPhone: member.phoneNumber,
          recipientEmail: member.email,
          variables: {
            memberName: member.fullName,
            paymentAmount: minDeposit,
            dueDate: endOfMonthDate,
            organizationName: 'Wabi SACCO',
          },
        });
        remindersSent++;
      }
    }

    return remindersSent;
  }

  // =========================================================================
  // 4. LOAN UPCOMING INSTALLMENTS & OVERDUE NOTICES
  // =========================================================================
  public async generateLoanDueReminders(): Promise<{ upcomingSent: number; overdueSent: number }> {
    const schedules = db.getLoanSchedules();
    const loans = db.getLoans().filter((l) => l.status === 'ACTIVE' || l.status === 'DISBURSED');
    const members = db.getMembers();

    const now = new Date();
    const nowTime = now.getTime();
    const threeDaysFromNow = new Date(nowTime + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const todayStr = now.toISOString().split('T')[0];

    let upcomingSent = 0;
    let overdueSent = 0;

    for (const item of schedules) {
      if ((item.status as string) === 'PAID') continue;

      const loan = loans.find((l) => l.id === item.loanId);
      if (!loan) continue;

      const member = members.find((m) => m.id === loan.memberId || m.membershipNo === loan.membershipNo);
      if (!member) continue;

      // Check upcoming (due in next 3 days)
      if (item.status === 'PENDING' && item.dueDate >= todayStr && item.dueDate <= threeDaysFromNow) {
        await notificationService.publish({
          eventCode: 'UPCOMING_INSTALLMENT',
          category: 'LOANS',
          recipientUserId: member.userId,
          recipientMemberId: member.id,
          recipientName: member.fullName,
          recipientPhone: member.phoneNumber,
          recipientEmail: member.email,
          variables: {
            memberName: member.fullName,
            loanNo: loan.loanNo,
            paymentAmount: item.installmentAmount,
            dueDate: item.dueDate,
          },
        });
        upcomingSent++;
      }

      // Check overdue (dueDate < todayStr and not paid)
      if (item.dueDate < todayStr && (item.status as string) !== 'PAID') {
        const dueDateObj = new Date(item.dueDate);
        const daysOverdue = Math.max(1, Math.floor((nowTime - dueDateObj.getTime()) / (24 * 60 * 60 * 1000)));

        await notificationService.publish({
          eventCode: 'LATE_PAYMENT_REMINDER',
          category: 'LOANS',
          recipientUserId: member.userId,
          recipientMemberId: member.id,
          recipientName: member.fullName,
          recipientPhone: member.phoneNumber,
          recipientEmail: member.email,
          isUrgent: true,
          variables: {
            memberName: member.fullName,
            loanNo: loan.loanNo,
            paymentAmount: item.installmentAmount,
            daysOverdue,
          },
        });
        overdueSent++;
      }
    }

    return { upcomingSent, overdueSent };
  }

  private timer: NodeJS.Timeout | null = null;

  public startAutoRunner(intervalMs = 60000): void {
    if (this.timer) return;
    // Run an initial check shortly after boot
    setTimeout(() => {
      this.runAllAutomatedReminders().catch((err) => {
        console.error('[Notification Scheduler] Auto-run error:', err);
      });
    }, 5000);

    this.timer = setInterval(() => {
      this.runAllAutomatedReminders().catch((err) => {
        console.error('[Notification Scheduler] Auto-run error:', err);
      });
    }, intervalMs);
  }

  public stopAutoRunner(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

export const schedulerService = new SchedulerService();
