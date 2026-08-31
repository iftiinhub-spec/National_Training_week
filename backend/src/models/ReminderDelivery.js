import mongoose from 'mongoose';

const reminderDeliverySchema = new mongoose.Schema(
  {
    training: { type: mongoose.Schema.Types.ObjectId, ref: 'Training', required: true },
    type: { type: String, enum: ['24h', '1h'], required: true },
    status: { type: String, enum: ['processing', 'sent', 'failed', 'permanent_failed'], default: 'processing' },
    attempts: { type: Number, default: 0 },
    nextAttemptAt: { type: Date, default: null },
    sentAt: { type: Date, default: null },
    lastError: { type: String, default: '' },
  },
  { timestamps: true },
);

reminderDeliverySchema.index({ training: 1, type: 1 }, { unique: true });
reminderDeliverySchema.index({ status: 1, nextAttemptAt: 1 });

export default mongoose.model('ReminderDelivery', reminderDeliverySchema);
