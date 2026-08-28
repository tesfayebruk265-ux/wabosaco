import { Request, Response } from 'express';
import { memberService } from '../services/memberService';
import { db } from '../db/database';
import { DbDocument } from '../db/schema';

export class MemberController {
  // ==========================================
  // PUBLIC MEMBER REGISTRATION
  // ==========================================
  public async register(req: Request, res: Response): Promise<void> {
    try {
      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Wabi SACCO Client';

      const result = await memberService.registerMember(req.body, ip, userAgent);
      res.status(201).json({
        success: true,
        ...result,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: 'REGISTRATION_VALIDATION_ERROR',
        message: err.message || 'Failed to submit registration application.',
      });
    }
  }

  public async getRegistrationStatus(req: Request, res: Response): Promise<void> {
    try {
      const { reference } = req.params;
      if (!reference) {
        res.status(400).json({ success: false, message: 'Application reference or National ID is required' });
        return;
      }

      const status = memberService.getRegistrationStatus(reference);
      if (!status) {
        res.status(404).json({ success: false, message: `Application reference '${reference}' not found.` });
        return;
      }

      res.json({ success: true, data: status });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public async reuploadReceipt(req: Request, res: Response): Promise<void> {
    try {
      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Wabi SACCO Client';
      const { reference } = req.params;

      const result = memberService.reuploadReceipt(reference, req.body, ip, userAgent);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  // ==========================================
  // DOCUMENT UPLOAD (Receipt / Profile Picture)
  // ==========================================
  public async uploadDocument(req: Request, res: Response): Promise<void> {
    try {
      const { originalName, mimeType, size, documentType, dataUrl } = req.body;

      if (!dataUrl) {
        res.status(400).json({ success: false, message: 'Document data URL / payload is required' });
        return;
      }

      // Basic MIME verification
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'application/pdf'];
      if (mimeType && !allowedTypes.includes(mimeType)) {
        res.status(400).json({ success: false, message: 'Invalid file type. Only JPEG, PNG, WEBP, and PDF documents are supported.' });
        return;
      }

      const docId = `doc_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      const doc: DbDocument = {
        id: docId,
        originalName: originalName || 'uploaded_document',
        mimeType: mimeType || 'image/jpeg',
        size: size || dataUrl.length,
        documentType: documentType || 'RECEIPT',
        storagePath: `/documents/${docId}`,
        dataUrl,
        uploadedBy: (req as any).user?.id || 'ANONYMOUS',
        uploadedAt: new Date().toISOString(),
        accessAudit: [],
      };

      db.saveDocument(doc);

      res.status(201).json({
        success: true,
        documentId: doc.id,
        url: doc.dataUrl,
        originalName: doc.originalName,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public async getDocument(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const doc = db.getDocumentById(id);
      if (!doc) {
        res.status(404).json({ success: false, message: 'Document not found' });
        return;
      }

      const userId = (req as any).user?.id || 'ANONYMOUS';
      db.recordDocumentAccess(doc.id, {
        accessedBy: userId,
        accessedAt: new Date().toISOString(),
        action: 'VIEW_DOCUMENT',
      });

      res.json({ success: true, document: doc });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // ==========================================
  // MEMBER SELF-SERVICE PORTAL
  // ==========================================
  public async getMyProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const profile = memberService.getMemberProfile(userId);
      res.json({ success: true, data: profile });
    } catch (err: any) {
      res.status(404).json({ success: false, message: err.message });
    }
  }

  public async updateMyProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Wabi SACCO Client';

      const updated = memberService.updateMemberProfile(userId, req.body, ip, userAgent);
      res.json({ success: true, message: 'Profile updated successfully.', data: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async getMyNominees(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const nominees = memberService.getNominees(userId);
      res.json({ success: true, data: nominees });
    } catch (err: any) {
      res.status(404).json({ success: false, message: err.message });
    }
  }

  public async updateMyNominees(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Wabi SACCO Client';

      const nominees = memberService.updateNominees(userId, req.body.nominees, ip, userAgent);
      res.json({ success: true, message: 'Nominees updated successfully.', data: nominees });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  // ==========================================
  // ACCOUNTANT REGISTRATION REQUESTS & APPROVALS
  // ==========================================
  public async getRegistrationRequests(req: Request, res: Response): Promise<void> {
    try {
      const { status, search, limit, offset } = req.query;
      const result = memberService.getRegistrationRequests({
        status: status as string,
        search: search as string,
        limit: limit ? parseInt(limit as string, 10) : 50,
        offset: offset ? parseInt(offset as string, 10) : 0,
      });
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public async getRegistrationRequestById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const item = memberService.getRegistrationRequestById(id);
      res.json({ success: true, data: item });
    } catch (err: any) {
      res.status(404).json({ success: false, message: err.message });
    }
  }

  public async approveRegistrationRequest(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const accountant = (req as any).user;
      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Wabi SACCO Portal';

      const result = await memberService.approveRegistrationRequest(id, accountant, ip, userAgent);
      res.json({
        success: true,
        message: `Registration request approved! Membership ID '${result.membershipNo}' issued to ${result.member.fullName}.`,
        ...result,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async rejectRegistrationRequest(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const accountant = (req as any).user;
      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Wabi SACCO Portal';

      const result = await memberService.rejectRegistrationRequest(id, reason, accountant, ip, userAgent);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  // ==========================================
  // STAFF MEMBERS DIRECTORY
  // ==========================================
  public async getMembers(req: Request, res: Response): Promise<void> {
    try {
      const { search, status, limit, offset } = req.query;
      const result = memberService.getAllMembers({
        search: search as string,
        status: status as string,
        limit: limit ? parseInt(limit as string, 10) : 50,
        offset: offset ? parseInt(offset as string, 10) : 0,
      });
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public async getMemberById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const member = memberService.getMemberByIdOrNo(id);
      res.json({ success: true, data: member });
    } catch (err: any) {
      res.status(404).json({ success: false, message: err.message });
    }
  }

  public async updateMember(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const staffUser = (req as any).user;
      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Wabi SACCO Portal';

      const updated = memberService.updateMemberByStaff(id, req.body, staffUser, ip, userAgent);
      res.json({ success: true, message: 'Member KYC record updated successfully.', data: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async activateMember(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const staffUser = (req as any).user;
      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Wabi SACCO Portal';

      const updated = memberService.activateMember(id, staffUser, ip, userAgent);
      res.json({ success: true, message: `Member ${updated.membershipNo} has been activated.`, data: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async suspendMember(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const staffUser = (req as any).user;
      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Wabi SACCO Portal';

      const updated = memberService.suspendMember(id, reason, staffUser, ip, userAgent);
      res.json({ success: true, message: `Member ${updated.membershipNo} has been suspended.`, data: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public async terminateMember(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const staffUser = (req as any).user;
      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Wabi SACCO Portal';

      const updated = memberService.terminateMember(id, reason, staffUser, ip, userAgent);
      res.json({ success: true, message: `Membership for ${updated.membershipNo} has been terminated.`, data: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  // ==========================================
  // NOTIFICATIONS
  // ==========================================
  public async getMyNotifications(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const list = db.getNotifications(userId);
      res.json({ success: true, data: list });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public async markNotificationsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      db.markNotificationsRead(userId);
      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

export const memberController = new MemberController();
