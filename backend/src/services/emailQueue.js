import { createHash, randomUUID } from 'node:crypto';
import EmailOutbox from '../models/EmailOutbox.js';

const priorityByCategory = {
  password_reset: 100, cancellation: 95, schedule_change: 95,
  approval: 80, rejection: 80, invitation: 70, reminder: 65,
  welcome: 45, application_received: 45, certificate: 30,
  announcement: 20, general: 50,
};

const recipients = (to) => (Array.isArray(to) ? to : String(to || '').split(','))
  .map((value) => String(value).trim().toLowerCase()).filter(Boolean);

// Explicit keys (certificates, for example) deduplicate forever. Ordinary
// messages use a short window so double-clicks are safe without blocking a
// legitimate repeat announcement weeks later.
const keyFor = ({ to, subject, html, category, dedupeKey, scheduledAt }) => dedupeKey || createHash('sha256')
  .update(`${category}|${to}|${subject}|${html}|${Math.floor(new Date(scheduledAt).getTime() / 600_000)}`).digest('hex');

export const enqueueEmail = async ({ to, subject, html, text = '', category = 'general', priority, dedupeKey, scheduledAt, expiresAt, relatedModel = '', relatedId = null }) => {
  const queued = [];
  const validRecipients = recipients(to);
  if (!validRecipients.length) return { success: false, queued: false, count: 0, error: 'No valid email recipients were provided.' };
  const deliveryTime = scheduledAt || new Date();
  for (const recipient of validRecipients) {
    const key = keyFor({ to: recipient, subject, html, category, scheduledAt: deliveryTime, dedupeKey: dedupeKey ? `${dedupeKey}:${recipient}` : '' });
    try {
      const message = await EmailOutbox.findOneAndUpdate(
        { dedupeKey: key },
        { $setOnInsert: { to: recipient, subject, html, text, category, priority: priority ?? priorityByCategory[category] ?? 50, dedupeKey: key, scheduledAt: deliveryTime, nextAttemptAt: deliveryTime, expiresAt: expiresAt || null, maxAttempts: Math.max(1, Number(process.env.EMAIL_MAX_ATTEMPTS) || 5), relatedModel, relatedId } },
        { new: true, upsert: true, runValidators: true },
      );
      queued.push(message);
    } catch (error) {
      if (error.code !== 11000) throw error;
      queued.push(await EmailOutbox.findOne({ dedupeKey: key }));
    }
  }
  return { success: true, queued: true, count: queued.length, ids: queued.map((item) => item?._id).filter(Boolean), queueId: queued[0]?._id, messageId: `queued-${randomUUID()}` };
};

export const emailQueuePriorities = priorityByCategory;
