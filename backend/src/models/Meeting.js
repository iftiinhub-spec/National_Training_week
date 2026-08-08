import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema(
  {
    training: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Training',
      required: true,
      unique: true, // One meeting per training
    },
    platform: {
      type: String,
      enum: ['zoom', 'google_meet', 'teams', 'other'],
      required: [true, 'Platform is required'],
    },
    meetingUrl: {
      type: String,
      required: [true, 'Meeting URL is required'],
    },
    meetingId: { type: String },
    passcode: { type: String },
    startTime: { type: Date },
    endTime: { type: Date },
    notes: { type: String },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isReleased: { type: Boolean, default: false }, // When true, approved participants can see it
  },
  { timestamps: true }
);

const Meeting = mongoose.model('Meeting', meetingSchema);
export default Meeting;
