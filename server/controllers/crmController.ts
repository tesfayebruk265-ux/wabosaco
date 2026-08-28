import { Request, Response } from 'express';
import { db } from '../db/database';
import {
  DbTicket,
  DbTicketMessage,
  DbSlaPolicy,
  DbKnowledgeBaseArticle,
  DbChatSession,
  DbChatMessage,
  TicketPriority,
  TicketCategory,
  TicketDepartment,
  TicketStatus,
  EscalationLevel,
} from '../db/schema';

// Helper to compute SLA due dates based on priority
function calculateSlaDueDates(priority: TicketPriority, slaPolicies: DbSlaPolicy[]) {
  const policy = slaPolicies.find((p) => p.priority === priority && p.isActive) ||
    slaPolicies.find((p) => p.priority === priority) || {
      firstResponseMinutes: priority === 'CRITICAL' ? 30 : priority === 'HIGH' ? 120 : priority === 'MEDIUM' ? 480 : 1440,
      resolutionMinutes: priority === 'CRITICAL' ? 240 : priority === 'HIGH' ? 1440 : priority === 'MEDIUM' ? 4320 : 7200,
    };

  const now = new Date();
  const firstResponseDue = new Date(now.getTime() + policy.firstResponseMinutes * 60 * 1000).toISOString();
  const resolutionDue = new Date(now.getTime() + policy.resolutionMinutes * 60 * 1000).toISOString();

  return {
    slaFirstResponseDue: firstResponseDue,
    slaResolutionDue: resolutionDue,
  };
}

export class CrmController {
  // ==========================================
  // TICKETS: LIST & QUERY
  // ==========================================
  public getTickets = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      const {
        memberId,
        assignedStaffId,
        department,
        category,
        priority,
        status,
        search,
        isOverdue,
        isEscalated,
      } = req.query;

      let filterMemberId = memberId as string | undefined;

      // If logged in as a MEMBER, force filtering only to their own tickets
      if (user && user.role === 'MEMBER') {
        const member = db.getMemberByUserId ? db.getMemberByUserId(user.id) : undefined;
        filterMemberId = member ? member.id : user.id;
      }

      const tickets = db.getSupportTickets({
        memberId: filterMemberId,
        assignedStaffId: assignedStaffId as string,
        department: department as string,
        category: category as string,
        priority: priority as string,
        status: status as string,
        search: search as string,
        isOverdue: isOverdue === 'true',
        isEscalated: isEscalated === 'true',
      });

      // Recalculate dynamic SLA breaches
      const nowIso = new Date().toISOString();
      const enrichedTickets = tickets.map((t) => {
        const isResponseBreached = !t.firstRespondedAt && t.slaFirstResponseDue < nowIso;
        const isResBreached =
          (t.currentStatus === 'OPEN' ||
            t.currentStatus === 'ASSIGNED' ||
            t.currentStatus === 'IN_PROGRESS' ||
            t.currentStatus === 'ESCALATED') &&
          t.slaResolutionDue < nowIso;

        return {
          ...t,
          isSlaResponseBreached: t.isSlaResponseBreached || isResponseBreached,
          isSlaResolutionBreached: t.isSlaResolutionBreached || isResBreached,
        };
      });

      res.json({
        success: true,
        count: enrichedTickets.length,
        tickets: enrichedTickets,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Error fetching support tickets' });
    }
  };

  // ==========================================
  // TICKETS: GET SINGLE WITH CONVERSATION
  // ==========================================
  public getTicketById = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const ticket = db.getSupportTicketById(id);

      if (!ticket) {
        res.status(404).json({ success: false, message: 'Support ticket not found' });
        return;
      }

      // If user is a member, verify ownership
      if (user && user.role === 'MEMBER') {
        const member = db.getMemberByUserId ? db.getMemberByUserId(user.id) : undefined;
        const memberId = member ? member.id : user.id;
        if (ticket.memberId !== memberId && ticket.userId !== user.id) {
          res.status(403).json({ success: false, message: 'Access denied to this ticket' });
          return;
        }
      }

      const isStaff = user && user.role !== 'MEMBER';
      const messages = db.getTicketMessages(ticket.id, isStaff);

      // Check SLA status
      const nowIso = new Date().toISOString();
      const isResponseBreached = !ticket.firstRespondedAt && ticket.slaFirstResponseDue < nowIso;
      const isResBreached =
        (ticket.currentStatus === 'OPEN' ||
          ticket.currentStatus === 'ASSIGNED' ||
          ticket.currentStatus === 'IN_PROGRESS' ||
          ticket.currentStatus === 'ESCALATED') &&
        ticket.slaResolutionDue < nowIso;

      res.json({
        success: true,
        ticket: {
          ...ticket,
          isSlaResponseBreached: ticket.isSlaResponseBreached || isResponseBreached,
          isSlaResolutionBreached: ticket.isSlaResolutionBreached || isResBreached,
        },
        messages,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Error retrieving ticket' });
    }
  };

  // ==========================================
  // TICKETS: CREATE TICKET
  // ==========================================
  public createTicket = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      const {
        memberId,
        category = 'GENERAL_INQUIRY',
        priority = 'MEDIUM',
        department = 'CUSTOMER_SERVICE',
        subject,
        description,
        attachments = [],
      } = req.body;

      if (!subject || !description) {
        res.status(400).json({ success: false, message: 'Subject and description are required' });
        return;
      }

      let targetMemberId = memberId;
      let memberName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Guest Member';
      let membershipNo = '';
      let memberEmail = user ? user.email : '';
      let memberPhone = user ? user.phone : '';

      if (user && user.role === 'MEMBER') {
        const member = db.getMemberByUserId ? db.getMemberByUserId(user.id) : undefined;
        if (member) {
          targetMemberId = member.id;
          memberName = member.fullName;
          membershipNo = member.membershipNo;
          memberEmail = member.email || user.email;
          memberPhone = member.phoneNumber || user.phone;
        }
      } else if (memberId) {
        const member = db.getMemberById ? db.getMemberById(memberId) : undefined;
        if (member) {
          memberName = member.fullName;
          membershipNo = member.membershipNo;
          memberEmail = member.email || '';
          memberPhone = member.phoneNumber || '';
        }
      }

      const slaPolicies = db.getSlaPolicies();
      const slaDates = calculateSlaDueDates(priority as TicketPriority, slaPolicies);
      const ticketNumber = db.getNextTicketNumber();
      const ticketId = `tkt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const nowIso = new Date().toISOString();

      // Auto-assign staff if customer service agent available
      let assignedStaffId: string | undefined = undefined;
      let assignedStaffName: string | undefined = undefined;
      let currentStatus: TicketStatus = 'OPEN';

      if (user && user.role !== 'MEMBER') {
        assignedStaffId = user.id;
        assignedStaffName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;
        currentStatus = 'ASSIGNED';
      }

      const newTicket: DbTicket = {
        id: ticketId,
        ticketNumber,
        memberId: targetMemberId,
        membershipNo,
        memberFullName: memberName,
        memberEmail,
        memberPhone,
        userId: user ? user.id : undefined,
        category: category as TicketCategory,
        priority: priority as TicketPriority,
        subject,
        description,
        attachments,
        assignedStaffId,
        assignedStaffName,
        department: department as TicketDepartment,
        currentStatus,
        slaFirstResponseDue: slaDates.slaFirstResponseDue,
        slaResolutionDue: slaDates.slaResolutionDue,
        isSlaResponseBreached: false,
        isSlaResolutionBreached: false,
        escalationLevel: 0,
        reopenCount: 0,
        isMerged: false,
        lastRepliedAt: nowIso,
        lastRepliedBy: memberName,
        lastRepliedRole: user && user.role === 'MEMBER' ? 'MEMBER' : 'STAFF',
        createdDate: nowIso,
        updatedDate: nowIso,
      };

      db.createSupportTicket(newTicket);

      // Create initial message in thread
      const initialMessage: DbTicketMessage = {
        id: `tmsg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        ticketId,
        type: user && user.role === 'MEMBER' ? 'MEMBER_REPLY' : 'STAFF_REPLY',
        senderId: user ? user.id : 'system',
        senderName: memberName,
        senderRole: user ? user.role : 'MEMBER',
        isInternalNote: false,
        content: description,
        attachments,
        createdAt: nowIso,
      };
      db.createTicketMessage(initialMessage);

      // Create notification for the user
      if (user && user.id) {
        db.createNotification({
          id: `notif_${Date.now()}`,
          userId: user.id,
          memberId: targetMemberId,
          type: 'INFO',
          eventType: 'SUPPORT_TICKET_OPENED',
          title: `Support Ticket Opened: #${ticketNumber}`,
          message: `Your ticket "${subject}" has been registered. Our support team will attend to it within SLA commitments.`,
          isRead: false,
          createdAt: nowIso,
        });
      }

      res.status(201).json({
        success: true,
        message: `Ticket #${ticketNumber} created successfully`,
        ticket: newTicket,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Error creating support ticket' });
    }
  };

  // ==========================================
  // TICKETS: ADD REPLY OR INTERNAL NOTE
  // ==========================================
  public addMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { content, isInternalNote = false, attachments = [] } = req.body;

      if (!content || !content.trim()) {
        res.status(400).json({ success: false, message: 'Message content cannot be empty' });
        return;
      }

      const ticket = db.getSupportTicketById(id);
      if (!ticket) {
        res.status(404).json({ success: false, message: 'Support ticket not found' });
        return;
      }

      const isStaff = user && user.role !== 'MEMBER';
      if (!isStaff && isInternalNote) {
        res.status(403).json({ success: false, message: 'Members cannot add internal notes' });
        return;
      }

      const nowIso = new Date().toISOString();
      const senderName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : 'User';

      const newMsg: DbTicketMessage = {
        id: `tmsg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        ticketId: ticket.id,
        type: isInternalNote ? 'INTERNAL_NOTE' : isStaff ? 'STAFF_REPLY' : 'MEMBER_REPLY',
        senderId: user ? user.id : 'unknown',
        senderName,
        senderRole: user ? user.role : 'MEMBER',
        isInternalNote: Boolean(isInternalNote),
        content: content.trim(),
        attachments,
        createdAt: nowIso,
      };

      db.createTicketMessage(newMsg);

      // Update ticket activity & status
      const updates: Partial<DbTicket> = {
        lastRepliedAt: nowIso,
        lastRepliedBy: senderName,
        lastRepliedRole: isStaff ? 'STAFF' : 'MEMBER',
      };

      // Record first response if staff reply
      if (isStaff && !isInternalNote && !ticket.firstRespondedAt) {
        updates.firstRespondedAt = nowIso;
        updates.firstRespondedById = user.id;
        updates.isSlaResponseBreached = nowIso > ticket.slaFirstResponseDue;
      }

      // Update status if appropriate
      if (isStaff && !isInternalNote) {
        if (ticket.currentStatus === 'OPEN' || ticket.currentStatus === 'ASSIGNED') {
          updates.currentStatus = 'IN_PROGRESS';
        }
      } else if (!isStaff) {
        if (ticket.currentStatus === 'WAITING_FOR_MEMBER') {
          updates.currentStatus = 'IN_PROGRESS';
        }
      }

      const updatedTicket = db.updateSupportTicket(ticket.id, updates);

      // Notify recipient if appropriate
      if (isStaff && !isInternalNote && ticket.userId) {
        db.createNotification({
          id: `notif_${Date.now()}`,
          userId: ticket.userId,
          memberId: ticket.memberId,
          type: 'INFO',
          eventType: 'SUPPORT_TICKET_REPLY',
          title: `Update on Ticket #${ticket.ticketNumber}`,
          message: `${senderName} replied to your ticket: "${ticket.subject}"`,
          isRead: false,
          createdAt: nowIso,
        });
      }

      res.status(201).json({
        success: true,
        message: isInternalNote ? 'Internal note added' : 'Reply sent successfully',
        data: newMsg,
        ticket: updatedTicket,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Error adding message' });
    }
  };

  // ==========================================
  // TICKETS: UPDATE STATUS / ASSIGNMENT / PRIORITY
  // ==========================================
  public updateTicket = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const {
        status,
        priority,
        category,
        department,
        assignedStaffId,
        assignedStaffName,
        resolution,
      } = req.body;

      const ticket = db.getSupportTicketById(id);
      if (!ticket) {
        res.status(404).json({ success: false, message: 'Ticket not found' });
        return;
      }

      const nowIso = new Date().toISOString();
      const updates: Partial<DbTicket> = {};

      if (status && status !== ticket.currentStatus) {
        updates.currentStatus = status;
        if (status === 'RESOLVED') {
          updates.resolvedAt = nowIso;
          updates.resolutionDate = nowIso;
          updates.resolvedById = user ? user.id : undefined;
          updates.resolvedByName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Staff';
          if (resolution) updates.resolution = resolution;
          updates.isSlaResolutionBreached = nowIso > ticket.slaResolutionDue;

          // Log resolution message
          db.createTicketMessage({
            id: `tmsg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            ticketId: ticket.id,
            type: 'RESOLUTION',
            senderId: user ? user.id : 'system',
            senderName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'System',
            senderRole: user ? user.role : 'STAFF',
            isInternalNote: false,
            content: `Ticket marked as RESOLVED. Resolution notes: ${resolution || 'Issue has been successfully addressed.'}`,
            createdAt: nowIso,
          });
        } else if (status === 'CLOSED') {
          updates.currentStatus = 'CLOSED';
        }
      }

      if (priority && priority !== ticket.priority) {
        updates.priority = priority;
        const slaPolicies = db.getSlaPolicies();
        const slaDates = calculateSlaDueDates(priority as TicketPriority, slaPolicies);
        updates.slaFirstResponseDue = slaDates.slaFirstResponseDue;
        updates.slaResolutionDue = slaDates.slaResolutionDue;
      }

      if (category) updates.category = category;
      if (department) updates.department = department;

      if (assignedStaffId !== undefined) {
        updates.assignedStaffId = assignedStaffId;
        updates.assignedStaffName = assignedStaffName;
        if (ticket.currentStatus === 'OPEN') {
          updates.currentStatus = 'ASSIGNED';
        }

        // Log assignment event
        db.createTicketMessage({
          id: `tmsg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          ticketId: ticket.id,
          type: 'ASSIGNMENT',
          senderId: user ? user.id : 'system',
          senderName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'System',
          senderRole: user ? user.role : 'STAFF',
          isInternalNote: true,
          content: `Ticket assigned to ${assignedStaffName || assignedStaffId}`,
          createdAt: nowIso,
        });
      }

      if (resolution && !updates.resolution) {
        updates.resolution = resolution;
      }

      const updated = db.updateSupportTicket(ticket.id, updates);

      res.json({
        success: true,
        message: 'Ticket updated successfully',
        ticket: updated,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Error updating ticket' });
    }
  };

  // ==========================================
  // TICKETS: ESCALATE TICKET
  // ==========================================
  public escalateTicket = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { level, reason, escalatedToName, targetDepartment } = req.body;

      const ticket = db.getSupportTicketById(id);
      if (!ticket) {
        res.status(404).json({ success: false, message: 'Ticket not found' });
        return;
      }

      const targetLevel = (level !== undefined ? Number(level) : (ticket.escalationLevel + 1)) as EscalationLevel;
      const nowIso = new Date().toISOString();
      const staffName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Staff';

      const updates: Partial<DbTicket> = {
        currentStatus: 'ESCALATED',
        escalationLevel: targetLevel,
        escalationReason: reason || 'Escalated for senior review and approval',
        escalatedToName: escalatedToName || (targetLevel === 2 ? 'General Manager' : targetLevel === 1 ? 'Customer Service Supervisor' : 'Executive Board'),
        department: (targetDepartment as TicketDepartment) || ticket.department,
        priority: targetLevel >= 2 ? 'CRITICAL' : 'HIGH',
      };

      const updated = db.updateSupportTicket(ticket.id, updates);

      // Create Escalation message
      db.createTicketMessage({
        id: `tmsg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        ticketId: ticket.id,
        type: 'ESCALATION',
        senderId: user ? user.id : 'system',
        senderName: staffName,
        senderRole: user ? user.role : 'STAFF',
        isInternalNote: true,
        content: `ESCALATION: Case escalated to Level ${targetLevel} (${updates.escalatedToName}). Reason: ${reason || 'Immediate senior action required.'}`,
        createdAt: nowIso,
      });

      res.json({
        success: true,
        message: `Ticket escalated to Level ${targetLevel}`,
        ticket: updated,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Error escalating ticket' });
    }
  };

  // ==========================================
  // TICKETS: REOPEN TICKET
  // ==========================================
  public reopenTicket = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { reason } = req.body;

      const ticket = db.getSupportTicketById(id);
      if (!ticket) {
        res.status(404).json({ success: false, message: 'Ticket not found' });
        return;
      }

      const nowIso = new Date().toISOString();
      const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'User';

      const updates: Partial<DbTicket> = {
        currentStatus: 'OPEN',
        reopenCount: (ticket.reopenCount || 0) + 1,
        resolution: undefined,
        resolutionDate: undefined,
        resolvedAt: undefined,
        resolvedById: undefined,
        resolvedByName: undefined,
        lastRepliedAt: nowIso,
        lastRepliedBy: userName,
        lastRepliedRole: user && user.role === 'MEMBER' ? 'MEMBER' : 'STAFF',
      };

      const updated = db.updateSupportTicket(ticket.id, updates);

      db.createTicketMessage({
        id: `tmsg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        ticketId: ticket.id,
        type: 'REOPEN',
        senderId: user ? user.id : 'unknown',
        senderName: userName,
        senderRole: user ? user.role : 'MEMBER',
        isInternalNote: false,
        content: `Ticket REOPENED by ${userName}. Reason: ${reason || 'Resolution was unsatisfactory or problem has recurred.'}`,
        createdAt: nowIso,
      });

      res.json({
        success: true,
        message: 'Ticket reopened successfully',
        ticket: updated,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Error reopening ticket' });
    }
  };

  // ==========================================
  // TICKETS: MERGE TICKETS
  // ==========================================
  public mergeTickets = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      const { primaryTicketId, secondaryTicketIds } = req.body;

      if (!primaryTicketId || !Array.isArray(secondaryTicketIds) || secondaryTicketIds.length === 0) {
        res.status(400).json({ success: false, message: 'Primary ticket and secondary ticket IDs are required' });
        return;
      }

      const primary = db.getSupportTicketById(primaryTicketId);
      if (!primary) {
        res.status(404).json({ success: false, message: 'Primary ticket not found' });
        return;
      }

      const mergedNumbers: string[] = [];
      const nowIso = new Date().toISOString();
      const staffName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Staff';

      for (const secId of secondaryTicketIds) {
        const secTicket = db.getSupportTicketById(secId);
        if (secTicket && secTicket.id !== primary.id) {
          mergedNumbers.push(secTicket.ticketNumber);

          // Mark secondary ticket as merged & closed
          db.updateSupportTicket(secTicket.id, {
            currentStatus: 'CLOSED',
            isMerged: true,
            mergedIntoTicketId: primary.id,
          });

          // Move all messages from secondary to primary or add reference note
          const secMessages = db.getTicketMessages(secTicket.id, true);
          for (const msg of secMessages) {
            db.createTicketMessage({
              ...msg,
              id: `tmsg_merged_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
              ticketId: primary.id,
              content: `[Merged from ${secTicket.ticketNumber}]: ${msg.content}`,
            });
          }
        }
      }

      // Update primary ticket
      const existingMerged = primary.mergedTicketNumbers || [];
      const updatedPrimary = db.updateSupportTicket(primary.id, {
        mergedTicketNumbers: [...existingMerged, ...mergedNumbers],
      });

      // Log merge message
      db.createTicketMessage({
        id: `tmsg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        ticketId: primary.id,
        type: 'MERGE_SPLIT',
        senderId: user ? user.id : 'system',
        senderName: staffName,
        senderRole: 'STAFF',
        isInternalNote: true,
        content: `Merged secondary tickets [${mergedNumbers.join(', ')}] into this ticket.`,
        createdAt: nowIso,
      });

      res.json({
        success: true,
        message: `Successfully merged tickets ${mergedNumbers.join(', ')} into #${primary.ticketNumber}`,
        ticket: updatedPrimary,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Error merging tickets' });
    }
  };

  // ==========================================
  // CSAT: SUBMIT SATISFACTION RATING
  // ==========================================
  public submitCsat = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { rating, comment, improvement } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        res.status(400).json({ success: false, message: 'Rating must be between 1 and 5 stars' });
        return;
      }

      const ticket = db.getSupportTicketById(id);
      if (!ticket) {
        res.status(404).json({ success: false, message: 'Ticket not found' });
        return;
      }

      const nowIso = new Date().toISOString();
      const updated = db.updateSupportTicket(ticket.id, {
        satisfactionRating: Number(rating),
        satisfactionComment: comment || '',
        satisfactionImprovement: improvement || '',
        ratedAt: nowIso,
      });

      // Log rating in thread
      db.createTicketMessage({
        id: `tmsg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        ticketId: ticket.id,
        type: 'RATING',
        senderId: user ? user.id : 'member',
        senderName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Member',
        senderRole: 'MEMBER',
        isInternalNote: false,
        content: `Member submitted CSAT Rating: ${'⭐'.repeat(rating)} (${rating}/5). Comment: "${comment || 'No comment'}"`,
        createdAt: nowIso,
      });

      res.json({
        success: true,
        message: 'Thank you for your feedback! Your rating has been recorded.',
        ticket: updated,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Error submitting rating' });
    }
  };

  // ==========================================
  // MEMBER 360 PROFILE (Read-Only Financial View)
  // ==========================================
  public getMember360 = async (req: Request, res: Response): Promise<void> => {
    try {
      const { memberId } = req.params;

      const member = db.getMemberById(memberId) ||
        (db.getMemberByMembershipNo ? db.getMemberByMembershipNo(memberId) : undefined);

      if (!member) {
        res.status(404).json({ success: false, message: 'Member record not found' });
        return;
      }

      // Savings Accounts
      const savingAccounts = db.getSavingAccountsByMemberId
        ? db.getSavingAccountsByMemberId(member.id)
        : [];
      const totalSavingsBalance = savingAccounts.reduce((acc, a) => acc + (a.balance || 0), 0);

      // Shares
      const shareAccount = db.getShareAccountByMemberId
        ? db.getShareAccountByMemberId(member.id)
        : undefined;
      const shareCerts = db.getShareCertificates
        ? db.getShareCertificates(member.id)
        : [];

      // Loans
      const loans = db.getLoansByMemberId ? db.getLoansByMemberId(member.id) : [];
      const activeLoans = loans.filter((l) =>
        ['ACTIVE', 'DISBURSED', 'OVERDUE', 'UNDER_REVIEW'].includes(l.status)
      );
      const totalLoanOutstanding = activeLoans.reduce((acc, l) => acc + (l.disbursedAmount || l.approvedAmount || l.requestedAmount || 0), 0);

      // Financial Transactions
      const allTxns = db.getFinancialTransactions ? db.getFinancialTransactions() : [];
      const txns = allTxns.filter((t) => t.memberId === member.id || t.membershipNo === member.membershipNo);

      // Support History
      const tickets = db.getSupportTickets({ memberId: member.id });
      const openCount = tickets.filter((t) =>
        ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_MEMBER', 'ESCALATED'].includes(t.currentStatus)
      ).length;
      const resolvedCount = tickets.filter((t) =>
        ['RESOLVED', 'CLOSED'].includes(t.currentStatus)
      ).length;

      const profile = {
        member: {
          id: member.id,
          memberNo: member.membershipNo,
          fullName: member.fullName,
          phone: member.phoneNumber,
          email: member.email,
          status: member.status,
          branch: member.address?.region ? `${member.address.region} Branch` : 'Addis Ababa Main Branch',
          joinDate: member.membershipDate || member.createdAt,
          kycStatus: member.status === 'ACTIVE' ? 'VERIFIED' : 'PENDING',
          monthlySavingsCommitment: 500,
        },
        savings: {
          totalBalance: totalSavingsBalance,
          accountsCount: savingAccounts.length,
          accounts: savingAccounts.map((a) => ({
            id: a.id,
            accountNumber: a.accountNo,
            productName: a.productName,
            balance: a.balance,
            status: a.status,
          })),
        },
        shares: {
          totalShares: shareAccount ? shareAccount.numberOfShares : 5,
          totalValue: shareAccount ? shareAccount.totalShareValue : 2500,
          certificateCount: shareCerts.length,
        },
        loans: {
          activeLoansCount: activeLoans.length,
          totalOutstanding: totalLoanOutstanding,
          loans: loans.map((l) => ({
            id: l.id,
            loanNumber: l.loanNo,
            productName: l.productName,
            principal: l.requestedAmount,
            totalOutstanding: l.disbursedAmount || l.approvedAmount || l.requestedAmount,
            status: l.status,
          })),
        },
        recentTransactions: txns.slice(0, 10).map((t) => ({
          id: t.id,
          reference: t.transactionNo,
          type: t.type,
          amount: t.amount,
          date: t.timestamp || t.createdAt,
          status: t.status,
        })),
        supportHistory: {
          totalTickets: tickets.length,
          openTickets: openCount,
          resolvedTickets: resolvedCount,
          tickets: tickets.map((t) => ({
            id: t.id,
            ticketNumber: t.ticketNumber,
            subject: t.subject,
            category: t.category,
            priority: t.priority,
            currentStatus: t.currentStatus,
            createdDate: t.createdDate,
          })),
        },
      };

      res.json({
        success: true,
        profile,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Error fetching Member 360 profile' });
    }
  };

  // ==========================================
  // DASHBOARD METRICS & KPI REPORTING
  // ==========================================
  public getDashboardMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const tickets = db.getSupportTickets();
      const nowIso = new Date().toISOString();
      const todayIso = nowIso.split('T')[0];

      let openCount = 0;
      let todayCount = 0;
      let overdueCount = 0;
      let resolvedToday = 0;
      let slaBreachedCount = 0;
      let totalResolutionHours = 0;
      let resolvedCount = 0;
      let totalCsatSum = 0;
      let csatRatedCount = 0;
      let pendingEscalations = 0;

      const categoryBreakdown: Record<string, number> = {};
      const priorityBreakdown: Record<string, number> = {};
      const statusBreakdown: Record<string, number> = {};
      const departmentBreakdown: Record<string, number> = {};

      const agentMap: Record<string, {
        agentId: string;
        agentName: string;
        department: string;
        assignedCount: number;
        resolvedCount: number;
        openCount: number;
        totalResHours: number;
        slaBreachCount: number;
        csatSum: number;
        csatCount: number;
      }> = {};

      for (const t of tickets) {
        // Breakdowns
        categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + 1;
        priorityBreakdown[t.priority] = (priorityBreakdown[t.priority] || 0) + 1;
        statusBreakdown[t.currentStatus] = (statusBreakdown[t.currentStatus] || 0) + 1;
        departmentBreakdown[t.department] = (departmentBreakdown[t.department] || 0) + 1;

        if (t.createdDate.startsWith(todayIso)) {
          todayCount++;
        }

        if (t.escalationLevel > 0 && t.currentStatus !== 'RESOLVED' && t.currentStatus !== 'CLOSED') {
          pendingEscalations++;
        }

        const isOverdue =
          (t.currentStatus === 'OPEN' ||
            t.currentStatus === 'ASSIGNED' ||
            t.currentStatus === 'IN_PROGRESS' ||
            t.currentStatus === 'ESCALATED') &&
          t.slaResolutionDue < nowIso;

        if (isOverdue) overdueCount++;

        const isBreached = t.isSlaResponseBreached || t.isSlaResolutionBreached || isOverdue;
        if (isBreached) slaBreachedCount++;

        if (t.currentStatus !== 'RESOLVED' && t.currentStatus !== 'CLOSED' && t.currentStatus !== 'CANCELLED') {
          openCount++;
        }

        if (t.currentStatus === 'RESOLVED' || t.currentStatus === 'CLOSED') {
          resolvedCount++;
          if (t.resolvedAt && t.resolvedAt.startsWith(todayIso)) {
            resolvedToday++;
          }
          if (t.resolvedAt && t.createdDate) {
            const diffHours = (new Date(t.resolvedAt).getTime() - new Date(t.createdDate).getTime()) / (1000 * 60 * 60);
            totalResolutionHours += Math.max(0.1, diffHours);
          }
        }

        if (t.satisfactionRating) {
          totalCsatSum += t.satisfactionRating;
          csatRatedCount++;
        }

        // Agent tracking
        if (t.assignedStaffId) {
          if (!agentMap[t.assignedStaffId]) {
            agentMap[t.assignedStaffId] = {
              agentId: t.assignedStaffId,
              agentName: t.assignedStaffName || 'Staff Member',
              department: t.department,
              assignedCount: 0,
              resolvedCount: 0,
              openCount: 0,
              totalResHours: 0,
              slaBreachCount: 0,
              csatSum: 0,
              csatCount: 0,
            };
          }
          const ag = agentMap[t.assignedStaffId];
          ag.assignedCount++;
          if (t.currentStatus === 'RESOLVED' || t.currentStatus === 'CLOSED') {
            ag.resolvedCount++;
            if (t.resolvedAt && t.createdDate) {
              const diffHours = (new Date(t.resolvedAt).getTime() - new Date(t.createdDate).getTime()) / (1000 * 60 * 60);
              ag.totalResHours += Math.max(0.1, diffHours);
            }
          } else {
            ag.openCount++;
          }
          if (isBreached) ag.slaBreachCount++;
          if (t.satisfactionRating) {
            ag.csatSum += t.satisfactionRating;
            ag.csatCount++;
          }
        }
      }

      const avgResolutionHours = resolvedCount > 0 ? Number((totalResolutionHours / resolvedCount).toFixed(1)) : 4.5;
      const averageCsat = csatRatedCount > 0 ? Number((totalCsatSum / csatRatedCount).toFixed(1)) : 4.8;
      const slaComplianceRate = tickets.length > 0
        ? Number((((tickets.length - slaBreachedCount) / tickets.length) * 100).toFixed(1))
        : 96.5;

      const agentPerformance = Object.values(agentMap).map((ag) => ({
        agentId: ag.agentId,
        agentName: ag.agentName,
        department: ag.department,
        assignedCount: ag.assignedCount,
        resolvedCount: ag.resolvedCount,
        openCount: ag.openCount,
        avgResolutionHours: ag.resolvedCount > 0 ? Number((ag.totalResHours / ag.resolvedCount).toFixed(1)) : 0,
        slaBreachCount: ag.slaBreachCount,
        csatAverage: ag.csatCount > 0 ? Number((ag.csatSum / ag.csatCount).toFixed(1)) : 5.0,
        totalRatingsCount: ag.csatCount,
      }));

      res.json({
        success: true,
        metrics: {
          totalTickets: tickets.length,
          openTickets: openCount,
          todayTickets: todayCount,
          overdueTickets: overdueCount,
          resolvedToday,
          avgResolutionHours,
          slaBreachedCount,
          slaComplianceRate,
          pendingEscalations,
          averageCsat,
          activeAgentsCount: agentPerformance.length,
          categoryBreakdown,
          priorityBreakdown,
          statusBreakdown,
          departmentBreakdown,
        },
        agentPerformance,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Error calculating dashboard metrics' });
    }
  };

  // ==========================================
  // SLA POLICIES
  // ==========================================
  public getSlaPolicies = async (req: Request, res: Response): Promise<void> => {
    try {
      const policies = db.getSlaPolicies();
      res.json({ success: true, policies });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Error fetching SLA policies' });
    }
  };

  public updateSlaPolicy = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { firstResponseMinutes, resolutionMinutes, escalationThresholdPercent, isActive } = req.body;

      const updated = db.updateSlaPolicy(id, {
        firstResponseMinutes: firstResponseMinutes ? Number(firstResponseMinutes) : undefined,
        resolutionMinutes: resolutionMinutes ? Number(resolutionMinutes) : undefined,
        escalationThresholdPercent: escalationThresholdPercent ? Number(escalationThresholdPercent) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      });

      if (!updated) {
        res.status(404).json({ success: false, message: 'SLA Policy not found' });
        return;
      }

      res.json({ success: true, message: 'SLA Policy updated successfully', policy: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Error updating SLA policy' });
    }
  };

  // ==========================================
  // KNOWLEDGE BASE
  // ==========================================
  public getKbArticles = async (req: Request, res: Response): Promise<void> => {
    try {
      const { category, status, search, tag } = req.query;
      const articles = db.getKbArticles({
        category: category as string,
        status: status as string,
        search: search as string,
        tag: tag as string,
      });
      res.json({ success: true, count: articles.length, articles });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Error fetching KB articles' });
    }
  };

  public getKbArticleById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const article = db.getKbArticleById(id);
      if (!article) {
        res.status(404).json({ success: false, message: 'Article not found' });
        return;
      }
      db.incrementKbViews(article.id);
      res.json({ success: true, article });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Error retrieving KB article' });
    }
  };

  public createKbArticle = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      const { title, category, summary, content, tags = [], status = 'PUBLISHED' } = req.body;

      if (!title || !content || !category) {
        res.status(400).json({ success: false, message: 'Title, category, and content are required' });
        return;
      }

      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const articleCode = db.getNextKbArticleCode();
      const nowIso = new Date().toISOString();
      const authorName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : 'Staff';

      const newArticle: DbKnowledgeBaseArticle = {
        id: `kb_${Date.now()}`,
        articleCode,
        title,
        slug: `${slug}-${Math.random().toString(36).substr(2, 4)}`,
        category,
        summary: summary || title,
        content,
        status,
        tags: Array.isArray(tags) ? tags : tags.split(',').map((t: string) => t.trim()),
        viewCount: 0,
        helpfulCount: 0,
        notHelpfulCount: 0,
        createdById: user ? user.id : 'system',
        createdByName: authorName,
        updatedById: user ? user.id : 'system',
        updatedByName: authorName,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      db.createKbArticle(newArticle);

      res.status(201).json({ success: true, message: 'Article published successfully', article: newArticle });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Error creating KB article' });
    }
  };

  public updateKbArticle = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { title, category, summary, content, tags, status } = req.body;

      const authorName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : 'Staff';

      const updated = db.updateKbArticle(id, {
        title,
        category,
        summary,
        content,
        tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t: string) => t.trim())) : undefined,
        status,
        updatedById: user ? user.id : undefined,
        updatedByName: authorName,
      });

      if (!updated) {
        res.status(404).json({ success: false, message: 'Article not found' });
        return;
      }

      res.json({ success: true, message: 'Article updated successfully', article: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Error updating KB article' });
    }
  };

  public deleteKbArticle = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const deleted = db.deleteKbArticle(id);
      if (!deleted) {
        res.status(404).json({ success: false, message: 'Article not found' });
        return;
      }
      res.json({ success: true, message: 'Article deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Error deleting KB article' });
    }
  };

  public voteKbArticle = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { helpful } = req.body;
      db.voteKbArticle(id, Boolean(helpful));
      res.json({ success: true, message: 'Feedback recorded' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Error submitting feedback' });
    }
  };

  // ==========================================
  // LIVE CHAT ENGINE
  // ==========================================
  public getChatSessions = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      const { status, memberId } = req.query;

      let targetMemberId = memberId as string | undefined;
      if (user && user.role === 'MEMBER') {
        const member = db.getMemberByUserId ? db.getMemberByUserId(user.id) : undefined;
        targetMemberId = member ? member.id : user.id;
      }

      const sessions = db.getChatSessions({
        status: status as string,
        memberId: targetMemberId,
      });

      res.json({ success: true, sessions });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Error fetching chat sessions' });
    }
  };

  public createChatSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      const { initialMessage, department = 'CUSTOMER_SERVICE' } = req.body;

      let memberId = user ? user.id : 'guest';
      let memberName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Guest Member';
      let memberEmail = user ? user.email : '';

      if (user && user.role === 'MEMBER') {
        const member = db.getMemberByUserId ? db.getMemberByUserId(user.id) : undefined;
        if (member) {
          memberId = member.id;
          memberName = member.fullName;
          memberEmail = member.email || user.email;
        }
      }

      const sessionNo = db.getNextChatSessionNumber();
      const sessionId = `chat_${Date.now()}`;
      const nowIso = new Date().toISOString();

      const newSession: DbChatSession = {
        id: sessionId,
        sessionNo,
        memberId,
        memberName,
        memberEmail,
        status: 'AGENT_CONNECTED',
        assignedAgentId: 'usr_cs_1',
        assignedAgentName: 'Selamawit Bekele (Member Care)',
        department: department as TicketDepartment,
        startedAt: nowIso,
        lastMessageAt: nowIso,
      };

      db.createChatSession(newSession);

      if (initialMessage) {
        db.createChatMessage({
          id: `cmsg_${Date.now()}`,
          sessionId,
          sender: 'MEMBER',
          senderId: user ? user.id : undefined,
          senderName: memberName,
          text: initialMessage,
          createdAt: nowIso,
        });

        // Add automated assistant reply
        db.createChatMessage({
          id: `cmsg_${Date.now() + 1}`,
          sessionId,
          sender: 'AGENT',
          senderId: 'usr_cs_1',
          senderName: 'Selamawit Bekele (Member Care)',
          text: `Hello ${memberName}! Welcome to Wabi Live Support. How may I assist you with your SACCO account today?`,
          createdAt: new Date(Date.now() + 1000).toISOString(),
        });
      }

      res.status(201).json({ success: true, session: newSession });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Error starting chat session' });
    }
  };

  public getChatMessages = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;
      const messages = db.getChatMessages(sessionId);
      res.json({ success: true, messages });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Error fetching chat messages' });
    }
  };

  public sendChatMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      const { sessionId } = req.params;
      const { text, attachments = [] } = req.body;

      if (!text || !text.trim()) {
        res.status(400).json({ success: false, message: 'Message text required' });
        return;
      }

      const session = db.getChatSessionById(sessionId);
      if (!session) {
        res.status(404).json({ success: false, message: 'Chat session not found' });
        return;
      }

      const isStaff = user && user.role !== 'MEMBER';
      const senderName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : 'User';
      const nowIso = new Date().toISOString();

      const newMsg: DbChatMessage = {
        id: `cmsg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        sessionId,
        sender: isStaff ? 'AGENT' : 'MEMBER',
        senderId: user ? user.id : undefined,
        senderName,
        text: text.trim(),
        attachments,
        createdAt: nowIso,
      };

      db.createChatMessage(newMsg);

      res.status(201).json({ success: true, message: newMsg });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Error sending chat message' });
    }
  };

  public closeChatSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId } = req.params;
      const { rating, feedback } = req.body;

      const updated = db.updateChatSession(sessionId, {
        status: 'CLOSED',
        endedAt: new Date().toISOString(),
        rating: rating ? Number(rating) : undefined,
        feedback,
      });

      if (!updated) {
        res.status(404).json({ success: false, message: 'Chat session not found' });
        return;
      }

      res.json({ success: true, message: 'Chat session closed', session: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Error closing chat session' });
    }
  };
}

export const crmController = new CrmController();
