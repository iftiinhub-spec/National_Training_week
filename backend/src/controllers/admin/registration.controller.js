import Registration from '../../models/Registration.js';
import Training from '../../models/Training.js';
import Attendance from '../../models/Attendance.js';
import { successResponse, errorResponse, getPagination, paginatedResponse } from '../../utils/apiResponse.js';
import { sendRegistrationStatusEmail } from '../../utils/registrationEmail.js';

// GET /api/admin/registrations
export const getRegistrations = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};
    if (req.query.training) filter.training = req.query.training;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.participant) filter.participant = req.query.participant;

    const [registrations, total] = await Promise.all([
      Registration.find(filter)
        .populate('participant', 'fullName email phone participantType region organization')
        .populate('training', 'title date startTime endTime status')
        .populate('updatedBy', 'fullName role')
        .sort({ registeredAt: -1 })
        .skip(skip).limit(limit),
      Registration.countDocuments(filter),
    ]);
    return paginatedResponse(res, registrations, total, page, limit);
  } catch (err) { next(err); }
};

// GET /api/admin/registrations/:id
export const getRegistration = async (req, res, next) => {
  try {
    const reg = await Registration.findById(req.params.id)
      .populate('participant', 'fullName email phone participantType region')
      .populate('training', 'title date startTime endTime status event')
      .populate('updatedBy', 'fullName role');
    if (!reg) return errorResponse(res, 'Registration not found.', 404);
    return successResponse(res, { registration: reg });
  } catch (err) { next(err); }
};

// PATCH /api/admin/registrations/:id/status
export const updateRegistrationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['approved', 'rejected', 'cancelled'];
    if (!allowed.includes(status)) return errorResponse(res, 'Invalid status.', 400);

    const reg = await Registration.findById(req.params.id)
      .populate('training')
      .populate('participant', 'fullName email');
    if (!reg) return errorResponse(res, 'Registration not found.', 404);
    if (reg.status === 'cancelled') return errorResponse(res, 'Cannot update a cancelled registration.', 400);

    // Capacity check when approving
    if (status === 'approved' && reg.training.capacity) {
      const approvedCount = await Registration.countDocuments({
        training: reg.training._id, status: 'approved',
      });
      if (approvedCount >= reg.training.capacity) {
        return errorResponse(res, 'Training capacity is full.', 400);
      }
    }

    const previousStatus = reg.status;
    reg.status = status;
    reg.updatedBy = req.user._id;
    await reg.save();

    // If approving, create an attendance record (status: not_marked)
    if (status === 'approved') {
      await Attendance.findOneAndUpdate(
        { participant: reg.participant._id, training: reg.training._id },
        { $setOnInsert: { participant: reg.participant._id, training: reg.training._id, status: 'not_marked' } },
        { upsert: true, new: true }
      );

      if (previousStatus !== 'approved') {
        await sendRegistrationStatusEmail({
          to: reg.participant.email,
          participantName: reg.participant.fullName,
          trainingTitle: reg.training.title,
          status: 'approved',
          date: reg.training.date,
          startTime: reg.training.startTime,
        });
      }
    }

    return successResponse(res, { registration: reg }, `Registration ${status}.`);
  } catch (err) { next(err); }
};
