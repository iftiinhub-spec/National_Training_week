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
    EmailOutbox.aggregate([
      { $group: {
        _id: '$category',
        total: { $sum: 1 },
        waiting: { $sum: { $cond: [{ $in: ['$status', ['queued', 'retrying', 'processing']] }, 1, 0] } },
        sent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
        failed: { $sum: { $cond: [{ $eq: ['$status', 'dead'] }, 1, 0] } },
        suppressed: { $sum: { $cond: [{ $eq: ['$status', 'suppressed'] }, 1, 0] } },
      } },
      { $sort: { waiting: -1, total: -1 } },
    ]),
    EmailOutbox.countDocuments({ status: 'sent', sentAt: { $gte: oneHourAgo } }),
    EmailOutbox.findOne({ status: { $in: ['queued', 'retrying'] } }).sort({ priority: -1, createdAt: 1 }).select('createdAt').lean(),
    ApprovalEmailDigest.countDocuments({ 'items.0': { $exists: true } }),
  ]);
  const statuses = Object.fromEntries(byStatus.map(({ _id, count }) => [_id, count]));
  const waiting = (statuses.queued || 0) + (statuses.retrying || 0) + (statuses.processing || 0) + approvalDigests;
  const categories = byCategory.map(({ _id, total, waiting: categoryWaiting, sent, failed, suppressed }) => ({ category: _id, total, waiting: categoryWaiting, sent, failed, suppressed }));
  const approvals = categories.find((item) => item.category === 'approval');
  if (approvals) { approvals.total += approvalDigests; approvals.waiting += approvalDigests; }
  else if (approvalDigests) categories.push({ category: 'approval', total: approvalDigests, waiting: approvalDigests, sent: 0, failed: 0, suppressed: 0 });
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
