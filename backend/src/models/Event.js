import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
    },
    theme: { type: String, trim: true },
    year: {
      type: Number,
      required: [true, 'Year is required'],
    },
    startDate: { type: Date, required: [true, 'Start date is required'] },
    endDate: { type: Date, required: [true, 'End date is required'] },
    registrationStart: { type: Date },
    registrationDeadline: { type: Date },
    description: { type: String },
    status: {
      type: String,
      enum: ['draft', 'registration_scheduled', 'registration_open', 'registration_closed', 'ongoing', 'completed'],
      default: 'draft',
    },
    isActive: { type: Boolean, default: true },
    isCurrent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

eventSchema.index({ isCurrent: 1 });
eventSchema.index({ year: 1 }, { unique: true });

const Event = mongoose.model('Event', eventSchema);
export default Event;
