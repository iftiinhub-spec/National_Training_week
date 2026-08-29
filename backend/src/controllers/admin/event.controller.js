import Event from '../../models/Event.js';
import EventDay from '../../models/EventDay.js';
import Training from '../../models/Training.js';
import { successResponse, errorResponse, getPagination, paginatedResponse } from '../../utils/apiResponse.js';
import { dayKey, eventDayKeys, eventDaysOutsideRange, parseNairobiInput, withEventPhase } from '../../utils/lifecycle.js';
import { eventTimelineError } from '../../utils/eventTimeline.js';
import { pick } from '../../utils/pick.js';
import { deleteEventCascade } from '../../utils/cascadeDelete.js';

const eventPayload = (input) => pick(input, ['name', 'theme', 'year', 'startDate', 'endDate', 'registrationStart', 'registrationDeadline', 'description', 'status', 'isActive', 'isCurrent']);

const badRequest = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};

// Calendar-only values are stored at UTC midnight, matching EventDay and Training dates, so their
// YYYY-MM-DD key never shifts. Wall-clock values ("2026-09-03T14:30") are Nairobi local time.
const EVENT_STATUSES = ['draft', 'published', 'cancelled'];

const assertEventRangeCanBeSaved = async (eventId, proposedEvent) => {
  const existingDays = await EventDay.find({ event: eventId }).sort({ date: 1 });
  const removed = eventDaysOutsideRange(existingDays, proposedEvent);
  if (!removed.length) return;

  const counts = await Promise.all(removed.map((day) => Training.countDocuments({ eventDay: day._id })));
  const occupiedIndex = counts.findIndex((count) => count > 0);
  if (occupiedIndex === -1) return;

  const day = removed[occupiedIndex];
  const sessions = counts[occupiedIndex];
  badRequest(`Day ${day.dayNumber} (${dayKey(day.date)}) is outside the new dates but still has ${sessions} session${sessions === 1 ? '' : 's'}. Move or delete those sessions first.`);
};

// Builds the record to save. An edition needs four things: its dates, when registration opens,
// an optional cut-off, and whether it is published. Nothing else is stored about its progress.
const prepareEvent = (input, existing = null) => {
  const data = eventPayload(input);

  data.year = Number(data.year ?? existing?.year);
  data.startDate = parseNairobiInput(data.startDate ?? existing?.startDate);
  data.endDate = parseNairobiInput(data.endDate ?? existing?.endDate);

  // Default: registration opens 30 days before the event and has no cut-off, so every session
  // stays open until its own day. Organisers only set a cut-off when they really want one.
  data.registrationStart = parseNairobiInput(data.registrationStart)
    || (existing?.registrationStart ?? null)
    || (data.startDate ? new Date(data.startDate.getTime() - 30 * 24 * 60 * 60 * 1000) : null);
  data.registrationDeadline = input.registrationDeadline === '' || input.registrationDeadline === null
    ? null
    : (parseNairobiInput(data.registrationDeadline) ?? existing?.registrationDeadline ?? null);

  const status = data.status ?? existing?.status ?? 'draft';
  if (!EVENT_STATUSES.includes(status)) badRequest(`Event status must be one of: ${EVENT_STATUSES.join(', ')}.`);
  data.status = status;

  const timelineMessage = eventTimelineError(data);
  if (timelineMessage) badRequest(timelineMessage);

  data.isCurrent = input.isCurrent === true || input.isCurrent === 'true';
  return data;
};

// Creates one EventDay per calendar date of the edition, numbered in order. Dates are never typed
// in by hand, so days cannot be duplicated, skipped, put out of order or placed outside the event.
// Existing days keep their theme; days that fall outside a shortened edition are removed, unless
// sessions are still attached to them.
const syncEventDays = async (event) => {
  const keys = eventDayKeys(event);
  if (!keys.length) return [];
  const existing = await EventDay.find({ event: event._id }).sort({ date: 1 });
  const byDate = new Map(existing.map((day) => [dayKey(day.date), day]));

  const removed = existing.filter((day) => !keys.includes(dayKey(day.date)));
  for (const day of removed) {
    const sessions = await Training.countDocuments({ eventDay: day._id });
    if (sessions) {
      badRequest(`Day ${day.dayNumber} (${dayKey(day.date)}) is outside the new dates but still has ${sessions} session${sessions === 1 ? '' : 's'}. Move or delete those sessions first.`);
    }
  }
  if (removed.length) await EventDay.deleteMany({ _id: { $in: removed.map((day) => day._id) } });

  // Day numbers are unique per event, so they are parked on negative values before being handed
  // out again. Renumbering in place would collide with the unique index halfway through.
  const kept = keys.map((key) => byDate.get(key)).filter(Boolean);
  if (kept.some((day, index) => day.dayNumber !== index + 1)) {
    await EventDay.bulkWrite(kept.map((day, index) => ({
      updateOne: { filter: { _id: day._id }, update: { $set: { dayNumber: -(index + 1) } } },
    })));
    await EventDay.bulkWrite(kept.map((day, index) => ({
      updateOne: { filter: { _id: day._id }, update: { $set: { dayNumber: index + 1 } } },
    })));
  }

  const created = keys
    .map((key, index) => ({ key, dayNumber: index + 1 }))
    .filter(({ key }) => !byDate.has(key))
    .map(({ key, dayNumber }) => ({
      event: event._id,
      dayNumber,
      theme: `Day ${dayNumber}`,
      date: new Date(`${key}T00:00:00.000Z`),
    }));
  if (created.length) await EventDay.insertMany(created);

  return EventDay.find({ event: event._id }).sort({ dayNumber: 1 });
};

// GET /api/admin/events
export const getEvents = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const [events, total] = await Promise.all([
      Event.find().sort({ year: -1 }).skip(skip).limit(limit),
      Event.countDocuments(),
    ]);
    return paginatedResponse(res, events.map((event) => withEventPhase(event)), total, page, limit);
  } catch (err) { next(err); }
};

// GET /api/admin/events/:id
export const getEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return errorResponse(res, 'Event not found.', 404);
    const days = await EventDay.find({ event: event._id }).sort({ dayNumber: 1 });
    return successResponse(res, { event: withEventPhase(event), days });
  } catch (err) { next(err); }
};

// POST /api/admin/events
export const createEvent = async (req, res, next) => {
  try {
    const data = prepareEvent(req.body);
    if (data.isCurrent) await Event.updateMany({}, { $set: { isCurrent: false } });
    const event = await Event.create(data);
    const days = await syncEventDays(event);
    return successResponse(
      res,
      { event: withEventPhase(event), days },
      `Event created with ${days.length} day${days.length === 1 ? '' : 's'}. Give each day a theme, then add its sessions.`,
      201
    );
  } catch (err) { next(err); }
};

// PUT /api/admin/events/:id
export const updateEvent = async (req, res, next) => {
  try {
    const existing = await Event.findById(req.params.id);
    if (!existing) return errorResponse(res, 'Event not found.', 404);
    const data = prepareEvent(req.body, existing);
    // Validate occupied days before persisting the new range. A rejected resize must leave both
    // the event and its programme unchanged.
    await assertEventRangeCanBeSaved(existing._id, data);
    if (data.isCurrent) await Event.updateMany({ _id: { $ne: req.params.id } }, { $set: { isCurrent: false } });
    const event = await Event.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    // Days are re-generated after the save so a changed date range grows or shrinks the programme.
    const days = await syncEventDays(event);
    return successResponse(res, { event: withEventPhase(event), days }, 'Event updated successfully.');
  } catch (err) { next(err); }
};

// DELETE /api/admin/events/:id
export const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return errorResponse(res, 'Event not found.', 404);
    const summary = await deleteEventCascade(event);
    return successResponse(res, { summary }, `Event deleted with ${summary.days} day(s), ${summary.trainings} training session(s), ${summary.coOrganizers} co-organizer(s), and ${summary.relatedRecords} related record(s).`);
  } catch (err) { next(err); }
};

// --- Event days ---
// Days are generated from the event's date range, so they are never created or deleted directly.
// The only thing an administrator writes here is the theme of a day.

// GET /api/admin/events/:eventId/days
export const getEventDays = async (req, res, next) => {
  try {
    const days = await EventDay.find({ event: req.params.eventId }).sort({ dayNumber: 1 });
    return successResponse(res, { days });
  } catch (err) { next(err); }
};

// PUT /api/admin/events/:eventId/days/:dayId
export const updateEventDay = async (req, res, next) => {
  try {
    const theme = String(req.body.theme || '').trim();
    if (!theme) return errorResponse(res, 'Enter a theme for this day.', 400);
    const day = await EventDay.findOneAndUpdate(
      { _id: req.params.dayId, event: req.params.eventId },
      { theme },
      { new: true, runValidators: true }
    );
    if (!day) return errorResponse(res, 'Event day not found.', 404);
    return successResponse(res, { day }, 'Day theme updated.');
  } catch (err) { next(err); }
};

// POST /api/admin/events/:eventId/days/regenerate — rebuilds the day list from the event dates.
export const regenerateEventDays = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return errorResponse(res, 'Event not found.', 404);
    const days = await syncEventDays(event);
    return successResponse(res, { days }, `The programme now has ${days.length} day${days.length === 1 ? '' : 's'}.`);
  } catch (err) { next(err); }
};
