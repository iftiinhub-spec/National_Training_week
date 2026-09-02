import mongoose from 'mongoose';

const certificateDigestItemSchema = new mongoose.Schema({
  certificate: { type: mongoose.Schema.Types.ObjectId, ref: 'Certificate', required: true },
  trainingTitle: { type: String, required: true, trim: true },
  certificateId: { type: String, required: true, trim: true },
}, { _id: false });

const certificateEmailDigestSchema = new mongoose.Schema({
  recipient: { type: String, required: true, trim: true, lowercase: true },
  participantName: { type: String, default: 'Participant', trim: true },
  items: { type: [certificateDigestItemSchema], default: [] },
  status: { type: String, enum: ['collecting', 'processing', 'queued', 'sent', 'failed'], default: 'collecting', index: true },
  scheduledAt: { type: Date, required: true, index: true },
  lockedAt: { type: Date, default: null },
  lastError: { type: String, default: '' },
}, { timestamps: true });

certificateEmailDigestSchema.index(
  { recipient: 1 },
  { unique: true, partialFilterExpression: { status: 'collecting' } },
);
certificateEmailDigestSchema.index({ status: 1, scheduledAt: 1 });

export default mongoose.model('CertificateEmailDigest', certificateEmailDigestSchema);
