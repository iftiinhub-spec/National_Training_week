import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    training: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Training',
      required: true,
    },
    status: {
      type: String,
      enum: ['not_marked', 'present', 'absent', 'late'],
      default: 'not_marked',
    },
    checkinTime: { type: Date, default: null },
    method: {
      type: String,
      enum: ['qr', 'manual'],
      default: 'manual',
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

// One attendance record per participant per training
attendanceSchema.index({ participant: 1, training: 1 }, { unique: true });
attendanceSchema.index({ training: 1, status: 1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
