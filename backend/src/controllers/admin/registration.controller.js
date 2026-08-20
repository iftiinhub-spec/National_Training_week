import Registration from '../../models/Registration.js';
import Training from '../../models/Training.js';
import Attendance from '../../models/Attendance.js';
import { successResponse, errorResponse, getPagination, paginatedResponse } from '../../utils/apiResponse.js';
import { sendRegistrationStatusEmail } from '../../utils/registrationEmail.js';
import { resolveTrainingScope } from '../../utils/trainingScope.js';

const idsFromRequest = (req) => [...new Set((req.body?.ids || [req.params.id]).filter(Boolean).map(String))];

const deleteRegistrationIds = async (ids) => {
  const registrations = await Registration.find({ _id: { $in: ids } }).select('participant training status');
  const approvedByTraining = registrations
    .filter((registration) => registration.status === 'approved')
    .reduce((grouped, registration) => {
      const key = String(registration.training);
      grouped[key] = (grouped[key] || 0) + 1;
      return grouped;
    }, {});
  await Promise.all(Object.entries(approvedByTraining).map(([training, count]) => (
    Training.findByIdAndUpdate(training, { $inc: { filledSeats: -count } })
  )));
  const attendanceDeletes = await Promise.all(registrations.map((registration) => (
    Attendance.deleteMany({ participant: registration.participant, training: registration.training })
  )));
  const deleted = await Registration.deleteMany({ _id: { $in: ids } });
  return {
    registrations: deleted.deletedCount,
    attendance: attendanceDeletes.reduce((total, result) => total + result.deletedCount, 0),
  };
};

// GET /api/admin/registrations
export const getRegistrations = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};
    const trainingScope = await resolveTrainingScope(req.query);
    if (trainingScope) filter.training = trainingScope;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.participant) filter.participant = req.query.participant;

    const [registrations, total] = await Promise.all([
      Registration.find(filter)
        .populate('participant', 'fullName email phone participantType region organization')
        .populate({ path: 'training', select: 'title date startTime endTime status event eventDay', populate: [{ path: 'event', select: 'name year' }, { path: 'eventDay', select: 'dayNumber theme date' }] })
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

    const previousStatus = reg.status;

    // // Validate same-day exclusivity before persisting the approval.
    // if (status === 'approved') {
    //   const sameDayTrainingIds = await Training.find({
    //     _id: { $ne: reg.training._id }, eventDay: reg.training.eventDay,
    //   }).distinct('_id');
    //   const approvedConflict = await Registration.findOne({
    //     _id: { $ne: reg._id }, participant: reg.participant._id,
    //     training: { $in: sameDayTrainingIds }, status: 'approved',
    //   }).populate('training', 'title');
    //   if (approvedConflict) {
    //     return errorResponse(res, `This participant is already approved for “${approvedConflict.training.title}” on the same event day.`, 409);
    //   }
    // }

    // Atomically reserve a seat when newly approving, so two concurrent
    // approvals can't both pass a stale capacity check.
    if (status === 'approved' && previousStatus !== 'approved' && reg.training.capacity) {
      const reserved = await Training.findOneAndUpdate(
        { _id: reg.training._id, $expr: { $lt: ['$filledSeats', '$capacity'] } },
        { $inc: { filledSeats: 1 } },
      );
      if (!reserved) return errorResponse(res, 'Training capacity is full.', 400);
    }

    // Release a seat when moving a previously-approved registration away from approved.
    if (previousStatus === 'approved' && status !== 'approved' && reg.training.capacity) {
      await Training.findByIdAndUpdate(reg.training._id, { $inc: { filledSeats: -1 } });
    }

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

export const deleteRegistration = async (req, res, next) => {
  try {
    const summary = await deleteRegistrationIds(idsFromRequest(req));
    return successResponse(res, { summary }, `Deleted ${summary.registrations} registration(s) and ${summary.attendance} attendance record(s).`);
  } catch (err) { next(err); }
};

export const deleteRegistrations = async (req, res, next) => {
  try {
    const summary = await deleteRegistrationIds(idsFromRequest(req));
    return successResponse(res, { summary }, `Deleted ${summary.registrations} registration(s) and ${summary.attendance} attendance record(s).`);
  } catch (err) { next(err); }
};
