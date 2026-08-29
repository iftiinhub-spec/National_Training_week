import mongoose from 'mongoose';
import Training from '../../models/Training.js';
import { escapeRegex } from '../../utils/search.js';
import Event from '../../models/Event.js';
import EventDay from '../../models/EventDay.js';
import Registration from '../../models/Registration.js';
import { successResponse, errorResponse, getPagination, paginatedResponse } from '../../utils/apiResponse.js';
import { sessionPhase, withEventPhase, withSessionPhase, registrationClosedReason } from '../../utils/lifecycle.js';

const publicEventFilter = { status: 'published', isActive: { $ne: false } };

// The public only ever sees sessions an administrator published. Whether one is open, running or
// finished is worked out from its dates when the response is built, never read from the database.
const PUBLIC_SESSION_FILTER = { status: { $in: ['published', 'completed'] } };

// Sessions are fetched with their event so the shared rule in utils/lifecycle.js can be applied.
const EVENT_FIELDS = 'name year theme startDate endDate registrationStart registrationDeadline';

const findCurrentEvent = async () => {
  const explicit = await Event.findOne({ ...publicEventFilter, isCurrent: true });
  if (explicit) return explicit;

  const today = new Date();
  return (await Event.findOne({ ...publicEventFilter, endDate: { $gte: today } }).sort({ startDate: 1 }))
    || await Event.findOne(publicEventFilter).sort({ year: -1, startDate: -1 });
};

// GET /api/public/trainings
export const getPublicTrainings = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = { ...PUBLIC_SESSION_FILTER };

    if (req.query.event) filter.event = req.query.event;
    else {
      const currentEvent = await findCurrentEvent();
      if (!currentEvent) return paginatedResponse(res, [], 0, page, limit);
      filter.event = currentEvent._id;
    }
    if (req.query.eventDay) filter.eventDay = req.query.eventDay;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.level) filter.level = req.query.level;
    if (req.query.language) filter.language = req.query.language;
    if (req.query.audience) filter.audience = { $regex: escapeRegex(req.query.audience), $options: 'i' };
    if (req.query.search) filter.title = { $regex: escapeRegex(req.query.search), $options: 'i' };

    // One edition is a few dozen sessions, so the programme is loaded in full, the shared rule is
    // applied to each session, and only then is the page cut. Filtering by "registration open"
    // cannot be expressed as a database query, because it depends on the current time.
    const sessions = await Training.find(filter)
      .populate('event', EVENT_FIELDS)
      .populate('eventDay', 'dayNumber theme date')
      .populate('category', 'name')
      .populate('trainer', 'name title organization photo')
      .populate('trainers', 'name title organization photo')
      .select('-moderator') // don't expose moderator to public
      .sort({ date: 1, startTime: 1 })
      .limit(500);

    const withPhase = sessions.map((session) => withSessionPhase(session));
    const visible = req.query.phase ? withPhase.filter((session) => session.phase === req.query.phase) : withPhase;
    return paginatedResponse(res, visible.slice(skip, skip + limit), visible.length, page, limit);
  } catch (err) { next(err); }
};

// GET /api/public/trainings/:trainingRef — accepts a slug or a legacy ObjectId
export const getPublicTraining = async (req, res, next) => {
  try {
    const { trainingRef } = req.params;
    const training = await Training.findOne(
      mongoose.isObjectIdOrHexString(trainingRef) ? { _id: trainingRef } : { slug: trainingRef }
    )
      .populate('event', EVENT_FIELDS)
      .populate('eventDay', 'dayNumber theme date')
      .populate('category', 'name')
      .populate('trainer', 'name title organization biography photo expertise');
    await training?.populate('trainers', 'name title organization biography photo expertise');

    if (!training) return errorResponse(res, 'Training not found.', 404);
    if (!['published', 'completed'].includes(training.status)) {
      return errorResponse(res, 'Training not found.', 404);
    }

    // Count approved registrations (for capacity display)
    const registeredCount = await Registration.countDocuments({ training: training._id, status: 'approved' });

    // Computed here so the page never has to re-derive the rule and disagree with the server.
    const { phase, registration } = sessionPhase(training, training.event, { registeredCount });
    return successResponse(res, {
      training: withSessionPhase(training, training.event, { registeredCount }),
      registeredCount,
      registrationOpen: registration.open,
      registrationClosesAt: registration.closesAt || null,
      registrationMessage: registration.open ? null : registrationClosedReason(registration),
      displayStatus: phase,
    });
  } catch (err) { next(err); }
};

// GET /api/public/events — public event list
export const getPublicEvents = async (req, res, next) => {
  try {
    const events = await Event.find(publicEventFilter).sort({ year: -1 }).limit(500);
    return successResponse(res, { events: events.map((event) => withEventPhase(event)) });
  } catch (err) { next(err); }
};

// GET /api/public/current-event — the edition used across all public pages
export const getCurrentEvent = async (req, res, next) => {
  try {
    const event = await findCurrentEvent();
    if (!event) return errorResponse(res, 'No public event edition is available.', 404);
    const days = await EventDay.find({ event: event._id }).sort({ dayNumber: 1 });
    const sessionCount = await Training.countDocuments({ event: event._id, ...PUBLIC_SESSION_FILTER });
    return successResponse(res, { event: withEventPhase(event), days, sessionCount });
  } catch (err) { next(err); }
};

// GET /api/public/events/:id — public event detail with days
export const getPublicEvent = async (req, res, next) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, ...publicEventFilter });
    if (!event) return errorResponse(res, 'Event not found.', 404);
    const days = await EventDay.find({ event: event._id }).sort({ dayNumber: 1 });
    return successResponse(res, { event: withEventPhase(event), days });
  } catch (err) { next(err); }
};

// GET /api/public/program?eventId= — full program for public program page
export const getPublicProgram = async (req, res, next) => {
  try {
    const event = req.query.eventId
      ? await Event.findOne({ _id: req.query.eventId, ...publicEventFilter })
      : await findCurrentEvent();
    if (!event) return errorResponse(res, 'No active event found.', 404);

    const days = await EventDay.find({ event: event._id }).sort({ dayNumber: 1 });
    const sessions = await Training.find({
      event: event._id,
      eventDay: { $in: days.map((day) => day._id) },
      ...PUBLIC_SESSION_FILTER,
    })
      .populate('trainer', 'name title photo organization')
      .populate('trainers', 'name title photo organization')
      .populate('category', 'name')
      .sort({ eventDay: 1, startTime: 1 });
    const sessionsByDay = new Map();
    sessions.forEach((session) => {
      const key = String(session.eventDay);
      const grouped = sessionsByDay.get(key) || [];
      grouped.push(withSessionPhase(session, event));
      sessionsByDay.set(key, grouped);
    });
    const program = days.map((day) => ({ day, sessions: sessionsByDay.get(String(day._id)) || [] }));

    return successResponse(res, { event: withEventPhase(event), program });
  } catch (err) { next(err); }
};

// GET /api/public/featured-trainings — for home page
export const getFeaturedTrainings = async (req, res, next) => {
  try {
    const event = req.query.event || await findCurrentEvent();
    const trainings = await Training.find({
      ...(event ? { event: event._id || event } : {}),
      status: 'published',
    })
      .populate('trainer', 'name title photo')
      .populate('trainers', 'name title photo')
      .populate('category', 'name')
      .populate('event', EVENT_FIELDS)
      .sort({ date: 1 })
      .limit(24);
    // The home page shows what people can act on: sessions still taking registrations first.
    const featured = trainings
      .map((training) => withSessionPhase(training))
      .filter((training) => training.phase === 'registration_open' || training.phase === 'scheduled')
      .slice(0, 6);
    return successResponse(res, { trainings: featured });
  } catch (err) { next(err); }
};
