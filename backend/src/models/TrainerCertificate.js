import mongoose from 'mongoose';

const trainerCertificateSchema = new mongoose.Schema(
  {
    trainer: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer', required: true },
    training: { type: mongoose.Schema.Types.ObjectId, ref: 'Training', required: true },
    certificateId: { type: String, required: true, unique: true },
    issuedAt: { type: Date, default: Date.now },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    emailStatus: { type: String, enum: ['pending', 'processing', 'sent', 'failed'], default: 'pending', index: true },
    emailAttempts: { type: Number, default: 0 },
    emailSentAt: { type: Date, default: null },
    emailLastError: { type: String, default: '' },
  },
  { timestamps: true },
);

// A trainer receives exactly one appreciation certificate for each delivered session.
trainerCertificateSchema.index({ trainer: 1, training: 1 }, { unique: true });
trainerCertificateSchema.index({ training: 1, emailStatus: 1 });

const TrainerCertificate = mongoose.model('TrainerCertificate', trainerCertificateSchema);
export default TrainerCertificate;
