import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
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
    contentRating: { type: Number, min: 1, max: 5, required: true },
    trainerRating: { type: Number, min: 1, max: 5, required: true },
    organizationRating: { type: Number, min: 1, max: 5, required: true },
    comments: { type: String },
    suggestions: { type: String },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// One feedback per participant per training
feedbackSchema.index({ participant: 1, training: 1 }, { unique: true });
feedbackSchema.index({ training: 1 });

const Feedback = mongoose.model('Feedback', feedbackSchema);
export default Feedback;
