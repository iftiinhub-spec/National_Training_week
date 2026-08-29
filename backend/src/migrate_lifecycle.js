import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import Event from './models/Event.js';
import EventDay from './models/EventDay.js';
import Training from './models/Training.js';
import { eventDayKeys, dayKey } from './utils/lifecycle.js';

// One-off migration for the lifecycle change.
//
// Before: `status` on an event and on a session mixed two different things — what an administrator
// decided (draft, published, cancelled) and what the clock had done (registration open, ongoing,
// completed). The clock half went stale and every screen re-derived it differently.
//
// After: only the decision is stored. Everything time-based is worked out on request by
// utils/lifecycle.js. This script rewrites the old values and fills the two new session fields.
//
// Run it once, after deploying the new code:  npm run migrate:lifecycle

// A session that was manually put in "registration_closed" while its own day is still ahead was
// closed early on purpose, so that intent is preserved as a real closing time. Every other old
// value simply becomes published, because it only described where the clock was.
const SESSION_STATUS_MAP = {
  draft: 'draft',
  published: 'published',
  registration_open: 'published',
  registration_closed: 'published',
  ongoing: 'published',
  completed: 'completed',
  cancelled: 'cancelled',
};

const EVENT_STATUS_MAP = {
  draft: 'draft',
  registration_scheduled: 'published',
  registration_open: 'published',
  registration_closed: 'published',
  ongoing: 'published',
  completed: 'published',
  published: 'published',
  cancelled: 'cancelled',
};

const migrateEvents = async () => {
  const events = await Event.find({}).lean();
  let updated = 0;
  for (const event of events) {
    const status = EVENT_STATUS_MAP[event.status] || 'draft';
    if (status !== event.status) {
      await Event.updateOne({ _id: event._id }, { $set: { status } });
      updated += 1;
    }
  }
  console.log(`Events: ${updated} of ${events.length} rewritten to draft / published / cancelled.`);
  return events;
};

// Every calendar date of an edition should have exactly one day, numbered in order. Editions built
// by hand often have gaps; this fills them so sessions can be attached to any date of the event.
const migrateDays = async (events) => {
  let created = 0;
  for (const event of events) {
    const keys = eventDayKeys(event);
    if (!keys.length) continue;
    const existing = await EventDay.find({ event: event._id }).sort({ date: 1 });
    const byDate = new Map(existing.map((day) => [dayKey(day.date), day]));
    const missing = keys
      .map((key, index) => ({ key, dayNumber: index + 1 }))
      .filter(({ key }) => !byDate.has(key));
    // Renumbering existing days is left alone here: sessions already point at them by id, and a
    // wrong day number is cosmetic while a broken link is not.
    if (missing.length) {
      const taken = new Set(existing.map((day) => day.dayNumber));
      let next = Math.max(0, ...taken) + 1;
      await EventDay.insertMany(missing.map(({ key }) => ({
        event: event._id,
        dayNumber: next++,
        theme: `Day ${next - 1}`,
        date: new Date(`${key}T00:00:00.000Z`),
      })));
      created += missing.length;
    }
  }
  console.log(`Event days: ${created} missing day(s) created.`);
};

const migrateSessions = async () => {
  const sessions = await Training.find({}).select('_id status date registrationClosesAt').lean();
  const now = new Date();
  let updated = 0;
  let closedEarly = 0;

  for (const session of sessions) {
    const status = SESSION_STATUS_MAP[session.status] || 'draft';
    const update = {};
    if (status !== session.status) update.status = status;

    if (session.status === 'registration_closed' && !session.registrationClosesAt) {
      const ownDayStart = new Date(`${dayKey(session.date)}T00:00:00+03:00`);
      // Only sessions whose day is still ahead were closed by a person; the rest were closed by
      // the calendar, which the new rule works out on its own.
      if (Number.isFinite(ownDayStart.getTime()) && now < ownDayStart) {
        update.registrationClosesAt = now;
        closedEarly += 1;
      }
    }

    if (Object.keys(update).length) {
      await Training.updateOne({ _id: session._id }, { $set: update });
      updated += 1;
    }
  }
  console.log(`Sessions: ${updated} of ${sessions.length} rewritten; ${closedEarly} kept as closed early.`);
};

const run = async () => {
  await connectDB();
  const events = await migrateEvents();
  await migrateDays(events);
  await migrateSessions();
  console.log('Lifecycle migration complete.');
};

run()
  .catch((error) => {
    console.error(`Lifecycle migration failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
