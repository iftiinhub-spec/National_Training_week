import ReminderDelivery from '../models/ReminderDelivery.js';
import Communication from '../models/Communication.js';
import Registration from '../models/Registration.js';
import Training from '../models/Training.js';
import { sendReminderEmail } from '../utils/email.js';
import { getTrainingDateTime } from '../utils/trainingDateTime.js';

const pollInterval = Math.max(60_000, Number(process.env.REMINDER_WORKER_POLL_MS) || 5 * 60_000);
const maxAttempts = Math.max(1, Number(process.env.REMINDER_EMAIL_MAX_ATTEMPTS) || 3);
const retryDelay = Math.max(60_000, Number(process.env.REMINDER_RETRY_DELAY_MS) || 30 * 60_000);
const processingStaleAfter = Math.max(5 * 60_000, Number(process.env.REMINDER_PROCESSING_STALE_MS) || 30 * 60_000);
const reminderWindows = [{ type: '1h', milliseconds: 60 * 60 * 1000 }, { type: '24h', milliseconds: 24 * 60 * 60 * 1000 }];
let timer = null;
let running = false;
let stopped = false;

const claimReminder = async (trainingId, type) => {
  const now = new Date();
  const staleBefore = new Date(now.getTime() - processingStaleAfter);
  const claimed = await ReminderDelivery.findOneAndUpdate(
    {
      training: trainingId,
      type,
      attempts: { $lt: maxAttempts },
      $or: [
        { status: 'failed', nextAttemptAt: { $lte: now } },
        { status: 'failed', nextAttemptAt: null },
        { status: 'processing', updatedAt: { $lte: staleBefore } },
      ],
    },
    { $set: { status: 'processing', lastError: '', nextAttemptAt: null }, $inc: { attempts: 1 } },
    { new: true },
  );
  if (claimed) return claimed;

  const existing = await ReminderDelivery.exists({ training: trainingId, type });
  if (existing) return null;
  try {
    return await ReminderDelivery.create({ training: trainingId, type, status: 'processing', attempts: 1 });
  } catch (error) {
    if (error.code !== 11000) throw error;
    return null;
  }
};

const processTraining = async (training) => {
  const startsAt = getTrainingDateTime(training.date, training.startTime);
  if (!startsAt || startsAt <= new Date()) return;
  const remaining = startsAt.getTime() - Date.now();
  const reminder = reminderWindows.find(({ milliseconds }) => remaining <= milliseconds);
  if (!reminder) return;
  let delivery;
  try {
    delivery = await claimReminder(training._id, reminder.type);
    if (!delivery) return;
    const registrations = await Registration.find({ training: training._id, status: 'approved' }).populate('participant', 'email').lean();
    const emails = [...new Set([
      ...registrations.map(({ participant }) => participant?.email),
      ...(training.trainers || []).map((trainer) => trainer?.email),
      training.trainer?.email,
      training.moderator?.email,
    ].filter(Boolean).map((email) => String(email).trim().toLowerCase()))];
    if (!emails.length) throw new Error('No eligible email recipients found.');
    const failed = [];
    const permanentlyFailed = [];
    for (const email of emails) {
      const result = await sendReminderEmail({ to: email, trainingTitle: training.title, startTime: startsAt, type: 'reminder' });
      if (!result.success) {
        failed.push(email);
        if (result.permanent) permanentlyFailed.push(email);
      }
    }
    const allFailed = failed.length === emails.length;
    const allFailuresPermanent = allFailed && permanentlyFailed.length === failed.length;
    const nextAttemptAt = allFailed && !allFailuresPermanent && delivery.attempts < maxAttempts
      ? new Date(Date.now() + retryDelay * (2 ** (delivery.attempts - 1)))
      : null;
    const status = allFailuresPermanent ? 'permanent_failed' : (allFailed ? 'failed' : 'sent');
    await ReminderDelivery.updateOne({ _id: delivery._id }, { $set: { status, sentAt: allFailed ? null : new Date(), nextAttemptAt, lastError: failed.length ? `${failed.length} email(s) failed; ${permanentlyFailed.length} permanently suppressed.` : '' } });
    if (failed.length < emails.length) {
      await Communication.create({
        training: training._id,
        type: 'reminder',
        recipientType: 'automatic',
        recipients: emails,
        subject: `${reminder.type} reminder: ${training.title}`,
        body: `Automatic ${reminder.type} reminder sent to approved participants, assigned trainer, and assigned moderator.`,
        deliveryStatus: failed.length ? 'partial' : 'sent',
        failedRecipients: failed,
      });
    }
  } catch (error) {
    if (delivery) {
      const nextAttemptAt = delivery.attempts < maxAttempts
        ? new Date(Date.now() + retryDelay * (2 ** (delivery.attempts - 1)))
        : null;
      await ReminderDelivery.updateOne({ _id: delivery._id }, { $set: { status: 'failed', nextAttemptAt, lastError: String(error.message || error).slice(0, 500) } });
    }
    console.error(`Automatic ${reminder.type} reminder failed for ${training._id}:`, error.message);
  }
};

const work = async () => {
  if (running || stopped) return;
  running = true;
  try {
    const trainings = await Training.find({ status: 'published' }).populate('trainer', 'email').populate('trainers', 'email').populate('moderator', 'email').lean();
    for (const training of trainings) await processTraining(training);
  } catch (error) { console.error('Reminder worker error:', error.message); }
  finally { running = false; }
};

export const startReminderWorker = () => {
  if (timer || process.env.DISABLE_REMINDER_WORKER === 'true') return;
  stopped = false;
  timer = setInterval(work, pollInterval);
  timer.unref();
  void work();
};

export const stopReminderWorker = async () => {
  stopped = true;
  if (timer) clearInterval(timer);
  timer = null;
  while (running) await new Promise((resolve) => setTimeout(resolve, 50));
};
