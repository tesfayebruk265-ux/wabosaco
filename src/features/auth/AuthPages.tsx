import React, { useState } from 'react';
import { useNavigation } from '../../providers/NavigationProvider';
import { useToast } from '../../providers/ToastProvider';
import { ROUTES } from '../../constants/routes';
import { TextInput } from '../../components/common/TextInput';
import { SelectInput } from '../../components/common/SelectInput';
import { DateInput } from '../../components/common/DateInput';
import { FileUploadInput } from '../../components/common/FileUploadInput';
import { CheckboxInput } from '../../components/common/CheckboxInput';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/Alert';
import { memberApiService, RegisterMemberPayload } from '../../services/memberApiService';
import { formatCurrency } from '../../utils/formatters';
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Briefcase,
  Users as UsersIcon,
  Shield,
  CreditCard,
  FileText,
  AlertCircle,
  Copy,
  Search,
  Upload,
  RefreshCw,
  Eye,
  Lock,
} from 'lucide-react';

/* ==========================================================================
   MEMBER SELF-REGISTRATION (13-STEP / 5-STAGE REGISTRATION WIZARD)
   ========================================================================== */
export const RegisterPage: React.FC = () => {
  const { navigate } = useNavigation();
  const { success, error: toastError } = useToast();

  // Wizard Stage (1: Personal & Contact, 2: Address & Employment, 3: Family & Emergency, 4: Nominees & Referral, 5: Payment & Slip Upload, 6: Review & Declaration)
  const [stage, setStage] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

  // Form State
  const [formData, setFormData] = useState({
    // 1. Personal
    fullName: '',
    gender: 'MALE' as 'MALE' | 'FEMALE',
    dateOfBirth: '1995-06-15',
    nationalId: '',
    // 2. Contact & Auth
    phoneNumber: '+2519',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    // 3. Address
    region: 'Addis Ababa',
    zone: 'Bole Subcity',
    woreda: 'Woreda 03',
    kebele: 'Kebele 07',
    specificAddress: '',
    additionalInfo: '',
    // 4. Employment & Income
    occupation: '',
    employer: '',
    monthlyIncome: 35000,
    employmentType: 'Employed' as const,
    // 5. Family
    familyMembersCount: 2,
    // 6. Emergency Contact
    emergencyName: '',
    emergencyRelationship: 'Spouse',
    emergencyPhone: '+2519',
    emergencyAddress: '',
    // 7. Nominees
    nominees: [
      {
        fullName: '',
        relationship: 'Spouse',
        phone: '+2519',
        address: '',
        percentage: 100,
      },
    ],
    // 8. Referral
    referralType: 'Walk-in',
    referralMemberNo: '',
    referralInfo: '',
    // 9. Photo & Document
    profilePhotoUrl: '',
    // 10 & 11. Payment & Slip
    paymentMethod: 'CBE' as 'CBE' | 'Tsehay Bank' | 'Bank Transfer',
    referenceNumber: '',
    receiptUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect width="400" height="200" fill="%23f1f5f9"/><text x="50%25" y="45%25" dominant-baseline="middle" text-anchor="middle" fill="%230f172a" font-size="14" font-family="sans-serif" font-weight="bold">CBE Bank Transfer Slip</text><text x="50%25" y="65%25" dominant-baseline="middle" text-anchor="middle" fill="%232563eb" font-size="12" font-family="sans-serif">ETB 1,000.00 - Reg Fee</text></svg>',
    receiptDocumentId: '',
    // 12. Terms
    agreedToByLaws: false,
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedRef, setCompletedRef] = useState<string | null>(null);

  // Nominee helper
  const addNominee = () => {
    setFormData((prev) => ({
      ...prev,
      nominees: [
        ...prev.nominees,
        { fullName: '', relationship: 'Child', phone: '+2519', address: '', percentage: 0 },
      ],
    }));
  };

  const removeNominee = (index: number) => {
    if (formData.nominees.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      nominees: prev.nominees.filter((_, i) => i !== index),
    }));
  };

  const updateNominee = (index: number, field: string, value: any) => {
    setFormData((prev) => {
      const updated = [...prev.nominees];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, nominees: updated };
    });
  };

  const totalNomineePercentage = formData.nominees.reduce(
    (sum, n) => sum + (Number(n.percentage) || 0),
    0
  );

  const handleNextStage = () => {
    setError(null);

    // Stage 1: Personal & Contact Validation
    if (stage === 1) {
      if (!formData.fullName.trim()) return setError('Full Legal Name is required.');
      if (!formData.nationalId.trim()) return setError('National Kebele ID / Passport No. is required.');
      if (!formData.phoneNumber.trim() || formData.phoneNumber.length < 10) {
        return setError('A valid Ethiopian mobile phone number is required (+2519... or 09...).');
      }
      if (!formData.email.trim() || !formData.email.includes('@')) {
        return setError('A valid email address is required.');
      }
      if (!formData.username.trim() || formData.username.length < 3) {
        return setError('Username must be at least 3 characters.');
      }
      if (!formData.password || formData.password.length < 8) {
        return setError('Password must be at least 8 characters with upper, lower, number, and special character.');
      }
      if (formData.password !== formData.confirmPassword) {
        return setError('Passwords do not match.');
      }
      setStage(2);
      return;
    }

    // Stage 2: Address & Employment Validation
    if (stage === 2) {
      if (!formData.region.trim() || !formData.zone.trim() || !formData.woreda.trim() || !formData.kebele.trim()) {
        return setError('Region, Zone/Subcity, Woreda, and Kebele are all mandatory address fields.');
      }
      if (!formData.occupation.trim()) return setError('Primary occupation / profession is required.');
      if (Number(formData.monthlyIncome) < 0) return setError('Monthly income cannot be negative.');
      setStage(3);
      return;
    }

    // Stage 3: Family & Emergency Contact Validation
    if (stage === 3) {
      if (!formData.emergencyName.trim()) return setError('Emergency contact full name is required.');
      if (!formData.emergencyPhone.trim() || formData.emergencyPhone.length < 10) {
        return setError('Emergency contact phone number is required.');
      }
      setStage(4);
      return;
    }

    // Stage 4: Nominees & Referral Validation
    if (stage === 4) {
      for (let i = 0; i < formData.nominees.length; i++) {
        const nom = formData.nominees[i];
        if (!nom.fullName.trim()) return setError(`Nominee #${i + 1} full name is required.`);
        if (!nom.phone.trim()) return setError(`Nominee #${i + 1} phone number is required.`);
        if (Number(nom.percentage) <= 0 || Number(nom.percentage) > 100) {
          return setError(`Nominee #${i + 1} allocation percentage must be between 1% and 100%.`);
        }
      }
      if (totalNomineePercentage !== 100) {
        return setError(
          `Total nominee share allocation must equal exactly 100%. Current total is ${totalNomineePercentage}%.`
        );
      }
      setStage(5);
      return;
    }

    // Stage 5: Payment & Slip Upload Validation
    if (stage === 5) {
      if (!formData.referenceNumber.trim()) {
        return setError('Bank deposit / transfer reference / FT number is required.');
      }
      if (!formData.receiptUrl) {
        return setError('Please upload your bank deposit slip or mobile transfer receipt image.');
      }
      setStage(6);
      return;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agreedToByLaws) {
      setError('You must accept the Wabi SACCO By-Laws and Membership Declaration to complete registration.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: RegisterMemberPayload = {
        personalInfo: {
          fullName: formData.fullName.trim(),
          gender: formData.gender,
          dateOfBirth: formData.dateOfBirth,
          nationalId: formData.nationalId.trim(),
        },
        contactInfo: {
          phoneNumber: formData.phoneNumber.trim(),
          email: formData.email.trim(),
          username: formData.username.trim(),
          password: formData.password,
        },
        address: {
          region: formData.region.trim(),
          zone: formData.zone.trim(),
          woreda: formData.woreda.trim(),
          kebele: formData.kebele.trim(),
          specificAddress: formData.specificAddress.trim(),
          additionalInfo: formData.additionalInfo.trim(),
        },
        employment: {
          occupation: formData.occupation.trim(),
          employer: formData.employer.trim() || 'N/A',
          monthlyIncome: Number(formData.monthlyIncome),
          employmentType: formData.employmentType,
        },
        family: {
          familyMembersCount: Number(formData.familyMembersCount),
        },
        emergencyContact: {
          name: formData.emergencyName.trim(),
          relationship: formData.emergencyRelationship,
          phone: formData.emergencyPhone.trim(),
          address: formData.emergencyAddress.trim(),
        },
        nominees: formData.nominees.map((n) => ({
          fullName: n.fullName.trim(),
          relationship: n.relationship,
          phone: n.phone.trim(),
          address: n.address.trim(),
          percentage: Number(n.percentage),
        })),
        referral: {
          referralType: formData.referralType,
          referralMemberNo: formData.referralMemberNo.trim() || undefined,
          referralInfo: formData.referralInfo.trim() || undefined,
        },
        profilePhotoUrl: formData.profilePhotoUrl,
        payment: {
          paymentMethod: formData.paymentMethod,
          referenceNumber: formData.referenceNumber.trim(),
          receiptUrl: formData.receiptUrl,
        },
      };

      const res = await memberApiService.registerMember(payload);
      setCompletedRef(res.applicationReference);
      success('Application Submitted', `Application Reference ${res.applicationReference} received!`);
    } catch (err: any) {
      setError(err?.error?.message || err?.message || 'Failed to submit registration application.');
      toastError('Registration Failed', err?.error?.message || err?.message || 'Please check your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mock slip file upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData((prev) => ({
          ...prev,
          receiptUrl: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // SUCCESS COMPLETION SCREEN
  if (completedRef) {
    return (
      <div className="space-y-6 py-2 text-left">
        <div className="p-6 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Application Submitted!</h3>
              <p className="text-xs text-slate-600">Your membership application has been safely registered in the Wabi Core System.</p>
            </div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-emerald-200/80 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Application Reference:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-base text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {completedRef}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(completedRef);
                    success('Copied', 'Application Reference copied to clipboard.');
                  }}
                  className="p-1 hover:bg-slate-100 rounded text-slate-600"
                  title="Copy Reference"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-2">
              <span className="text-slate-500 font-medium">Applicant Name:</span>
              <span className="font-semibold text-slate-900">{formData.fullName}</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-2">
              <span className="text-slate-500 font-medium">Registration Fee Paid:</span>
              <span className="font-semibold text-slate-900">ETB 1,000.00 ({formData.paymentMethod})</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-2">
              <span className="text-slate-500 font-medium">Status:</span>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded text-[11px]">
                PENDING ACCOUNTANT VERIFICATION
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Our Accounting Department will verify your bank transfer reference against the bank ledger. Once verified, your official sequential <strong>Membership ID (e.g. WB000201)</strong> will be activated and you can sign in.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate(ROUTES.AUTH.LOGIN)}
              className="flex-1"
            >
              Go to Member Sign In
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                setCompletedRef(null);
                setStage(1);
              }}
            >
              Submit Another Application
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wizard Progress Indicator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
          <span className={stage === 1 ? 'text-blue-600 font-bold' : ''}>1. Identity</span>
          <span>•</span>
          <span className={stage === 2 ? 'text-blue-600 font-bold' : ''}>2. Residence</span>
          <span>•</span>
          <span className={stage === 3 ? 'text-blue-600 font-bold' : ''}>3. Emergency</span>
          <span>•</span>
          <span className={stage === 4 ? 'text-blue-600 font-bold' : ''}>4. Nominees</span>
          <span>•</span>
          <span className={stage === 5 ? 'text-blue-600 font-bold' : ''}>5. Payment</span>
          <span>•</span>
          <span className={stage === 6 ? 'text-blue-600 font-bold' : ''}>6. Review</span>
        </div>
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all duration-300 rounded-full"
            style={{ width: `${(stage / 6) * 100}%` }}
          />
        </div>
      </div>

      {error && (
        <Alert variant="error" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* STAGE 1: PERSONAL & CONTACT */}
      {stage === 1 && (
        <div className="space-y-4 text-left">
          <div className="border-b border-slate-100 pb-2">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" /> Step 1: Personal & Account Credentials
            </h4>
            <p className="text-xs text-slate-500">Provide legal identification and your desired login credentials.</p>
          </div>

          <TextInput
            label="Full Legal Name (as on Ethiopian ID)"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            placeholder="e.g. Dawit Yohannes Gizaw"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <DateInput
              label="Date of Birth"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              required
            />
            <SelectInput
              label="Gender"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
              options={[
                { value: 'MALE', label: 'Male' },
                { value: 'FEMALE', label: 'Female' },
              ]}
            />
          </div>

          <TextInput
            label="National ID / Kebele ID / Passport Number"
            value={formData.nationalId}
            onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
            placeholder="e.g. NAT-ETH-199508-3101"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextInput
              label="Mobile Phone (+2519...)"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              placeholder="+251911223344"
              required
            />
            <TextInput
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="dawit.y@example.com"
              required
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-blue-600" /> Web Portal Access Credentials
            </p>
            <TextInput
              label="Choose Username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="e.g. dawit.yohannes"
              required
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TextInput
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••••••"
                required
              />
              <TextInput
                label="Confirm Password"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="••••••••••••"
                required
              />
            </div>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={handleNextStage}
            className="w-full mt-2"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Next: Address & Employment
          </Button>
        </div>
      )}

      {/* STAGE 2: ADDRESS & EMPLOYMENT */}
      {stage === 2 && (
        <div className="space-y-4 text-left">
          <div className="border-b border-slate-100 pb-2">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" /> Step 2: Residential Address & Employment
            </h4>
            <p className="text-xs text-slate-500">Provide official residential and occupational details for KYC records.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <TextInput
              label="Region / City Administration"
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              placeholder="e.g. Addis Ababa"
              required
            />
            <TextInput
              label="Zone / Sub-City"
              value={formData.zone}
              onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
              placeholder="e.g. Bole Subcity"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <TextInput
              label="Woreda"
              value={formData.woreda}
              onChange={(e) => setFormData({ ...formData, woreda: e.target.value })}
              placeholder="e.g. Woreda 03"
              required
            />
            <TextInput
              label="Kebele"
              value={formData.kebele}
              onChange={(e) => setFormData({ ...formData, kebele: e.target.value })}
              placeholder="e.g. Kebele 07"
              required
            />
          </div>

          <TextInput
            label="House Number / Street Landmark"
            value={formData.specificAddress}
            onChange={(e) => setFormData({ ...formData, specificAddress: e.target.value })}
            placeholder="e.g. House No. 441, Near Medhanialem Mall"
          />

          <div className="border-t border-slate-100 pt-3 space-y-3">
            <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-blue-600" /> Occupation & Income
            </h5>

            <div className="grid grid-cols-2 gap-3">
              <TextInput
                label="Occupation / Title"
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                placeholder="e.g. Software Engineer"
                required
              />
              <SelectInput
                label="Employment Type"
                value={formData.employmentType}
                onChange={(e) => setFormData({ ...formData, employmentType: e.target.value as any })}
                options={[
                  { value: 'Employed', label: 'Employed' },
                  { value: 'Self-employed', label: 'Self-employed' },
                  { value: 'Business Owner', label: 'Business Owner' },
                  { value: 'Student', label: 'Student' },
                  { value: 'Other', label: 'Other' },
                ]}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <TextInput
                label="Employer / Company Name"
                value={formData.employer}
                onChange={(e) => setFormData({ ...formData, employer: e.target.value })}
                placeholder="e.g. Ethio Telecom"
              />
              <TextInput
                label="Monthly Income (ETB)"
                type="number"
                value={formData.monthlyIncome}
                onChange={(e) => setFormData({ ...formData, monthlyIncome: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" size="md" onClick={() => setStage(1)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
            <Button variant="primary" size="md" onClick={handleNextStage} className="flex-1" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Next: Family & Emergency
            </Button>
          </div>
        </div>
      )}

      {/* STAGE 3: FAMILY & EMERGENCY CONTACT */}
      {stage === 3 && (
        <div className="space-y-4 text-left">
          <div className="border-b border-slate-100 pb-2">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <UsersIcon className="w-4 h-4 text-blue-600" /> Step 3: Family & Emergency Contact
            </h4>
            <p className="text-xs text-slate-500">Provide household information and emergency contact reachability.</p>
          </div>

          <TextInput
            label="Total Household / Family Dependents Count"
            type="number"
            min={0}
            value={formData.familyMembersCount}
            onChange={(e) => setFormData({ ...formData, familyMembersCount: Number(e.target.value) })}
            required
          />

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-blue-600" /> Primary Emergency Contact
            </h5>

            <TextInput
              label="Emergency Contact Full Name"
              value={formData.emergencyName}
              onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value })}
              placeholder="e.g. Marta Worku Tadesse"
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <SelectInput
                label="Relationship"
                value={formData.emergencyRelationship}
                onChange={(e) => setFormData({ ...formData, emergencyRelationship: e.target.value })}
                options={[
                  { value: 'Spouse', label: 'Spouse' },
                  { value: 'Father', label: 'Father' },
                  { value: 'Mother', label: 'Mother' },
                  { value: 'Brother', label: 'Brother' },
                  { value: 'Sister', label: 'Sister' },
                  { value: 'Child', label: 'Child' },
                  { value: 'Friend', label: 'Friend / Colleague' },
                ]}
              />
              <TextInput
                label="Phone Number"
                value={formData.emergencyPhone}
                onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                placeholder="+251911..."
                required
              />
            </div>

            <TextInput
              label="Emergency Contact Residential Address"
              value={formData.emergencyAddress}
              onChange={(e) => setFormData({ ...formData, emergencyAddress: e.target.value })}
              placeholder="e.g. Kazanchis, Kirkos Subcity, House 882"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" size="md" onClick={() => setStage(2)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
            <Button variant="primary" size="md" onClick={handleNextStage} className="flex-1" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Next: Nominees Allocation
            </Button>
          </div>
        </div>
      )}

      {/* STAGE 4: NOMINEES ALLOCATION & REFERRAL */}
      {stage === 4 && (
        <div className="space-y-4 text-left">
          <div className="border-b border-slate-100 pb-2">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" /> Step 4: Nominee Beneficiaries (Exact 100% Allocation)
            </h4>
            <p className="text-xs text-slate-500">
              In accordance with Ethiopian SACCO Proclamation No. 985/2016, specify beneficiaries who receive savings/equity.
            </p>
          </div>

          {/* Allocation Bar */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span>Total Allocation:</span>
              <span className={totalNomineePercentage === 100 ? 'text-emerald-600' : 'text-rose-600'}>
                {totalNomineePercentage}% / 100% {totalNomineePercentage === 100 ? '✓ Valid' : '⚠️ Must Equal 100%'}
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  totalNomineePercentage === 100 ? 'bg-emerald-500' : totalNomineePercentage > 100 ? 'bg-rose-500' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(totalNomineePercentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Nominees List */}
          <div className="space-y-3">
            {formData.nominees.map((nom, idx) => (
              <div key={idx} className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Beneficiary #{idx + 1}</span>
                  {formData.nominees.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeNominee(idx)}
                      className="text-xs text-rose-600 hover:text-rose-700 font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <TextInput
                    label="Full Name"
                    value={nom.fullName}
                    onChange={(e) => updateNominee(idx, 'fullName', e.target.value)}
                    placeholder="e.g. Natnael Hailemariam"
                    required
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <SelectInput
                      label="Relationship"
                      value={nom.relationship}
                      onChange={(e) => updateNominee(idx, 'relationship', e.target.value)}
                      options={[
                        { value: 'Spouse', label: 'Spouse' },
                        { value: 'Child', label: 'Child' },
                        { value: 'Father', label: 'Father' },
                        { value: 'Mother', label: 'Mother' },
                        { value: 'Brother', label: 'Brother' },
                        { value: 'Sister', label: 'Sister' },
                        { value: 'Other', label: 'Other' },
                      ]}
                    />
                    <TextInput
                      label="Share %"
                      type="number"
                      min={1}
                      max={100}
                      value={nom.percentage}
                      onChange={(e) => updateNominee(idx, 'percentage', Number(e.target.value))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <TextInput
                    label="Phone Number"
                    value={nom.phone}
                    onChange={(e) => updateNominee(idx, 'phone', e.target.value)}
                    placeholder="+2519..."
                    required
                  />
                  <TextInput
                    label="Address (Optional)"
                    value={nom.address}
                    onChange={(e) => updateNominee(idx, 'address', e.target.value)}
                    placeholder="e.g. Bole Subcity Woreda 03"
                  />
                </div>
              </div>
            ))}

            <Button variant="secondary" size="sm" onClick={addNominee} className="w-full">
              + Add Another Beneficiary Nominee
            </Button>
          </div>

          {/* Referral Info */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <h5 className="font-bold text-slate-800">Referral Information (Optional)</h5>
            <div className="grid grid-cols-2 gap-2.5">
              <SelectInput
                label="Referral Source"
                value={formData.referralType}
                onChange={(e) => setFormData({ ...formData, referralType: e.target.value })}
                options={[
                  { value: 'Walk-in', label: 'Walk-in / Self' },
                  { value: 'Existing Member', label: 'Existing Member Referral' },
                  { value: 'Social Media', label: 'Social Media / Website' },
                  { value: 'Employer', label: 'Employer Group' },
                ]}
              />
              <TextInput
                label="Referral Member ID (if any)"
                value={formData.referralMemberNo}
                onChange={(e) => setFormData({ ...formData, referralMemberNo: e.target.value })}
                placeholder="e.g. WB000088"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" size="md" onClick={() => setStage(3)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
            <Button variant="primary" size="md" onClick={handleNextStage} className="flex-1" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Next: Payment & Deposit Slip
            </Button>
          </div>
        </div>
      )}

      {/* STAGE 5: PAYMENT & SLIP UPLOAD */}
      {stage === 5 && (
        <div className="space-y-4 text-left">
          <div className="border-b border-slate-100 pb-2">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-600" /> Step 5: Registration Fee & Bank Deposit Slip
            </h4>
            <p className="text-xs text-slate-500">Pay the non-refundable registration fee and upload your bank transfer slip.</p>
          </div>

          {/* Fee Card */}
          <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl space-y-2 text-xs text-blue-950">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm">Mandatory One-Time Registration Fee:</span>
              <span className="text-base font-black text-blue-700">ETB 1,000.00</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Please transfer exactly <strong>ETB 1,000.00</strong> to any of the official Wabi SACCO bank accounts below and enter your transaction FT reference number.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div className="p-2.5 bg-white rounded-lg border border-blue-200 space-y-0.5">
                <span className="font-bold text-slate-900">Commercial Bank of Ethiopia (CBE)</span>
                <p className="text-slate-600">A/C: <strong className="text-blue-700 font-mono">10001898762</strong></p>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-blue-200 space-y-0.5">
                <span className="font-bold text-slate-900">Tsehay Bank S.C.</span>
                <p className="text-slate-600">A/C: <strong className="text-blue-700 font-mono">2004558900</strong></p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SelectInput
              label="Bank Channel Paid Into"
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
              options={[
                { value: 'CBE', label: 'Commercial Bank of Ethiopia (CBE)' },
                { value: 'Tsehay Bank', label: 'Tsehay Bank' },
                { value: 'Bank Transfer', label: 'Other Inter-bank Transfer' },
              ]}
            />
            <TextInput
              label="Bank FT / Reference / Transaction No."
              value={formData.referenceNumber}
              onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
              placeholder="e.g. CBE-FT202608149921"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Upload Deposit Receipt / Screenshot (JPG, PNG, PDF)
            </label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileUpload}
              className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
            {formData.receiptUrl && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <span className="text-[11px] font-bold text-slate-600">Uploaded Receipt Slip Preview:</span>
                <div className="max-h-40 overflow-hidden rounded border border-slate-200 bg-white flex items-center justify-center p-1">
                  <img src={formData.receiptUrl} alt="Deposit Slip" className="max-h-36 object-contain" />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" size="md" onClick={() => setStage(4)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
            <Button variant="primary" size="md" onClick={handleNextStage} className="flex-1" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Next: Review & Confirm
            </Button>
          </div>
        </div>
      )}

      {/* STAGE 6: REVIEW & DECLARATION */}
      {stage === 6 && (
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="border-b border-slate-100 pb-2">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" /> Step 6: Review & Membership Declaration
            </h4>
            <p className="text-xs text-slate-500">Please review all submitted information before final submission.</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Applicant Legal Name:</span>
              <span className="font-bold text-slate-900">{formData.fullName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500 font-medium">National / Kebele ID:</span>
              <span className="font-semibold text-slate-900">{formData.nationalId}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Phone & Email:</span>
              <span className="font-semibold text-slate-900">{formData.phoneNumber} • {formData.email}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Address:</span>
              <span className="font-semibold text-slate-900">{formData.region}, {formData.zone}, {formData.woreda}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Nominees:</span>
              <span className="font-semibold text-slate-900">
                {formData.nominees.map((n) => `${n.fullName} (${n.percentage}%)`).join(', ')}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Bank Reference FT No:</span>
              <span className="font-mono font-bold text-blue-700">{formData.referenceNumber}</span>
            </div>
            <div className="flex justify-between py-1 text-sm font-bold text-slate-900 pt-1">
              <span>Registration Fee:</span>
              <span className="text-emerald-700 font-black">ETB 1,000.00</span>
            </div>
          </div>

          <CheckboxInput
            label="I accept Wabi SACCO By-Laws & Membership Declaration"
            description="I certify that all details provided are accurate and authorize Wabi SACCO Accountants to verify my payment."
            checked={formData.agreedToByLaws}
            onChange={(e) => setFormData({ ...formData, agreedToByLaws: e.target.checked })}
          />

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" size="md" onClick={() => setStage(5)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={isSubmitting} className="flex-1">
              Submit Membership Application
            </Button>
          </div>
        </form>
      )}

      <div className="pt-2 text-center flex items-center justify-between text-xs font-semibold text-slate-500">
        <button
          type="button"
          onClick={() => navigate(ROUTES.AUTH.LOGIN)}
          className="hover:text-slate-900"
        >
          ← Back to Sign In
        </button>
        <button
          type="button"
          onClick={() => navigate(ROUTES.AUTH.FORGOT_PASSWORD)}
          className="hover:text-slate-900"
        >
          Track Application Status →
        </button>
      </div>
    </div>
  );
};

/* ==========================================================================
   APPLICATION STATUS TRACKER & RE-UPLOAD RECEIPT VIEW
   ========================================================================== */
export const ForgotPasswordPage: React.FC = () => {
  const { navigate } = useNavigation();
  const { success, error: toastError } = useToast();

  const [referenceInput, setReferenceInput] = useState('APP-2026-000101');
  const [isSearching, setIsSearching] = useState(false);
  const [appStatus, setAppStatus] = useState<any | null>(null);

  // Re-upload form state
  const [reuploadMethod, setReuploadMethod] = useState<'CBE' | 'Tsehay Bank' | 'Bank Transfer'>('CBE');
  const [reuploadRef, setReuploadRef] = useState('');
  const [reuploadUrl, setReuploadUrl] = useState('');
  const [isReuploading, setIsReuploading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referenceInput.trim()) return;

    setIsSearching(true);
    try {
      const res = await memberApiService.getRegistrationStatus(referenceInput.trim());
      setAppStatus(res.data);
      success('Status Retrieved', `Found application ${res.data.applicationReference}`);
    } catch (err: any) {
      toastError('Not Found', err?.error?.message || err?.message || 'Application reference not found.');
      setAppStatus(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleReuploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reuploadRef.trim() || !reuploadUrl) {
      toastError('Missing Fields', 'Please provide a valid bank reference and uploaded receipt slip.');
      return;
    }

    setIsReuploading(true);
    try {
      await memberApiService.reuploadReceipt(appStatus.applicationReference, {
        paymentMethod: reuploadMethod,
        referenceNumber: reuploadRef.trim(),
        receiptUrl: reuploadUrl,
      });
      success('Slip Uploaded', 'Your replacement deposit receipt was received and is under accountant review.');
      // Refresh status
      const refreshed = await memberApiService.getRegistrationStatus(appStatus.applicationReference);
      setAppStatus(refreshed.data);
    } catch (err: any) {
      toastError('Upload Failed', err?.error?.message || err?.message || 'Could not re-upload receipt.');
    } finally {
      setIsReuploading(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="border-b border-slate-100 pb-2">
        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Search className="w-4 h-4 text-blue-600" /> Track Application / Re-upload Receipt
        </h4>
        <p className="text-xs text-slate-500">
          Enter your Application Reference (e.g. APP-2026-000101) or National ID to check your membership activation status.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <TextInput
          label="Application Reference or National ID"
          value={referenceInput}
          onChange={(e) => setReferenceInput(e.target.value)}
          placeholder="APP-2026-XXXXXX"
          required
          className="flex-1"
        />
        <div className="pt-6">
          <Button type="submit" variant="primary" size="md" isLoading={isSearching}>
            Track
          </Button>
        </div>
      </form>

      {appStatus && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4 text-xs animate-in fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <span className="text-slate-500">Application Reference:</span>
              <p className="font-mono font-bold text-sm text-slate-900">{appStatus.applicationReference}</p>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                appStatus.status === 'APPROVED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : appStatus.status === 'REJECTED'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {appStatus.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-slate-700">
            <div>
              <span className="text-slate-400">Applicant:</span>
              <p className="font-semibold text-slate-900">{appStatus.personalInfo?.fullName}</p>
            </div>
            <div>
              <span className="text-slate-400">National ID:</span>
              <p className="font-semibold text-slate-900">{appStatus.personalInfo?.nationalId}</p>
            </div>
          </div>

          {/* APPROVED STATE */}
          {appStatus.status === 'APPROVED' && (
            <div className="p-3 bg-emerald-100/70 border border-emerald-300 rounded-lg space-y-2">
              <p className="font-bold text-emerald-950 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Membership Approved & Active!
              </p>
              <p className="text-emerald-900">
                Official Membership ID: <strong className="font-mono text-base text-emerald-950">{appStatus.membershipNo}</strong>
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate(ROUTES.AUTH.LOGIN)}
                className="w-full mt-1"
              >
                Sign In With Your Membership ID
              </Button>
            </div>
          )}

          {/* REJECTED STATE -> RE-UPLOAD FORM */}
          {appStatus.status === 'REJECTED' && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-3">
              <div className="flex items-start gap-2 text-rose-950">
                <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold">Receipt Rejected by Accountant:</p>
                  <p className="text-rose-900 italic font-medium">"{appStatus.rejectionReason || 'Invalid receipt reference'}"</p>
                </div>
              </div>

              <form onSubmit={handleReuploadSubmit} className="p-3 bg-white border border-rose-200 rounded-lg space-y-2.5">
                <h5 className="font-bold text-slate-900 text-xs">Re-upload Corrected Deposit Receipt</h5>
                <div className="grid grid-cols-2 gap-2">
                  <SelectInput
                    label="Bank Channel"
                    value={reuploadMethod}
                    onChange={(e) => setReuploadMethod(e.target.value as any)}
                    options={[
                      { value: 'CBE', label: 'CBE' },
                      { value: 'Tsehay Bank', label: 'Tsehay Bank' },
                      { value: 'Bank Transfer', label: 'Bank Transfer' },
                    ]}
                  />
                  <TextInput
                    label="Correct FT Reference No."
                    value={reuploadRef}
                    onChange={(e) => setReuploadRef(e.target.value)}
                    placeholder="e.g. CBE-FT2026..."
                    required
                  />
                </div>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const r = new FileReader();
                      r.onload = () => setReuploadUrl(r.result as string);
                      r.readAsDataURL(file);
                    }
                  }}
                  className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 cursor-pointer"
                />
                <Button type="submit" variant="primary" size="sm" isLoading={isReuploading} className="w-full mt-1">
                  Submit Replacement Slip
                </Button>
              </form>
            </div>
          )}

          {/* PENDING STATE */}
          {appStatus.status === 'PENDING' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-950 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-amber-600 animate-spin" /> In Accountant Verification Queue
              </p>
              <p className="text-slate-600">
                Your deposit slip is queued for verification. Verification is usually completed within regular business hours.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="text-center pt-2">
        <button
          type="button"
          onClick={() => navigate(ROUTES.AUTH.LOGIN)}
          className="text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          Back to Login Portal
        </button>
      </div>
    </div>
  );
};

export const ResetPasswordPage: React.FC = () => {
  const { navigate } = useNavigation();
  const { success } = useToast();
  const [otpCode, setOtpCode] = useState('123456');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    success('Password Updated', 'Your security credentials have been updated.');
    navigate(ROUTES.AUTH.LOGIN);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <TextInput
        label="6-Digit SMS / Email OTP Code"
        value={otpCode}
        onChange={(e) => setOtpCode(e.target.value)}
        placeholder="123456"
        required
      />

      <TextInput
        label="New Secure Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••••••"
        required
      />

      <TextInput
        label="Confirm New Password"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="••••••••••••"
        required
      />

      <Button type="submit" variant="primary" size="md" className="w-full">
        Save & Login
      </Button>
    </form>
  );
};
