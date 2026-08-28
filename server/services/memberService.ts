import { db } from '../db/database';
import {
  DbMember,
  DbRegistrationRequest,
  DbNominee,
  DbUser,
  DbNotification,
  DbAuditLog,
} from '../db/schema';
import { cryptoUtils } from '../utils/crypto';
import { notificationService } from './notificationService';

export interface RegisterMemberInput {
  personalInfo: {
    fullName: string;
    gender: 'MALE' | 'FEMALE';
    dateOfBirth: string;
    nationalId: string;
  };
  contactInfo: {
    phoneNumber: string;
    email: string;
    username: string;
    password: string;
  };
  address: {
    region: string;
    zone: string;
    woreda: string;
    kebele: string;
    specificAddress?: string;
    additionalInfo?: string;
  };
  employment: {
    occupation: string;
    employer: string;
    monthlyIncome: number;
    employmentType: 'Employed' | 'Self-employed' | 'Business Owner' | 'Student' | 'Unemployed' | 'Other';
  };
  family: {
    familyMembersCount: number;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
    address?: string;
  };
  nominees: Array<{
    fullName: string;
    relationship: string;
    phone: string;
    address?: string;
    percentage: number;
  }>;
  referral?: {
    referralType?: string;
    referralMemberNo?: string;
    referralInfo?: string;
  };
  profilePhotoDocumentId?: string;
  profilePhotoUrl?: string;
  payment: {
    paymentMethod: 'CBE' | 'Tsehay Bank' | 'Bank Transfer';
    referenceNumber: string;
    receiptDocumentId?: string;
    receiptUrl?: string;
  };
}

export class MemberService {
  // ==========================================
  // PUBLIC SELF-REGISTRATION
  // ==========================================
  public async registerMember(
    data: RegisterMemberInput,
    ipAddress = '127.0.0.1',
    userAgent = 'Wabi SACCO Client'
  ): Promise<{ applicationReference: string; status: string; message: string }> {
    // 1. Validate Personal Info
    if (!data.personalInfo?.fullName?.trim()) {
      throw new Error('Full Legal Name is required');
    }
    if (!['MALE', 'FEMALE'].includes(data.personalInfo?.gender)) {
      throw new Error('Gender must be either MALE or FEMALE');
    }
    if (!data.personalInfo?.dateOfBirth?.trim()) {
      throw new Error('Date of Birth is required (YYYY-MM-DD)');
    }
    if (!data.personalInfo?.nationalId?.trim()) {
      throw new Error('National ID / Kebele ID is required');
    }

    const cleanNationalId = data.personalInfo.nationalId.trim();
    // Check if national ID already exists in active members
    const existingMemberWithId = db.getMemberByNationalId(cleanNationalId);
    if (existingMemberWithId) {
      throw new Error(`A member with National ID '${cleanNationalId}' is already registered with Membership No ${existingMemberWithId.membershipNo}`);
    }

    // Check if pending registration already has this national ID
    const existingPendingReq = db.getRegistrationRequests().find(
      (r) =>
        r.status === 'PENDING' &&
        r.personalInfo.nationalId.trim().toLowerCase() === cleanNationalId.toLowerCase()
    );
    if (existingPendingReq) {
      throw new Error(`A pending registration request already exists with National ID '${cleanNationalId}' (Ref: ${existingPendingReq.applicationReference})`);
    }

    // 2. Validate Contact Info & Credentials
    if (!data.contactInfo?.phoneNumber?.trim()) {
      throw new Error('Phone Number is required');
    }
    if (!data.contactInfo?.email?.trim() || !data.contactInfo.email.includes('@')) {
      throw new Error('A valid email address is required');
    }
    if (!data.contactInfo?.username?.trim()) {
      throw new Error('Username is required');
    }
    const cleanUsername = data.contactInfo.username.trim().toLowerCase();
    const existingUser = db.findUserByIdentifier(cleanUsername);
    if (existingUser) {
      throw new Error(`Username '${cleanUsername}' is already in use. Please choose another username.`);
    }

    const existingReqWithUsername = db.getRegistrationRequests().find(
      (r) => r.status === 'PENDING' && r.contactInfo.username.trim().toLowerCase() === cleanUsername
    );
    if (existingReqWithUsername) {
      throw new Error(`Username '${cleanUsername}' is already taken in a pending application.`);
    }

    if (!data.contactInfo.password || data.contactInfo.password.length < 8) {
      throw new Error('Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character');
    }

    // 3. Validate Address
    if (!data.address?.region?.trim() || !data.address?.zone?.trim() || !data.address?.woreda?.trim() || !data.address?.kebele?.trim()) {
      throw new Error('Region, Zone/Subcity, Woreda, and Kebele are required address fields');
    }

    // 4. Validate Employment
    if (!data.employment?.occupation?.trim()) {
      throw new Error('Occupation is required');
    }
    if (typeof data.employment?.monthlyIncome !== 'number' || data.employment.monthlyIncome < 0) {
      throw new Error('Monthly Income must be a positive number');
    }

    // 5. Validate Emergency Contact
    if (!data.emergencyContact?.name?.trim() || !data.emergencyContact?.relationship?.trim() || !data.emergencyContact?.phone?.trim()) {
      throw new Error('Emergency Contact Name, Relationship, and Phone Number are required');
    }

    // 6. Validate Nominees (Strict Rule: Total percentages must equal exactly 100%)
    if (!data.nominees || !Array.isArray(data.nominees) || data.nominees.length === 0) {
      throw new Error('At least one beneficiary nominee is required');
    }

    let totalNomineePercentage = 0;
    const validatedNominees: DbNominee[] = [];

    for (let i = 0; i < data.nominees.length; i++) {
      const nom = data.nominees[i];
      if (!nom.fullName?.trim()) {
        throw new Error(`Nominee #${i + 1} full name is required`);
      }
      if (!nom.relationship?.trim()) {
        throw new Error(`Nominee #${i + 1} relationship is required`);
      }
      if (!nom.phone?.trim()) {
        throw new Error(`Nominee #${i + 1} phone number is required`);
      }
      const pct = Number(nom.percentage);
      if (isNaN(pct) || pct <= 0 || pct > 100) {
        throw new Error(`Nominee #${i + 1} share allocation percentage must be between 1% and 100%`);
      }
      totalNomineePercentage += pct;
      validatedNominees.push({
        id: `nom_${Date.now()}_${i + 1}`,
        fullName: nom.fullName.trim(),
        relationship: nom.relationship.trim(),
        phone: nom.phone.trim(),
        address: nom.address?.trim(),
        percentage: pct,
      });
    }

    // Precise floating comparison check (e.g. 100.0)
    if (Math.round(totalNomineePercentage * 100) !== 10000) {
      throw new Error(
        `Total nominee allocation percentages must equal exactly 100%. Currently assigned: ${totalNomineePercentage}%`
      );
    }

    // 7. Validate Payment
    if (!data.payment?.paymentMethod || !['CBE', 'Tsehay Bank', 'Bank Transfer'].includes(data.payment.paymentMethod)) {
      throw new Error('Valid Payment Method (CBE, Tsehay Bank, or Bank Transfer) is required');
    }
    if (!data.payment?.referenceNumber?.trim()) {
      throw new Error('Bank Transaction Reference / FT Number is required');
    }
    if (!data.payment?.receiptUrl?.trim() && !data.payment?.receiptDocumentId?.trim()) {
      throw new Error('Deposit receipt image / document upload is required');
    }

    // Hash password
    const salt = cryptoUtils.generateSalt();
    const passwordHash = cryptoUtils.hashPassword(data.contactInfo.password, salt);

    // Generate Unique Application Reference
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const appRef = `APP-${new Date().getFullYear()}-${randomSuffix}`;
    const now = new Date().toISOString();

    const newRequest: DbRegistrationRequest = {
      id: `reg_${Date.now()}`,
      applicationReference: appRef,
      personalInfo: {
        fullName: data.personalInfo.fullName.trim(),
        gender: data.personalInfo.gender,
        dateOfBirth: data.personalInfo.dateOfBirth.trim(),
        nationalId: cleanNationalId,
      },
      contactInfo: {
        phoneNumber: data.contactInfo.phoneNumber.trim(),
        email: data.contactInfo.email.trim(),
        username: cleanUsername,
        passwordHash,
        salt,
      },
      address: {
        region: data.address.region.trim(),
        zone: data.address.zone.trim(),
        woreda: data.address.woreda.trim(),
        kebele: data.address.kebele.trim(),
        specificAddress: data.address.specificAddress?.trim(),
        additionalInfo: data.address.additionalInfo?.trim(),
      },
      employment: {
        occupation: data.employment.occupation.trim(),
        employer: data.employment.employer?.trim() || 'N/A',
        monthlyIncome: data.employment.monthlyIncome,
        employmentType: data.employment.employmentType || 'Employed',
      },
      family: {
        familyMembersCount: Number(data.family?.familyMembersCount) || 0,
      },
      emergencyContact: {
        name: data.emergencyContact.name.trim(),
        relationship: data.emergencyContact.relationship.trim(),
        phone: data.emergencyContact.phone.trim(),
        address: data.emergencyContact.address?.trim(),
      },
      nominees: validatedNominees,
      referral: data.referral,
      profilePhotoDocumentId: data.profilePhotoDocumentId,
      profilePhotoUrl: data.profilePhotoUrl,
      payment: {
        amount: 1000, // Fixed 1000 ETB
        paymentMethod: data.payment.paymentMethod,
        referenceNumber: data.payment.referenceNumber.trim(),
        receiptDocumentId: data.payment.receiptDocumentId,
        receiptUrl: data.payment.receiptUrl,
      },
      status: 'PENDING',
      submittedAt: now,
      receiptHistory: [
        {
          id: `rcp_${Date.now()}`,
          receiptDocumentId: data.payment.receiptDocumentId,
          receiptUrl: data.payment.receiptUrl,
          paymentMethod: data.payment.paymentMethod,
          referenceNumber: data.payment.referenceNumber.trim(),
          amount: 1000,
          uploadedAt: now,
          status: 'PENDING',
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    db.createRegistrationRequest(newRequest);

    // Record Security Event & Audit Log
    db.recordSecurityEvent({
      id: `sec_${Date.now()}`,
      eventType: 'SUSPICIOUS_ACTIVITY',
      severity: 'INFO',
      ipAddress,
      userAgent,
      details: {
        action: 'MEMBER_REGISTRATION_SUBMITTED',
        applicationReference: appRef,
        applicantName: newRequest.personalInfo.fullName,
        nationalId: cleanNationalId,
      },
      timestamp: now,
    });

    db.recordAuditLog({
      id: `aud_${Date.now()}`,
      actorId: 'PUBLIC_APPLICANT',
      actorName: newRequest.personalInfo.fullName,
      actorRole: 'ANONYMOUS',
      action: 'MEMBER_REGISTRATION_SUBMIT',
      resource: 'registration_requests',
      resourceId: newRequest.id,
      afterState: {
        applicationReference: appRef,
        fullName: newRequest.personalInfo.fullName,
        nationalId: cleanNationalId,
        paymentRef: newRequest.payment.referenceNumber,
      },
      result: 'SUCCESS',
      ipAddress,
      userAgent,
      timestamp: now,
    });

    // Enterprise Centralized Notification Event
    notificationService.publish({
      eventCode: 'REGISTRATION_SUBMITTED',
      category: 'MEMBERSHIP',
      recipientPhone: newRequest.contactInfo.phoneNumber,
      recipientEmail: newRequest.contactInfo.email,
      recipientName: newRequest.personalInfo.fullName,
      variables: {
        memberName: newRequest.personalInfo.fullName,
        transactionReference: appRef,
      },
    }).catch((e) => console.error('Notification dispatch error:', e));

    return {
      applicationReference: appRef,
      status: 'PENDING',
      message: 'Registration submitted successfully. The Accountant team will verify your payment slip and activate your Membership ID.',
    };
  }

  // ==========================================
  // REGISTRATION STATUS & RE-UPLOAD RECEIPT
  // ==========================================
  public getRegistrationStatus(reference: string): Partial<DbRegistrationRequest> | null {
    const req = db.getRegistrationRequestByReference(reference);
    if (!req) return null;

    // Return sanitized status for public inquiry
    return {
      id: req.id,
      applicationReference: req.applicationReference,
      personalInfo: {
        fullName: req.personalInfo.fullName,
        gender: req.personalInfo.gender,
        dateOfBirth: req.personalInfo.dateOfBirth,
        nationalId: req.personalInfo.nationalId.replace(/(?<=.{3}).(?=.{3})/g, '*'),
      },
      status: req.status,
      membershipNo: req.membershipNo,
      submittedAt: req.submittedAt,
      reviewedAt: req.reviewedAt,
      rejectionReason: req.rejectionReason,
      receiptHistory: req.receiptHistory.map((rh) => ({
        id: rh.id,
        paymentMethod: rh.paymentMethod,
        referenceNumber: rh.referenceNumber,
        amount: rh.amount,
        uploadedAt: rh.uploadedAt,
        status: rh.status,
        reviewedAt: rh.reviewedAt,
        rejectionReason: rh.rejectionReason,
      })),
    };
  }

  public reuploadReceipt(
    applicationReference: string,
    data: {
      paymentMethod: 'CBE' | 'Tsehay Bank' | 'Bank Transfer';
      referenceNumber: string;
      receiptUrl?: string;
      receiptDocumentId?: string;
    },
    ipAddress = '127.0.0.1',
    userAgent = 'Wabi SACCO Client'
  ): { success: boolean; message: string; request: DbRegistrationRequest } {
    const req = db.getRegistrationRequestByReference(applicationReference);
    if (!req) {
      throw new Error(`Application Reference '${applicationReference}' not found.`);
    }

    if (req.status === 'APPROVED') {
      throw new Error('This application has already been approved and activated. You can log in directly.');
    }

    if (!data.referenceNumber?.trim()) {
      throw new Error('Bank Reference / FT number is required');
    }
    if (!data.receiptUrl?.trim() && !data.receiptDocumentId?.trim()) {
      throw new Error('New receipt image or document upload is required');
    }

    const now = new Date().toISOString();
    const newReceiptItem = {
      id: `rcp_${Date.now()}`,
      receiptDocumentId: data.receiptDocumentId,
      receiptUrl: data.receiptUrl,
      paymentMethod: data.paymentMethod,
      referenceNumber: data.referenceNumber.trim(),
      amount: 1000,
      uploadedAt: now,
      status: 'PENDING' as const,
    };

    req.payment = {
      amount: 1000,
      paymentMethod: data.paymentMethod,
      referenceNumber: data.referenceNumber.trim(),
      receiptDocumentId: data.receiptDocumentId,
      receiptUrl: data.receiptUrl,
    };
    req.status = 'PENDING';
    req.rejectionReason = null;
    req.receiptHistory.unshift(newReceiptItem);
    req.updatedAt = now;

    db.updateRegistrationRequest(req.id, req);

    db.recordAuditLog({
      id: `aud_${Date.now()}`,
      actorId: req.userId || 'PUBLIC_APPLICANT',
      actorName: req.personalInfo.fullName,
      actorRole: 'MEMBER',
      action: 'RECEIPT_REUPLOAD',
      resource: 'registration_requests',
      resourceId: req.id,
      afterState: {
        applicationReference: req.applicationReference,
        paymentRef: data.referenceNumber,
      },
      result: 'SUCCESS',
      ipAddress,
      userAgent,
      timestamp: now,
    });

    return {
      success: true,
      message: 'New deposit receipt uploaded successfully. Status updated to PENDING for accountant review.',
      request: req,
    };
  }

  // ==========================================
  // ACCOUNTANT & STAFF VERIFICATION WORKFLOW
  // ==========================================
  public getRegistrationRequests(filters: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): { requests: DbRegistrationRequest[]; total: number } {
    let list = db.getRegistrationRequests();

    if (filters.status && filters.status !== 'ALL') {
      list = list.filter((r) => r.status === filters.status);
    }

    if (filters.search) {
      const q = filters.search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.applicationReference.toLowerCase().includes(q) ||
          r.personalInfo.fullName.toLowerCase().includes(q) ||
          r.personalInfo.nationalId.toLowerCase().includes(q) ||
          r.contactInfo.phoneNumber.toLowerCase().includes(q) ||
          r.payment.referenceNumber.toLowerCase().includes(q)
      );
    }

    const total = list.length;
    const offset = filters.offset || 0;
    const limit = filters.limit || 50;
    const paginated = list.slice(offset, offset + limit);

    return { requests: paginated, total };
  }

  public getRegistrationRequestById(id: string): DbRegistrationRequest {
    const req = db.getRegistrationRequestById(id);
    if (!req) {
      throw new Error(`Registration request '${id}' not found`);
    }
    return req;
  }

  public async approveRegistrationRequest(
    requestId: string,
    accountantUser: DbUser,
    ipAddress = '127.0.0.1',
    userAgent = 'Wabi SACCO Portal'
  ): Promise<{
    success: boolean;
    member: DbMember;
    user: DbUser;
    membershipNo: string;
  }> {
    const req = db.getRegistrationRequestById(requestId);
    if (!req) {
      throw new Error(`Registration request '${requestId}' not found`);
    }

    if (req.status === 'APPROVED') {
      throw new Error(`This application has already been approved (Membership No: ${req.membershipNo})`);
    }

    // Separation of duties rule: Accountant cannot approve a receipt/application they uploaded or submitted
    if (
      accountantUser.id === req.userId ||
      accountantUser.email.toLowerCase() === req.contactInfo.email.toLowerCase() ||
      accountantUser.phoneNumber === req.contactInfo.phoneNumber
    ) {
      throw new Error('Separation of duties violation: You cannot approve your own membership registration application or receipt.');
    }

    const now = new Date().toISOString();

    // 1. Generate Next Sequential Membership ID (WB000001, WB000002...)
    const sequentialMembershipNo = db.getNextMembershipNo();

    // 2. Create or Activate Member User Account
    const newUserId = `usr_mem_${Date.now()}`;
    const newUser: DbUser = {
      id: newUserId,
      username: req.contactInfo.username || sequentialMembershipNo,
      email: req.contactInfo.email,
      phoneNumber: req.contactInfo.phoneNumber,
      fullName: req.personalInfo.fullName,
      passwordHash: req.contactInfo.passwordHash,
      salt: req.contactInfo.salt,
      status: 'ACTIVE',
      isActive: true,
      membershipNo: sequentialMembershipNo,
      avatarUrl: req.profilePhotoUrl,
      failedLoginAttempts: 0,
      lockedUntil: null,
      passwordChangedAt: now,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    };

    db.createUser(newUser);
    db.assignUserRole(newUser.id, 'role_member', accountantUser.id);

    // 3. Create Official Member Profile Record
    const memberId = `mbr_${sequentialMembershipNo.toLowerCase()}`;
    const newMember: DbMember = {
      id: memberId,
      userId: newUser.id,
      membershipNo: sequentialMembershipNo,
      fullName: req.personalInfo.fullName,
      gender: req.personalInfo.gender,
      dateOfBirth: req.personalInfo.dateOfBirth,
      nationalId: req.personalInfo.nationalId,
      phoneNumber: req.contactInfo.phoneNumber,
      email: req.contactInfo.email,
      address: req.address,
      occupation: req.employment.occupation,
      employer: req.employment.employer,
      monthlyIncome: req.employment.monthlyIncome,
      employmentType: req.employment.employmentType,
      familyMembersCount: req.family.familyMembersCount,
      emergencyContact: req.emergencyContact,
      nominees: req.nominees,
      referral: req.referral,
      profilePictureUrl: req.profilePhotoUrl,
      profilePictureDocumentId: req.profilePhotoDocumentId,
      status: 'ACTIVE',
      approvedAt: now,
      approvedBy: accountantUser.id,
      membershipDate: now.split('T')[0],
      createdAt: now,
      updatedAt: now,
    };

    db.createMember(newMember);

    // 4. Update Registration Request Status
    req.status = 'APPROVED';
    req.memberId = newMember.id;
    req.userId = newUser.id;
    req.membershipNo = sequentialMembershipNo;
    req.reviewedAt = now;
    req.reviewedBy = accountantUser.id;
    req.reviewedByName = accountantUser.fullName;
    req.rejectionReason = null;

    if (req.receiptHistory.length > 0) {
      req.receiptHistory[0].status = 'APPROVED';
      req.receiptHistory[0].reviewedAt = now;
      req.receiptHistory[0].reviewedBy = accountantUser.id;
      req.receiptHistory[0].reviewedByName = accountantUser.fullName;
    }
    db.updateRegistrationRequest(req.id, req);

    // 5. Centralized Multi-Channel Notification Event
    notificationService.publish({
      eventCode: 'MEMBERSHIP_APPROVED',
      category: 'MEMBERSHIP',
      recipientUserId: newUser.id,
      recipientMemberId: newMember.id,
      recipientPhone: newMember.phoneNumber,
      recipientEmail: newMember.email,
      recipientName: newMember.fullName,
      variables: {
        memberName: newMember.fullName,
        membershipId: sequentialMembershipNo,
        membershipNo: sequentialMembershipNo,
      },
      metadata: {
        membershipNo: sequentialMembershipNo,
        approvedBy: accountantUser.fullName,
      },
    }).catch((e) => console.error('Notification error:', e));

    // 6. Record Audit Log
    db.recordAuditLog({
      id: `aud_${Date.now()}`,
      actorId: accountantUser.id,
      actorName: accountantUser.fullName,
      actorRole: 'ACCOUNTANT',
      action: 'APPROVE_MEMBER_REGISTRATION',
      resource: 'members',
      resourceId: newMember.id,
      afterState: {
        membershipNo: sequentialMembershipNo,
        memberId: newMember.id,
        applicationReference: req.applicationReference,
        approvedBy: accountantUser.fullName,
      },
      result: 'SUCCESS',
      ipAddress,
      userAgent,
      timestamp: now,
    });

    return {
      success: true,
      member: newMember,
      user: newUser,
      membershipNo: sequentialMembershipNo,
    };
  }

  public async rejectRegistrationRequest(
    requestId: string,
    reason: string,
    accountantUser: DbUser,
    ipAddress = '127.0.0.1',
    userAgent = 'Wabi SACCO Portal'
  ): Promise<{ success: boolean; message: string; request: DbRegistrationRequest }> {
    const req = db.getRegistrationRequestById(requestId);
    if (!req) {
      throw new Error(`Registration request '${requestId}' not found`);
    }

    if (!reason || !reason.trim()) {
      throw new Error('A detailed rejection reason is required for audit trail.');
    }

    const now = new Date().toISOString();
    const trimmedReason = reason.trim();

    req.status = 'REJECTED';
    req.rejectionReason = trimmedReason;
    req.reviewedAt = now;
    req.reviewedBy = accountantUser.id;
    req.reviewedByName = accountantUser.fullName;
    req.updatedAt = now;

    if (req.receiptHistory.length > 0) {
      req.receiptHistory[0].status = 'REJECTED';
      req.receiptHistory[0].rejectionReason = trimmedReason;
      req.receiptHistory[0].reviewedAt = now;
      req.receiptHistory[0].reviewedBy = accountantUser.id;
      req.receiptHistory[0].reviewedByName = accountantUser.fullName;
    }

    db.updateRegistrationRequest(req.id, req);

    // Record Security Event & Audit Log
    db.recordAuditLog({
      id: `aud_${Date.now()}`,
      actorId: accountantUser.id,
      actorName: accountantUser.fullName,
      actorRole: 'ACCOUNTANT',
      action: 'REJECT_MEMBER_REGISTRATION',
      resource: 'registration_requests',
      resourceId: req.id,
      afterState: {
        applicationReference: req.applicationReference,
        rejectionReason: trimmedReason,
        reviewedBy: accountantUser.fullName,
      },
      result: 'SUCCESS',
      ipAddress,
      userAgent,
      timestamp: now,
    });

    // Centralized Rejection Notification Event
    notificationService.publish({
      eventCode: 'RECEIPT_REJECTED',
      category: 'MEMBERSHIP',
      recipientPhone: req.contactInfo.phoneNumber,
      recipientEmail: req.contactInfo.email,
      recipientName: req.personalInfo.fullName,
      variables: {
        memberName: req.personalInfo.fullName,
        rejectionReason: trimmedReason,
        transactionReference: req.applicationReference,
      },
    }).catch((e) => console.error('Notification error:', e));

    return {
      success: true,
      message: `Registration application ${req.applicationReference} has been rejected with reason: "${trimmedReason}".`,
      request: req,
    };
  }

  // ==========================================
  // MEMBER PROFILE SELF-SERVICE
  // ==========================================
  public getMemberProfile(userId: string): DbMember {
    let member = db.getMemberByUserId(userId);
    if (!member) {
      // Check by membershipNo in user
      const user = db.getUserById(userId);
      if (user && user.membershipNo) {
        member = db.getMemberByMembershipNo(user.membershipNo);
      }
    }
    if (!member) {
      throw new Error('Member record not found for the authenticated user.');
    }
    return member;
  }

  public updateMemberProfile(
    userId: string,
    updates: Partial<{
      phoneNumber: string;
      email: string;
      address: DbMember['address'];
      emergencyContact: DbMember['emergencyContact'];
      occupation: string;
      employer: string;
      monthlyIncome: number;
      familyMembersCount: number;
      profilePictureUrl: string;
    }>,
    ipAddress = '127.0.0.1',
    userAgent = 'Wabi SACCO Client'
  ): DbMember {
    const member = this.getMemberProfile(userId);
    const beforeState = { ...member };

    const allowedUpdates: Partial<DbMember> = {};

    if (updates.phoneNumber !== undefined) allowedUpdates.phoneNumber = updates.phoneNumber.trim();
    if (updates.email !== undefined) allowedUpdates.email = updates.email.trim();
    if (updates.address !== undefined) allowedUpdates.address = updates.address;
    if (updates.emergencyContact !== undefined) allowedUpdates.emergencyContact = updates.emergencyContact;
    if (updates.occupation !== undefined) allowedUpdates.occupation = updates.occupation.trim();
    if (updates.employer !== undefined) allowedUpdates.employer = updates.employer.trim();
    if (updates.monthlyIncome !== undefined) allowedUpdates.monthlyIncome = updates.monthlyIncome;
    if (updates.familyMembersCount !== undefined) allowedUpdates.familyMembersCount = updates.familyMembersCount;
    if (updates.profilePictureUrl !== undefined) allowedUpdates.profilePictureUrl = updates.profilePictureUrl;

    const updated = db.updateMember(member.id, allowedUpdates);
    if (!updated) {
      throw new Error('Failed to update member profile.');
    }

    // Sync user email/phone if changed
    if (allowedUpdates.email || allowedUpdates.phoneNumber || allowedUpdates.profilePictureUrl) {
      db.updateUser(userId, {
        email: allowedUpdates.email || member.email,
        phoneNumber: allowedUpdates.phoneNumber || member.phoneNumber,
        avatarUrl: allowedUpdates.profilePictureUrl || member.profilePictureUrl,
      });
    }

    db.recordAuditLog({
      id: `aud_${Date.now()}`,
      actorId: userId,
      actorName: member.fullName,
      actorRole: 'MEMBER',
      action: 'UPDATE_OWN_PROFILE',
      resource: 'members',
      resourceId: member.id,
      beforeState,
      afterState: updated,
      result: 'SUCCESS',
      ipAddress,
      userAgent,
      timestamp: new Date().toISOString(),
    });

    return updated;
  }

  public getNominees(userId: string): DbNominee[] {
    const member = this.getMemberProfile(userId);
    return member.nominees || [];
  }

  public updateNominees(
    userId: string,
    nominees: Array<{
      id?: string;
      fullName: string;
      relationship: string;
      phone: string;
      address?: string;
      percentage: number;
    }>,
    ipAddress = '127.0.0.1',
    userAgent = 'Wabi SACCO Client'
  ): DbNominee[] {
    const member = this.getMemberProfile(userId);

    if (!nominees || !Array.isArray(nominees) || nominees.length === 0) {
      throw new Error('At least one beneficiary nominee is required.');
    }

    let totalPct = 0;
    const validated: DbNominee[] = [];

    for (let i = 0; i < nominees.length; i++) {
      const n = nominees[i];
      if (!n.fullName?.trim() || !n.relationship?.trim() || !n.phone?.trim()) {
        throw new Error(`Nominee #${i + 1} name, relationship, and phone are required.`);
      }
      const pct = Number(n.percentage);
      if (isNaN(pct) || pct <= 0 || pct > 100) {
        throw new Error(`Nominee #${i + 1} percentage must be between 1% and 100%.`);
      }
      totalPct += pct;
      validated.push({
        id: n.id || `nom_${Date.now()}_${i + 1}`,
        fullName: n.fullName.trim(),
        relationship: n.relationship.trim(),
        phone: n.phone.trim(),
        address: n.address?.trim(),
        percentage: pct,
      });
    }

    if (Math.round(totalPct * 100) !== 10000) {
      throw new Error(`Total nominee percentages must equal exactly 100%. Currently assigned: ${totalPct}%.`);
    }

    const updated = db.updateMember(member.id, { nominees: validated });
    if (!updated) {
      throw new Error('Failed to update nominees.');
    }

    db.recordAuditLog({
      id: `aud_${Date.now()}`,
      actorId: userId,
      actorName: member.fullName,
      actorRole: 'MEMBER',
      action: 'UPDATE_NOMINEES',
      resource: 'members',
      resourceId: member.id,
      beforeState: { nominees: member.nominees },
      afterState: { nominees: validated },
      result: 'SUCCESS',
      ipAddress,
      userAgent,
      timestamp: new Date().toISOString(),
    });

    return validated;
  }

  // ==========================================
  // STAFF MEMBER DIRECTORY & LIFECYCLE MANAGEMENT
  // ==========================================
  public getAllMembers(filters: {
    search?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): { members: DbMember[]; total: number } {
    let list = db.getMembers();

    if (filters.status && filters.status !== 'ALL') {
      list = list.filter((m) => m.status === filters.status);
    }

    if (filters.search) {
      const q = filters.search.trim().toLowerCase();
      list = list.filter(
        (m) =>
          m.fullName.toLowerCase().includes(q) ||
          m.membershipNo.toLowerCase().includes(q) ||
          m.nationalId.toLowerCase().includes(q) ||
          m.phoneNumber.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q)
      );
    }

    const total = list.length;
    const offset = filters.offset || 0;
    const limit = filters.limit || 50;
    const paginated = list.slice(offset, offset + limit);

    return { members: paginated, total };
  }

  public getMemberByIdOrNo(id: string): DbMember {
    const member = db.getMemberById(id);
    if (!member) {
      throw new Error(`Member '${id}' not found.`);
    }
    return member;
  }

  public updateMemberByStaff(
    id: string,
    updates: Partial<DbMember>,
    staffUser: DbUser,
    ipAddress = '127.0.0.1',
    userAgent = 'Wabi SACCO Portal'
  ): DbMember {
    const member = this.getMemberByIdOrNo(id);
    const beforeState = { ...member };

    // Prevent altering sequential membershipNo, id, or userId
    delete updates.id;
    delete updates.membershipNo;
    delete updates.userId;

    const updated = db.updateMember(member.id, updates);
    if (!updated) {
      throw new Error('Failed to update member.');
    }

    db.recordAuditLog({
      id: `aud_${Date.now()}`,
      actorId: staffUser.id,
      actorName: staffUser.fullName,
      actorRole: 'STAFF',
      action: 'STAFF_UPDATE_MEMBER_KYC',
      resource: 'members',
      resourceId: member.id,
      beforeState,
      afterState: updated,
      result: 'SUCCESS',
      ipAddress,
      userAgent,
      timestamp: new Date().toISOString(),
    });

    return updated;
  }

  public activateMember(
    id: string,
    staffUser: DbUser,
    ipAddress = '127.0.0.1',
    userAgent = 'Wabi SACCO Portal'
  ): DbMember {
    const member = this.getMemberByIdOrNo(id);
    const now = new Date().toISOString();

    const updated = db.updateMember(member.id, {
      status: 'ACTIVE',
      suspendedAt: null,
      suspendedReason: null,
    });

    if (!updated) throw new Error('Failed to activate member.');

    if (member.userId) {
      db.updateUser(member.userId, { status: 'ACTIVE', isActive: true });
    }

    db.recordAuditLog({
      id: `aud_${Date.now()}`,
      actorId: staffUser.id,
      actorName: staffUser.fullName,
      actorRole: 'STAFF',
      action: 'ACTIVATE_MEMBER',
      resource: 'members',
      resourceId: member.id,
      afterState: { status: 'ACTIVE' },
      result: 'SUCCESS',
      ipAddress,
      userAgent,
      timestamp: now,
    });

    return updated;
  }

  public suspendMember(
    id: string,
    reason: string,
    staffUser: DbUser,
    ipAddress = '127.0.0.1',
    userAgent = 'Wabi SACCO Portal'
  ): DbMember {
    if (!reason || !reason.trim()) {
      throw new Error('A valid reason is required to suspend a member.');
    }

    const member = this.getMemberByIdOrNo(id);
    const now = new Date().toISOString();

    const updated = db.updateMember(member.id, {
      status: 'SUSPENDED',
      suspendedAt: now,
      suspendedReason: reason.trim(),
    });

    if (!updated) throw new Error('Failed to suspend member.');

    if (member.userId) {
      db.updateUser(member.userId, { status: 'DEACTIVATED', isActive: false });
    }

    db.recordAuditLog({
      id: `aud_${Date.now()}`,
      actorId: staffUser.id,
      actorName: staffUser.fullName,
      actorRole: 'STAFF',
      action: 'SUSPEND_MEMBER',
      resource: 'members',
      resourceId: member.id,
      afterState: { status: 'SUSPENDED', reason: reason.trim() },
      result: 'SUCCESS',
      ipAddress,
      userAgent,
      timestamp: now,
    });

    return updated;
  }

  public terminateMember(
    id: string,
    reason: string,
    staffUser: DbUser,
    ipAddress = '127.0.0.1',
    userAgent = 'Wabi SACCO Portal'
  ): DbMember {
    if (!reason || !reason.trim()) {
      throw new Error('A valid reason is required to terminate membership.');
    }

    const member = this.getMemberByIdOrNo(id);
    const now = new Date().toISOString();

    const updated = db.updateMember(member.id, {
      status: 'TERMINATED',
      terminatedAt: now,
      terminatedReason: reason.trim(),
    });

    if (!updated) throw new Error('Failed to terminate member.');

    if (member.userId) {
      db.updateUser(member.userId, { status: 'DEACTIVATED', isActive: false });
    }

    db.recordAuditLog({
      id: `aud_${Date.now()}`,
      actorId: staffUser.id,
      actorName: staffUser.fullName,
      actorRole: 'STAFF',
      action: 'TERMINATE_MEMBER',
      resource: 'members',
      resourceId: member.id,
      afterState: { status: 'TERMINATED', reason: reason.trim() },
      result: 'SUCCESS',
      ipAddress,
      userAgent,
      timestamp: now,
    });

    return updated;
  }
}

export const memberService = new MemberService();
