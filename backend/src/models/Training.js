import mongoose from 'mongoose';
import { randomBytes } from 'node:crypto';
import { normalizeTrainingTime } from '../utils/trainingDateTime.js';

const trainingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Training title is required'],
      trim: true,
    },
    slug: { type: String, unique: true, sparse: true },
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
    trainers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trainer',
    }],
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
    // What an administrator decided about this session. Nothing here changes on its own: whether
    // registration is open, whether the session is running and whether it is over are all worked
    // out from the dates by utils/lifecycle.js. See that file for the full explanation.
    status: {
      type: String,
      enum: ['draft', 'published', 'cancelled', 'completed'],
      default: 'draft',
    },
    // Optional overrides. Left empty, the session follows the event: registration opens when the
    // event opens and closes when this session's own day begins. Setting registrationClosesAt is
    // how an administrator closes one session early; clearing it re-opens the session.
    registrationOpensAt: { type: Date, default: null },
    registrationClosesAt: { type: Date, default: null },
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
trainingSchema.index({ trainers: 1 });

export const slugifyTitle = (title) => (title || '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .slice(0, 60)
  .replace(/^-+|-+$/g, '');

// Slugs are generated once and never regenerated: a changed slug would break links already shared.
// The readable slug is used as-is, and a counter is appended only when it is genuinely taken.
// This runs on save rather than validate, because checking for a collision needs a database round
// trip and a document must stay validatable without one.
trainingSchema.pre('save', async function generateSlug() {
  if (this.slug || !this.title) return;
  const base = slugifyTitle(this.title) || randomBytes(6).toString('hex');
  let candidate = base;
  let counter = 1;
  while (await this.constructor.exists({ slug: candidate, _id: { $ne: this._id } })) {
    counter += 1;
    candidate = `${base}-${counter}`;
  }
  this.slug = candidate;
});

trainingSchema.pre('validate', function syncTrainerAssignments() {
  const ids = [...new Set((this.trainers || []).map(String))];
  if (!ids.length && this.trainer) ids.push(String(this.trainer));
  this.trainers = ids;
  this.trainer = ids[0] || null; // Temporary compatibility for older readers during migration.
});

const Training = mongoose.model('Training', trainingSchema);
export default Training;
