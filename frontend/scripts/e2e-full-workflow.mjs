import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd(), '..');
const artifacts = path.join(process.cwd(), 'test-results', 'full-workflow');
fs.mkdirSync(artifacts, { recursive: true });
const envText = fs.readFileSync(path.join(root, 'backend', '.env'), 'utf8');
const envValue = (key) => envText.match(new RegExp(`^${key}=(.*)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const adminEmail = envValue('ADMIN_EMAIL');
const adminPassword = envValue('ADMIN_PASSWORD');
if (!adminEmail || !adminPassword) throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required in backend/.env');

const stamp = Date.now();
const moderator = { name: 'E2E Session Moderator', email: `moderator.e2e.${stamp}@example.com`, password: 'Moderator123!', phone: '+252610000101' };
const participant = { name: 'Ibrahim Khaliil', email: 'ibrahimkhaliil5280@gmail.com', password: 'Participant123!', phone: '+252610000202' };
const testData = { event: 'National Training Week 2027', theme: 'Digital Skills for Inclusive Growth', category: 'Digital Skills', trainer: 'E2E Expert Trainer', training: 'E2E Digital Skills Foundations' };
const report = { startedAt: new Date().toISOString(), completed: [], failures: [], browserErrors: [], failedResponses: [], testData: { ...testData, moderatorEmail: moderator.email, participantEmail: participant.email } };

const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
page.on('pageerror', (error) => report.browserErrors.push(error.message));
page.on('response', (response) => { if (response.status() >= 400 && response.url().includes('/api/') && !response.url().endsWith('/api/public/current-event')) report.failedResponses.push({ status: response.status(), url: response.url() }); });
const shot = async (name) => page.screenshot({ path: path.join(artifacts, `${name}.png`), fullPage: true });
const step = async (name, action) => { try { await action(); report.completed.push(name); await shot(name.replaceAll(/[^a-z0-9]+/gi, '-').toLowerCase()); } catch (error) { report.failures.push({ step: name, error: error.message }); await shot(`FAILED-${name.replaceAll(/[^a-z0-9]+/gi, '-').toLowerCase()}`); throw error; } };
const signIn = async (email, password) => { await page.goto('http://localhost:5173/signin'); await page.getByPlaceholder('name@domain.com').fill(email); await page.locator('input[type="password"]').fill(password); await page.getByRole('button', { name: /Sign In to Portal/i }).click(); await page.waitForLoadState('networkidle'); };
const signOut = async () => { await page.getByRole('button', { name: /Sign Out/i }).click(); await page.waitForURL(/\/signin$/); };

try {
  await step('01-admin-sign-in', async () => { await signIn(adminEmail, adminPassword); await page.waitForURL(/\/admin/); });
  await step('02-create-event', async () => {
    await page.getByRole('link', { name: 'Events & Days', exact: true }).click();
    await page.getByRole('button', { name: /Create New Event Edition/i }).click();
    const modal = page.getByRole('heading', { name: /Create New Event Edition/i }).locator('..');
    const inputs = modal.locator('input');
    await inputs.nth(0).fill(testData.event);
    await inputs.nth(1).fill('2026-08-01'); await inputs.nth(2).fill('2027-08-08');
    await inputs.nth(3).fill(testData.theme); await inputs.nth(4).fill('2027');
    await inputs.nth(5).fill('2027-08-09'); await inputs.nth(6).fill('2027-08-10'); await inputs.nth(7).fill('09:00');
    await modal.locator('select').selectOption('registration_open'); await modal.locator('input[type="checkbox"]').check();
    await modal.getByRole('button', { name: /Save Event/i }).click(); await page.getByText(testData.event).waitFor();
  });
  await step('03-create-event-day', async () => {
    await page.getByRole('button', { name: /Add Event Day/i }).click(); const modal = page.getByRole('heading', { name: /Add Day to/i }).locator('..'); const inputs = modal.locator('input');
    await inputs.nth(0).fill('1'); await inputs.nth(1).fill('2027-08-09'); await inputs.nth(2).fill('Digital Skills Day'); await modal.getByRole('button', { name: /Save Day/i }).click(); await page.getByText('Digital Skills Day').waitFor();
  });
  await step('04-create-category', async () => { await page.getByRole('link', { name: /^Categories$/i }).click(); await page.getByPlaceholder('e.g. Artificial Intelligence').fill(testData.category); await page.getByPlaceholder(/Briefly explain/i).fill('Foundational digital and professional capabilities.'); await page.getByRole('button', { name: /Add Category/i }).click(); await page.getByRole('cell', { name: testData.category, exact: true }).waitFor(); });
  await step('05-create-trainer', async () => {
    await page.getByRole('link', { name: 'Trainer Profiles', exact: true }).click(); await page.getByRole('button', { name: /Add Trainer Profile/i }).click(); const modal = page.getByRole('heading', { name: /Create Trainer Profile/i }).locator('..');
    await modal.getByPlaceholder('Dr.').fill('Dr.'); await modal.getByPlaceholder(/Ibrahim Ahmed/i).fill(testData.trainer); await modal.getByPlaceholder(/ibrahim@example/i).fill('hn4717064@gmail.com'); await modal.getByPlaceholder(/Somali National/i).fill('National Digital Academy'); await modal.getByPlaceholder(/Machine Learning/i).fill('Digital Literacy'); await modal.getByPlaceholder(/Short professional bio/i).fill('Test trainer for the complete browser workflow.'); await modal.getByRole('button', { name: /Save Profile/i }).click(); await page.getByText(testData.trainer).waitFor();
  });
  await step('06-create-moderator', async () => {
    await page.getByRole('link', { name: 'Moderator Accounts', exact: true }).click(); await page.getByRole('button', { name: /Create Moderator Account/i }).click(); const modal = page.getByRole('heading', { name: /Create Moderator Account/i }).locator('..'); const inputs = modal.locator('input');
    await inputs.nth(0).fill(moderator.name); await inputs.nth(1).fill(moderator.email); await inputs.nth(2).fill(moderator.password); await inputs.nth(3).fill(moderator.phone); await modal.getByRole('button', { name: /Create Account/i }).click(); await page.getByRole('cell', { name: moderator.email }).waitFor();
  });
  await step('07-create-training', async () => {
    await page.getByRole('link', { name: 'Training Sessions', exact: true }).click(); await page.getByRole('button', { name: /Create New Training Session/i }).click(); const modal = page.getByRole('heading', { name: /Create New Training Session/i }).locator('..');
    await modal.getByPlaceholder(/Introduction to Machine/i).fill(testData.training); const selects = modal.locator('select'); await selects.nth(0).selectOption({ label: testData.event }); await selects.nth(1).selectOption({ label: 'Day 1: Digital Skills Day' }); await selects.nth(2).selectOption({ label: testData.category }); await selects.nth(3).selectOption({ label: testData.trainer }); await selects.nth(4).selectOption({ label: moderator.name });
    const date = modal.locator('input[type="date"]'); await date.fill('2027-08-09'); const texts = modal.locator('input[type="text"]'); await texts.nth(1).fill('09:00 AM'); await texts.nth(2).fill('11:00 AM'); await modal.locator('textarea').fill('End-to-end workflow training session.'); await modal.getByRole('button', { name: /Save Training Session/i }).click(); await page.getByText(testData.training).waitFor();
    await page.locator('select.admin-status-select').selectOption('registration_open'); await page.getByText(/Status updated/i).waitFor({ timeout: 10000 }).catch(() => {});
  });
  await step('08-participant-sign-up', async () => {
    await signOut(); await page.goto('http://localhost:5173/signup'); await page.getByPlaceholder(/Abdi Mohamed/i).fill(participant.name); await page.getByPlaceholder('abdi@example.com').fill(participant.email); const pw = page.locator('input[name="password"]'); await pw.fill(participant.password); await page.locator('input[name="confirmPassword"]').fill(participant.password); await page.locator('input[name="phone"]').fill(participant.phone); await page.locator('select[name="gender"]').selectOption('male'); await page.locator('select[name="region"]').selectOption('Banaadir'); await page.getByRole('button', { name: /Complete Registration/i }).click(); await page.waitForURL(/\/portal/);
  });
  await step('09-participant-registers-pending', async () => {
    await page.goto('http://localhost:5173/trainings'); await page.getByText(testData.training).first().click(); await page.getByRole('button', { name: /Register for Session/i }).click(); await page.getByText('Status: pending', { exact: true }).waitFor({ timeout: 30000 });
  });
  await step('10-admin-approves-registration', async () => {
    await page.goto('http://localhost:5173/portal'); await signOut(); await signIn(adminEmail, adminPassword); await page.getByRole('link', { name: /^Registrations$/i }).click(); const row = page.getByRole('row').filter({ hasText: participant.email }); await row.getByRole('button', { name: /Approve/i }).click(); await row.getByText(/approved/i).waitFor({ timeout: 30000 });
  });
} catch (error) {
  report.fatal = error.message;
} finally {
  report.finishedAt = new Date().toISOString();
  fs.writeFileSync(path.join(artifacts, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close();
  console.log(JSON.stringify(report, null, 2));
}
