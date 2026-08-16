import mongoose from 'mongoose';
import { normalizeTrainingTime } from '../utils/trainingDateTime.js';

const trainingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Training title is required'],
      trim: true,
    },
    description: { type: String },
    coverImage: { type: String, default: null },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event reference is required'],
    },
    eventDay: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EventDay',
      required: [true, 'Event day reference is required'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trainer',
      default: null,
    },
    moderator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    date: { type: Date, required: [true, 'Training date is required'] },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      set: normalizeTrainingTime,
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Start time must be a valid time'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      set: normalizeTrainingTime,
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'End time must be a valid time'],
    },
    audience: { type: String, trim: true },
    level: {
      type: String,
      enum: ['general', 'beginner', 'intermediate', 'advanced'],
      default: 'general',
    },
    language: { type: String, default: 'English' },
    capacity: { type: Number, default: null },
    filledSeats: { type: Number, default: 0 },
    registrationRequired: { type: Boolean, default: true },
    status: {
      type: String,
      enum: [
        'draft',
        'published',
        'registration_open',
        'registration_closed',
        'ongoing',
        'completed',
        'cancelled',
      ],
      default: 'draft',
    },
    completedAt: { type: Date, default: null },
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    attendanceLockedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

trainingSchema.index({ event: 1, status: 1 });
trainingSchema.index({ eventDay: 1 });
trainingSchema.index({ status: 1 });
trainingSchema.index({ trainer: 1 });

const Training = mongoose.model('Training', trainingSchema);
export default Training;
