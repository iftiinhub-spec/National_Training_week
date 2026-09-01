import Training from '../../models/Training.js';
import Event from '../../models/Event.js';
import EventDay from '../../models/EventDay.js';
import Trainer from '../../models/Trainer.js';
import User from '../../models/User.js';
import Registration from '../../models/Registration.js';
import { successResponse, errorResponse, getPagination, paginatedResponse } from '../../utils/apiResponse.js';
import { completeTrainingSession } from '../../services/completeTrainingSession.js';
import { getTrainingDateTime, normalizeTrainingTime } from '../../utils/trainingDateTime.js';
import { registrationClosedReason, sessionEndsAt, sessionPhase, withSessionPhase } from '../../utils/lifecycle.js';
import { escapeRegex } from '../../utils/search.js';
import { pick } from '../../utils/pick.js';
import { deleteTrainingCascade } from '../../utils/cascadeDelete.js';
import { sendReminderEmail } from '../../utils/email.js';

const trainingPayload = (input) => pick(input, ['title', 'description', 'event', 'eventDay', 'category', 'trainers', 'moderator', 'date', 'startTime', 'endTime', 'audience', 'level', 'language', 'capacity', 'registrationRequired', 'status']);

const trainerIdsFor = (training) => [...new Set([
  ...(training?.trainers || []).map((value) => String(value?._id || value)),
  ...(training?.trainer ? [String(training.trainer?._id || training.trainer)] : []),
])];

const normalizeTimes = (data) => {
  for (const field of ['startTime', 'endTime']) {
    if (data[field] !== undefined) data[field] = normalizeTrainingTime(data[field]) || data[field];
  }
  if (data.trainers !== undefined) {
    data.trainers = [...new Set(data.trainers.map(String))];
    data.trainer = data.trainers[0] || null;
  }
  return data;
};

const validateTrainingDay = async (data, existing = null) => {
  const eventId = data.event || existing?.event;
  const eventDayId = data.eventDay || existing?.eventDay;
  const [event, eventDay] = await Promise.all([
    Event.findById(eventId).select('year startDate endDate registrationStart registrationDeadline'),
    EventDay.findById(eventDayId).select('event date'),
  ]);
  if (!event) { const error = new Error('Selected event does not exist.'); error.statusCode = 400; throw error; }
  if (!eventDay || String(eventDay.event) !== String(event._id)) {
    const error = new Error('Selected event day does not belong to the selected event.'); error.statusCode = 400; throw error;
  }
  const dayDateKey = new Date(eventDay.date).toISOString().slice(0, 10);
  // A session always inherits its date from the selected event day.
  // Ignore any client-supplied date so the two records cannot conflict.
  data.date = eventDay.date;
  const trainingDate = data.date;
  const trainingDateKey = dayDateKey;
  const startTime = data.startTime ?? existing?.startTime;
  const endTime = data.endTime ?? existing?.endTime;
  const startsAt = getTrainingDateTime(trainingDate, startTime);
  const endsAt = getTrainingDateTime(trainingDate, endTime);
  if (!startsAt || !endsAt || startsAt >= endsAt) {
    const error = new Error('Training end time must be later than its start time.'); error.statusCode = 400; throw error;
  }
  // No rule ties a session to an event-wide deadline any more. Registration for a session closes
  // when that session's own day begins (see utils/lifecycle.js), so later days of a running event
  // can still accept sign-ups.
  const scheduleChanged = !existing
    || trainingDateKey !== new Date(existing.date).toISOString().slice(0, 10)
    || normalizeTrainingTime(startTime) !== normalizeTrainingTime(existing.startTime);
  if (scheduleChanged && startsAt <= new Date()) {
    const error = new Error('A new or rescheduled training must start in the future.'); error.statusCode = 400; throw error;
  }
};

const validateStaffAvailability = async (data, existing = null) => {
  const conflicts = [];
  const baseFilter = {
    eventDay: data.eventDay || existing?.eventDay,
    ...(existing?._id ? { _id: { $ne: existing._id } } : {}),
    startTime: { $lt: data.endTime ?? existing?.endTime },
    endTime: { $gt: data.startTime ?? existing?.startTime },
  };

  const trainerIds = data.trainers !== undefined ? data.trainers.map(String) : trainerIdsFor(existing);
  if (trainerIds.length) {
    const conflicting = await Training.find({
      ...baseFilter,
      $or: [{ trainers: { $in: trainerIds } }, { trainer: { $in: trainerIds } }],
    }).select('trainers trainer').lean();
    const busyIds = new Set(conflicting.flatMap(trainerIdsFor));
    const busy = trainerIds.filter((id) => busyIds.has(id));
    if (busy.length) conflicts.push(`${busy.length} trainer${busy.length === 1 ? '' : 's'}`);
  }
  if (data.moderator || existing?.moderator) {
    const moderatorId = data.moderator ?? existing?.moderator;
    if (moderatorId && await Training.exists({ ...baseFilter, moderator: moderatorId })) conflicts.push('moderator');
  }

  if (conflicts.length) {
    const error = new Error(`The assigned ${conflicts.join(' and ')} already has another session at this time on the selected day.`);
    error.statusCode = 409;
    throw error;
  }
};

const validateTrainerAssignments = async (data) => {
  if (data.trainers === undefined) return;
  const ids = [...new Set(data.trainers.map(String))];
  const count = await Trainer.countDocuments({ _id: { $in: ids }, accessStatus: 'approved', isActive: true });
  if (count !== ids.length) {
    const error = new Error('Select only active, approved trainers.'); error.statusCode = 400; throw error;
  }
};

// Marking a session finished is the only status an administrator cannot apply whenever they like:
// it locks attendance and queues certificates, so it must wait until the session is actually over.
const validateTimedStatus = (training, status, now = new Date()) => {
  if (status !== 'completed') return null;
  const endsAt = sessionEndsAt(training);
  if (!endsAt) return 'Set this session’s date and end time before marking it finished.';
  if (now < endsAt) return 'This session cannot be marked finished before its end time.';
  return null;
};

// The only four values stored on a session. Everything else an administrator sees — registration
// open, happening now, finished — is worked out from the dates in utils/lifecycle.js.
const SESSION_STATUSES = ['draft', 'published', 'cancelled', 'completed'];

const STATUS_MESSAGES = {
  draft: 'Session saved as a draft. It is hidden from the public.',
  published: 'Session published. Registration follows the event dates.',
  cancelled: 'Session cancelled.',
};

// GET /api/admin/trainings
export const getTrainings = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};
    if (req.query.event) filter.event = req.query.event;
    if (req.query.eventDay) filter.eventDay = req.query.eventDay;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.search) filter.title = { $regex: escapeRegex(req.query.search), $options: 'i' };

    const [trainings, total] = await Promise.all([
      Training.find(filter)
        .populate('event', 'name year registrationStart registrationDeadline')
        .populate('eventDay', 'dayNumber theme date')
        .populate('category', 'name')
        .populate('trainer', 'name title organization photo')
        .populate('trainers', 'name title organization photo')
        .populate('moderator', 'fullName email')
        .sort({ date: 1 })
        .skip(skip).limit(limit),
      Training.countDocuments(filter),
    ]);
    // The derived state is computed here, once, and sent to the screen. The admin screen never
    // recalculates it — that is what used to let the two disagree.
    return paginatedResponse(res, trainings.map((training) => withSessionPhase(training)), total, page, limit);
  } catch (err) { next(err); }
};

// GET /api/admin/trainings/:id
export const getTraining = async (req, res, next) => {
  try {
    const training = await Training.findById(req.params.id)
      .populate('event', 'name year theme registrationStart registrationDeadline')
      .populate('eventDay', 'dayNumber theme date')
      .populate('category', 'name')
      .populate('trainer', 'name title organization photo biography expertise')
      .populate('trainers', 'name title organization photo biography expertise')
      .populate('moderator', 'fullName email phone');
    if (!training) return errorResponse(res, 'Training not found.', 404);
    return successResponse(res, { training: withSessionPhase(training) });
  } catch (err) { next(err); }
};

// POST /api/admin/trainings
export const createTraining = async (req, res, next) => {
  try {
    const data = normalizeTimes(trainingPayload(req.body));
    await validateTrainingDay(data);
    await validateTrainerAssignments(data);
    await validateStaffAvailability(data);
    if (req.file) data.coverImage = `uploads/coverImage/${req.file.filename}`;
    const training = await Training.create(data);
    return successResponse(res, { training }, 'Training created successfully.', 201);
  } catch (err) { next(err); }
};

// PUT /api/admin/trainings/:id
export const updateTraining = async (req, res, next) => {
  try {
    const data = normalizeTimes(trainingPayload(req.body));
    const existing = await Training.findById(req.params.id);
    if (!existing) return errorResponse(res, 'Training not found.', 404);
    await validateTrainingDay(data, existing);
    await validateTrainerAssignments(data);
    await validateStaffAvailability(data, existing);
    if (req.file) data.coverImage = `uploads/coverImage/${req.file.filename}`;
    // Remove status from update — use dedicated status endpoint
    delete data.status;
    const training = await Training.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!training) return errorResponse(res, 'Training not found.', 404);
    const scheduleChanged = ['date', 'startTime', 'endTime'].some((field) => String(existing[field] || '') !== String(training[field] || ''));
    let scheduleEmailsQueued = 0;
    if (scheduleChanged && existing.status === 'published') {
      const approved = await Registration.find({ training: training._id, status: 'approved' }).populate('participant', 'email').lean();
      const emails = [...new Set(approved.map((item) => item.participant?.email).filter(Boolean))];
      if (emails.length) {
        const result = await sendReminderEmail({ to: emails, trainingTitle: training.title, startTime: getTrainingDateTime(training.date, training.startTime), type: 'schedule_change' });
        scheduleEmailsQueued = result.count || emails.length;
      }
    }
    return successResponse(res, { training, scheduleEmailsQueued }, scheduleEmailsQueued ? `Training updated. ${scheduleEmailsQueued} schedule-change email(s) were queued.` : 'Training updated successfully.');
  } catch (err) { next(err); }
};

// PATCH /api/admin/trainings/:id/status
// Sets what the administrator decided: draft, published, cancelled or finished. These four are
// always available — none of them depends on the clock, so nothing is ever greyed out.
export const updateTrainingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const training = await Training.findById(req.params.id)
      .populate('event', 'registrationStart registrationDeadline');
    if (!training) return errorResponse(res, 'Training not found.', 404);

    if (!SESSION_STATUSES.includes(status)) {
      return errorResponse(res, `Invalid status '${status}'. Valid values: ${SESSION_STATUSES.join(', ')}.`, 400);
    }

    const timedStatusError = validateTimedStatus(training, status);
    if (timedStatusError) return errorResponse(res, timedStatusError, 400);

    if (status === 'completed') {
      const result = await completeTrainingSession({ trainingId: training._id, completedBy: req.user._id });
      return successResponse(res, result, 'Session finished. A six-hour attendance review is now open; certificates will be processed after it closes.');
    }
    if (training.status === 'completed') {
      return errorResponse(res, 'A finished session cannot be reopened because attendance is locked and certificates may already be issued.', 400);
    }

    const wasPublished = training.status === 'published';
    training.status = status;
    await training.save();
    let cancellationEmailsQueued = 0;
    if (status === 'cancelled' && wasPublished) {
      const approved = await Registration.find({ training: training._id, status: 'approved' }).populate('participant', 'email').lean();
      const emails = [...new Set(approved.map((item) => item.participant?.email).filter(Boolean))];
      if (emails.length) {
        const result = await sendReminderEmail({ to: emails, trainingTitle: training.title, startTime: getTrainingDateTime(training.date, training.startTime), type: 'cancellation' });
        cancellationEmailsQueued = result.count || emails.length;
      }
    }
    return successResponse(res, { training: withSessionPhase(training, training.event), cancellationEmailsQueued }, cancellationEmailsQueued ? `Session cancelled. ${cancellationEmailsQueued} cancellation email(s) were queued.` : STATUS_MESSAGES[status]);
  } catch (err) { next(err); }
};

// PATCH /api/admin/trainings/:id/registration  { open: true | false }
// Opening clears the manual override so the session follows the event dates again; closing records
// "closed from now". This is the only registration control an administrator needs.
export const setTrainingRegistration = async (req, res, next) => {
  try {
    const open = req.body.open === true || req.body.open === 'true';
    const training = await Training.findById(req.params.id)
      .populate('event', 'registrationStart registrationDeadline');
    if (!training) return errorResponse(res, 'Training not found.', 404);
    if (training.status !== 'published') {
      return errorResponse(res, 'Publish this session first. Only a published session can take registrations.', 400);
    }

    if (!open) {
      training.registrationClosesAt = new Date();
      await training.save();
      return successResponse(res, { training: withSessionPhase(training, training.event) }, 'Registration closed for this session.');
    }

    training.registrationClosesAt = null;
    const { phase, registration } = sessionPhase(training, training.event);
    // Clearing the override cannot help once the session's own day has arrived, so say why instead
    // of saving a change that would have no effect.
    if (phase !== 'registration_open' && phase !== 'scheduled') {
      return errorResponse(res, registrationClosedReason(registration), 400);
    }
    await training.save();
    return successResponse(
      res,
      { training: withSessionPhase(training, training.event) },
      phase === 'scheduled'
        ? `Registration will open automatically on ${registration.opensAt.toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}.`
        : 'Registration is open for this session.'
    );
  } catch (err) { next(err); }
};

export const completeTraining = async (req, res, next) => {
  try {
    const training = await Training.findById(req.params.id);
    if (!training) return errorResponse(res, 'Training not found.', 404);
    if (req.user.role !== 'admin' && String(training.moderator) !== String(req.user._id)) {
      return errorResponse(res, 'Only the assigned moderator or an administrator can complete this training.', 403);
    }
    const timedStatusError = validateTimedStatus(training, 'completed');
    if (timedStatusError) return errorResponse(res, timedStatusError, 400);
    const result = await completeTrainingSession({ trainingId: training._id, completedBy: req.user._id });
    return successResponse(res, result, 'Training completed. A six-hour attendance review is now open; certificates will be processed after it closes.');
  } catch (err) { next(err); }
};

// PATCH /api/admin/trainings/:id/assign
export const assignTrainingStaff = async (req, res, next) => {
  try {
    const { trainerIds, moderatorId } = req.body;
    if (trainerIds !== undefined) {
      const uniqueIds = [...new Set(trainerIds.map(String))];
      const validCount = await Trainer.countDocuments({ _id: { $in: uniqueIds }, accessStatus: 'approved', isActive: true });
      if (validCount !== uniqueIds.length) return errorResponse(res, 'Select only active, approved trainers.', 400);
    }
    if (moderatorId) {
      const moderator = await User.findOne({ _id: moderatorId, role: 'moderator', isActive: true });
      if (!moderator) return errorResponse(res, 'Select an active moderator.', 400);
    }
    const existing = await Training.findById(req.params.id);
    if (!existing) return errorResponse(res, 'Training not found.', 404);
    await validateStaffAvailability({
      eventDay: existing.eventDay,
      startTime: existing.startTime,
      endTime: existing.endTime,
      trainers: trainerIds !== undefined ? [...new Set(trainerIds.map(String))] : trainerIdsFor(existing),
      moderator: moderatorId !== undefined ? moderatorId : existing.moderator,
    }, existing);
    const update = {};
    if (trainerIds !== undefined) {
      update.trainers = [...new Set(trainerIds.map(String))];
      update.trainer = update.trainers[0] || null;
    }
    if (moderatorId !== undefined) update.moderator = moderatorId || null;

    const training = await Training.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('trainer', 'name title organization')
      .populate('trainers', 'name title organization')
      .populate('moderator', 'fullName email');
    return successResponse(res, { training }, 'Assignments updated successfully.');
  } catch (err) { next(err); }
};

// DELETE /api/admin/trainings/:id
export const deleteTraining = async (req, res, next) => {
  try {
    const training = await Training.findById(req.params.id);
    if (!training) return errorResponse(res, 'Training not found.', 404);
    const summary = await deleteTrainingCascade(training);
    return successResponse(res, { summary }, `Training deleted with ${summary.relatedRecords} related record(s).`);
  } catch (err) { next(err); }
};
