import mongoose from 'mongoose';
import { isValidInternationalPhone, normalizePhone } from '../utils/phone.js';

const trainerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Trainer name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Trainer email is required'],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      set: normalizePhone,
      validate: { validator: (value) => !value || isValidInternationalPhone(value), message: 'Enter a valid phone number for its country code.' },
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, sparse: true, default: null },
    accessStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'pending',
    },
    reviewReason: { type: String, trim: true, default: '' },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    title: { type: String, trim: true }, // e.g. "Dr.", "Prof."
    organization: { type: String, trim: true },
    biography: { type: String },
    photo: { type: String, default: null },
    expertise: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Trainer = mongoose.model('Trainer', trainerSchema);
export default Trainer;
