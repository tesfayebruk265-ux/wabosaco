// Comprehensive English & Amharic (አማርኛ) Localization Dictionary for Wabi SACCO Society

export type SupportedLanguage = 'en' | 'am';

export interface TranslationDictionary {
  // Common / Global UI
  app_name: string;
  app_legal_name: string;
  slogan: string;
  tagline: string;
  licensed_badge: string;
  bank_clearance_badge: string;
  par_value_badge: string;
  currency_name: string;
  login: string;
  register: string;
  member_portal: string;
  staff_portal: string;
  logout: string;
  home: string;
  about: string;
  savings: string;
  loans: string;
  membership: string;
  contact: string;
  faq: string;
  terms: string;
  privacy: string;
  view_all: string;
  back: string;
  submit: string;
  cancel: string;
  save: string;
  search: string;
  filter: string;
  status: string;
  date: string;
  amount: string;
  balance: string;
  actions: string;
  download_pdf: string;
  verified: string;
  pending: string;
  approved: string;
  rejected: string;
  quick_lookup: string;
  dark_mode: string;
  light_mode: string;
  system_theme: string;
  toggle_theme: string;

  // Public Layout & Footer
  footer_desc: string;
  quick_links: string;
  financial_products: string;
  headquarters: string;
  newsletter_title: string;
  newsletter_desc: string;
  subscribe: string;
  subscribed_msg: string;
  copyright: string;
  deposit_channels: string;

  // Landing Page Hero
  hero_badge: string;
  hero_title_prefix: string;
  hero_title_highlight: string;
  hero_title_suffix: string;
  hero_description: string;
  hero_cta_join: string;
  hero_cta_calc: string;
  stat_yield_label: string;
  stat_mult_label: string;
  stat_share_label: string;

  // Digital Passbook Card
  passbook_card_title: string;
  passbook_verified: string;
  passbook_accumulated_bal: string;
  passbook_compulsory_bal: string;
  passbook_voluntary_bal: string;
  passbook_shares_title: string;
  passbook_shares_sub: string;
  passbook_credit_limit_title: string;
  passbook_instant_approved: string;
  passbook_login_btn: string;

  // Calculator Section
  calc_badge: string;
  calc_title: string;
  calc_desc: string;
  calc_tab_savings: string;
  calc_tab_loans: string;
  calc_monthly_contrib: string;
  calc_savings_duration: string;
  calc_scheme_label: string;
  calc_scheme_regular: string;
  calc_scheme_voluntary: string;
  calc_scheme_fixed: string;
  calc_proj_maturity: string;
  calc_total_deposited: string;
  calc_interest_gain: string;
  calc_effective_growth: string;
  calc_start_saving_btn: string;

  calc_loan_base: string;
  calc_loan_term: string;
  calc_loan_category: string;
  calc_loan_cat_emergency: string;
  calc_loan_cat_business: string;
  calc_loan_cat_asset: string;
  calc_loan_multiplier_result: string;
  calc_loan_monthly_inst: string;
  calc_loan_total_interest: string;
  calc_loan_req_months: string;
  calc_loan_view_guide_btn: string;

  // Institutional Pillars
  pillars_title: string;
  pillars_desc: string;
  pillar_1_title: string;
  pillar_1_desc: string;
  pillar_2_title: string;
  pillar_2_desc: string;
  pillar_3_title: string;
  pillar_3_desc: string;
  pillar_4_title: string;
  pillar_4_desc: string;

  // Onboarding Roadmap
  onboarding_title: string;
  onboarding_desc: string;
  onboarding_step1_title: string;
  onboarding_step1_desc: string;
  onboarding_step2_title: string;
  onboarding_step2_desc: string;
  onboarding_step3_title: string;
  onboarding_step3_desc: string;
  onboarding_cta_btn: string;

  // Landing FAQ & CTA Banner
  faq_heading: string;
  faq_subheading: string;
  cta_banner_active_members: string;
  cta_banner_title: string;
  cta_banner_desc: string;
  cta_banner_open_btn: string;
  cta_banner_contact_btn: string;

  // About Page
  about_badge: string;
  about_title: string;
  about_subtitle: string;
  mission_title: string;
  mission_desc: string;
  vision_title: string;
  vision_desc: string;
  values_title: string;
  values_desc: string;
  milestones_title: string;
  governance_title: string;
  governance_desc: string;
  about_cta_title: string;
  about_cta_desc: string;
  about_cta_btn: string;

  // Savings Page
  savings_hero_badge: string;
  savings_hero_title: string;
  savings_hero_desc: string;
  savings_open_btn: string;
  bank_accounts_title: string;
  bank_accounts_desc: string;

  // Loans Page
  loans_hero_badge: string;
  loans_hero_title: string;
  loans_hero_desc: string;
  loan_policy_title: string;
  loan_policy_desc: string;
  loan_max_duration: string;
  loan_multiplier_label: string;
  loan_check_eligibility: string;

  // Membership Info Page
  membership_hero_badge: string;
  membership_hero_title: string;
  membership_hero_desc: string;
  capital_req_title: string;
  reg_fee_label: string;
  reg_fee_sub: string;
  equity_shares_label: string;
  equity_shares_sub: string;
  first_month_savings_label: string;
  first_month_savings_sub: string;
  total_initial_capital: string;
  kyc_docs_title: string;
  start_reg_btn: string;

  // Contact Page
  contact_hero_badge: string;
  contact_hero_title: string;
  contact_hero_desc: string;
  contact_hq_title: string;
  contact_phone_label: string;
  contact_email_label: string;
  contact_hours_label: string;
  contact_hours_val: string;
  contact_form_title: string;
  contact_form_desc: string;
  contact_form_name: string;
  contact_form_phone: string;
  contact_form_email: string;
  contact_form_subject: string;
  contact_form_message: string;
  contact_form_send_btn: string;
  contact_form_success_title: string;
  contact_form_success_desc: string;

  // FAQ Page
  faq_hero_badge: string;
  faq_hero_title: string;
  faq_hero_desc: string;
  faq_search_placeholder: string;
  faq_cat_all: string;
  faq_cat_savings: string;
  faq_cat_loans: string;
  faq_cat_membership: string;
  faq_cat_payments: string;

  // Terms Page
  terms_badge: string;
  terms_title: string;
  terms_version: string;
  terms_sec1_title: string;
  terms_sec2_title: string;
  terms_sec3_title: string;
  terms_sec4_title: string;
  terms_sec5_title: string;

  // Privacy Page
  privacy_badge: string;
  privacy_title: string;
  privacy_version: string;
  privacy_sec1_title: string;
  privacy_sec2_title: string;
  privacy_sec3_title: string;
  privacy_sec4_title: string;
  privacy_sec5_title: string;

  // Auth Pages
  auth_login_title: string;
  auth_login_desc: string;
  auth_email_or_phone: string;
  auth_password: string;
  auth_forgot_password: string;
  auth_signin_btn: string;
  auth_no_account: string;
  auth_register_now: string;
  auth_register_title: string;
  auth_register_desc: string;
  auth_have_account: string;

  // Member Portal & Workstation Common
  member_dashboard: string;
  my_savings: string;
  my_shares: string;
  my_loans: string;
  digital_passbook: string;
  transactions_history: string;
  my_profile: string;
  notifications: string;
  support_desk: string;
  account_overview: string;
  total_savings_balance: string;
  active_loan_balance: string;
  share_capital_balance: string;
  monthly_interest_accrued: string;
  deposit_funds: string;
  apply_for_loan: string;
  buy_more_shares: string;
  download_statement: string;
}

export const TRANSLATIONS: Record<SupportedLanguage, TranslationDictionary> = {
  en: {
    app_name: 'Wabi SACCO',
    app_legal_name: 'Wabi Savings and Credit Cooperative Society Ltd.',
    slogan: 'Ethical Wealth Growth & Modern Cooperative Finance for Ethiopia',
    tagline: 'Empowering Communities Through Digital Cooperative Banking',
    licensed_badge: 'Federal Cooperative Agency Licensed & Regulated',
    bank_clearance_badge: 'Direct CBE & Tsehay Bank Deposit Clearance',
    par_value_badge: 'Core Share Par Value: ETB 500.00',
    currency_name: 'ETB / Ethiopian Birr',
    login: 'Sign In',
    register: 'Open Account',
    member_portal: 'Member Portal',
    staff_portal: 'Staff Portal',
    logout: 'Log Out',
    home: 'Home',
    about: 'About Us',
    savings: 'Savings Products',
    loans: 'Loan Products',
    membership: 'Membership',
    contact: 'Contact',
    faq: 'FAQ',
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
    view_all: 'View All',
    back: 'Back',
    submit: 'Submit',
    cancel: 'Cancel',
    save: 'Save Changes',
    search: 'Search...',
    filter: 'Filter',
    status: 'Status',
    date: 'Date',
    amount: 'Amount',
    balance: 'Balance',
    actions: 'Actions',
    download_pdf: 'Download PDF',
    verified: 'Verified Active',
    pending: 'Pending Approval',
    approved: 'Approved',
    rejected: 'Rejected',
    quick_lookup: 'Quick Lookup (Member / Txn)...',

    footer_desc: 'Wabi Savings and Credit Cooperative Society (SACCO) is a member-owned, licensed, and regulated financial institution committed to ethical savings compounding, 4.0× credit access, and modern digital passbooks.',
    quick_links: 'Quick Navigation',
    financial_products: 'Financial Products',
    headquarters: 'Headquarters & Support',
    newsletter_title: 'SACCO Member Bulletin',
    newsletter_desc: 'Subscribe to receive annual General Assembly dividends, statutory audits, and cooperative policy updates.',
    subscribe: 'Subscribe',
    subscribed_msg: 'Thank you! You have successfully subscribed to the SACCO Bulletin.',
    copyright: 'All rights reserved. Regulated under Federal Cooperative Proclamation 985/2016.',
    deposit_channels: 'Authorized Commercial Deposit Channels',

    hero_badge: 'Next-Generation Ethiopian Cooperative Banking',
    hero_title_prefix: 'Ethical Wealth Growth & Modern',
    hero_title_highlight: 'Cooperative Finance',
    hero_title_suffix: 'for Ethiopia.',
    hero_description: 'Wabi SACCO combines member solidarity with institutional digital rigor. Enjoy competitive compound savings yields (12.5%–15.0%), transparent 4.0× credit multipliers, and real-time digital passbooks — 100% compliant with Federal Cooperative guidelines.',
    hero_cta_join: 'Join Wabi SACCO',
    hero_cta_calc: 'Try Growth Calculator',
    stat_yield_label: 'Annual Savings Yield',
    stat_mult_label: 'Credit Multiplier',
    stat_share_label: 'Share Par Value',

    passbook_card_title: 'Wabi SACCO Digital Passbook',
    passbook_verified: 'VERIFIED ACTIVE',
    passbook_accumulated_bal: 'Total Accumulated Balance',
    passbook_compulsory_bal: 'Regular Compulsory',
    passbook_voluntary_bal: 'Voluntary Demand',
    passbook_shares_title: 'Equity Shares (Par 500)',
    passbook_shares_sub: 'Equity Ownership',
    passbook_credit_limit_title: '4.0× Credit Limit',
    passbook_instant_approved: 'Instant Pre-Approved',
    passbook_login_btn: 'Sign In to Your Member Portal',

    calc_badge: 'Interactive Financial Modeling Tool',
    calc_title: 'Calculate Your Growth & Loan Eligibility',
    calc_desc: 'Experience the mathematical power of cooperative compounding and our 4.0× credit multiplier.',
    calc_tab_savings: 'Compound Savings Growth',
    calc_tab_loans: '4.0× Loan Multiplier & Repayment',
    calc_monthly_contrib: 'Monthly Contribution (ETB)',
    calc_savings_duration: 'Savings Duration (Years)',
    calc_scheme_label: 'Savings Product Scheme',
    calc_scheme_regular: 'Regular (12.5%)',
    calc_scheme_voluntary: 'Voluntary (13.5%)',
    calc_scheme_fixed: 'Fixed Term (15.0%)',
    calc_proj_maturity: 'Projected Maturity Value',
    calc_total_deposited: 'Total Principal Deposited:',
    calc_interest_gain: 'Compound Interest Gain:',
    calc_effective_growth: 'Effective Growth:',
    calc_start_saving_btn: 'Start Saving Today',

    calc_loan_base: 'Compulsory Savings Base (ETB)',
    calc_loan_term: 'Repayment Duration (Months)',
    calc_loan_category: 'Loan Category',
    calc_loan_cat_emergency: 'Emergency (12.0%)',
    calc_loan_cat_business: 'Business (13.5%)',
    calc_loan_cat_asset: 'Asset/Vehicle (14.0%)',
    calc_loan_multiplier_result: 'Eligible Credit Multiplier (4.0×)',
    calc_loan_monthly_inst: 'Monthly Amortized Installment:',
    calc_loan_total_interest: 'Total Interest Payable:',
    calc_loan_req_months: 'Required Savings Months:',
    calc_loan_view_guide_btn: 'View Loan Guidelines',

    pillars_title: 'Four Pillars of Financial Security',
    pillars_desc: 'Designed with strict cooperative principles, dual-control governance, and transparent interest accruals.',
    pillar_1_title: 'Compulsory Regular Savings',
    pillar_1_desc: 'Mandatory monthly deposits (min. ETB 500) that serve as your foundational collateral for 4.0× credit multipliers.',
    pillar_2_title: 'Voluntary Liquid Savings',
    pillar_2_desc: 'High-yield flexible demand savings. Deposit anytime via CBE Birr or Tsehay Bank with 3-day liquidity notice protection.',
    pillar_3_title: 'Affordable Credit Lines',
    pillar_3_desc: 'Low-interest emergency, business development, and asset loans with transparent French amortization schedules.',
    pillar_4_title: 'Double-Entry Ledger',
    pillar_4_desc: 'Immutable General Ledger journals and full maker-checker dual authorization protecting all institutional funds.',

    onboarding_title: 'Join in Three Seamless Steps',
    onboarding_desc: 'Digital membership registration without long branch queues.',
    onboarding_step1_title: 'Submit Online KYC Registration',
    onboarding_step1_desc: 'Provide your National ID / Passport, Kebele residence information, employer details, and designated nominees via our secure form.',
    onboarding_step2_title: 'Deposit Initial Shares & Fee',
    onboarding_step2_desc: 'Deposit the registration fee (ETB 1,000) and statutory minimum shares (5 shares @ ETB 500 = ETB 2,500) via CBE or Tsehay Bank slip.',
    onboarding_step3_title: 'Access Portal & 4.0× Loans',
    onboarding_step3_desc: 'Receive instant portal credentials, download signed digital passbooks, track daily interest accruals, and apply for loan multipliers.',
    onboarding_cta_btn: 'Start Member Registration Now',

    faq_heading: 'Frequently Asked Questions',
    faq_subheading: 'Clear, transparent answers on membership covenants, credit policies, and deposit clearances.',
    cta_banner_active_members: 'Over 15,000+ Active Members Across Ethiopia',
    cta_banner_title: 'Build Your Financial Future with Wabi SACCO Society Today.',
    cta_banner_desc: 'Join the cooperative movement that puts member growth, ethical interest returns, and digital transparency first.',
    cta_banner_open_btn: 'Open Your Member Account',
    cta_banner_contact_btn: 'Contact Head Office',

    about_badge: 'Institutional Overview',
    about_title: 'Building Shared Prosperity Through Cooperative Integrity',
    about_subtitle: 'Wabi SACCO is a premier member-owned financial institution serving over 15,000 active members across Ethiopia with institutional transparency and technological excellence.',
    mission_title: 'Our Mission',
    mission_desc: 'To provide accessible, ethical, and high-yield financial savings and credit services through cooperative solidarity and modern technological rigor.',
    vision_title: 'Our Vision',
    vision_desc: 'To be Ethiopia\'s most trustworthy, resilient, and digitally advanced Savings and Credit Cooperative Society by 2030.',
    values_title: 'Core Values',
    values_desc: 'Transparency, Member Supremacy, Accountability, Financial Prudence, Equal Voice, and Continuous Innovation.',
    milestones_title: 'Cooperative Milestones',
    governance_title: 'Board of Directors & Governance',
    governance_desc: 'Elected by the General Assembly under strict cooperative democratic principles (One Member, One Vote).',
    about_cta_title: 'Ready to participate in our cooperative?',
    about_cta_desc: 'Open your member account online in under 5 minutes.',
    about_cta_btn: 'Become a Member',

    savings_hero_badge: 'Guaranteed Compounding Growth',
    savings_hero_title: 'Cooperative Savings Products',
    savings_hero_desc: 'Transparent interest rates, zero hidden ledger maintenance deductions, and full auditability backed by Federal Cooperative laws.',
    savings_open_btn: 'Open Account',
    bank_accounts_title: 'Official Institutional Bank Accounts for Deposits',
    bank_accounts_desc: 'Deposit via Commercial Bank of Ethiopia (CBE A/C: 1000123456789) or Tsehay Bank (A/C: 2000987654321). Upload your transaction slip in your portal for instant clearance.',

    loans_hero_badge: 'Cooperative Credit Facilities',
    loans_hero_title: 'Fair & Transparent Loan Products',
    loans_hero_desc: 'Empowering member investments through our standard 4.0× credit multiplier with straightforward French amortization.',
    loan_policy_title: 'Cooperative Credit Covenant: 4-Month Savings Rule',
    loan_policy_desc: 'To protect cooperative solvency, loan applicants must maintain an active membership with at least 4 consecutive months of regular compulsory savings contributions (min. ETB 500/month). Your approved credit ceiling is calculated as 4.0× your total accumulated compulsory savings.',
    loan_max_duration: 'Max Duration:',
    loan_multiplier_label: 'Multiplier:',
    loan_check_eligibility: 'Check Eligibility',

    membership_hero_badge: 'Member Onboarding',
    membership_hero_title: 'Membership Requirements & Steps',
    membership_hero_desc: 'Become a co-owner of Wabi SACCO Society with equal voting rights and institutional dividend participation.',
    capital_req_title: 'Mandatory Initial Capital Requirement',
    reg_fee_label: '1. Registration Fee',
    reg_fee_sub: 'One-time administrative onboarding fee',
    equity_shares_label: '2. Statutory Equity Shares',
    equity_shares_sub: '5 Shares @ ETB 500 par value (Earns Dividends)',
    first_month_savings_label: '3. First Month Savings',
    first_month_savings_sub: 'Monthly compulsory recurring deposit',
    total_initial_capital: 'Total initial capital required to activate full membership:',
    kyc_docs_title: 'Required KYC Identification Documents',
    start_reg_btn: 'Start Your Membership Registration',

    contact_hero_badge: 'Member Support & Branches',
    contact_hero_title: 'Contact Wabi SACCO Society',
    contact_hero_desc: 'Our member service desk and accounting team are available to assist with deposit reconciliations, loan consultations, and general inquiries.',
    contact_hq_title: 'Headquarters Office',
    contact_phone_label: 'Member Services Hotline',
    contact_email_label: 'Official Correspondence',
    contact_hours_label: 'Working Hours',
    contact_hours_val: 'Mon – Fri: 8:00 AM – 5:00 PM | Saturday: 8:00 AM – 12:30 PM (EAT)',
    contact_form_title: 'Send an Inquiry',
    contact_form_desc: 'Our support team responds within 1 business day.',
    contact_form_name: 'Full Legal Name *',
    contact_form_phone: 'Phone Number *',
    contact_form_email: 'Email Address',
    contact_form_subject: 'Inquiry Subject *',
    contact_form_message: 'Your Message *',
    contact_form_send_btn: 'Submit Inquiry',
    contact_form_success_title: 'Inquiry Transmitted Successfully',
    contact_form_success_desc: 'Thank you for contacting Wabi SACCO. A member service representative will reach out to you shortly.',

    faq_hero_badge: 'Knowledge Base',
    faq_hero_title: 'Frequently Asked Questions',
    faq_hero_desc: 'Everything you need to know about cooperative accounts, loan multipliers, and banking operations.',
    faq_search_placeholder: 'Search questions (e.g. 4.0x multiplier, CBE deposit, interest)...',
    faq_cat_all: 'ALL',
    faq_cat_savings: 'SAVINGS',
    faq_cat_loans: 'LOANS',
    faq_cat_membership: 'MEMBERSHIP',
    faq_cat_payments: 'PAYMENTS',

    terms_badge: 'Institutional By-Laws & Legal Framework',
    terms_title: 'Wabi SACCO Terms of Membership & Service',
    terms_version: 'Effective Version: 2026.1 • Approved by the General Assembly & Board of Directors',
    terms_sec1_title: '1. Membership Qualification & Admission',
    terms_sec2_title: '2. Savings Accounts & Interest Accrual',
    terms_sec3_title: '3. Loan Origination & Multiplier Covenants',
    terms_sec4_title: '4. Deposit Slip Verification & Audit',
    terms_sec5_title: '5. Termination of Membership',

    privacy_badge: 'Data Protection & Privacy Policy',
    privacy_title: 'Wabi SACCO Privacy Policy',
    privacy_version: 'Compliance: Ethiopian Federal Data Protection & Financial Privacy Directives',
    privacy_sec1_title: '1. Information We Collect',
    privacy_sec2_title: '2. Purpose of Data Processing',
    privacy_sec3_title: '3. Information Security & Encryption',
    privacy_sec4_title: '4. Third-Party Disclosures',
    privacy_sec5_title: '5. Member Rights & Data Access',

    auth_login_title: 'Sign In to Your Account',
    auth_login_desc: 'Access your savings, loans, passbook, and financial statements.',
    auth_email_or_phone: 'Email Address or Phone Number',
    auth_password: 'Password',
    auth_forgot_password: 'Forgot Password?',
    auth_signin_btn: 'Sign In to Portal',
    auth_no_account: "Don't have a member account?",
    auth_register_now: 'Register as a New Member',
    auth_register_title: 'Open Your SACCO Member Account',
    auth_register_desc: 'Join over 15,000+ members and start building ethical wealth.',
    auth_have_account: 'Already an active member? Sign In',

    member_dashboard: 'Member Dashboard',
    my_savings: 'My Savings Portfolio',
    my_shares: 'My Equity Shares',
    my_loans: 'My Loans & Credit',
    digital_passbook: 'Digital Passbook',
    transactions_history: 'Transaction History',
    my_profile: 'My Profile & KYC',
    notifications: 'Notifications',
    support_desk: 'Support Desk',
    account_overview: 'Account Overview',
    total_savings_balance: 'Total Savings Balance',
    active_loan_balance: 'Active Loan Balance',
    share_capital_balance: 'Share Capital Balance',
    monthly_interest_accrued: 'Monthly Interest Accrued',
    deposit_funds: 'Deposit Funds',
    apply_for_loan: 'Apply for Loan',
    buy_more_shares: 'Purchase Shares',
    download_statement: 'Download Statement',
    dark_mode: 'Dark Mode',
    light_mode: 'Light Mode',
    system_theme: 'System Default',
    toggle_theme: 'Toggle Theme',
  },

  am: {
    app_name: 'ዋቢ ሣኮ',
    app_legal_name: 'ዋቢ የገንዘብ ቁጠባና ብድር ኅብረት ሥራ ማህበር ኃ/የተ/የግ/ማ',
    slogan: 'ፍትሐዊ የሀብት ዕድገት እና ዘመናዊ የኅብረት ሥራ ፋይናንስ ለኢትዮጵያ',
    tagline: 'ማህበረሰብን በዲጂታል የኅብረት ሥራ ባንክ አገልግሎት ማብቃት',
    licensed_badge: 'በፌዴራል ኅብረት ሥራ ኤጀንሲ ፈቃድ የተሰጠውና የሚመራ',
    bank_clearance_badge: 'በኢትዮጵያ ንግድ ባንክ እና ፀሐይ ባንክ ቀጥተኛ ክፍያ ማረጋገጫ',
    par_value_badge: 'የአንድ አክሲዮን መነሻ ዋጋ፡ 500 የኢትዮጵያ ብር',
    currency_name: 'ETB / የኢትዮጵያ ብር',
    login: 'ይግቡ (መግቢያ)',
    register: 'አባል ይሁኑ',
    member_portal: 'የአባላት ፖርታል',
    staff_portal: 'የሠራተኞች ፖርታል',
    logout: 'ይውጡ',
    home: 'ዋና ገጽ',
    about: 'ስለ ማህበሩ',
    savings: 'የቁጠባ ዓይነቶች',
    loans: 'የብድር አገልግሎት',
    membership: 'የአባልነት መስፈርቶች',
    contact: 'አድራሻና እውቂያ',
    faq: 'ተደጋጋሚ ጥያቄዎች',
    terms: 'የአጠቃቀም ደንቦች',
    privacy: 'የግላዊነት ፖሊሲ',
    view_all: 'ሁሉንም ይመልከቱ',
    back: 'ይመለሱ',
    submit: 'አስገባ',
    cancel: 'ይቅር',
    save: 'ለውጦችን መዝግብ',
    search: 'ፈልግ...',
    filter: 'አጣራ',
    status: 'ሁኔታ',
    date: 'ቀን',
    amount: 'የገንዘብ መጠን',
    balance: 'ቀሪ ሒሳብ',
    actions: 'ተግባራት',
    download_pdf: 'PDF አውርድ',
    verified: 'የተረጋገጠ ንቁ አባል',
    pending: 'በመጠባበቅ ላይ',
    approved: 'የጸደቀ',
    rejected: 'ውድቅ የተደረገ',
    quick_lookup: 'ፈጣን ፍለጋ (አባል / ዝውውር)...',

    footer_desc: 'ዋቢ የገንዘብ ቁጠባና ብድር ኅብረት ሥራ ማህበር (ሣኮ) በአባላቱ ባለቤትነት የተመሰረተ፣ በሕግ የታወቀና የሚመራ የፋይናንስ ተቋም ሲሆን፣ ተወዳዳሪ የወለድ ዕድገት፣ የ4.0× እጥፍ የብድር እድል እና ዘመናዊ ዲጂታል የቁጠባ ደብተር ያቀርባል።',
    quick_links: 'ፈጣን አሰሳ',
    financial_products: 'የፋይናንስ አገልግሎቶች',
    headquarters: 'ዋናው መሥሪያ ቤትና እውቂያ',
    newsletter_title: 'የማህበሩ መረጃና ዜና መጽሔት',
    newsletter_desc: 'የዓመታዊ ጠቅላላ ጉባዔ ትርፍ ድርሻ፣ የኦዲት ሪፖርቶች እና የፖሊሲ ማሻሻያዎችን በቀጥታ ለማግኘት ይመዝገቡ።',
    subscribe: 'ይመዝገቡ',
    subscribed_msg: 'እናመሰግናለን! ለዜና መጽሔታችን በተሳካ ሁኔታ ተመዝግበዋል።',
    copyright: 'መብቱ በሕግ የተጠበቀ ነው። በፌዴራል ኅብረት ሥራ አዋጅ ቁጥር 985/2009 መሠረት የሚተዳደር።',
    deposit_channels: 'ሕጋዊ የባንክ ሒሳብ ቁጥሮች',

    hero_badge: 'የኢትዮጵያ የቀጣዩ ትውልድ የኅብረት ሥራ ባንክ ሥርዓት',
    hero_title_prefix: 'ፍትሐዊ የሀብት ዕድገትና ዘመናዊ',
    hero_title_highlight: 'የኅብረት ሥራ ፋይናንስ',
    hero_title_suffix: 'ለኢትዮጵያ።',
    hero_description: 'ዋቢ ሣኮ የአባላትን ትብብር ከዘመናዊ ዲጂታል የባንክ ቴክኖሎጂ ጋር ያጣምራል። ከፍተኛ የቁጠባ ወለድ (12.5%–15.0%)፣ የ4.0× እጥፍ የብድር ማባዣ እና ፈጣን ዲጂታል የቁጠባ ደብተር — 100% በፌዴራል ኅብረት ሥራ መመሪያዎች መሠረት።',
    hero_cta_join: 'የዋቢ ሣኮ አባል ይሁኑ',
    hero_cta_calc: 'የቁጠባና ብድር ስሌት ይሞክሩ',
    stat_yield_label: 'የዓመታዊ ቁጠባ ወለድ',
    stat_mult_label: 'የብድር ማባዣ ምጣኔ',
    stat_share_label: 'የአንድ አክሲዮን ዋጋ',

    passbook_card_title: 'የዋቢ ሣኮ ዲጂታል የቁጠባ ደብተር',
    passbook_verified: 'የተረጋገጠ ንቁ አባል',
    passbook_accumulated_bal: 'ጠቅላላ የተጠራቀመ ቁጠባ',
    passbook_compulsory_bal: 'መደበኛ የግዴታ ቁጠባ',
    passbook_voluntary_bal: 'የፍላጎት ተቀማጭ ቁጠባ',
    passbook_shares_title: 'የአክሲዮን ካፒታል (በ500 ብር)',
    passbook_shares_sub: 'የባለቤትነት ድርሻ',
    passbook_credit_limit_title: 'የ4.0× እጥፍ የብድር ገደብ',
    passbook_instant_approved: 'ቅድመ-የጸደቀ ብድር',
    passbook_login_btn: 'ወደ አባላት መግቢያ ገጽ ይሂዱ',

    calc_badge: 'ይነጋገሩበት፡ የፋይናንስ ስሌት ማስያ',
    calc_title: 'የቁጠባዎን ዕድገት እና የብድር መብትዎን ያሰሉ',
    calc_desc: 'የኅብረት ሥራ የቁጠባ ወለድን እና የ4.0× እጥፍ የብድር ማባዣን በቅጽበት ይሞክሩ።',
    calc_tab_savings: 'የቁጠባ ወለድ ዕድገት ስሌት',
    calc_tab_loans: 'የ4.0× እጥፍ ብድርና ወርሃዊ ከፋይ',
    calc_monthly_contrib: 'ወርሃዊ የቁጠባ መጠን (በብር)',
    calc_savings_duration: 'የቁጠባ ቆይታ ጊዜ (በዓመታት)',
    calc_scheme_label: 'የቁጠባ ዓይነት ምርጫ',
    calc_scheme_regular: 'መደበኛ (12.5%)',
    calc_scheme_voluntary: 'የፍላጎት (13.5%)',
    calc_scheme_fixed: 'የጊዜ ገደብ (15.0%)',
    calc_proj_maturity: 'የሚጠበቅ አጠቃላይ ተቀማጭ',
    calc_total_deposited: 'የተቀመጠ ዋና ገንዘብ፡',
    calc_interest_gain: 'የተገኘ የቁጠባ ወለድ፡',
    calc_effective_growth: 'ጠቅላላ ዕድገት በመቶኛ፡',
    calc_start_saving_btn: 'ዛሬውኑ መቆጠብ ይጀምሩ',

    calc_loan_base: 'የመደበኛ ቁጠባ መነሻ (በብር)',
    calc_loan_term: 'የብድር መክፈያ ጊዜ (በወራት)',
    calc_loan_category: 'የብድር ዘርፍ',
    calc_loan_cat_emergency: 'አስቸኳይ (12.0%)',
    calc_loan_cat_business: 'ለንግድ ሥራ (13.5%)',
    calc_loan_cat_asset: 'ዕቃ/ተሽከርካሪ (14.0%)',
    calc_loan_multiplier_result: 'የሚፈቀደው የብድር ጣሪያ (4.0×)',
    calc_loan_monthly_inst: 'ወርሃዊ ተከፋይ ክፍፍል፡',
    calc_loan_total_interest: 'ጠቅላላ የወለድ መጠን፡',
    calc_loan_req_months: 'የሚያስፈልግ የቁጠባ ወራት፡',
    calc_loan_view_guide_btn: 'የብድር መመሪያዎችን ይመልከቱ',

    pillars_title: 'አራቱ የፋይናንስ ዋስትና ምሰሶዎች',
    pillars_desc: 'በጥብቅ የኅብረት ሥራ መርሆዎች፣ ባለሁለት ደረጃ ቁጥጥር እና ግልጽ የወለድ አሰራር የተገነባ።',
    pillar_1_title: 'መደበኛ የግዴታ ቁጠባ',
    pillar_1_desc: 'ለሁሉም አባላት ግዴታ የሆነ ወርሃዊ ተቀማጭ (ቢያንስ 500 ብር) ሲሆን፣ ለ4.0× እጥፍ የብድር ጥያቄ ዋና መያዣ ሆኖ ያገለግላል።',
    pillar_2_title: 'የፍላጎት ተለዋዋጭ ቁጠባ',
    pillar_2_desc: 'ከፍተኛ ወለድ የሚያስገኝ ተለዋዋጭ ቁጠባ። በኢትዮጵያ ንግድ ባንክ ወይም በፀሐይ ባንክ በማንኛውም ጊዜ ማስገባት ይቻላል።',
    pillar_3_title: 'ተመጣጣኝ የወለድ ብድሮች',
    pillar_3_desc: 'ዝቅተኛ ወለድ ያላቸው የአስቸኳይ ጊዜ፣ የንግድ ማስፋፊያ እና የቋሚ ንብረት ብድሮች ከግልጽ የክፍያ ስሌት ጋር።',
    pillar_4_title: 'ባለ ሁለት-መዝገብ ሌጀር',
    pillar_4_desc: 'ተአማኒ የጠቅላላ ሌጀር መዛግብት እና የአባላትን ገንዘብ የሚጠብቅ ባለሁለት ደረጃ ፈቃጅና አጽዳቂ (Maker-Checker) ሥርዓት።',

    onboarding_title: 'በሦስት ቀላል ደረጃዎች አባል ይሁኑ',
    onboarding_desc: 'ያለ ረጅም የሰልፍ እንግልት በዲጂታል መንገድ ፈጣን ምዝገባ ያካሂዱ።',
    onboarding_step1_title: 'የምዝገባ ቅጽ ይሙሉ',
    onboarding_step1_desc: 'የብሔራዊ መታወቂያ / ፓስፖርት፣ የነዋሪነት ማስረጃ፣ የሥራ መረጃ እና የውርስ ወራሽ ስም በደህንነቱ የተጠበቀ ቅጽ ላይ ያስገቡ።',
    onboarding_step2_title: 'የምዝገባ ክፍያና አክሲዮን ያስገቡ',
    onboarding_step2_desc: 'የአንድ ጊዜ የምዝገባ ክፍያ (1,000 ብር) እና የሕጋዊ አክሲዮን መግዣ (5 አክሲዮን @ 500 ብር = 2,500 ብር) በባንክ በኩል ያስገቡ።',
    onboarding_step3_title: 'ፖርታልዎን ያግኙና ብድር ይጠይቁ',
    onboarding_step3_desc: 'የፖርታል መግቢያዎን ይቀበሉ፣ ዲጂታል የቁጠባ ደብተርዎን ያውርዱ፣ ወርሃዊ ወለድዎን ይከታተሉ እንዲሁም የ4.0× እጥፍ ብድር ያመልክቱ።',
    onboarding_cta_btn: 'አሁን የአባልነት ምዝገባ ይጀምሩ',

    faq_heading: 'ተደጋግመው የሚጠየቁ ጥያቄዎች',
    faq_subheading: 'ስለ አባልነት ደንቦች፣ የብድር ፖሊሲዎች እና የባንክ ተቀማጭ ግልጽና ዝርዝር ምላሾች።',
    cta_banner_active_members: 'በመላው ኢትዮጵያ ከ15,000+ በላይ ንቁ አባላት',
    cta_banner_title: 'የፋይናንስ የወደፊት ሕይወትዎን ዛሬ ከዋቢ ሣኮ ጋር ይገንቡ።',
    cta_banner_desc: 'የአባላትን እድገት፣ ፍትሐዊ የቁጠባ ትርፍ እና ዲጂታል ግልጽነትን የሚያስቀድመውን የኅብረት ሥራ ንቅናቄ ይቀላቀሉ።',
    cta_banner_open_btn: 'የአባልነት ሒሳብ ይክፈቱ',
    cta_banner_contact_btn: 'ዋና መሥሪያ ቤትን ያነጋግሩ',

    about_badge: 'ስለ ማህበሩ አጠቃላይ መረጃ',
    about_title: 'በኅብረት ሥራ ተአማኒነት የጋራ ብልጽግናን መገንባት',
    about_subtitle: 'ዋቢ ሣኮ በኢትዮጵያ ውስጥ ከ15,000 በላይ ንቁ አባላትን በከፍተኛ ግልጽነት፣ ዲጂታል ቴክኖሎጂ እና ፍትሐዊ አሰራር የሚያገለግል አንጋፋ የገንዘብ ቁጠባና ብድር ኅብረት ሥራ ማህበር ነው።',
    mission_title: 'ተልዕኳችን',
    mission_desc: 'በአባላት የጋራ ትብብር እና በዘመናዊ ቴክኖሎጂ የታገዘ ተደራሽ፣ ፍትሐዊና ከፍተኛ ወለድ የሚያስገኝ የቁጠባና የብድር አገልግሎት ማቅረብ።',
    vision_title: 'ራዕያችን',
    vision_desc: 'በ2022 ዓ.ም በኢትዮጵያ ውስጥ እጅግ ተአማኒ፣ ጠንካራና በዲጂታል የላቀ የቁጠባና ብድር ኅብረት ሥራ ማህበር መሆን።',
    values_title: 'መሰረታዊ እሴቶቻችን',
    values_desc: 'ግልጽነት፣ የአባላት የበላይነት፣ ተጠያቂነት፣ የፋይናንስ ጥንቃቄ፣ እኩል ድምፅ እና ቀጣይነት ያለው የቴክኖሎጂ ፈጠራ።',
    milestones_title: 'የማህበሩ ታሪካዊ ጉዞ',
    governance_title: 'የሥራ አመራር ቦርድ እና አመራር',
    governance_desc: 'በጠቅላላ ጉባዔው በቀጥታ በዴሞክራሲያዊ የኅብረት ሥራ መርህ (አንድ አባል፣ አንድ ድምፅ) የተመረጡ።',
    about_cta_title: 'የማህበራችን አባል ለመሆን ዝግጁ ነዎት?',
    about_cta_desc: 'የአባልነት ምዝገባዎን በድረ-ገጻችን በ5 ደቂቃ ውስጥ ያጠናቁ።',
    about_cta_btn: 'አባል ይሁኑ',

    savings_hero_badge: 'አስተማማኝ የወለድ ዕድገት',
    savings_hero_title: 'የኅብረት ሥራ የቁጠባ ዓይነቶች',
    savings_hero_desc: 'ግልጽ የወለድ ስሌት፣ ምንም ዓይነት ያልተገለጸ የሂሳብ አያያዝ ተቀናሽ የሌለው እና በሕግ ዋስትና የተረጋገጠ የቁጠባ አገልግሎት።',
    savings_open_btn: 'ሒሳብ ይክፈቱ',
    bank_accounts_title: 'ሕጋዊ የባንክ ሒሳብ ቁጥሮች ለተቀማጭ',
    bank_accounts_desc: 'በኢትዮጵያ ንግድ ባንክ (CBE ሒሳብ፡ 1000123456789) ወይም በፀሐይ ባንክ (ሒሳብ፡ 2000987654321) በቀጥታ ያስገቡ። ደረሰኝዎን በፖርታልዎ በማስገባት በቅጽበት ያረጋግጡ።',

    loans_hero_badge: 'የኅብረት ሥራ የብድር አቅርቦት',
    loans_hero_title: 'ፍትሐዊና ግልጽ የብድር አገልግሎቶች',
    loans_hero_desc: 'የአባላትን የንግድና የኢንቨስትመንት እንቅስቃሴ በ4.0× እጥፍ የብድር ማባዣ እና በተመጣጣኝ ወርሃዊ አከፋፈል መደገፍ።',
    loan_policy_title: 'የብድር መመሪያ፡ የ4 ወራት ተከታታይ ቁጠባ ደንብ',
    loan_policy_desc: 'የማህበሩን የፋይናንስ ጤንነት ለመጠበቅ፣ አመልካቾች ቢያንስ ለ4 ተከታታይ ወራት መደበኛ የግዴታ ቁጠባ (ቢያንስ 500 ብር/ወር) የቆጠቡ መሆን አለባቸው። የሚፈቀደው የብድር ጣሪያ ከተጠራቀመው መደበኛ ቁጠባ 4.0× እጥፍ ይሆናል።',
    loan_max_duration: 'ከፍተኛው ጊዜ፡',
    loan_multiplier_label: 'የማባዣ ምጣኔ፡',
    loan_check_eligibility: 'ብቁ መሆንዎን ያረጋግጡ',

    membership_hero_badge: 'የአባልነት ምዝገባ',
    membership_hero_title: 'የአባልነት መስፈርቶች እና ደረጃዎች',
    membership_hero_desc: 'እኩል የድምፅ ባለቤት እና የዓመታዊ ትርፍ ተጋሪ በመሆን የዋቢ ሣኮ አባልና ባለቤት ይሁኑ።',
    capital_req_title: 'አስፈላጊ የመነሻ ካፒታል ክፍያዎች',
    reg_fee_label: '1. የአባልነት መመዝገቢያ ክፍያ',
    reg_fee_sub: 'የአንድ ጊዜ የማይመለስ አስተዳደራዊ ክፍያ',
    equity_shares_label: '2. የሕጋዊ አክሲዮን ካፒታል',
    equity_shares_sub: '5 አክሲዮኖች በ500 ብር (ትርፍ ድርሻ የሚያስገኝ)',
    first_month_savings_label: '3. የመጀመሪያ ወር የግዴታ ቁጠባ',
    first_month_savings_sub: 'ወርሃዊ ቋሚ የቁጠባ ተቀማጭ',
    total_initial_capital: 'ሙሉ አባልነትን ለማረጋገጥ የሚያስፈልግ ጠቅላላ መነሻ ገንዘብ፡',
    kyc_docs_title: 'የሚያስፈልጉ ሕጋዊ ማስረጃዎች (KYC)',
    start_reg_btn: 'የአባልነት ምዝገባ ይጀምሩ',

    contact_hero_badge: 'የአባላት አገልግሎት እና ቅርንጫፎች',
    contact_hero_title: 'የዋቢ ሣኮ ዋና መሥሪያ ቤት እውቂያ',
    contact_hero_desc: 'የአባላት አገልግሎት ዴስካችን እና የሒሳብ ክፍላችን ለተቀማጭ ማረጋገጫ፣ ለብድር ማብራሪያ እና ለጥያቄዎችዎ ፈጣን ምላሽ ለመስጠት ዝግጁ ናቸው።',
    contact_hq_title: 'ዋናው መሥሪያ ቤት',
    contact_phone_label: 'የአባላት አገልግሎት ስልክ መስመር',
    contact_email_label: 'ኦፊሴላዊ የኢሜይል አድራሻ',
    contact_hours_label: 'የሥራ ሰዓት',
    contact_hours_val: 'ከሰኞ – ዓርብ፡ 2:00 ጠዋት – 11:00 ከሰዓት | ቅዳሜ፡ 2:00 – 6:30 ቀትር',
    contact_form_title: 'መልዕክት ወይም ጥያቄ ይላኩ',
    contact_form_desc: 'የድጋፍ ቡድናችን በአንድ የሥራ ቀን ውስጥ ፈጣን ምላሽ ይሰጣል።',
    contact_form_name: 'ሙሉ ሕጋዊ ስም *',
    contact_form_phone: 'የስልክ ቁጥር *',
    contact_form_email: 'የኢሜይል አድራሻ',
    contact_form_subject: 'የመልዕክቱ ርዕሰ ጉዳይ *',
    contact_form_message: 'መልዕክትዎን እዚህ ይጻፉ *',
    contact_form_send_btn: 'መልዕክት ላክ',
    contact_form_success_title: 'መልዕክትዎ በተሳካ ሁኔታ ተልኳል',
    contact_form_success_desc: 'ዋቢ ሣኮን ስላነጋገሩ እናመሰግናለን። የደንበኞች አገልግሎት ሠራተኛ በአጭር ጊዜ ውስጥ ያነጋግርዎታል።',

    faq_hero_badge: 'የመረጃ እና ጥያቄዎች ማዕከል',
    faq_hero_title: 'ተደጋግመው የሚጠየቁ ጥያቄዎች (FAQ)',
    faq_hero_desc: 'ስለ ቁጠባ ዓይነቶች፣ የብድር አሰጣጥ፣ ወለድ እና የባንክ ክፍያዎች ማወቅ የሚፈልጉት ዝርዝር መረጃ።',
    faq_search_placeholder: 'ጥያቄዎችን ይፈልጉ (ለምሳሌ፡ 4 እጥፍ ብድር፣ የባንክ ደረሰኝ፣ ወለድ)...',
    faq_cat_all: 'ሁሉም',
    faq_cat_savings: 'ቁጠባ',
    faq_cat_loans: 'ብድር',
    faq_cat_membership: 'አባልነት',
    faq_cat_payments: 'ክፍያዎች',

    terms_badge: 'የማህበሩ መተዳደሪያ ደንብ እና የሕግ ማዕቀፍ',
    terms_title: 'የዋቢ ሣኮ የአባልነትና የአገልግሎት ደንቦች',
    terms_version: 'የጸደቀበት ሥሪት፡ 2026.1 • በጠቅላላ ጉባዔውና በሥራ አመራር ቦርድ የጸደቀ',
    terms_sec1_title: '1. የአባልነት ብቃት እና ቅበላ ደንብ',
    terms_sec2_title: '2. የቁጠባ ሒሳቦች እና የወለድ ስሌት',
    terms_sec3_title: '3. የብድር አሰጣጥ እና የ4.0× እጥፍ ማባዣ ደንቦች',
    terms_sec4_title: '4. የባንክ ደረሰኝ ማረጋገጫና ኦዲት',
    terms_sec5_title: '5. ከአባልነት የመልቀቅ ሁኔታዎች',

    privacy_badge: 'የመረጃ ጥበቃ እና የግላዊነት ፖሊሲ',
    privacy_title: 'የዋቢ ሣኮ የግላዊነት ፖሊሲ',
    privacy_version: 'ተገዢነት፡ የኢትዮጵያ ፌዴራል የመረጃ ደህንነት እና የፋይናንስ ግላዊነት መመሪያዎች',
    privacy_sec1_title: '1. የምንሰበስባቸው መረጃዎች',
    privacy_sec2_title: '2. የመረጃ አጠቃቀም ዓላማ',
    privacy_sec3_title: '3. የመረጃ ደህንነት እና የኢንክሪፕሽን ጥበቃ',
    privacy_sec4_title: '4. ለሦስተኛ ወገን መረጃን ስለማሳወቅ',
    privacy_sec5_title: '5. የአባላት የመረጃ ፍተሻና መብቶች',

    auth_login_title: 'ወደ ፖርታልዎ ይግቡ',
    auth_login_desc: 'የቁጠባ፣ የብድር፣ የደብተርና የሂሳብ መግለጫዎችዎን ይመልከቱ።',
    auth_email_or_phone: 'የኢሜይል አድራሻ ወይም የስልክ ቁጥር',
    auth_password: 'የይለፍ ቃል (Password)',
    auth_forgot_password: 'የይለፍ ቃል ረሱ?',
    auth_signin_btn: 'ወደ ፖርታል ግባ',
    auth_no_account: 'የአባልነት ሒሳብ የለዎትም?',
    auth_register_now: 'አዲስ አባል ይሁኑና ይመዝገቡ',
    auth_register_title: 'የዋቢ ሣኮ የአባልነት ሒሳብ ይክፈቱ',
    auth_register_desc: 'ከ15,000+ በላይ አባላትን ይቀላቀሉና የፋይናንስ እድገትዎን ይጀምሩ።',
    auth_have_account: 'አስቀድመው አባል ነዎት? ይግቡ',

    member_dashboard: 'የአባላት ዳሽቦርድ',
    my_savings: 'የእኔ ቁጠባ',
    my_shares: 'የእኔ አክሲዮን',
    my_loans: 'የእኔ ብድር',
    digital_passbook: 'ዲጂታል የቁጠባ ደብተር',
    transactions_history: 'የዝውውር ታሪክ',
    my_profile: 'የግል መረጃና ማስረጃ (KYC)',
    notifications: 'ማሳወቂያዎች',
    support_desk: 'የድጋፍ ዴስክ',
    account_overview: 'የሒሳብ ማጠቃለያ',
    total_savings_balance: 'ጠቅላላ የቁጠባ መጠን',
    active_loan_balance: 'ያለብኝ የብድር መጠን',
    share_capital_balance: 'የአክሲዮን ካፒታል መጠን',
    monthly_interest_accrued: 'የወሩ የተጠራቀመ ወለድ',
    deposit_funds: 'ገንዘብ አስገባ (ተቀማጭ)',
    apply_for_loan: 'ብድር አመልክት',
    buy_more_shares: 'ተጨማሪ አክሲዮን ግዛ',
    download_statement: 'የሒሳብ መግለጫ አውርድ',
    dark_mode: 'ጨለማ ገጽታ',
    light_mode: 'ብርሃን ገጽታ',
    system_theme: 'የስርዓቱ ገጽታ',
    toggle_theme: 'ገጽታ ቀይር',
  },
};
