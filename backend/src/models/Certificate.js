import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema(
  {
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    training: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Training',
      required: true,
    },
    certificateId: {
      type: String,
      required: true,
      unique: true,
    },
    issuedAt: { type: Date, default: Date.now },
    emailStatus: { type: String, enum: ['pending', 'processing', 'sent', 'failed'], default: 'pending', index: true },
    emailAttempts: { type: Number, default: 0 },
    emailSentAt: { type: Date, default: null },
    emailLastError: { type: String, default: '' },
    isRevoked: { type: Boolean, default: false },
    revokedAt: { type: Date, default: null },
    revokedReason: { type: String },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// One certificate per participant per training
certificateSchema.index({ participant: 1, training: 1 }, { unique: true });
certificateSchema.index({ training: 1, emailStatus: 1 });

const Certificate = mongoose.model('Certificate', certificateSchema);
export default Certificate;
