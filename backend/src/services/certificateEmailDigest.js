import { createHash } from 'node:crypto';
import CertificateEmailDigest from '../models/CertificateEmailDigest.js';
import { enqueueEmail } from './emailQueue.js';
import { emailButton, emailLayout, escapeHtml } from '../utils/email.js';

const windowMs = Math.max(60_000, Number(process.env.CERTIFICATE_DIGEST_WINDOW_MS) || 60 * 60_000);
const staleMs = 10 * 60_000;

export const queueCertificateDigest = async ({ to, participantName, certificate, trainingTitle, certificateId }) => {
  const recipient = String(to || '').trim().toLowerCase();
  if (!recipient || !certificate || !certificateId) return { success: false, queued: false, error: 'Certificate digest details are incomplete.' };
  const item = { certificate, trainingTitle, certificateId };
  const addToDigest = async (digest) => {
    await CertificateEmailDigest.updateOne(
      { _id: digest._id, 'items.certificate': { $ne: certificate } },
      { $set: { participantName: participantName || 'Participant' }, $push: { items: item } },
    );
    return { success: true, queued: true, digest: true, queueId: digest._id, scheduledAt: digest.scheduledAt };
  };
  const existing = await CertificateEmailDigest.findOne({ recipient, status: 'collecting' }).sort({ createdAt: -1 });
  if (existing) return addToDigest(existing);
  let digest;
  try {
    digest = await CertificateEmailDigest.create({
      recipient,
      participantName: participantName || 'Participant',
      items: [item],
      scheduledAt: new Date(Date.now() + windowMs),
    });
  } catch (error) {
    if (error.code !== 11000) throw error;
    const concurrent = await CertificateEmailDigest.findOne({ recipient, status: 'collecting' });
    if (!concurrent) throw error;
    return addToDigest(concurrent);
  }
  return { success: true, queued: true, digest: true, queueId: digest._id, scheduledAt: digest.scheduledAt };
};

const digestHtml = (digest) => {
  const rows = digest.items.map((item) => `<tr><td style="padding:14px 0;border-bottom:1px solid #e2e8f0"><strong style="color:#0f172a">${escapeHtml(item.trainingTitle)}</strong><br><span style="color:#64748b;font-size:13px">Certificate ID: ${escapeHtml(item.certificateId)}</span></td></tr>`).join('');
  const count = digest.items.length;
  return emailLayout({
    eyebrow: 'Verified achievements',
    title: count === 1 ? 'Your certificate is ready' : `${count} certificates are ready`,
    preview: `Your National Training Week ${count === 1 ? 'certificate is' : 'certificates are'} available.`,
    body: `<p style="margin-top:0">Hello ${escapeHtml(digest.participantName || 'Participant')},</p><p>Your verified ${count === 1 ? 'certificate is' : 'certificates are'} now available in the participant portal.</p><table role="presentation" style="width:100%;border-collapse:collapse;margin:12px 0 20px">${rows}</table>${emailButton('View my certificates', `${process.env.FRONTEND_URL}/portal/certificates`)}<p>You can view and download every certificate from the portal at any time.</p>`,
  });
};

export const materializeNextCertificateDigest = async () => {
  const now = new Date();
  await CertificateEmailDigest.updateMany(
    { status: 'processing', lockedAt: { $lt: new Date(Date.now() - staleMs) } },
    { $set: { status: 'collecting', lockedAt: null } },
  );
  const digest = await CertificateEmailDigest.findOneAndUpdate(
    { status: 'collecting', scheduledAt: { $lte: now }, 'items.0': { $exists: true } },
    { $set: { status: 'processing', lockedAt: now } },
    { new: true, sort: { scheduledAt: 1 } },
  );
  if (!digest) return null;
  const key = createHash('sha256').update(digest.items.map((item) => String(item.certificate)).sort().join('|')).digest('hex').slice(0, 24);
  try {
    const result = await enqueueEmail({
      to: digest.recipient,
      category: 'certificate',
      subject: digest.items.length === 1 ? 'Your National Training Week certificate is ready' : `${digest.items.length} National Training Week certificates are ready`,
      html: digestHtml(digest),
      dedupeKey: `certificate-digest:${digest._id}:${key}`,
      relatedModel: 'CertificateDigest',
      relatedId: digest._id,
    });
    await CertificateEmailDigest.updateOne({ _id: digest._id }, { $set: { status: 'queued', lockedAt: null, lastError: '' } });
    return result;
  } catch (error) {
    await CertificateEmailDigest.updateOne({ _id: digest._id }, { $set: { status: 'collecting', scheduledAt: new Date(Date.now() + 60_000), lockedAt: null, lastError: String(error.message || error).slice(0, 500) } });
    throw error;
  }
};

export const getCertificateDigestWindowMs = () => windowMs;
