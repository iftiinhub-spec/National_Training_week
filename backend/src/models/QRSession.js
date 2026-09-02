import mongoose from 'mongoose';

const qrSessionSchema = new mongoose.Schema(
  {
    training: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Training',
      required: true,
    },
    sessionToken: {
      type: String,
      required: true,
      unique: true,
    },
    isOpen: { type: Boolean, default: true },
    openedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    openedAt: { type: Date, default: Date.now },
    closedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true }, // QR sessions expire after a set time
  },
  { timestamps: true }
);

qrSessionSchema.index({ training: 1, isOpen: 1 });

const QRSession = mongoose.model('QRSession', qrSessionSchema);
export default QRSession;
