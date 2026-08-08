import mongoose from 'mongoose';

const eventDaySchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event reference is required'],
    },
    dayNumber: {
      type: Number,
      required: [true, 'Day number is required'],
      min: 1,
    },
    theme: { type: String, required: [true, 'Day theme is required'], trim: true },
    date: { type: Date, required: [true, 'Day date is required'] },
  },
  { timestamps: true }
);

// A day number must be unique within an event
eventDaySchema.index({ event: 1, dayNumber: 1 }, { unique: true });

const EventDay = mongoose.model('EventDay', eventDaySchema);
export default EventDay;
