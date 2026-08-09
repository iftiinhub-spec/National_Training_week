import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd(), '..');
const artifacts = path.join(process.cwd(), 'test-results', 'full-workflow');
const previous = JSON.parse(fs.readFileSync(path.join(artifacts, 'report.json'), 'utf8'));
const envText = fs.readFileSync(path.join(root, 'backend', '.env'), 'utf8');
const envValue = (key) => envText.match(new RegExp(`^${key}=(.*)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const accounts = {
  admin: [envValue('ADMIN_EMAIL'), envValue('ADMIN_PASSWORD')],
  moderator: [previous.testData.moderatorEmail, 'Moderator123!'],
  participant: [previous.testData.participantEmail, 'Participant123!'],
};
const training = previous.testData.training;
const report = { startedAt: new Date().toISOString(), completed: [], failures: [], browserErrors: [], failedResponses: [], testData: previous.testData };
const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
page.on('pageerror', (error) => report.browserErrors.push(error.message));
page.on('response', (response) => { if (response.status() >= 400 && response.url().includes('/api/')) report.failedResponses.push({ status: response.status(), url: response.url() }); });
const shot = (name) => page.screenshot({ path: path.join(artifacts, `${name}.png`), fullPage: true });
const step = async (name, action) => { try { await action(); report.completed.push(name); await shot(name); } catch (error) { report.failures.push({ step: name, error: error.message }); await shot(`FAILED-${name}`); throw error; } };
const signIn = async ([email, password], roleUrl) => { await page.goto('http://localhost:5173/signin'); await page.getByPlaceholder('name@domain.com').fill(email); await page.locator('input[type="password"]').fill(password); await page.getByRole('button', { name: /Sign In to Portal/i }).click(); await page.waitForURL(new RegExp(roleUrl)); };
const signOut = async () => { await page.getByRole('button', { name: /Sign Out/i }).click(); await page.waitForURL(/\/signin$/); };

try {
  await step('10-admin-approves-registration', async () => {
    await signIn(accounts.admin, '/admin');
    await page.getByRole('link', { name: /^Registrations$/i }).click();
    const row = page.getByRole('row').filter({ hasText: accounts.participant[0] });
    const approve = row.getByRole('button', { name: /Approve/i });
    if (await approve.count()) await approve.click();
    await row.getByText('Approved', { exact: true }).waitFor({ timeout: 30000 });
  });
  await step('11-moderator-creates-and-releases-meeting', async () => {
    await signOut(); await signIn(accounts.moderator, '/moderator');
    await page.getByRole('link', { name: /^Assigned Sessions$/i }).click();
    const card = page.locator('article').filter({ hasText: training });
    await card.getByRole('link', { name: /Manage session/i }).click();
    await page.getByPlaceholder('https://zoom.us/j/...').fill('https://meet.google.com/pdr-stto-ixp');
    await page.locator('select').filter({ has: page.locator('option[value="google_meet"]') }).selectOption('google_meet');
    await page.getByPlaceholder('e.g. 845 1234 5678').fill('845 1234 5678');
    await page.getByPlaceholder('e.g. 123456').fill('246810');
    await page.getByRole('button', { name: /Create Meeting Details|Update Meeting Details/i }).click();
    await page.getByText(/Meeting (created|updated)!/i).waitFor({ timeout: 30000 });
    const release = page.getByRole('button', { name: /Release to Participants/i });
    if (await release.isVisible()) await release.click();
    await page.getByRole('button', { name: /Hide from Participants/i }).waitFor();
  });
  await step('11b-moderator-sends-participant-invitation', async () => {
    await page.getByRole('button', { name: /Invitations & Communications/i }).click();
    await page.getByRole('button', { name: /Send Invitation Email to Approved Participants/i }).click();
    await page.getByText(/Sent to 1 of 1 participants/i).waitFor({ timeout: 30000 });
  });
  let qrUrl;
  await step('12-moderator-launches-qr-attendance', async () => {
    await page.getByRole('button', { name: /QR & Manual Attendance/i }).click();
    await page.getByRole('button', { name: /Launch Live QR Session/i }).click();
    const tokenText = await page.getByText(/Session Token:/i).textContent();
    const trainingIdText = await page.getByText(/Training ID:/i).textContent();
    const token = tokenText.replace(/Session Token:\s*/i, '').trim();
    const trainingId = trainingIdText.replace(/Training ID:\s*/i, '').trim();
    qrUrl = `http://localhost:5173/qr-checkin?t=${encodeURIComponent(trainingId)}&s=${encodeURIComponent(token)}`;
  });
  await step('13-participant-confirms-qr-check-in', async () => {
    await signOut(); await signIn(accounts.participant, '/portal');
    await page.goto(qrUrl);
    await page.getByRole('button', { name: /Confirm check-in/i }).click();
    await page.getByText(/attendance.*confirmed|check-in.*successful/i).waitFor({ timeout: 30000 });
  });
  await step('14-participant-attendance-record-visible', async () => {
    await page.getByRole('link', { name: /Attendance Records/i }).click();
    await page.getByText(training).waitFor();
  });
  await step('15-admin-reports-render', async () => {
    await signOut(); await signIn(accounts.admin, '/admin');
    await page.getByRole('link', { name: /^Reports$/i }).click();
    await page.getByRole('heading', { name: /Reports/i }).waitFor();
    await page.waitForTimeout(1200);
  });
} catch (error) { report.fatal = error.message; }
finally {
  report.finishedAt = new Date().toISOString();
  fs.writeFileSync(path.join(artifacts, 'continuation-report.json'), JSON.stringify(report, null, 2));
  await browser.close();
  console.log(JSON.stringify(report, null, 2));
}
