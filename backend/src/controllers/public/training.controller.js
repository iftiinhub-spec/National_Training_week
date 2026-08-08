import Training from '../../models/Training.js';
import Event from '../../models/Event.js';
import EventDay from '../../models/EventDay.js';
import Registration from '../../models/Registration.js';
import { successResponse, errorResponse, getPagination, paginatedResponse } from '../../utils/apiResponse.js';

// GET /api/public/trainings
export const getPublicTrainings = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = { status: { $in: ['published', 'registration_open', 'registration_closed', 'ongoing', 'completed'] } };

    if (req.query.event) filter.event = req.query.event;
    if (req.query.eventDay) filter.eventDay = req.query.eventDay;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.level) filter.level = req.query.level;
    if (req.query.language) filter.language = req.query.language;
    if (req.query.audience) filter.audience = { $regex: req.query.audience, $options: 'i' };
    if (req.query.search) filter.title = { $regex: req.query.search, $options: 'i' };
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
      .populate('event', 'name year theme startDate endDate')
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
    const events = await Event.find({ status: { $ne: 'draft' } }).sort({ year: -1 });
    return successResponse(res, { events });
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
    const eventFilter = req.query.eventId
      ? { _id: req.query.eventId }
      : { status: { $ne: 'draft' } };

    const event = await Event.findOne(eventFilter).sort({ year: -1 });
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
    const trainings = await Training.find({
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
