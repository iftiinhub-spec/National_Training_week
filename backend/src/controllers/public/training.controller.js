import Training from '../../models/Training.js';
import { escapeRegex } from '../../utils/search.js';
import Event from '../../models/Event.js';
import EventDay from '../../models/EventDay.js';
import Registration from '../../models/Registration.js';
import { successResponse, errorResponse, getPagination, paginatedResponse } from '../../utils/apiResponse.js';
import { syncEventStatus } from '../../utils/eventLifecycle.js';

const publicEventFilter = { status: { $ne: 'draft' }, isActive: { $ne: false } };

const findCurrentEvent = async () => {
  const explicit = await Event.findOne({ ...publicEventFilter, isCurrent: true });
  if (explicit) return syncEventStatus(explicit);

  const today = new Date();
  const event = (await Event.findOne({ ...publicEventFilter, endDate: { $gte: today } }).sort({ startDate: 1 }))
    || await Event.findOne(publicEventFilter).sort({ year: -1, startDate: -1 });
  return syncEventStatus(event);
};

// GET /api/public/trainings
export const getPublicTrainings = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = { status: { $in: ['published', 'registration_open', 'registration_closed', 'ongoing', 'completed'] } };

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
    if (req.query.status) filter.status = req.query.status;

    const [trainings, total] = await Promise.all([
      Training.find(filter)
        .populate('event', 'name year theme')
        .populate('eventDay', 'dayNumber theme date')
        .populate('category', 'name')
        .populate('trainer', 'name title organization photo')
        .select('-moderator') // don't expose moderator to public
        .sort({ date: 1 })
        .skip(skip).limit(limit),
      Training.countDocuments(filter),
    ]);
    return paginatedResponse(res, trainings, total, page, limit);
  } catch (err) { next(err); }
};

// GET /api/public/trainings/:id
export const getPublicTraining = async (req, res, next) => {
  try {
    const training = await Training.findById(req.params.id)
      .populate('event', 'name year theme startDate endDate registrationStart registrationDeadline')
      .populate('eventDay', 'dayNumber theme date')
      .populate('category', 'name')
      .populate('trainer', 'name title organization biography photo expertise');

    if (!training) return errorResponse(res, 'Training not found.', 404);
    if (!['published', 'registration_open', 'registration_closed', 'ongoing', 'completed'].includes(training.status)) {
      return errorResponse(res, 'Training not found.', 404);
    }

    // Count approved registrations (for capacity display)
    const registeredCount = await Registration.countDocuments({ training: training._id, status: 'approved' });

    return successResponse(res, { training, registeredCount });
  } catch (err) { next(err); }
};

// GET /api/public/events — public event list
export const getPublicEvents = async (req, res, next) => {
  try {
    const events = await Event.find(publicEventFilter).sort({ year: -1 }).limit(500);
    return successResponse(res, { events });
  } catch (err) { next(err); }
};

// GET /api/public/current-event — the edition used across all public pages
export const getCurrentEvent = async (req, res, next) => {
  try {
    const event = await findCurrentEvent();
    if (!event) return errorResponse(res, 'No public event edition is available.', 404);
    const days = await EventDay.find({ event: event._id }).sort({ dayNumber: 1 });
    const sessionCount = await Training.countDocuments({
      event: event._id,
      status: { $in: ['published', 'registration_open', 'registration_closed', 'ongoing', 'completed'] },
    });
    return successResponse(res, { event, days, sessionCount });
  } catch (err) { next(err); }
};

// GET /api/public/events/:id — public event detail with days
export const getPublicEvent = async (req, res, next) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, status: { $ne: 'draft' } });
    if (!event) return errorResponse(res, 'Event not found.', 404);
    const days = await EventDay.find({ event: event._id }).sort({ dayNumber: 1 });
    return successResponse(res, { event, days });
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
    const program = await Promise.all(days.map(async (day) => {
      const sessions = await Training.find({
        eventDay: day._id,
        status: { $in: ['published', 'registration_open', 'registration_closed', 'ongoing', 'completed'] },
      })
        .populate('trainer', 'name title photo organization')
        .populate('category', 'name')
        .sort({ startTime: 1 });
      return { day, sessions };
    }));

    return successResponse(res, { event, program });
  } catch (err) { next(err); }
};

// GET /api/public/featured-trainings — for home page
export const getFeaturedTrainings = async (req, res, next) => {
  try {
    const event = req.query.event || await findCurrentEvent();
    const trainings = await Training.find({
      ...(event ? { event: event._id || event } : {}),
      status: { $in: ['published', 'registration_open'] },
    })
      .populate('trainer', 'name title photo')
      .populate('category', 'name')
      .populate('event', 'name year')
      .sort({ date: 1 })
      .limit(6);
    return successResponse(res, { trainings });
  } catch (err) { next(err); }
};
