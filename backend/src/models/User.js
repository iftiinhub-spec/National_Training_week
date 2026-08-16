import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { isValidInternationalPhone, normalizePhone } from '../utils/phone.js';
import { HUMAN_NAME_MESSAGE, isValidHumanName, normalizeHumanName } from '../utils/humanName.js';

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      set: normalizeHumanName,
      maxlength: [100, 'Full name cannot exceed 100 characters'],
      validate: { validator: isValidHumanName, message: HUMAN_NAME_MESSAGE },
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'moderator', 'trainer', 'participant'],
      required: true,
    },
    phone: {
      type: String,
      trim: true,
      set: normalizePhone,
      validate: { validator: (value) => !value || isValidInternationalPhone(value), message: 'Enter a valid phone number for its country code.' },
    },
    trainerProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer', default: null },
    gender: { type: String, enum: ['male', 'female', ''] },
    region: { type: String, trim: true },
    country: { type: String, trim: true, uppercase: true, default: 'SO', maxlength: 2 },
    city: { type: String, trim: true, maxlength: 100, default: '' },
    organization: { type: String, trim: true },
    profession: { type: String, trim: true },
    participantType: {
      type: String,
      enum: [
        'general_public',
        'professional',
        'university_student',
        'developer_it',
        'highschool_graduate',
        'teacher_educator',
        'entrepreneur_business',
        'health_worker',
        'community_organization',
        'other',
        '',
      ],
    },
    profilePhoto: { type: String, default: null },
    accountStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
    },
    isActive: { type: Boolean, default: true },
    tokenVersion: { type: Number, default: 0 },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) return;
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  return obj;
};

userSchema.index({ role: 1 });

const User = mongoose.model('User', userSchema);
export default User;
