import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = 'C:\\Users\\tesfa\\.gemini\\antigravity-ide\\brain\\a9a37267-8206-434a-a99f-da41c58dcdea\\screenshots';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Demo profiles for injecting auth
const MEMBER_USER = {
  id: 'usr_member_143',
  username: 'WB000143',
  email: 'abebe.bikila@gmail.com',
  fullName: 'Abebe Bikila Wolde',
  membershipNo: 'WB000143',
  role: 'MEMBER',
  isActive: true,
  phoneNumber: '+251911998877',
  createdAt: '2025-04-12T09:00:00Z',
  lastLoginAt: '2026-08-14T12:00:00Z',
};

const MEMBER_TOKENS = {
  accessToken: 'demo_jwt_member_token',
  refreshToken: 'demo_refresh_member_token',
  tokenType: 'Bearer',
  expiresIn: 3600,
};

const ADMIN_USER = {
  id: 'usr_admin_1',
  username: 'admin.sacco',
  email: 'admin@wabisacco.et',
  fullName: 'Samuel Ambaw (System Admin)',
  role: 'ADMIN',
  isActive: true,
  phoneNumber: '+251911223344',
  createdAt: '2025-01-10T08:00:00Z',
  lastLoginAt: '2026-08-14T09:15:00Z',
};

const ADMIN_TOKENS = {
  accessToken: 'demo_jwt_admin_token',
  refreshToken: 'demo_refresh_admin_token',
  tokenType: 'Bearer',
  expiresIn: 3600,
};

const ADMIN_PERMISSIONS = [
  'users:view', 'users:create', 'users:edit', 'users:delete',
  'roles:view', 'roles:edit', 'audit:view', 'system:configure',
  'members:view', 'members:edit', 'savings:view', 'loans:view', 'reports:view'
];

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();
    this.isOpen = false;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws.onopen = () => {
        this.isOpen = true;
        resolve();
      };
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { resolve, reject } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
    });
  }

  async send(method, params = {}) {
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.ws.close();
  }
}

async function capture() {
  console.log('Launching Headless Chrome...');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeProcess = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--window-size=1440,1080',
    '--disable-gpu',
    '--hide-scrollbars',
    'about:blank',
  ]);

  await delay(1500);

  console.log('Connecting to Chrome DevTools Protocol...');
  const versionRes = await fetch('http://127.0.0.1:9222/json/version');
  const versionData = await versionRes.json();
  const browserWsUrl = versionData.webSocketDebuggerUrl;

  const targetsRes = await fetch('http://127.0.0.1:9222/json/list');
  const targets = await targetsRes.json();
  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
  const pageWsUrl = pageTarget.webSocketDebuggerUrl;

  const client = new CDPClient(pageWsUrl);
  await client.connect();

  await client.send('Page.enable');
  await client.send('DOM.enable');
  await client.send('Runtime.enable');
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false,
  });

  async function takeScreenshot(fileName) {
    const res = await client.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const fullPath = path.join(SCREENSHOT_DIR, fileName);
    fs.writeFileSync(fullPath, buffer);
    console.log(`Saved screenshot: ${fileName}`);
  }

  async function navigate(url) {
    await client.send('Page.navigate', { url });
    await delay(1200);
  }

  async function setLocalStorage(role = 'NONE') {
    if (role === 'MEMBER') {
      await client.send('Runtime.evaluate', {
        expression: `
          localStorage.setItem('wabi_user', '${JSON.stringify(MEMBER_USER)}');
          localStorage.setItem('wabi_tokens', '${JSON.stringify(MEMBER_TOKENS)}');
          localStorage.setItem('wabi_permissions', '[]');
        `,
      });
    } else if (role === 'ADMIN') {
      await client.send('Runtime.evaluate', {
        expression: `
          localStorage.setItem('wabi_user', '${JSON.stringify(ADMIN_USER)}');
          localStorage.setItem('wabi_tokens', '${JSON.stringify(ADMIN_TOKENS)}');
          localStorage.setItem('wabi_permissions', '${JSON.stringify(ADMIN_PERMISSIONS)}');
        `,
      });
    } else {
      await client.send('Runtime.evaluate', {
        expression: `
          localStorage.removeItem('wabi_user');
          localStorage.removeItem('wabi_tokens');
          localStorage.removeItem('wabi_permissions');
        `,
      });
    }
  }

  try {
    // 1. Clear session
    await navigate('http://localhost:3000/');
    await setLocalStorage('NONE');

    // 2. Public Pages
    console.log('\n--- Capturing Public Pages ---');
    await navigate('http://localhost:3000/');
    await takeScreenshot('01_home_top.png');

    // Scroll to bottom CTA section to verify the fixed button
    await client.send('Runtime.evaluate', {
      expression: `window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });`,
    });
    await delay(600);
    await takeScreenshot('02_home_cta_banner.png');

    await navigate('http://localhost:3000/about');
    await takeScreenshot('03_about_page.png');

    await navigate('http://localhost:3000/savings');
    await takeScreenshot('04_savings_products.png');

    await navigate('http://localhost:3000/loans');
    await takeScreenshot('05_loan_products.png');

    await navigate('http://localhost:3000/membership');
    await takeScreenshot('06_membership_info.png');

    await navigate('http://localhost:3000/contact');
    await takeScreenshot('07_contact_page.png');

    await navigate('http://localhost:3000/faq');
    await takeScreenshot('08_faq_page.png');

    await navigate('http://localhost:3000/terms');
    await takeScreenshot('09_terms_page.png');

    await navigate('http://localhost:3000/privacy');
    await takeScreenshot('10_privacy_page.png');

    await navigate('http://localhost:3000/login');
    await takeScreenshot('11_login_page.png');

    await navigate('http://localhost:3000/register');
    await takeScreenshot('12_register_wizard.png');

    // 3. Member Portal Pages
    console.log('\n--- Capturing Member Portal Pages ---');
    await setLocalStorage('MEMBER');

    await navigate('http://localhost:3000/member/dashboard');
    await takeScreenshot('13_member_dashboard.png');

    await navigate('http://localhost:3000/member/savings');
    await takeScreenshot('14_member_savings.png');

    await navigate('http://localhost:3000/member/shares');
    await takeScreenshot('15_member_shares.png');

    await navigate('http://localhost:3000/member/loans');
    await takeScreenshot('16_member_loans.png');

    await navigate('http://localhost:3000/member/passbook');
    await takeScreenshot('17_member_passbook.png');

    await navigate('http://localhost:3000/member/transactions');
    await takeScreenshot('18_member_transactions.png');

    await navigate('http://localhost:3000/member/profile');
    await takeScreenshot('19_member_profile.png');

    // 4. Staff & Admin Portal Pages
    console.log('\n--- Capturing Admin / Staff Pages ---');
    await setLocalStorage('ADMIN');

    await navigate('http://localhost:3000/admin/dashboard');
    await takeScreenshot('20_admin_executive_dashboard.png');

    await navigate('http://localhost:3000/manager/dashboard');
    await takeScreenshot('21_manager_dashboard.png');

    await navigate('http://localhost:3000/accountant/dashboard');
    await takeScreenshot('22_accountant_dashboard.png');

    await navigate('http://localhost:3000/auditor/dashboard');
    await takeScreenshot('23_auditor_dashboard.png');

    await navigate('http://localhost:3000/customer-service/dashboard');
    await takeScreenshot('24_customer_service_dashboard.png');

    await navigate('http://localhost:3000/staff/members');
    await takeScreenshot('25_staff_member_management.png');

    await navigate('http://localhost:3000/staff/approvals');
    await takeScreenshot('26_staff_dual_approvals.png');

    await navigate('http://localhost:3000/staff/accounting');
    await takeScreenshot('27_staff_accounting_ledger.png');

    await navigate('http://localhost:3000/staff/reports');
    await takeScreenshot('28_staff_central_reports.png');

    await navigate('http://localhost:3000/staff/forecasting');
    await takeScreenshot('29_staff_ai_forecasting.png');

    await navigate('http://localhost:3000/staff/audit-logs');
    await takeScreenshot('30_staff_audit_trails.png');

    await navigate('http://localhost:3000/staff/migration');
    await takeScreenshot('31_staff_data_migration.png');

    await navigate('http://localhost:3000/staff/settings');
    await takeScreenshot('32_staff_enterprise_settings.png');

    console.log('\nAll 32 pages captured successfully!');
  } finally {
    client.close();
    chromeProcess.kill();
  }
}

capture().catch((err) => {
  console.error('Capture error:', err);
  process.exit(1);
});
