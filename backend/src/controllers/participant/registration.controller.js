import Training from '../../models/Training.js';
import Registration from '../../models/Registration.js';
import Attendance from '../../models/Attendance.js';
import Meeting from '../../models/Meeting.js';
import { successResponse, errorResponse, getPagination, paginatedResponse } from '../../utils/apiResponse.js';

// POST /api/participant/registrations
export const registerForTraining = async (req, res, next) => {
  try {
    const { trainingId } = req.body;
    const participantId = req.user._id;

    const training = await Training.findById(trainingId);
    if (!training) return errorResponse(res, 'Training not found.', 404);
    if (!['published', 'registration_open'].includes(training.status)) {
      return errorResponse(res, 'This training is not currently open for registration.', 400);
    }

    // Capacity check
    if (training.capacity) {
      const count = await Registration.countDocuments({ training: trainingId, status: 'approved' });
      if (count >= training.capacity) return errorResponse(res, 'This training has reached its capacity.', 400);
    }

    // Duplicate check handled by unique index - will throw 11000 if duplicate
    const reg = await Registration.create({ participant: participantId, training: trainingId });
    const populated = await Registration.findById(reg._id)
      .populate('training', 'title date startTime endTime status');
    return successResponse(res, { registration: populated }, 'Registration submitted. Awaiting approval.', 201);
  } catch (err) { next(err); }
};

// GET /api/participant/registrations
export const getMyRegistrations = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = { participant: req.user._id };
    if (req.query.status) filter.status = req.query.status;

    const [registrations, total] = await Promise.all([
      Registration.find(filter)
        .populate({
          path: 'training',
          select: 'title date startTime endTime status coverImage level language audience',
          populate: [
            { path: 'event', select: 'name year' },
            { path: 'eventDay', select: 'dayNumber theme' },
            { path: 'trainer', select: 'name title photo' },
            { path: 'category', select: 'name' },
          ],
        })
        .sort({ registeredAt: -1 }).skip(skip).limit(limit),
      Registration.countDocuments(filter),
    ]);
    return paginatedResponse(res, registrations, total, page, limit);
  } catch (err) { next(err); }
};

// GET /api/participant/registrations/:id
export const getMyRegistration = async (req, res, next) => {
  try {
    const reg = await Registration.findOne({ _id: req.params.id, participant: req.user._id })
      .populate({
        path: 'training',
        populate: [
          { path: 'event', select: 'name year' },
          { path: 'trainer', select: 'name title organization biography photo expertise' },
          { path: 'category', select: 'name' },
        ],
      });
    if (!reg) return errorResponse(res, 'Registration not found.', 404);

    // If approved and meeting is released, include meeting info
    let meeting = null;
    if (reg.status === 'approved') {
      meeting = await Meeting.findOne({ training: reg.training._id, isReleased: true })
        .select('platform meetingUrl meetingId passcode startTime endTime notes');
    }

    return successResponse(res, { registration: reg, meeting });
  } catch (err) { next(err); }
};

// PATCH /api/participant/registrations/:id/cancel
export const cancelRegistration = async (req, res, next) => {
  try {
    const reg = await Registration.findOne({ _id: req.params.id, participant: req.user._id });
    if (!reg) return errorResponse(res, 'Registration not found.', 404);
    if (['cancelled', 'rejected'].includes(reg.status)) {
      return errorResponse(res, 'This registration is already cancelled or rejected.', 400);
    }
    reg.status = 'cancelled';
    reg.updatedBy = req.user._id;
    await reg.save();
    return successResponse(res, { registration: reg }, 'Registration cancelled.');
  } catch (err) { next(err); }
};

// GET /api/participant/attendance — own attendance records
export const getMyAttendance = async (req, res, next) => {
  try {
    const records = await Attendance.find({ participant: req.user._id })
      .populate('training', 'title date startTime endTime coverImage status')
      .sort({ createdAt: -1 });
    return successResponse(res, { attendance: records });
  } catch (err) { next(err); }
};

// GET /api/participant/dashboard
export const getParticipantDashboard = async (req, res, next) => {
  try {
    const participantId = req.user._id;

    const [
      myRegistrations,
      myAttendance,
      myCertificates,
      upcomingTrainings,
    ] = await Promise.all([
      Registration.find({ participant: participantId })
        .populate('training', 'title date startTime status coverImage')
        .sort({ registeredAt: -1 }).limit(5),
      Attendance.find({ participant: participantId }).countDocuments(),
      (await import('../../models/Certificate.js')).default.countDocuments({ participant: participantId, isRevoked: false }),
      Training.find({ status: { $in: ['published', 'registration_open'] }, date: { $gte: new Date() } })
        .populate('trainer', 'name title photo')
        .populate('category', 'name')
        .sort({ date: 1 }).limit(6),
    ]);

    const stats = {
      totalRegistrations: await Registration.countDocuments({ participant: participantId }),
      approvedRegistrations: await Registration.countDocuments({ participant: participantId, status: 'approved' }),
      totalAttended: await Attendance.countDocuments({ participant: participantId, status: 'present' }),
      totalCertificates: myCertificates,
    };

    return successResponse(res, { stats, recentRegistrations: myRegistrations, upcomingTrainings });
  } catch (err) { next(err); }
};
