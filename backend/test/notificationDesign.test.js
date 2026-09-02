import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import CertificateEmailDigest from '../src/models/CertificateEmailDigest.js';
import EmailOutbox from '../src/models/EmailOutbox.js';
import { sendReminderDigestEmail } from '../src/utils/email.js';

test('empty reminder summaries are rejected before an outbox message is created', async () => {
  const result = await sendReminderDigestEmail({ to: 'person@example.com', dateKey: '2026-09-02', sessions: [] });
  assert.equal(result.success, false);
  assert.equal(result.queued, false);
});

test('certificate digests require certificate references and support multiple items', async () => {
  const digest = new CertificateEmailDigest({
    recipient: 'person@example.com',
    scheduledAt: new Date(),
    items: [
      { certificate: new mongoose.Types.ObjectId(), trainingTitle: 'Session One', certificateId: 'NTW-2026-ONE' },
      { certificate: new mongoose.Types.ObjectId(), trainingTitle: 'Session Two', certificateId: 'NTW-2026-TWO' },
    ],
  });
  await digest.validate();
  assert.equal(digest.items.length, 2);
});

test('the outbox accepts consolidated certificate messages', async () => {
  const message = new EmailOutbox({
    to: 'person@example.com',
    subject: 'Certificates ready',
    html: '<p>Ready</p>',
    dedupeKey: 'certificate-digest-test',
    relatedModel: 'CertificateDigest',
    relatedId: new mongoose.Types.ObjectId(),
  });
  await message.validate();
  assert.equal(message.relatedModel, 'CertificateDigest');
});
