import mongoose from 'mongoose';

const emailSuppressionSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    reason: { type: String, default: 'Permanent recipient rejection', maxlength: 500 },
    smtpCode: { type: Number, default: null },
    source: { type: String, enum: ['smtp', 'bounce', 'complaint', 'manual'], default: 'smtp' },
    suppressedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export default mongoose.model('EmailSuppression', emailSuppressionSchema);
