import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
    },
    registeredAt: { type: Date, default: Date.now },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

// One participant cannot register for the same training twice
registrationSchema.index({ participant: 1, training: 1 }, { unique: true });
registrationSchema.index({ training: 1, status: 1 });
registrationSchema.index({ participant: 1, status: 1 });

const Registration = mongoose.model('Registration', registrationSchema);
export default Registration;
