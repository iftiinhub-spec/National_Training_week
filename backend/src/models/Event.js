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
    // When registration opens for the whole edition. Sessions inherit this.
    registrationStart: { type: Date },
    // Optional event-wide cut-off. Left empty, each session simply closes on its own day, which is
    // what lets people still register for day 5 while day 1 is running.
    registrationDeadline: { type: Date, default: null },
    description: { type: String },
    // Administrator's decision only. "Registration open", "running" and "finished" are derived from
    // the dates by utils/lifecycle.js and are never stored.
    status: {
      type: String,
      enum: ['draft', 'published', 'cancelled'],
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
