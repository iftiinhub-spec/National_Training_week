import mongoose from 'mongoose';

const recordingSchema = new mongoose.Schema(
  {
    training: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Training',
      required: true,
      unique: true,
    },
    title: { type: String, required: true, trim: true },
    url: { type: String, required: true },
    description: { type: String },
    thumbnail: { type: String, default: null },
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },
    isArchived: { type: Boolean, default: false },
    archivedAt: { type: Date, default: null },
    archivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

recordingSchema.index({ isPublished: 1, isArchived: 1 });

const Recording = mongoose.model('Recording', recordingSchema);
export default Recording;
