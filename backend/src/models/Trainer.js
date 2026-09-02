import mongoose from 'mongoose';
import { isValidInternationalPhone, normalizePhone } from '../utils/phone.js';
import { HUMAN_NAME_MESSAGE, isValidHumanName, normalizeHumanName } from '../utils/humanName.js';

const trainerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Trainer name is required'],
      trim: true,
      set: normalizeHumanName,
      maxlength: [100, 'Trainer name cannot exceed 100 characters'],
      validate: { validator: isValidHumanName, message: HUMAN_NAME_MESSAGE },
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
    portfolioUrl: {
      type: String,
      trim: true,
      maxlength: [500, 'Portfolio URL cannot exceed 500 characters'],
      validate: { validator: (value) => !value || /^https:\/\//i.test(value), message: 'Portfolio URL must use HTTPS.' },
    },
    linkedinUrl: {
      type: String,
      trim: true,
      maxlength: [500, 'LinkedIn URL cannot exceed 500 characters'],
      validate: { validator: (value) => !value || /^https:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\//i.test(value), message: 'Enter a valid LinkedIn profile URL.' },
    },
    biography: { type: String },
    photo: { type: String, default: null },
    expertise: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

trainerSchema.index({ email: 1 });
trainerSchema.index({ accessStatus: 1 });

const Trainer = mongoose.model('Trainer', trainerSchema);
export default Trainer;
