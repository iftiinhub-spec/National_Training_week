import mongoose from 'mongoose';

const certificateIssuanceJobSchema = new mongoose.Schema({
  training: { type: mongoose.Schema.Types.ObjectId, ref: 'Training', required: true, unique: true },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['queued', 'processing', 'completed', 'completed_with_errors', 'failed'],
    default: 'queued',
    index: true,
  },
  attempts: { type: Number, default: 0 },
  nextRunAt: { type: Date, default: Date.now, index: true },
  lockedAt: { type: Date, default: null },
  lockedBy: { type: String, default: '' },
  completedAt: { type: Date, default: null },
  lastError: { type: String, default: '' },
  summary: {
    eligible: { type: Number, default: 0 },
    participantCertificates: { type: Number, default: 0 },
    participantEmailsSent: { type: Number, default: 0 },
    participantEmailsFailed: { type: Number, default: 0 },
    trainerCertificateIssued: { type: Boolean, default: false },
    trainerEmailSent: { type: Boolean, default: false },
    trainerEmailFailed: { type: Boolean, default: false },
  },
}, { timestamps: true });

certificateIssuanceJobSchema.index({ status: 1, nextRunAt: 1, lockedAt: 1 });

export default mongoose.model('CertificateIssuanceJob', certificateIssuanceJobSchema);
