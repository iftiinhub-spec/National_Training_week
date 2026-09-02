import mongoose from 'mongoose';

const emailOutboxSchema = new mongoose.Schema({
  to: { type: String, required: true, trim: true, lowercase: true, index: true },
  subject: { type: String, required: true, trim: true, maxlength: 200 },
  html: { type: String, required: true },
  text: { type: String, default: '' },
  category: { type: String, default: 'general', index: true },
  priority: { type: Number, default: 50, min: 0, max: 100, index: true },
  dedupeKey: { type: String, required: true, unique: true },
  status: { type: String, enum: ['queued', 'processing', 'retrying', 'sent', 'suppressed', 'dead'], default: 'queued', index: true },
  scheduledAt: { type: Date, default: Date.now, index: true },
  expiresAt: { type: Date, default: null },
  attempts: { type: Number, default: 0 },
  maxAttempts: { type: Number, default: 5 },
  nextAttemptAt: { type: Date, default: Date.now, index: true },
  lockedAt: { type: Date, default: null },
  lockedBy: { type: String, default: '' },
  sentAt: { type: Date, default: null },
  providerMessageId: { type: String, default: '' },
  lastError: { type: String, default: '' },
  relatedModel: { type: String, enum: ['', 'Certificate', 'TrainerCertificate', 'CertificateDigest'], default: '' },
  relatedId: { type: mongoose.Schema.Types.ObjectId, default: null },
}, { timestamps: true });

emailOutboxSchema.index({ status: 1, nextAttemptAt: 1, priority: -1, createdAt: 1 });
emailOutboxSchema.index({ sentAt: 1 });

export default mongoose.model('EmailOutbox', emailOutboxSchema);
