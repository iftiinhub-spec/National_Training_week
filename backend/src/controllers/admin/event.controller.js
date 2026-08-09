import Event from '../../models/Event.js';
import EventDay from '../../models/EventDay.js';
import { successResponse, errorResponse, getPagination, paginatedResponse } from '../../utils/apiResponse.js';

// GET /api/admin/events
export const getEvents = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const [events, total] = await Promise.all([
      Event.find().sort({ year: -1 }).skip(skip).limit(limit),
      Event.countDocuments(),
    ]);
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
    const data = { ...req.body };
    data.isCurrent = req.body.isCurrent === true || req.body.isCurrent === 'true';
    if (data.isCurrent) await Event.updateMany({}, { $set: { isCurrent: false } });
    const event = await Event.create(data);
    return successResponse(res, { event }, 'Event created successfully.', 201);
  } catch (err) { next(err); }
};

// PUT /api/admin/events/:id
export const updateEvent = async (req, res, next) => {
  try {
    const data = { ...req.body };
    data.isCurrent = req.body.isCurrent === true || req.body.isCurrent === 'true';
    if (data.isCurrent) {
      await Event.updateMany({ _id: { $ne: req.params.id } }, { $set: { isCurrent: false } });
    }
    const event = await Event.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!event) return errorResponse(res, 'Event not found.', 404);
    return successResponse(res, { event }, 'Event updated successfully.');
  } catch (err) { next(err); }
};

// DELETE /api/admin/events/:id
export const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return errorResponse(res, 'Event not found.', 404);
    return successResponse(res, null, 'Event deleted successfully.');
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
    const day = await EventDay.create({ ...req.body, event: req.params.eventId });
    return successResponse(res, { day }, 'Event day created successfully.', 201);
  } catch (err) { next(err); }
};

// PUT /api/admin/events/:eventId/days/:dayId
export const updateEventDay = async (req, res, next) => {
  try {
    const day = await EventDay.findOneAndUpdate(
      { _id: req.params.dayId, event: req.params.eventId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!day) return errorResponse(res, 'Event day not found.', 404);
    return successResponse(res, { day }, 'Event day updated successfully.');
  } catch (err) { next(err); }
};

// DELETE /api/admin/events/:eventId/days/:dayId
export const deleteEventDay = async (req, res, next) => {
  try {
    const day = await EventDay.findOneAndDelete({ _id: req.params.dayId, event: req.params.eventId });
    if (!day) return errorResponse(res, 'Event day not found.', 404);
    return successResponse(res, null, 'Event day deleted successfully.');
  } catch (err) { next(err); }
};
