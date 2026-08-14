import User from '../../models/User.js';
import Training from '../../models/Training.js';
import Registration from '../../models/Registration.js';
import Attendance from '../../models/Attendance.js';
import Certificate from '../../models/Certificate.js';
import Feedback from '../../models/Feedback.js';
import Event from '../../models/Event.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

const scopedTrainingIds = async (query) => {
  if (query.trainingId) return Training.find({ _id: query.trainingId }).distinct('_id');
  if (!query.eventId && !query.eventDayId) return null;
  const filter = {};
  if (query.eventId) filter.event = query.eventId;
  if (query.eventDayId) filter.eventDay = query.eventDayId;
  return Training.find(filter).distinct('_id');
};

const scopedParticipantIds = async (trainingIds) => trainingIds
  ? Registration.find({ training: { $in: trainingIds } }).distinct('participant')
  : null;

// GET /api/admin/reports/overview
export const getOverview = async (req, res, next) => {
  try {
    const trainingIds = await scopedTrainingIds(req.query);
    const trainingFilter = trainingIds ? { training: { $in: trainingIds } } : {};
    const participantIds = await scopedParticipantIds(trainingIds);
    const [
      totalParticipants, totalTrainings, totalTrainers, totalModerators,
      totalRegistrations, totalPresent, totalCertificates, totalEvents,
      pendingRegistrations, approvedRegistrations,
    ] = await Promise.all([
      User.countDocuments({ role: 'participant', ...(participantIds ? { _id: { $in: participantIds } } : {}) }),
      Training.countDocuments(trainingIds ? { _id: { $in: trainingIds } } : {}),
      (await import('../../models/Trainer.js')).default.countDocuments(),
      User.countDocuments({ role: 'moderator' }),
      Registration.countDocuments(trainingFilter),
      Attendance.countDocuments({ ...trainingFilter, status: 'present' }),
      Certificate.countDocuments({ ...trainingFilter, isRevoked: false }),
      Event.countDocuments(),
      Registration.countDocuments({ ...trainingFilter, status: 'pending' }),
      Registration.countDocuments({ ...trainingFilter, status: 'approved' }),
    ]);

    return successResponse(res, {
      totalParticipants, totalTrainings, totalTrainers, totalModerators,
      totalRegistrations, totalPresent, totalCertificates, totalEvents,
      pendingRegistrations, approvedRegistrations,
    });
  } catch (err) { next(err); }
};

// GET /api/admin/reports/registrations?eventId=
export const registrationReport = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.eventId) {
      const trainings = await Training.find({ event: req.query.eventId }).select('_id');
      filter.training = { $in: trainings.map((t) => t._id) };
    }

    const data = await Registration.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const byTraining = await Registration.aggregate([
      { $match: filter },
      { $group: { _id: '$training', total: { $sum: 1 }, approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } } } },
      { $lookup: { from: 'trainings', localField: '_id', foreignField: '_id', as: 'training' } },
      { $unwind: '$training' },
      { $project: { title: '$training.title', total: 1, approved: 1 } },
      { $sort: { total: -1 } },
    ]);

    return successResponse(res, { byStatus: data, byTraining });
  } catch (err) { next(err); }
};

// GET /api/admin/reports/attendance?trainingId=&eventId=
export const attendanceReport = async (req, res, next) => {
  try {
    const trainingIds = await scopedTrainingIds(req.query);
    const filter = trainingIds ? { training: { $in: trainingIds } } : {};

    const data = await Attendance.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const total = data.reduce((s, d) => s + d.count, 0);
    const present = data.find((d) => d._id === 'present')?.count || 0;
    const attendanceRate = total > 0 ? ((present / total) * 100).toFixed(1) : 0;

    const byTraining = await Attendance.aggregate([
      { $match: filter },
      { $group: { _id: { training: '$training', status: '$status' }, count: { $sum: 1 } } },
      { $group: { _id: '$_id.training', statuses: { $push: { status: '$_id.status', count: '$count' } }, total: { $sum: '$count' } } },
      { $lookup: { from: 'trainings', localField: '_id', foreignField: '_id', as: 'training' } },
      { $unwind: '$training' },
      { $project: { title: '$training.title', statuses: 1, total: 1 } },
      { $sort: { total: -1 } },
    ]);

    return successResponse(res, { byStatus: data, attendanceRate, total, byTraining });
  } catch (err) { next(err); }
};

// GET /api/admin/reports/participants-by-region
export const participantsByRegion = async (req, res, next) => {
  try {
    const participantIds = await scopedParticipantIds(await scopedTrainingIds(req.query));
    const data = await User.aggregate([
      { $match: { role: 'participant', ...(participantIds ? { _id: { $in: participantIds } } : {}) } },
      { $group: { _id: '$region', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    return successResponse(res, { byRegion: data });
  } catch (err) { next(err); }
};

// GET /api/admin/reports/participants-by-type
export const participantsByType = async (req, res, next) => {
  try {
    const participantIds = await scopedParticipantIds(await scopedTrainingIds(req.query));
    const data = await User.aggregate([
      { $match: { role: 'participant', ...(participantIds ? { _id: { $in: participantIds } } : {}) } },
      { $group: { _id: '$participantType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    return successResponse(res, { byType: data });
  } catch (err) { next(err); }
};

// GET /api/admin/reports/certificates
export const certificateReport = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.trainingId) filter.training = req.query.trainingId;
    const [total, revoked] = await Promise.all([
      Certificate.countDocuments(filter),
      Certificate.countDocuments({ ...filter, isRevoked: true }),
    ]);
    const byTraining = await Certificate.aggregate([
      { $match: { isRevoked: false } },
      { $group: { _id: '$training', count: { $sum: 1 } } },
      { $lookup: { from: 'trainings', localField: '_id', foreignField: '_id', as: 'training' } },
      { $unwind: '$training' },
      { $project: { title: '$training.title', count: 1 } },
      { $sort: { count: -1 } },
    ]);
    return successResponse(res, { total, revoked, active: total - revoked, byTraining });
  } catch (err) { next(err); }
};

// GET /api/admin/reports/feedback
export const feedbackReport = async (req, res, next) => {
  try {
    const trainingIds = await scopedTrainingIds(req.query);
    const filter = trainingIds ? { training: { $in: trainingIds } } : {};
    const data = await Feedback.aggregate([
      { $match: filter },
      { $group: {
        _id: null,
        count: { $sum: 1 },
        avgContent: { $avg: '$contentRating' },
        avgTrainer: { $avg: '$trainerRating' },
        avgOrg: { $avg: '$organizationRating' },
      }},
    ]);
    const byTraining = await Feedback.aggregate([
      { $match: filter },
      { $group: {
        _id: '$training', count: { $sum: 1 },
        avgContent: { $avg: '$contentRating' },
        avgTrainer: { $avg: '$trainerRating' },
        avgOrg: { $avg: '$organizationRating' },
      }},
      { $lookup: { from: 'trainings', localField: '_id', foreignField: '_id', as: 'training' } },
      { $unwind: '$training' },
      { $project: { title: '$training.title', count: 1, avgContent: 1, avgTrainer: 1, avgOrg: 1 } },
      { $sort: { avgContent: -1 } },
    ]);
    return successResponse(res, { summary: data[0] || {}, byTraining });
  } catch (err) { next(err); }
};

// GET /api/admin/reports/daily-attendance
export const dailyAttendanceSummary = async (req, res, next) => {
  try {
    const eventId = req.query.eventId;
    const EventDay = (await import('../../models/EventDay.js')).default;
    const dayFilter = {};
    if (eventId) dayFilter.event = eventId;
    if (req.query.eventDayId) dayFilter._id = req.query.eventDayId;
    const days = await EventDay.find(dayFilter).sort({ dayNumber: 1 });

    const result = await Promise.all(days.map(async (day) => {
      const trainings = await Training.find({ eventDay: day._id, ...(req.query.trainingId ? { _id: req.query.trainingId } : {}) }).select('_id title');
      const trainingIds = trainings.map((t) => t._id);
      const [present, total] = await Promise.all([
        Attendance.countDocuments({ training: { $in: trainingIds }, status: 'present' }),
        Attendance.countDocuments({ training: { $in: trainingIds } }),
      ]);
      return { day: `Day ${day.dayNumber}: ${day.theme}`, date: day.date, present, total, rate: total > 0 ? ((present/total)*100).toFixed(1) : 0 };
    }));

    return successResponse(res, { dailySummary: result });
  } catch (err) { next(err); }
};
