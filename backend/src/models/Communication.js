import mongoose from 'mongoose';

const communicationSchema = new mongoose.Schema(
  {
    training: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Training',
      required: true,
    },
    type: {
      type: String,
      enum: ['invitation', 'reminder', 'announcement', 'cancellation', 'schedule_change'],
      required: true,
    },
    recipientType: {
      type: String,
      enum: ['trainer', 'all_approved', 'selected', 'all'],
      required: true,
    },
    recipients: [{ type: String }], // Array of email addresses
    subject: { type: String, required: true },
    body: { type: String, required: true },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sentAt: { type: Date, default: Date.now },
    deliveryStatus: {
      type: String,
      enum: ['sent', 'failed', 'partial'],
      default: 'sent',
    },
    failedRecipients: [{ type: String }],
  },
  { timestamps: true }
);

communicationSchema.index({ training: 1 });
communicationSchema.index({ sentAt: -1 });

const Communication = mongoose.model('Communication', communicationSchema);
export default Communication;
