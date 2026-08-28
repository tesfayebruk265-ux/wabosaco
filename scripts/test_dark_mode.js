import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = 'C:\\Users\\tesfa\\.gemini\\antigravity-ide\\brain\\a9a37267-8206-434a-a99f-da41c58dcdea\\screenshots\\dark_mode';

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
  fullName: 'Yohannes Girma (System Admin)',
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

async function findChromePath() {
  const possiblePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return 'chrome';
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    const WebSocket = (await import('ws')).default;
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.on('open', resolve);
      this.ws.on('error', reject);
      this.ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.id && this.callbacks.has(msg.id)) {
          const cb = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) cb.reject(msg.error);
          else cb.resolve(msg.result);
        }
      });
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = this.id++;
      this.callbacks.set(msgId, { resolve, reject });
      this.ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  async close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

async function run() {
  console.log('Launching Headless Chrome for Dark Mode verification...');
  const chromePath = await findChromePath();
  const remoteDebuggingPort = 9223;

  const chromeProc = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${remoteDebuggingPort}`,
    '--window-size=1440,900',
    '--disable-gpu',
    '--no-sandbox',
  ]);

  await delay(1500);

  try {
    const listRes = await fetch(`http://127.0.0.1:${remoteDebuggingPort}/json`);
    const targets = await listRes.json();
    const pageTarget = targets.find((t) => t.type === 'page') || targets[0];

    const client = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await client.connect();

    await client.send('Page.enable');
    await client.send('DOM.enable');
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1.5,
      mobile: false,
    });

    const navigateWithState = async (url, filename, stateFn) => {
      await client.send('Page.navigate', { url: 'http://localhost:3000/' });
      await delay(400);

      await client.send('Runtime.evaluate', {
        expression: `
          localStorage.setItem('wabi_sacco_theme', 'dark');
          document.documentElement.classList.add('dark');
          document.documentElement.setAttribute('data-theme', 'dark');
        `
      });

      if (stateFn) {
        await stateFn(client);
      }

      await client.send('Page.navigate', { url });
      await delay(900);

      await client.send('Runtime.evaluate', {
        expression: `
          document.documentElement.classList.add('dark');
          document.documentElement.setAttribute('data-theme', 'dark');
          document.body.classList.add('dark');
          document.body.setAttribute('data-theme', 'dark');
        `
      });
      await delay(500);

      const { data } = await client.send('Page.captureScreenshot', { format: 'png' });
      const buffer = Buffer.from(data, 'base64');
      const filePath = path.join(SCREENSHOT_DIR, filename);
      fs.writeFileSync(filePath, buffer);
      console.log(`Saved Dark Mode screenshot: ${filename}`);
    };

    console.log('\n--- Capturing Public Dark Mode Pages ---');
    await navigateWithState('http://localhost:3000/', 'dark_01_home.png');
    await navigateWithState('http://localhost:3000/about', 'dark_02_about.png');
    await navigateWithState('http://localhost:3000/savings', 'dark_03_savings.png');
    await navigateWithState('http://localhost:3000/loans', 'dark_04_loans.png');

    console.log('\n--- Capturing Member Dark Mode Pages ---');
    const memberState = async (cdp) => {
      await cdp.send('Runtime.evaluate', {
        expression: `
          localStorage.setItem('wabi_user', JSON.stringify(${JSON.stringify(MEMBER_USER)}));
          localStorage.setItem('wabi_tokens', JSON.stringify(${JSON.stringify(MEMBER_TOKENS)}));
          localStorage.setItem('wabi_permissions', JSON.stringify([]));
          localStorage.setItem('wabi_sacco_theme', 'dark');
        `,
      });
    };

    await navigateWithState('http://localhost:3000/member/dashboard', 'dark_05_member_dashboard.png', memberState);
    await navigateWithState('http://localhost:3000/member/savings', 'dark_06_member_savings.png', memberState);
    await navigateWithState('http://localhost:3000/member/loans', 'dark_07_member_loans.png', memberState);
    await navigateWithState('http://localhost:3000/member/passbook', 'dark_08_member_passbook.png', memberState);

    console.log('\n--- Capturing Admin Dark Mode Pages ---');
    const adminState = async (cdp) => {
      await cdp.send('Runtime.evaluate', {
        expression: `
          localStorage.setItem('wabi_user', JSON.stringify(${JSON.stringify(ADMIN_USER)}));
          localStorage.setItem('wabi_tokens', JSON.stringify(${JSON.stringify(ADMIN_TOKENS)}));
          localStorage.setItem('wabi_permissions', JSON.stringify(${JSON.stringify(ADMIN_PERMISSIONS)}));
          localStorage.setItem('wabi_sacco_theme', 'dark');
        `,
      });
    };

    await navigateWithState('http://localhost:3000/admin/dashboard', 'dark_09_admin_dashboard.png', adminState);
    await navigateWithState('http://localhost:3000/staff/members', 'dark_10_staff_members.png', adminState);
    await navigateWithState('http://localhost:3000/staff/accounting', 'dark_11_staff_accounting.png', adminState);
    await navigateWithState('http://localhost:3000/staff/settings', 'dark_12_staff_settings.png', adminState);

    await client.close();
    console.log('\nAll Dark Mode pages captured and verified!');
  } finally {
    chromeProc.kill();
  }
}

run().catch((err) => {
  console.error('Error during dark mode capture:', err);
  process.exit(1);
});
