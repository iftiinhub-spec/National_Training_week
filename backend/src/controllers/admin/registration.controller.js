import Registration from '../../models/Registration.js';
import Training from '../../models/Training.js';
import Attendance from '../../models/Attendance.js';
import { successResponse, errorResponse, getPagination, paginatedResponse } from '../../utils/apiResponse.js';
import { sendRegistrationAnnouncementEmail, sendRegistrationStatusEmail } from '../../utils/registrationEmail.js';
import { resolveTrainingScope } from '../../utils/trainingScope.js';
import User from '../../models/User.js';
import { escapeRegex } from '../../utils/search.js';

const idsFromRequest = (req) => [...new Set((req.body?.ids || [req.params.id]).filter(Boolean).map(String))];

const buildRegistrationFilter = async (query, { pendingOnly = false } = {}) => {
  const filter = {};
  const trainingScope = await resolveTrainingScope(query);
  if (trainingScope) filter.training = trainingScope;
  if (pendingOnly) filter.status = 'pending';
  else if (query.status) filter.status = query.status;
  if (query.participant) filter.participant = query.participant;
  if (query.search) {
    const search = { $regex: escapeRegex(query.search), $options: 'i' };
    const [participantIds, trainingIds] = await Promise.all([
      User.find({ role: 'participant', $or: [{ fullName: search }, { email: search }] }).distinct('_id'),
      Training.find({ title: search }).distinct('_id'),
    ]);
    filter.$or = [{ participant: { $in: participantIds } }, { training: { $in: trainingIds } }];
  }
  return filter;
};

const sendBulkApprovalEmails = async (messages) => {
  let failed = 0;
  for (const message of messages) {
    const result = await sendRegistrationStatusEmail(message);
    if (!result?.success) failed += 1;
  }
  console.info(`Bulk approval email delivery finished: ${messages.length - failed} sent, ${failed} failed.`);
};

const sendFilteredAnnouncementEmails = async (recipients, announcement) => {
  let failed = 0;
  for (const recipient of recipients) {
    const result = await sendRegistrationAnnouncementEmail({ ...recipient, ...announcement });
    if (!result?.success) failed += 1;
  }
  console.info(`Filtered registration announcement finished: ${recipients.length - failed} sent, ${failed} failed.`);
};

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
    const filter = await buildRegistrationFilter(req.query);

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

// PATCH /api/admin/registrations/approve-filtered
export const approveFilteredRegistrations = async (req, res, next) => {
  try {
    const filter = await buildRegistrationFilter(req.query, { pendingOnly: true });
    const registrations = await Registration.find(filter)
      .populate('training')
      .populate('participant', 'fullName email')
      .sort({ registeredAt: 1 });

    let approved = 0;
    let capacitySkipped = 0;
    const approvalEmails = [];

    for (const registration of registrations) {
      const { training, participant } = registration;
      if (training.capacity) {
        const reserved = await Training.findOneAndUpdate(
          { _id: training._id, $expr: { $lt: ['$filledSeats', '$capacity'] } },
          { $inc: { filledSeats: 1 } },
        );
        if (!reserved) {
          capacitySkipped += 1;
          continue;
        }
      }

      registration.status = 'approved';
      registration.updatedBy = req.user._id;
      await registration.save();
      await Attendance.findOneAndUpdate(
        { participant: participant._id, training: training._id },
        { $setOnInsert: { participant: participant._id, training: training._id, status: 'not_marked' } },
        { upsert: true, new: true },
      );
      approved += 1;
      approvalEmails.push({
        to: participant.email,
        participantName: participant.fullName,
        trainingTitle: training.title,
        status: 'approved',
        date: training.date,
        startTime: training.startTime,
      });
    }

    // SMTP delivery can take minutes when the provider is unavailable. Keep it
    // outside the HTTP request so successful approvals are returned immediately.
    if (approvalEmails.length) {
      setImmediate(() => { void sendBulkApprovalEmails(approvalEmails); });
    }

    return successResponse(res, {
      summary: { matched: registrations.length, approved, capacitySkipped, emailsQueued: approvalEmails.length },
    }, approved ? `Approved ${approved} filtered registration(s).` : 'No pending filtered registrations could be approved.');
  } catch (err) { next(err); }
};

// POST /api/admin/registrations/email-filtered
export const emailFilteredRegistrations = async (req, res, next) => {
  try {
    const filter = await buildRegistrationFilter(req.query);
    filter.status = { $in: ['pending', 'approved'] };
    const registrations = await Registration.find(filter)
      .populate('participant', 'fullName email')
      .populate('training', 'title');

    const recipientsByEmail = new Map();
    for (const registration of registrations) {
      const email = registration.participant?.email?.trim().toLowerCase();
      if (!email || recipientsByEmail.has(email)) continue;
      recipientsByEmail.set(email, {
        to: email,
        participantName: registration.participant.fullName,
        trainingTitle: registration.training?.title || 'Training session',
      });
    }
    const recipients = [...recipientsByEmail.values()];
    if (!recipients.length) return errorResponse(res, 'No pending or approved applicants match this session.', 404);

    setImmediate(() => {
      void sendFilteredAnnouncementEmails(recipients, {
        subject: req.body.subject.trim(),
        message: req.body.message.trim(),
      });
    });

    return successResponse(res, { queued: recipients.length }, `Email queued for ${recipients.length} applicant(s).`);
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

// POST /api/admin/registrations — assign participants to a session directly
// Admin assignment is deliberate, so registrations are created already approved. That means this
// must do everything approval does: reserve a seat, open an attendance row, and notify.
export const assignParticipants = async (req, res, next) => {
  try {
    const { trainingId, participantIds } = req.body;
    const uniqueIds = [...new Set(participantIds.map(String))];

    const training = await Training.findById(trainingId);
    if (!training) return errorResponse(res, 'Training not found.', 404);
    if (['draft', 'cancelled', 'completed'].includes(training.status)) {
      return errorResponse(res, `A ${training.status} session cannot have participants assigned to it.`, 400);
    }

    const participants = await User.find({ _id: { $in: uniqueIds }, role: 'participant', isActive: true })
      .select('fullName email');
    if (!participants.length) return errorResponse(res, 'Select at least one active participant.', 400);

    const existing = await Registration.find({ training: trainingId, participant: { $in: uniqueIds } })
      .select('participant');
    const alreadyRegisteredIds = new Set(existing.map((registration) => String(registration.participant)));

    const assigned = [];
    const capacityFull = [];
    const alreadyRegistered = [];

    for (const participant of participants) {
      if (alreadyRegisteredIds.has(String(participant._id))) {
        alreadyRegistered.push(participant.fullName);
        continue;
      }

      // Reserve the seat before creating the registration, using the same atomic guard as approval
      // so two admins assigning at once cannot both pass a stale capacity check.
      if (training.capacity) {
        const reserved = await Training.findOneAndUpdate(
          { _id: training._id, $expr: { $lt: ['$filledSeats', '$capacity'] } },
          { $inc: { filledSeats: 1 } },
        );
        if (!reserved) {
          capacityFull.push(participant.fullName);
          continue;
        }
      }

      try {
        await Registration.create({
          participant: participant._id,
          training: training._id,
          status: 'approved',
          updatedBy: req.user._id,
        });
      } catch (error) {
        // Lost a race against another assignment: hand the seat back rather than leaking it.
        if (training.capacity) await Training.findByIdAndUpdate(training._id, { $inc: { filledSeats: -1 } });
        if (error.code === 11000) { alreadyRegistered.push(participant.fullName); continue; }
        throw error;
      }

      await Attendance.findOneAndUpdate(
        { participant: participant._id, training: training._id },
        { $setOnInsert: { participant: participant._id, training: training._id, status: 'not_marked' } },
        { upsert: true, new: true },
      );

      assigned.push(participant);
    }

    // Sent after the writes so a mail failure can never roll back a completed assignment.
    await Promise.all(assigned.map((participant) => sendRegistrationStatusEmail({
      to: participant.email,
      participantName: participant.fullName,
      trainingTitle: training.title,
      status: 'approved',
      date: training.date,
      startTime: training.startTime,
    }).catch(() => null)));

    const summary = {
      assigned: assigned.length,
      alreadyRegistered: alreadyRegistered.length,
      capacityFull: capacityFull.length,
      capacityFullNames: capacityFull,
    };
    const parts = [`${summary.assigned} participant${summary.assigned === 1 ? '' : 's'} assigned`];
    if (summary.alreadyRegistered) parts.push(`${summary.alreadyRegistered} already registered`);
    if (summary.capacityFull) parts.push(`${summary.capacityFull} skipped — session full`);

    return successResponse(res, { summary }, `${parts.join(', ')}.`, 201);
  } catch (err) { next(err); }
};
