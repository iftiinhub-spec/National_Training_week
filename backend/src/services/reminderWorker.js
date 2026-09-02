import ReminderDelivery from '../models/ReminderDelivery.js';
import Communication from '../models/Communication.js';
import Registration from '../models/Registration.js';
import Training from '../models/Training.js';
import { sendReminderDigestEmail } from '../utils/email.js';
import { getTrainingDateTime } from '../utils/trainingDateTime.js';

const pollInterval = Math.max(60_000, Number(process.env.REMINDER_WORKER_POLL_MS) || 5 * 60_000);
const lookaheadMs = Math.max(60 * 60_000, Number(process.env.REMINDER_DIGEST_LOOKAHEAD_MS) || 24 * 60 * 60_000);
let timer = null;
let running = false;
let stopped = false;

const dateKey = (value) => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(value);
  const part = (type) => parts.find((item) => item.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
};

const claim = async (trainingId) => {
  const retry = await ReminderDelivery.findOneAndUpdate(
    { training: trainingId, type: '24h', status: 'failed' },
    { $set: { status: 'processing', sentAt: null, lastError: '' }, $inc: { attempts: 1 } },
    { new: true },
  );
  if (retry) return retry;
  try {
    return await ReminderDelivery.create({ training: trainingId, type: '24h', status: 'processing', attempts: 1 });
  } catch (error) {
    if (error.code === 11000) return null;
    throw error;
  }
};

const work = async () => {
  if (running || stopped) return;
  running = true;
  const claimed = [];
  try {
    const now = new Date();
    const published = await Training.find({ status: 'published' })
      .populate('trainer', 'name email')
      .populate('trainers', 'name email')
      .populate('moderator', 'fullName email')
      .lean();
    const future = published.map((training) => ({ training, startsAt: getTrainingDateTime(training.date, training.startTime) }))
      .filter(({ startsAt }) => startsAt && startsAt > now);
    const seed = future
      .filter(({ startsAt }) => startsAt.getTime() - now.getTime() <= lookaheadMs)
      .sort((a, b) => a.startsAt - b.startsAt)[0];
    if (!seed) return;

    const targetDate = dateKey(seed.startsAt);
    const daySessions = future.filter(({ startsAt }) => dateKey(startsAt) === targetDate);
    for (const item of daySessions) {
      const delivery = await claim(item.training._id);
      if (delivery) claimed.push({ ...item, delivery });
    }
    if (!claimed.length) return;

    const recipients = new Map();
    for (const item of claimed) {
      const registrations = await Registration.find({ training: item.training._id, status: 'approved' })
        .populate('participant', 'fullName email').lean();
      const people = [
        ...registrations.map(({ participant }) => ({ name: participant?.fullName, email: participant?.email })),
        ...(item.training.trainers || []).map((trainer) => ({ name: trainer?.name, email: trainer?.email })),
        ...(item.training.trainer ? [{ name: item.training.trainer.name, email: item.training.trainer.email }] : []),
        ...(item.training.moderator ? [{ name: item.training.moderator.fullName, email: item.training.moderator.email }] : []),
      ];
      for (const person of people) {
        const email = String(person.email || '').trim().toLowerCase();
        if (!email) continue;
        if (!recipients.has(email)) recipients.set(email, { to: email, recipientName: person.name || 'Participant', sessions: [] });
        const recipient = recipients.get(email);
        if (!recipient.sessions.some((session) => String(session.trainingId) === String(item.training._id))) {
          recipient.sessions.push({ trainingId: item.training._id, trainingTitle: item.training.title, startTime: item.startsAt });
        }
      }
    }

    let failed = 0;
    for (const recipient of recipients.values()) {
      const result = await sendReminderDigestEmail({ ...recipient, dateKey: targetDate });
      if (!result.success) failed += 1;
    }
    const status = recipients.size && failed < recipients.size ? 'sent' : 'failed';
    const error = failed ? `${failed} reminder summary email(s) could not be queued.` : '';
    await ReminderDelivery.updateMany(
      { _id: { $in: claimed.map(({ delivery }) => delivery._id) } },
      { $set: { status, sentAt: status === 'sent' ? new Date() : null, lastError: error } },
    );
    await Promise.all(claimed.map(({ training }) => Communication.create({
      training: training._id,
      type: 'reminder',
      recipientType: 'automatic',
      recipients: [...recipients.values()].filter((recipient) => recipient.sessions.some((session) => String(session.trainingId) === String(training._id))).map((recipient) => recipient.to),
      subject: `Daily schedule summary: ${targetDate}`,
      body: 'This session was included in a consolidated daily reminder summary.',
      deliveryStatus: recipients.size ? (failed ? 'partial' : 'queued') : 'failed',
      failedRecipients: [],
    })));
  } catch (error) {
    if (claimed.length) await ReminderDelivery.updateMany(
      { _id: { $in: claimed.map(({ delivery }) => delivery._id) } },
      { $set: { status: 'failed', lastError: String(error.message || error).slice(0, 500) } },
    ).catch(() => {});
    console.error('Automatic reminder summary failed:', error.message);
  } finally {
    running = false;
  }
};

export const startReminderWorker = () => {
  if (timer || process.env.DISABLE_REMINDER_WORKER === 'true') return;
  stopped = false;
  timer = setInterval(() => { void work(); }, pollInterval);
  timer.unref();
  void work();
};

export const stopReminderWorker = async () => {
  stopped = true;
  if (timer) clearInterval(timer);
  timer = null;
  while (running) await new Promise((resolve) => setTimeout(resolve, 50));
};
