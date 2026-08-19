import Event from '../../models/Event.js';
import EventDay from '../../models/EventDay.js';
import Training from '../../models/Training.js';
import { successResponse, errorResponse, getPagination, paginatedResponse } from '../../utils/apiResponse.js';
import { syncEventStatus } from '../../utils/eventLifecycle.js';
import { eventDayTimelineError, eventStatusError, eventTimelineError } from '../../utils/eventTimeline.js';
import { pick } from '../../utils/pick.js';
import { deleteEventCascade, deleteEventDayCascade } from '../../utils/cascadeDelete.js';

const eventPayload = (input) => pick(input, ['name', 'theme', 'year', 'startDate', 'endDate', 'registrationStart', 'registrationDeadline', 'description', 'status', 'isActive', 'isCurrent']);
const eventDayPayload = (input) => pick(input, ['dayNumber', 'theme', 'date']);

const dateKey = (value) => {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : null;
};

const todayInNairobi = () => new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);

const validateEventDates = (data, existing = null) => {
  const year = Number(data.year ?? existing?.year);
  const start = dateKey(data.startDate ?? existing?.startDate);
  const end = dateKey(data.endDate ?? existing?.endDate);
  const invalid = (message) => { const error = new Error(message); error.statusCode = 400; throw error; };
  if (!start || !end) invalid('Valid event start and end dates are required.');
  if (start > end) invalid('The event end date cannot be before its start date.');
  if (Number(start.slice(0, 4)) !== year || Number(end.slice(0, 4)) !== year) {
    invalid(`The event start and end dates must be in ${year}.`);
  }
  return { start, end };
};

const validateDayForEvent = (event, value) => {
  const message = eventDayTimelineError(event, value);
  if (message) { const error = new Error(message); error.statusCode = 400; throw error; }
};

const rejectNewPastDate = (value, previousValue = null, label = 'Date') => {
  const next = dateKey(value);
  const previous = dateKey(previousValue);
  if (next !== previous && next < todayInNairobi()) {
    const error = new Error(`${label} cannot be in the past.`); error.statusCode = 400; throw error;
  }
};

const ensureUniqueEventDay = async ({ eventId, dayNumber, date, excludeId = null }) => {
  const dayKey = dateKey(date);
  const nextDay = new Date(`${dayKey}T00:00:00.000Z`);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  const base = { event: eventId, ...(excludeId ? { _id: { $ne: excludeId } } : {}) };
  const [sameNumber, sameDate] = await Promise.all([
    EventDay.findOne({ ...base, dayNumber }),
    EventDay.findOne({ ...base, date: { $gte: new Date(`${dayKey}T00:00:00.000Z`), $lt: nextDay } }),
  ]);
  if (sameNumber) { const error = new Error(`Day ${dayNumber} already exists for this event.`); error.statusCode = 409; throw error; }
  if (sameDate) { const error = new Error(`An event day already exists on ${dayKey}. Add trainings to that day instead.`); error.statusCode = 409; throw error; }
};

const prepareRegistrationWindow = (data, existing = null) => {
  const parseNairobiDateTime = (value) => {
    if (value instanceof Date) return value;
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return new Date(`${value}:00+03:00`);
    return new Date(value);
  };
  const rawStartDate = data.startDate || existing?.startDate;
  const startDate = typeof rawStartDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawStartDate)
    ? new Date(`${rawStartDate}T00:00:00+03:00`)
    : parseNairobiDateTime(rawStartDate);
  if (Number.isNaN(startDate.getTime())) throw new Error('A valid event start date is required.');

  const registrationStart = data.registrationStart
    ? parseNairobiDateTime(data.registrationStart)
    : existing?.registrationStart || new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  const registrationDeadline = data.registrationDeadline
    ? parseNairobiDateTime(data.registrationDeadline)
    : existing?.registrationDeadline || new Date(startDate.getTime() - 24 * 60 * 60 * 1000);

  if (Number.isNaN(registrationStart.getTime()) || Number.isNaN(registrationDeadline.getTime())) {
    throw new Error('Valid registration opening and closing date-times are required.');
  }
  const invalidWindow = (message) => { const error = new Error(message); error.statusCode = 400; throw error; };
  if (registrationStart >= registrationDeadline) invalidWindow('Registration must open before it closes.');
  if (registrationDeadline >= startDate) invalidWindow('Registration must close before the event start date.');
  const now = new Date();
  const registrationChanged = !existing
    || registrationStart.getTime() !== new Date(existing.registrationStart).getTime()
    || registrationDeadline.getTime() !== new Date(existing.registrationDeadline).getTime();
  if (registrationChanged && registrationStart <= now) invalidWindow('Registration opening must be in the future.');
  if (registrationChanged && registrationDeadline <= now) invalidWindow('Registration deadline must be in the future.');

  data.registrationStart = registrationStart;
  data.registrationDeadline = registrationDeadline;
  const timelineMessage = eventTimelineError({
    year: data.year ?? existing?.year,
    startDate: rawStartDate,
    endDate: data.endDate ?? existing?.endDate,
    registrationStart,
    registrationDeadline,
  });
  if (timelineMessage) invalidWindow(timelineMessage);
  const requestedStatus = data.status ?? existing?.status ?? 'draft';
  const statusMessage = eventStatusError({
    year: data.year ?? existing?.year,
    startDate: rawStartDate,
    endDate: data.endDate ?? existing?.endDate,
    registrationStart,
    registrationDeadline,
  }, requestedStatus);
  if (statusMessage) invalidWindow(statusMessage);
  if (requestedStatus !== 'draft') {
    data.status = now < registrationStart ? 'registration_scheduled'
      : now < registrationDeadline ? 'registration_open'
        : now < startDate ? 'registration_closed' : 'ongoing';
  }
  return data;
};

// GET /api/admin/events
export const getEvents = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const [events, total] = await Promise.all([
      Event.find().sort({ year: -1 }).skip(skip).limit(limit),
      Event.countDocuments(),
    ]);
    await Promise.all(events.map(syncEventStatus));
    return paginatedResponse(res, events, total, page, limit);
  } catch (err) { next(err); }
};

// GET /api/admin/events/:id
export const getEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return errorResponse(res, 'Event not found.', 404);
    const days = await EventDay.find({ event: event._id }).sort({ dayNumber: 1 });
    return successResponse(res, { event, days });
  } catch (err) { next(err); }
};

// POST /api/admin/events
export const createEvent = async (req, res, next) => {
  try {
    validateEventDates(req.body);
    rejectNewPastDate(req.body.startDate, null, 'Event start date');
    const data = prepareRegistrationWindow(eventPayload(req.body));
    data.isCurrent = req.body.isCurrent === true || req.body.isCurrent === 'true';
    if (data.isCurrent) await Event.updateMany({}, { $set: { isCurrent: false } });
    const event = await Event.create(data);
    return successResponse(res, { event }, 'Event created successfully.', 201);
  } catch (err) { next(err); }
};

// PUT /api/admin/events/:id
export const updateEvent = async (req, res, next) => {
  try {
    const existing = await Event.findById(req.params.id);
    if (!existing) return errorResponse(res, 'Event not found.', 404);
    const range = validateEventDates(req.body, existing);
    rejectNewPastDate(req.body.startDate ?? existing.startDate, existing.startDate, 'Event start date');
    const conflictingDay = await EventDay.findOne({
      event: existing._id,
      $or: [{ date: { $lt: new Date(range.start) } }, { date: { $gt: new Date(`${range.end}T23:59:59.999Z`) } }],
    });
    if (conflictingDay) return errorResponse(res, 'Update the existing event days first; at least one day falls outside the new event date range.', 400);
    const data = prepareRegistrationWindow(eventPayload(req.body), existing);
    data.isCurrent = req.body.isCurrent === true || req.body.isCurrent === 'true';
    if (data.isCurrent) {
      await Event.updateMany({ _id: { $ne: req.params.id } }, { $set: { isCurrent: false } });
    }
    const event = await Event.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    return successResponse(res, { event }, 'Event updated successfully.');
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

// --- Event Days ---
// GET /api/admin/events/:eventId/days
export const getEventDays = async (req, res, next) => {
  try {
    const days = await EventDay.find({ event: req.params.eventId }).sort({ dayNumber: 1 });
    return successResponse(res, { days });
  } catch (err) { next(err); }
};

// POST /api/admin/events/:eventId/days
export const createEventDay = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return errorResponse(res, 'Event not found.', 404);
    validateDayForEvent(event, req.body.date);
    rejectNewPastDate(req.body.date, null, 'Event day date');
    await ensureUniqueEventDay({ eventId: event._id, dayNumber: req.body.dayNumber, date: req.body.date });
    const day = await EventDay.create({ ...eventDayPayload(req.body), event: req.params.eventId });
    return successResponse(res, { day }, 'Event day created successfully.', 201);
  } catch (err) { next(err); }
};

// PUT /api/admin/events/:eventId/days/:dayId
export const updateEventDay = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return errorResponse(res, 'Event not found.', 404);
    validateDayForEvent(event, req.body.date);
    const existingDay = await EventDay.findOne({ _id: req.params.dayId, event: req.params.eventId });
    if (!existingDay) return errorResponse(res, 'Event day not found.', 404);
    rejectNewPastDate(req.body.date, existingDay.date, 'Event day date');
    await ensureUniqueEventDay({ eventId: event._id, dayNumber: req.body.dayNumber, date: req.body.date, excludeId: existingDay._id });
    const day = await EventDay.findOneAndUpdate(
      { _id: req.params.dayId, event: req.params.eventId },
      eventDayPayload(req.body),
      { new: true, runValidators: true }
    );
    if (!day) return errorResponse(res, 'Event day not found.', 404);
    return successResponse(res, { day }, 'Event day updated successfully.');
  } catch (err) { next(err); }
};

// DELETE /api/admin/events/:eventId/days/:dayId
export const deleteEventDay = async (req, res, next) => {
  try {
    const day = await EventDay.findOne({ _id: req.params.dayId, event: req.params.eventId });
    if (!day) return errorResponse(res, 'Event day not found.', 404);
    const summary = await deleteEventDayCascade(day);
    return successResponse(res, { summary }, `Event day deleted with ${summary.trainings} training session(s) and ${summary.relatedRecords} related record(s).`);
  } catch (err) { next(err); }
};
