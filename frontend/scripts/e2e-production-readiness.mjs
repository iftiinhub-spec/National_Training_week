import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd(), '..');
const out = path.join(process.cwd(), 'test-results', 'production-readiness');
fs.mkdirSync(out, { recursive: true });
const env = fs.readFileSync(path.join(root, 'backend', '.env'), 'utf8');
const value = (key) => env.match(new RegExp(`^${key}=(.*)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const base = 'http://localhost:5173';
const report = { startedAt: new Date().toISOString(), checks: [], failures: [], responsive: {} };
const pass = (name) => report.checks.push(name);
const check = (condition, name) => { if (!condition) throw new Error(name); pass(name); };

const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
try {
  const login = async (email, password) => {
    const response = await context.request.post(`${base}/api/auth/login`, { data: { email, password } });
    check(response.ok(), `Login succeeds for ${email}`);
    return (await response.json()).data.token;
  };
  const adminToken = await login(value('ADMIN_EMAIL'), value('ADMIN_PASSWORD'));
  const participantToken = await login('ibrahimkhaliil5280@gmail.com', 'Participant123!');
  const workflow = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'test-results', 'full-workflow', 'report.json'), 'utf8'));
  const moderatorToken = await login(workflow.testData.moderatorEmail, 'Moderator123!');

  let response = await context.request.get(`${base}/api/admin/settings`);
  check(response.status() === 401, 'Anonymous users cannot access admin settings');
  response = await context.request.get(`${base}/api/admin/settings`, { headers: { Authorization: `Bearer ${participantToken}` } });
  check(response.status() === 403, 'Participants cannot access admin settings');
  response = await context.request.get(`${base}/api/admin/settings`, { headers: { Authorization: `Bearer ${moderatorToken}` } });
  check(response.status() === 403, 'Moderators cannot access admin settings');
  response = await context.request.get(`${base}/api/moderator/dashboard`, { headers: { Authorization: `Bearer ${participantToken}` } });
  check(response.status() === 403, 'Participants cannot access moderator operations');
  response = await context.request.get(`${base}/api/participant/dashboard`, { headers: { Authorization: `Bearer ${adminToken}` } });
  check(response.status() === 403, 'Administrators cannot impersonate participant endpoints');
  response = await context.request.get(`${base}/api/admin/settings`, { headers: { Authorization: `Bearer ${adminToken}` } });
  check(response.ok(), 'Administrator can access settings');
  const adminSettings = JSON.stringify(await response.json());
  check(!adminSettings.includes('smtpPassEncrypted') && !adminSettings.includes('smtpPassword'), 'Admin settings API never returns the App Password');
  response = await context.request.get(`${base}/api/public/settings`);
  const publicSettings = JSON.stringify(await response.json());
  check(response.ok() && !/smtp|replyToEmail/i.test(publicSettings), 'Public settings expose no private email configuration');

  await page.goto(`${base}/signin`);
  await page.getByPlaceholder('name@domain.com').fill(value('ADMIN_EMAIL'));
  await page.locator('input[type="password"]').fill(value('ADMIN_PASSWORD'));
  await page.getByRole('button', { name: /Sign In to Portal/i }).click();
  await page.waitForURL(/\/admin/);
  await page.getByRole('link', { name: 'Settings', exact: true }).click();
  await page.getByRole('heading', { name: /Website & email settings/i }).waitFor();
  check(await page.getByRole('button', { name: /Edit settings/i }).isVisible(), 'Settings are read-only with an explicit Edit button');
  check(await page.getByRole('button', { name: /Send test email/i }).isVisible(), 'Send test email control is available');
  await page.screenshot({ path: path.join(out, 'admin-settings.png'), fullPage: true });

  for (const [name, width, height, url] of [['mobile', 390, 844, '/'], ['tablet', 768, 1024, '/trainings'], ['desktop', 1440, 1000, '/about']]) {
    await page.setViewportSize({ width, height }); await page.goto(`${base}${url}`); await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
    report.responsive[name] = { width, height, horizontalOverflow: overflow };
    check(!overflow, `${name} public page has no horizontal overflow`);
  }
  await page.goto(`${base}/`); await page.locator('footer').scrollIntoViewIfNeeded();
  check(await page.locator('footer').getByText(/^Web:/).count() === 0, 'Footer website row is removed');
  check(await page.locator('footer a[aria-label="LinkedIn"], footer a[aria-label="X (Twitter)"], footer a[aria-label="YouTube"]').count() === 0, 'Footer contains no removed social networks');
} catch (error) { report.failures.push(error.message); }
finally { report.finishedAt = new Date().toISOString(); fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2)); await browser.close(); }
console.log(JSON.stringify(report, null, 2));
if (report.failures.length) process.exitCode = 1;
