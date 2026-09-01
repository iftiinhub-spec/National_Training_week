import ApprovalEmailDigest from '../models/ApprovalEmailDigest.js';
import { createHash } from 'node:crypto';
import { enqueueEmail } from './emailQueue.js';
import { emailButton, emailLayout, escapeHtml } from '../utils/email.js';

const windowMs = Math.max(60_000, Number(process.env.APPROVAL_DIGEST_WINDOW_MS) || 30 * 60_000);
const staleMs = 10 * 60_000;

const normalizedEmail = (value) => String(value || '').trim().toLowerCase();
const timeLabel = (value) => {
  if (!value) return '';
  const [hour, minute] = String(value).split(':').map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return String(value);
  const date = new Date(); date.setHours(hour, minute, 0, 0);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};
const dateLabel = (value) => value ? new Date(value).toLocaleDateString('en-US', { timeZone: 'Africa/Nairobi', dateStyle: 'medium' }) : 'Date to be confirmed';

export const queueApprovalDigest = async ({ to, participantName, trainingId, trainingTitle, date, startTime }) => {
  const recipient = normalizedEmail(to);
  if (!recipient || !trainingId) return { success: false, queued: false, error: 'A recipient and training ID are required for an approval digest.' };
  const scheduledAt = new Date(Date.now() + windowMs);
  const update = {
    $set: { participantName: participantName || 'Participant' },
    $setOnInsert: { scheduledAt },
    $addToSet: { items: { training: trainingId, title: trainingTitle, date: date || null, startTime: startTime || '' } },
  };
  let digest;
  try {
    digest = await ApprovalEmailDigest.findOneAndUpdate({ recipient }, update, { new: true, upsert: true, runValidators: true });
  } catch (error) {
    if (error.code !== 11000) throw error;
    digest = await ApprovalEmailDigest.findOneAndUpdate({ recipient }, update, { new: true, runValidators: true });
  }
  return { success: true, queued: true, digest: true, scheduledAt: digest.scheduledAt, count: 1, queueId: digest._id };
};

const digestHtml = (digest) => {
  const rows = digest.items.map((item) => `<tr><td style="padding:14px 0;border-bottom:1px solid #e2e8f0"><strong style="color:#0f172a">${escapeHtml(item.title)}</strong><br><span style="color:#64748b;font-size:13px">${escapeHtml(dateLabel(item.date))}${item.startTime ? ` &middot; ${escapeHtml(timeLabel(item.startTime))}` : ''}</span></td></tr>`).join('');
  const count = digest.items.length;
  return emailLayout({
    eyebrow: 'Places confirmed',
    title: count === 1 ? 'Your registration is approved' : `${count} registrations approved`,
    preview: `You have ${count} approved training ${count === 1 ? 'session' : 'sessions'}.`,
    body: `<p style="margin-top:0">Hello ${escapeHtml(digest.participantName || 'Participant')},</p><p>Your registration approval${count === 1 ? ' is' : 's are'} confirmed for the following ${count === 1 ? 'session' : 'sessions'}:</p><table role="presentation" style="width:100%;border-collapse:collapse;margin:12px 0 20px">${rows}</table><p>Meeting access will appear in your participant portal when it is released.</p>${emailButton('View my trainings', `${process.env.FRONTEND_URL}/portal/trainings`)}`,
  });
};

export const materializeNextApprovalDigest = async () => {
  const now = new Date();
  await ApprovalEmailDigest.updateMany(
    { status: 'processing', lockedAt: { $lt: new Date(Date.now() - staleMs) } },
    { $set: { status: 'collecting', lockedAt: null } },
  );
  const digest = await ApprovalEmailDigest.findOneAndUpdate(
    { status: 'collecting', scheduledAt: { $lte: now }, 'items.0': { $exists: true } },
    { $set: { status: 'processing', lockedAt: now } },
    { new: true, sort: { scheduledAt: 1 } },
  );
  if (!digest) return null;
  const itemIds = digest.items.map((item) => item.training);
  const batchKey = createHash('sha256').update(itemIds.map(String).sort().join('|')).digest('hex').slice(0, 24);
  try {
    const result = await enqueueEmail({
      to: digest.recipient,
      category: 'approval',
      subject: digest.items.length === 1 ? `Registration approved: ${digest.items[0].title}` : `${digest.items.length} training registrations approved`,
      html: digestHtml(digest),
      dedupeKey: `approval-digest:${digest._id}:${batchKey}`,
    });
    const remaining = await ApprovalEmailDigest.findOneAndUpdate(
      { _id: digest._id },
      { $pull: { items: { training: { $in: itemIds } } } },
      { new: true },
    );
    if (!remaining?.items.length) {
      // Delete only if another approval was not added after the pull. This
      // conditional prevents a just-arrived approval from being lost at the
      // exact moment the previous digest is finalized.
      const deleted = await ApprovalEmailDigest.deleteOne({ _id: digest._id, 'items.0': { $exists: false } });
      if (!deleted.deletedCount) await ApprovalEmailDigest.updateOne({ _id: digest._id }, { $set: { status: 'collecting', scheduledAt: new Date(Date.now() + windowMs), lockedAt: null } });
    } else {
      await ApprovalEmailDigest.updateOne({ _id: digest._id }, { $set: { status: 'collecting', scheduledAt: new Date(Date.now() + windowMs), lockedAt: null } });
    }
    return result;
  } catch (error) {
    await ApprovalEmailDigest.updateOne({ _id: digest._id }, { $set: { status: 'collecting', scheduledAt: new Date(Date.now() + 60_000), lockedAt: null } });
    throw error;
  }
};

export const getApprovalDigestWindowMs = () => windowMs;
