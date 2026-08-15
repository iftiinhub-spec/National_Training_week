import { expect, test } from '@playwright/test';
import fs from 'node:fs';

const fixtures = JSON.parse(fs.readFileSync(process.env.E2E_FIXTURE_PATH, 'utf8'));
const apiUrl = (path) => `${process.env.E2E_API_URL}${path}`;

const accounts = {
  admin: { email: 'admin.e2e@example.com', password: 'AdminE2E123!' },
  moderator: { email: 'moderator.e2e@example.com', password: 'ModeratorE2E123!' },
  trainer: { email: 'trainer.e2e@example.com', password: 'TrainerE2E123!' },
  participant: { email: `participant.${Date.now()}@example.com`, password: 'ParticipantE2E123!' },
};

const apiLogin = async (request, account) => {
  const response = await request.post(apiUrl('/api/auth/login'), { data: account });
  const payload = await response.json();
  expect(response.ok(), `${account.email}: ${payload.message || response.statusText()}`).toBeTruthy();
  return payload.data;
};

const authorized = (token) => ({ Authorization: `Bearer ${token}` });

test('complete participant-to-certificate workflow', async ({ page, request }) => {
  test.setTimeout(90_000);

  await test.step('participant creates an account in the browser', async () => {
    await page.goto('/signup');
    await page.getByPlaceholder('e.g. Abdi Mohamed Hassan').fill('Browser Test Participant');
    await page.getByPlaceholder('abdi@example.com').fill(accounts.participant.email);
    await page.locator('input[name="password"]').fill(accounts.participant.password);
    await page.locator('input[name="confirmPassword"]').fill(accounts.participant.password);
    await page.getByPlaceholder('Phone number').fill('612345678');
    await page.locator('select[name="gender"]').selectOption('male');
    await page.locator('select[name="region"]').selectOption('Banaadir');
    await page.locator('select[name="participantType"]').selectOption('general_public');
    await page.locator('input[name="profession"]').fill('Software Tester');
    const signupResponse = page.waitForResponse((response) => response.url().includes('/api/auth/register'));
    await page.getByRole('button', { name: 'Complete Registration' }).click();
    const response = await signupResponse;
    const payload = await response.json();
    expect(response.status(), payload.message).toBe(201);
    await expect(page).toHaveURL(/\/signin$/);
    await expect(page.getByText(/Account created successfully/i)).toBeVisible();
  });

  await test.step('participant signs in through the browser', async () => {
    await page.getByPlaceholder('name@domain.com').fill(accounts.participant.email);
    await page.locator('input[type="password"]').fill(accounts.participant.password);
    await page.getByRole('button', { name: /Sign In to Portal/i }).click();
    await expect(page).toHaveURL(/\/portal/);
    await expect(page.getByText(/Browser Test Participant/i).first()).toBeVisible();
  });

  const participantAuth = await apiLogin(request, accounts.participant);
  const adminAuth = await apiLogin(request, accounts.admin);
  const moderatorAuth = await apiLogin(request, accounts.moderator);

  const training = { _id: fixtures.trainingId, title: 'E2E Complete Workflow Session' };
  const fixtureResponse = await request.get(apiUrl(`/api/admin/trainings/${training._id}`), {
    headers: authorized(adminAuth.token),
  });
  const fixturePayload = await fixtureResponse.json();
  expect(fixtureResponse.ok(), fixturePayload.message).toBeTruthy();

  await test.step('participant registers and admin approves', async () => {
    const registrationResponse = await request.post(apiUrl('/api/participant/registrations'), {
      headers: authorized(participantAuth.token), data: { trainingId: training._id },
    });
    const registrationPayload = await registrationResponse.json();
    expect(registrationResponse.status(), registrationPayload.message).toBe(201);

    const registrationsResponse = await request.get(apiUrl(`/api/admin/registrations?training=${training._id}`), {
      headers: authorized(adminAuth.token),
    });
    expect(registrationsResponse.ok()).toBeTruthy();
    const payload = await registrationsResponse.json();
    const registrations = payload.data?.items || payload.data || [];
    const registration = registrations.find((item) => item.participant?.email === accounts.participant.email);
    expect(registration).toBeTruthy();

    const approvalResponse = await request.patch(apiUrl(`/api/admin/registrations/${registration._id}/status`), {
      headers: authorized(adminAuth.token), data: { status: 'approved' },
    });
    expect(approvalResponse.ok()).toBeTruthy();
  });

  let qrUrl;
  await test.step('moderator releases meeting and opens QR attendance', async () => {
    const meetingResponse = await request.post(apiUrl(`/api/moderator/trainings/${training._id}/meeting`), {
      headers: authorized(moderatorAuth.token),
      data: { platform: 'google_meet', meetingUrl: 'https://meet.google.com/e2e-test-room', notes: 'Isolated E2E meeting.' },
    });
    expect(meetingResponse.status()).toBe(201);
    const releaseResponse = await request.patch(apiUrl(`/api/moderator/trainings/${training._id}/meeting/release`), {
      headers: authorized(moderatorAuth.token), data: { isReleased: true },
    });
    expect(releaseResponse.ok()).toBeTruthy();
    const qrResponse = await request.post(apiUrl(`/api/moderator/trainings/${training._id}/qr-session/open`), {
      headers: authorized(moderatorAuth.token),
    });
    expect(qrResponse.ok()).toBeTruthy();
    const qr = (await qrResponse.json()).data;
    qrUrl = `/qr-checkin?t=${encodeURIComponent(training._id)}&s=${encodeURIComponent(qr.session.sessionToken)}`;
  });

  await test.step('participant checks in through the browser QR page', async () => {
    await page.goto(qrUrl);
    await page.getByRole('button', { name: /Confirm check-in/i }).click();
    await expect(page.getByText(/check-in successful|attendance.*confirmed/i)).toBeVisible();
  });

  await test.step('moderator completes the session and worker issues certificates', async () => {
    const completionResponse = await request.post(apiUrl(`/api/moderator/trainings/${training._id}/complete`), {
      headers: authorized(moderatorAuth.token),
    });
    expect(completionResponse.ok()).toBeTruthy();

    await expect.poll(async () => {
      const response = await request.get(apiUrl(`/api/admin/certificates/jobs/${training._id}`), { headers: authorized(adminAuth.token) });
      if (!response.ok()) return 'not-ready';
      return (await response.json()).data?.job?.status;
    }, { timeout: 30_000 }).toBe('completed');
  });

  let certificate;
  await test.step('participant sees and downloads the issued certificate', async () => {
    await page.goto('/portal/certificates');
    await expect(page.getByText('E2E Complete Workflow Session')).toBeVisible();

    const certificatesResponse = await request.get(apiUrl('/api/participant/certificates'), {
      headers: authorized(participantAuth.token),
    });
    expect(certificatesResponse.ok()).toBeTruthy();
    const payload = await certificatesResponse.json();
    const certificates = payload.data?.certificates || payload.data || [];
    certificate = certificates.find((item) => item.training?.title === 'E2E Complete Workflow Session');
    expect(certificate).toBeTruthy();

    const download = await request.get(apiUrl(`/api/participant/certificates/${certificate._id}/download`), {
      headers: authorized(participantAuth.token),
    });
    expect(download.ok()).toBeTruthy();
    expect(download.headers()['content-type']).toContain('application/pdf');
    expect((await download.body()).length).toBeGreaterThan(1_000);
  });

  await test.step('certificate is publicly verifiable and trainer certificate exists', async () => {
    const verification = await request.get(apiUrl(`/api/public/verify/${certificate.certificateId}`));
    expect(verification.ok()).toBeTruthy();
    expect((await verification.json()).data?.valid).toBe(true);

    const trainerAuth = await apiLogin(request, accounts.trainer);
    const trainerCertificates = await request.get(apiUrl('/api/trainer/certificates'), {
      headers: authorized(trainerAuth.token),
    });
    expect(trainerCertificates.ok()).toBeTruthy();
    const payload = await trainerCertificates.json();
    expect((payload.data?.certificates || []).some((item) => item.training?.title === 'E2E Complete Workflow Session')).toBe(true);
  });
});
