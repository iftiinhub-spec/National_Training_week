import mongoose from 'mongoose';
import { HUMAN_NAME_MESSAGE, isValidHumanName, normalizeHumanName } from '../utils/humanName.js';

const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, set: normalizeHumanName, maxlength: 100, validate: { validator: isValidHumanName, message: HUMAN_NAME_MESSAGE } },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

contactMessageSchema.index({ isRead: 1, createdAt: -1 });

const ContactMessage = mongoose.model('ContactMessage', contactMessageSchema);
export default ContactMessage;
