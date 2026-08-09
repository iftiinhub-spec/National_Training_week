import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd(), '..');
const output = path.join(process.cwd(), 'test-results', 'dark-mode');
fs.mkdirSync(output, { recursive: true });
const env = fs.readFileSync(path.join(root, 'backend', '.env'), 'utf8');
const envValue = (key) => env.match(new RegExp(`^${key}=(.*)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const workflow = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'test-results', 'full-workflow', 'report.json'), 'utf8'));
const baseUrl = 'http://localhost:5173';
const checks = [];
const check = (condition, message) => { if (!condition) throw new Error(message); checks.push(message); };

const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });

const login = async (request, email, password) => {
  const response = await request.post(`${baseUrl}/api/auth/login`, { data: { email, password } });
  check(response.ok(), `Login succeeds for ${email}`);
  return (await response.json()).data;
};

const openAuthenticatedTheme = async ({ name, path: route, email, password, width = 1440, height = 1000 }) => {
  const context = await browser.newContext({ viewport: { width, height } });
  const auth = await login(context.request, email, password);
  const page = await context.newPage();
  await page.addInitScript(({ token, user }) => {
    localStorage.setItem('ntw_token', token);
    localStorage.setItem('ntw_user', JSON.stringify(user));
    localStorage.setItem('ntw_theme', 'dark');
  }, auth);
  await page.goto(`${baseUrl}${route}`);
  await page.waitForLoadState('networkidle');
  check(await page.locator('html.dark').count() === 1, `${name} applies the dark theme`);
  check(await page.getByRole('button', { name: 'Switch to light mode' }).first().isVisible(), `${name} displays the theme toggle`);
  const bodyBackground = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  check(bodyBackground !== 'rgb(255, 255, 255)', `${name} uses a non-white dark background`);
  const logoAppearance = await page.locator('img[src="/logo.png"]').first().evaluate((logo) => {
    const style = getComputedStyle(logo);
    return { background: style.backgroundColor, filter: style.filter };
  });
  check(logoAppearance.background === 'rgba(0, 0, 0, 0)' && logoAppearance.filter !== 'none', `${name} uses the transparent white logo treatment`);
  if (name === 'admin') {
    const inactiveItem = page.getByRole('link', { name: 'Events & Days', exact: true });
    await inactiveItem.hover();
    await page.waitForTimeout(250);
    const hoverBackground = await inactiveItem.evaluate((item) => getComputedStyle(item).backgroundColor);
    check(hoverBackground === 'rgb(30, 41, 59)', `Admin sidebar hover remains dark and readable (${hoverBackground})`);
    const signOut = page.getByRole('button', { name: 'Sign Out', exact: true });
    await signOut.hover();
    await page.waitForTimeout(250);
    const signOutHover = await signOut.evaluate((button) => {
      const style = getComputedStyle(button);
      return { background: style.backgroundColor, color: style.color };
    });
    check(signOutHover.background === 'rgb(58, 23, 32)' && signOutHover.color === 'rgb(251, 113, 133)', `Admin Sign Out hover uses an accessible dark danger state (${signOutHover.background}, ${signOutHover.color})`);
  }
  await page.screenshot({ path: path.join(output, `${name}.png`), fullPage: true });
  await context.close();
};

try {
  const publicContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const publicPage = await publicContext.newPage();
  await publicPage.goto(`${baseUrl}/about`);
  await publicPage.getByRole('button', { name: 'Switch to dark mode' }).click();
  check(await publicPage.locator('html.dark').count() === 1, 'Public toggle enables dark mode');
  await publicPage.reload();
  check(await publicPage.locator('html.dark').count() === 1, 'Public dark-mode choice persists after reload');
  check(await publicPage.getByRole('button', { name: 'Switch to light mode' }).isVisible(), 'Mobile public header shows the active theme control');
  await publicPage.screenshot({ path: path.join(output, 'public-mobile.png'), fullPage: true });
  await publicPage.goto(`${baseUrl}/`);
  const recordingsButton = publicPage.getByRole('link', { name: 'Watch Recordings', exact: true });
  await recordingsButton.hover();
  await publicPage.waitForTimeout(250);
  const recordingButtonColor = await recordingsButton.evaluate((button) => getComputedStyle(button).color);
  check(recordingButtonColor === 'rgb(248, 250, 252)', `Watch Recordings remains readable on dark hover (${recordingButtonColor})`);
  await publicContext.close();

  await openAuthenticatedTheme({ name: 'admin', path: '/admin', email: envValue('ADMIN_EMAIL'), password: envValue('ADMIN_PASSWORD') });
  await openAuthenticatedTheme({ name: 'participant-mobile', path: '/portal', email: 'ibrahimkhaliil5280@gmail.com', password: 'Participant123!', width: 390, height: 844 });
  await openAuthenticatedTheme({ name: 'moderator', path: '/moderator', email: workflow.testData.moderatorEmail, password: 'Moderator123!' });

  fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify({ passed: true, checks }, null, 2));
  console.log(JSON.stringify({ passed: true, checks: checks.length }));
} finally {
  await browser.close();
}
