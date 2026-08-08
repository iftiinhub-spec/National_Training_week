import mongoose from 'mongoose';

const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
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
