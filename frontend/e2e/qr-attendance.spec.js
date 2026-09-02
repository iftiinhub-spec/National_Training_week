import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import mongoose from '../../backend/node_modules/mongoose/index.js';
import Event from '../../backend/src/models/Event.js';
import EventDay from '../../backend/src/models/EventDay.js';
import Training from '../../backend/src/models/Training.js';
import Registration from '../../backend/src/models/Registration.js';
import Attendance from '../../backend/src/models/Attendance.js';
import QRSession from '../../backend/src/models/QRSession.js';
import User from '../../backend/src/models/User.js';

const backendEnv = fs.readFileSync(new URL('../../backend/.env', import.meta.url), 'utf8');
const envValue = (key) => backendEnv.match(new RegExp(`^${key}=(.*)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const apiBase = process.env.E2E_API_URL || 'http://localhost:5113';
const password = 'QrAttendanceE2E123!';
const runId = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
const participantEmail = `qr-attendance-${runId}@example.com`;
const created = {};

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });
const eatDate = (date) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Africa/Nairobi', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(date);
const eatTime = (date) => new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Africa/Nairobi', hour: '2-digit', minute: '2-digit', hour12: false,
}).format(date);

test.beforeAll(async () => {
  await mongoose.connect(envValue('MONGODB_URI'));
  const event = await Event.findOne({}).sort({ createdAt: -1 });
  const eventDay = await EventDay.findOne({ event: event?._id }).sort({ dayNumber: 1 });
  if (!event || !eventDay) throw new Error('A local event and event day are required for the QR test.');

  const participant = await User.create({
    fullName: 'QR Attendance Test Participant',
    email: participantEmail,
    passwordHash: password,
    role: 'participant',
    phone: '+252612345678',
    gender: 'male',
    region: 'Banaadir',
    participantType: 'general_public',
    profession: 'Tester',
    accountStatus: 'approved',
  });

  const now = new Date();
  const training = await Training.create({
    title: `QR Attendance E2E ${runId}`,
    event: event._id,
    eventDay: eventDay._id,
    date: `${eatDate(now)}T00:00:00.000Z`,
    startTime: eatTime(new Date(now.getTime() - 5 * 60_000)),
    endTime: eatTime(new Date(now.getTime() + 20 * 60_000)),
    status: 'published',
    capacity: 5,
  });
  const registration = await Registration.create({ participant: participant._id, training: training._id, status: 'approved' });
  Object.assign(created, { participant, training, registration });
});

test.afterAll(async () => {
  if (created.training?._id) {
    await Promise.all([
      QRSession.deleteMany({ training: created.training._id }),
      Attendance.deleteMany({ training: created.training._id }),
      Registration.deleteMany({ training: created.training._id }),
    ]);
    await Training.deleteOne({ _id: created.training._id });
  }
  if (created.participant?._id) await User.deleteOne({ _id: created.participant._id });
  await mongoose.disconnect();
});

test('rotating QR checks in an approved participant and rejects unsafe reuse', async ({ page, request }) => {
  test.setTimeout(90_000);

  const adminLogin = await request.post(`${apiBase}/api/auth/login`, {
    data: { email: envValue('ADMIN_EMAIL'), password: envValue('ADMIN_PASSWORD') },
  });
  expect(adminLogin.ok(), await adminLogin.text()).toBeTruthy();
  const adminToken = (await adminLogin.json()).data.token;

  const participantLogin = await request.post(`${apiBase}/api/auth/login`, {
    data: { email: participantEmail, password },
  });
  expect(participantLogin.ok(), await participantLogin.text()).toBeTruthy();
  const participantAuth = (await participantLogin.json()).data;

  const openedResponse = await request.post(`${apiBase}/api/admin/trainings/${created.training._id}/qr-session/open`, {
    headers: authHeaders(adminToken),
  });
  expect(openedResponse.ok(), await openedResponse.text()).toBeTruthy();
  const opened = (await openedResponse.json()).data;
  expect(opened.checkUrl).toContain('/qr-checkin?');
  expect(opened.checkUrl).toContain('&c=');
  expect(opened).not.toHaveProperty('secret');
  expect(opened.session).not.toHaveProperty('secret');

  const firstUrl = new URL(opened.checkUrl);
  const firstCode = firstUrl.searchParams.get('c');
  await page.waitForTimeout((opened.secondsLeftInStep + 1) * 1_000);

  const currentResponse = await request.get(`${apiBase}/api/admin/trainings/${created.training._id}/qr-session/current`, {
    headers: authHeaders(adminToken),
  });
  expect(currentResponse.ok(), await currentResponse.text()).toBeTruthy();
  const current = (await currentResponse.json()).data;
  const currentUrl = new URL(current.checkUrl);
  expect(currentUrl.searchParams.get('c')).not.toBe(firstCode);
  expect(current).not.toHaveProperty('secret');

  await page.addInitScript(({ token, user }) => {
    localStorage.setItem('ntw_token', token);
    localStorage.setItem('ntw_user', JSON.stringify(user));
  }, participantAuth);
  await page.goto(`${currentUrl.pathname}${currentUrl.search}`);
  await expect(page.getByRole('heading', { name: 'Confirm your attendance' })).toBeVisible();
  await page.getByRole('button', { name: 'Confirm check-in' }).click();
  await expect(page.getByText(/attendance confirmed/i)).toBeVisible();

  const attendance = await Attendance.findOne({ participant: created.participant._id, training: created.training._id }).lean();
  expect(attendance?.status).toBe('present');
  expect(attendance?.method).toBe('qr');

  const duplicateResponse = await request.post(`${apiBase}/api/participant/qr-checkin`, {
    headers: authHeaders(participantAuth.token),
    data: {
      trainingId: String(created.training._id),
      sessionToken: currentUrl.searchParams.get('s'),
      code: currentUrl.searchParams.get('c'),
    },
  });
  expect(duplicateResponse.status()).toBe(409);

  const invalidCodeResponse = await request.post(`${apiBase}/api/participant/qr-checkin`, {
    headers: authHeaders(participantAuth.token),
    data: {
      trainingId: String(created.training._id),
      sessionToken: currentUrl.searchParams.get('s'),
      code: 'invalidcode12',
    },
  });
  expect(invalidCodeResponse.status()).toBe(400);
  expect((await invalidCodeResponse.json()).message).toMatch(/expired|currently on screen/i);

  const closeResponse = await request.post(`${apiBase}/api/admin/trainings/${created.training._id}/qr-session/close`, {
    headers: authHeaders(adminToken),
  });
  expect(closeResponse.ok()).toBeTruthy();

  const closedCurrentResponse = await request.get(`${apiBase}/api/admin/trainings/${created.training._id}/qr-session/current`, {
    headers: authHeaders(adminToken),
  });
  expect(closedCurrentResponse.status()).toBe(404);
});
