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
      enum: ['draft', 'registration_open', 'registration_closed', 'ongoing', 'completed'],
      default: 'draft',
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Event = mongoose.model('Event', eventSchema);
export default Event;
