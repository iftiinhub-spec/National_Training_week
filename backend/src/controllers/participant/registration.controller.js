import Training from '../../models/Training.js';
import Registration from '../../models/Registration.js';
import Attendance from '../../models/Attendance.js';
import Meeting from '../../models/Meeting.js';
import TrainingMaterial from '../../models/TrainingMaterial.js';
import { successResponse, errorResponse, getPagination, paginatedResponse } from '../../utils/apiResponse.js';
import { sendRegistrationStatusEmail } from '../../utils/registrationEmail.js';

// POST /api/participant/registrations
export const registerForTraining = async (req, res, next) => {
  try {
    const { trainingId } = req.body;
    const participantId = req.user._id;

    const training = await Training.findById(trainingId)
      .populate('eventDay', 'dayNumber theme date')
      .populate('event', 'registrationStart registrationDeadline startDate status');
    if (!training) return errorResponse(res, 'Training not found.', 404);
    if (training.status !== 'registration_open') {
      return errorResponse(res, 'This training is not currently open for registration.', 400);
    }
    const now = new Date();
    if (!training.event?.registrationStart || !training.event?.registrationDeadline) {
      return errorResponse(res, 'The registration window has not been configured for this event.', 400);
    }
    if (now < training.event.registrationStart) {
      return errorResponse(res, `Registration opens on ${training.event.registrationStart.toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}.`, 400);
    }
    if (now >= training.event.registrationDeadline) {
      return errorResponse(res, 'Registration for this event has closed.', 400);
    }

    // const sameDayTrainings = await Training.find({
    //   _id: { $ne: training._id },
    //   eventDay: training.eventDay?._id || training.eventDay,
    // }).select('_id title');
    // const conflict = await Registration.findOne({
    //   participant: participantId,
    //   training: { $in: sameDayTrainings.map((item) => item._id) },
    //   status: { $in: ['pending', 'approved'] },
    // }).populate('training', 'title');
    // if (conflict) {
    //   const dayLabel = training.eventDay?.dayNumber ? `Day ${training.eventDay.dayNumber}` : 'this event day';
    //   return errorResponse(res, `You already have an active registration for “${conflict.training.title}” on ${dayLabel}. A participant can register for only one session per event day.`, 409);
    // }

    // Capacity check
    if (training.capacity) {
      const count = await Registration.countDocuments({ training: trainingId, status: 'approved' });
      if (count >= training.capacity) return errorResponse(res, 'This training has reached its capacity.', 400);
    }

    // Duplicate check handled by unique index - will throw 11000 if duplicate
    const reg = await Registration.create({ participant: participantId, training: trainingId });
    const populated = await Registration.findById(reg._id)
      .populate('training', 'title date startTime endTime status');
    await sendRegistrationStatusEmail({
      to: req.user.email,
      participantName: req.user.fullName,
      trainingTitle: populated.training.title,
      status: 'pending',
      date: populated.training.date,
      startTime: populated.training.startTime,
    });
    return successResponse(res, { registration: populated }, 'Registration submitted. Awaiting approval.', 201);
  } catch (err) { next(err); }
};

// GET /api/participant/registrations
export const getMyRegistrations = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = { participant: req.user._id };
    if (req.query.status) filter.status = req.query.status;
    // Lets a caller ask about one session directly instead of paging through every registration.
    if (req.query.training) filter.training = req.query.training;

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
        .sort({ registeredAt: -1 }).skip(skip).limit(limit).lean(),
      Registration.countDocuments(filter),
    ]);
    const approvedTrainingIds = registrations
      .filter((registration) => registration.status === 'approved' && registration.training)
      .map((registration) => registration.training._id);
    const materials = approvedTrainingIds.length
      ? await TrainingMaterial.find({ training: { $in: approvedTrainingIds } })
        .select('training title url description createdAt').sort({ createdAt: -1 }).lean()
      : [];
    const materialsByTraining = materials.reduce((grouped, material) => {
      const key = String(material.training);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(material);
      return grouped;
    }, {});
    const securedRegistrations = registrations.map((registration) => ({
      ...registration,
      training: registration.training ? {
        ...registration.training,
        materials: registration.status === 'approved' ? (materialsByTraining[String(registration.training._id)] || []) : [],
      } : null,
    }));
    return paginatedResponse(res, securedRegistrations, total, page, limit);
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
    let materials = [];
    if (reg.status === 'approved') {
      [meeting, materials] = await Promise.all([
        Meeting.findOne({ training: reg.training._id })
          .select('platform meetingUrl meetingId passcode startTime endTime notes'),
        TrainingMaterial.find({ training: reg.training._id })
          .select('title url description createdAt').sort({ createdAt: -1 }),
      ]);
    }

    return successResponse(res, { registration: reg, meeting, materials });
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
        .populate('trainers', 'name title photo')
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
