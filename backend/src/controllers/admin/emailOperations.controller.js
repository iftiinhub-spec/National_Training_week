import EmailOutbox from '../../models/EmailOutbox.js';
import Certificate from '../../models/Certificate.js';
import TrainerCertificate from '../../models/TrainerCertificate.js';
import ApprovalEmailDigest from '../../models/ApprovalEmailDigest.js';
import { getEmailCircuit, pauseEmailCircuit, resetEmailCircuit } from '../../services/emailOutboxWorker.js';

const hourlyLimit = Math.max(1, Number(process.env.EMAIL_MAX_PER_HOUR) || 300);

export const getEmailOperations = async (_req, res) => {
  const oneHourAgo = new Date(Date.now() - 3600_000);
  const [byStatus, byCategory, sentLastHour, oldestQueued, approvalDigests] = await Promise.all([
    EmailOutbox.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    EmailOutbox.aggregate([{ $match: { status: { $in: ['queued', 'retrying', 'processing'] } } }, { $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    EmailOutbox.countDocuments({ status: 'sent', sentAt: { $gte: oneHourAgo } }),
    EmailOutbox.findOne({ status: { $in: ['queued', 'retrying'] } }).sort({ priority: -1, createdAt: 1 }).select('createdAt').lean(),
    ApprovalEmailDigest.countDocuments({ 'items.0': { $exists: true } }),
  ]);
  const statuses = Object.fromEntries(byStatus.map(({ _id, count }) => [_id, count]));
  const waiting = (statuses.queued || 0) + (statuses.retrying || 0) + (statuses.processing || 0) + approvalDigests;
  const categories = byCategory.map(({ _id, count }) => ({ category: _id, count }));
  const approvals = categories.find((item) => item.category === 'approval');
  if (approvals) approvals.count += approvalDigests;
  else if (approvalDigests) categories.push({ category: 'approval', count: approvalDigests });
  res.json({
    statuses,
    categories,
    approvalDigests,
    waiting,
    sentLastHour,
    hourlyLimit,
    remainingThisHour: Math.max(0, hourlyLimit - sentLastHour),
    estimatedMinutes: waiting ? Math.ceil((waiting / hourlyLimit) * 60) : 0,
    oldestQueuedAt: oldestQueued?.createdAt || null,
    circuit: getEmailCircuit(),
    deliveryDisabled: process.env.EMAIL_DELIVERY_MODE === 'disabled' || process.env.DISABLE_EMAIL_WORKER === 'true',
  });
};

export const getEmailMessages = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(10, Number(req.query.limit) || 25));
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.category) filter.category = req.query.category;
  const [items, total] = await Promise.all([
    EmailOutbox.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).select('-html -text').lean(),
    EmailOutbox.countDocuments(filter),
  ]);
  res.json({ items, page, pages: Math.max(1, Math.ceil(total / limit)), total });
};

export const pauseEmailDelivery = async (req, res) => res.json({ circuit: pauseEmailCircuit(req.body.reason || 'Paused by an administrator.') });
export const resumeEmailDelivery = async (_req, res) => res.json({ circuit: resetEmailCircuit() });

export const retryEmailMessages = async (req, res) => {
  const filter = req.body.ids?.length
    ? { _id: { $in: req.body.ids }, status: { $in: ['dead', 'suppressed'] } }
    : { status: 'dead' };
  const result = await EmailOutbox.updateMany(filter, { $set: { status: 'queued', attempts: 0, nextAttemptAt: new Date(), lastError: '', lockedAt: null, lockedBy: '' } });
  res.json({ message: `${result.modifiedCount} email(s) queued for retry.`, modified: result.modifiedCount });
};

export const suppressEmailMessages = async (req, res) => {
  const messages = await EmailOutbox.find({ _id: { $in: req.body.ids }, status: { $in: ['queued', 'retrying', 'dead'] } }).select('relatedModel relatedId maxAttempts').lean();
  const messageIds = messages.map(({ _id }) => _id);
  const result = await EmailOutbox.updateMany({ _id: { $in: messageIds } }, { $set: { status: 'suppressed', lastError: 'Suppressed by an administrator.', lockedAt: null, lockedBy: '' } });
  await Promise.all(messages.map((message) => {
    const Model = message.relatedModel === 'Certificate' ? Certificate : message.relatedModel === 'TrainerCertificate' ? TrainerCertificate : null;
    return Model && message.relatedId ? Model.updateOne({ _id: message.relatedId }, { $set: { emailStatus: 'failed', emailAttempts: message.maxAttempts, emailLastError: 'Email suppressed by an administrator.' } }) : null;
  }));
  res.json({ message: `${result.modifiedCount} email(s) suppressed.`, modified: result.modifiedCount });
};
