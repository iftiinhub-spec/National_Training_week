import mongoose from 'mongoose';

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
    phone: { type: String, trim: true },
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
