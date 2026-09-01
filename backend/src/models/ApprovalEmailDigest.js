import mongoose from 'mongoose';

const approvalItemSchema = new mongoose.Schema({
  training: { type: mongoose.Schema.Types.ObjectId, required: true },
  title: { type: String, required: true, trim: true },
  date: { type: Date, default: null },
  startTime: { type: String, default: '' },
}, { _id: false });

const approvalEmailDigestSchema = new mongoose.Schema({
  recipient: { type: String, required: true, trim: true, lowercase: true, unique: true },
  participantName: { type: String, default: 'Participant', trim: true },
  items: { type: [approvalItemSchema], default: [] },
  status: { type: String, enum: ['collecting', 'processing'], default: 'collecting', index: true },
  scheduledAt: { type: Date, required: true, index: true },
  lockedAt: { type: Date, default: null },
}, { timestamps: true });

approvalEmailDigestSchema.index({ status: 1, scheduledAt: 1 });

export default mongoose.model('ApprovalEmailDigest', approvalEmailDigestSchema);
