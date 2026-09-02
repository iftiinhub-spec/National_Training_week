import os from 'node:os';
import { randomUUID } from 'node:crypto';
import EmailOutbox from '../models/EmailOutbox.js';
import Certificate from '../models/Certificate.js';
import TrainerCertificate from '../models/TrainerCertificate.js';
import CertificateEmailDigest from '../models/CertificateEmailDigest.js';
import { deliverEmailNow } from '../utils/email.js';
import { materializeNextApprovalDigest } from './approvalEmailDigest.js';
import { materializeNextCertificateDigest } from './certificateEmailDigest.js';

const workerId = `${os.hostname()}:${process.pid}:${randomUUID().slice(0, 8)}`;
const intervalMs = Math.max(12_000, Number(process.env.EMAIL_MIN_INTERVAL_MS) || 12_000);
const hourlyLimit = Math.max(1, Number(process.env.EMAIL_MAX_PER_HOUR) || 300);
const staleMs = Math.max(60_000, Number(process.env.EMAIL_LOCK_STALE_MS) || 10 * 60_000);
let timer; let running = false; let stopped = false; let circuit = { open: false, reason: '', openedAt: null };

const relatedModel = (name) => name === 'Certificate' ? Certificate : name === 'TrainerCertificate' ? TrainerCertificate : null;
const updateRelated = async (message, success, error = '') => {
  if (message.relatedModel === 'CertificateDigest' && message.relatedId) {
    const digest = await CertificateEmailDigest.findById(message.relatedId).select('items').lean();
    if (!digest) return;
    const certificateIds = digest.items.map((item) => item.certificate);
    await Promise.all([
      Certificate.updateMany({ _id: { $in: certificateIds } }, success
        ? { $set: { emailStatus: 'sent', emailSentAt: new Date(), emailLastError: '' } }
        : { $set: { emailStatus: 'failed', emailLastError: error.slice(0, 500) } }),
      CertificateEmailDigest.updateOne({ _id: message.relatedId }, { $set: { status: success ? 'sent' : 'failed', lastError: success ? '' : error.slice(0, 500) } }),
    ]);
    return;
  }
  const Model = relatedModel(message.relatedModel);
  if (!Model || !message.relatedId) return;
  await Model.updateOne({ _id: message.relatedId }, success
    ? { $set: { emailStatus: 'sent', emailSentAt: new Date(), emailLastError: '' } }
    : { $set: { emailStatus: 'failed', emailAttempts: message.attempts, emailLastError: error.slice(0, 500) } });
};
const isCircuitError = (error) => /535|auth(?:entication)? failed|account (?:is )?(?:suspended|disabled)|sender (?:is )?disabled|quota|incorrect login/i.test(error);
const claim = async () => {
  const now = new Date();
  await EmailOutbox.updateMany(
    { status: { $in: ['queued', 'retrying'] }, expiresAt: { $ne: null, $lte: now } },
    { $set: { status: 'suppressed', lastError: 'Message expired before delivery.' } },
  );
  await EmailOutbox.updateMany({ status: 'processing', lockedAt: { $lt: new Date(Date.now() - staleMs) } }, { $set: { status: 'retrying', lockedAt: null, lockedBy: '', nextAttemptAt: now } });
  return EmailOutbox.findOneAndUpdate(
    { status: { $in: ['queued', 'retrying'] }, scheduledAt: { $lte: now }, nextAttemptAt: { $lte: now }, $expr: { $lt: ['$attempts', '$maxAttempts'] }, $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] },
    { $set: { status: 'processing', lockedAt: now, lockedBy: workerId }, $inc: { attempts: 1 } },
    { new: true, sort: { priority: -1, createdAt: 1 } },
  );
};
const work = async () => {
  if (running || stopped || circuit.open || process.env.EMAIL_DELIVERY_MODE === 'disabled') return;
  running = true;
  let message;
  try {
    await materializeNextApprovalDigest();
    await materializeNextCertificateDigest();
    const sentLastHour = await EmailOutbox.countDocuments({ status: 'sent', sentAt: { $gte: new Date(Date.now() - 3600_000) } });
    if (sentLastHour >= hourlyLimit) return;
    message = await claim(); if (!message) return;
    const result = await deliverEmailNow(message);
    if (result.success) {
      await EmailOutbox.updateOne({ _id: message._id, lockedBy: workerId }, { $set: { status: 'sent', sentAt: new Date(), providerMessageId: result.messageId || '', lastError: '', lockedAt: null, lockedBy: '' } });
      await updateRelated(message, true);
    } else {
      const error = String(result.error || 'Email delivery failed.');
      if (isCircuitError(error)) circuit = { open: true, reason: error, openedAt: new Date() };
      const terminal = message.attempts >= message.maxAttempts;
      const delay = Math.min(3600_000, 60_000 * (5 ** Math.max(0, message.attempts - 1)));
      await EmailOutbox.updateOne({ _id: message._id, lockedBy: workerId }, { $set: { status: terminal ? 'dead' : 'retrying', nextAttemptAt: new Date(Date.now() + delay), lastError: error.slice(0, 500), lockedAt: null, lockedBy: '' } });
      if (terminal) await updateRelated(message, false, error);
    }
  } catch (error) { console.error('Email outbox worker error:', error.message); }
  finally { running = false; }
};

export const startEmailOutboxWorker = () => { if (timer || process.env.DISABLE_EMAIL_WORKER === 'true') return; stopped = false; timer = setInterval(() => { void work(); }, intervalMs); timer.unref(); void work(); };
export const stopEmailOutboxWorker = async () => { stopped = true; if (timer) clearInterval(timer); timer = null; while (running) await new Promise((resolve) => setTimeout(resolve, 50)); };
export const getEmailCircuit = () => ({ ...circuit });
export const resetEmailCircuit = () => { circuit = { open: false, reason: '', openedAt: null }; void work(); return getEmailCircuit(); };
export const pauseEmailCircuit = (reason = 'Paused by an administrator.') => {
  circuit = { open: true, reason, openedAt: new Date() };
  return getEmailCircuit();
};
