import Attendance from '../../models/Attendance.js';
import QRSession from '../../models/QRSession.js';
import Registration from '../../models/Registration.js';
import Training from '../../models/Training.js';
import { randomUUID } from 'node:crypto';
import { generateQRDataUrl } from '../../utils/qrGenerator.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';
import { sessionStartsAt, sessionEndsAt, attendanceCorrectionEndsAt } from '../../utils/lifecycle.js';
import Certificate from '../../models/Certificate.js';
import { enqueueCertificateIssuance } from '../../services/completeTrainingSession.js';

const checkAccess = async (trainingId, userId, role) => {
  if (role === 'admin') return true;
  const training = await Training.findById(trainingId);
  return training && String(training.moderator) === String(userId);
};

// Each opening creates one fixed code. It remains valid for ten minutes unless
// the moderator closes or replaces it first.
const SESSION_MINUTES = Math.max(1, Number(process.env.QR_SESSION_MINUTES) || 10);
// How far outside its own scheduled time a session still accepts check-ins.
const WINDOW_BEFORE_MINUTES = Number(process.env.QR_WINDOW_BEFORE_MINUTES) || 15;
const WINDOW_AFTER_MINUTES = Number(process.env.QR_WINDOW_AFTER_MINUTES) || 60;

// The window a session may accept check-ins in, derived from the training's own
// schedule rather than from when the moderator happened to open the QR.
const checkInWindow = (training) => {
  const start = sessionStartsAt(training);
  const end = sessionEndsAt(training);
  if (!start || !end) return null;
  return {
    opensAt: new Date(start.getTime() - WINDOW_BEFORE_MINUTES * 60000),
    closesAt: new Date(end.getTime() + WINDOW_AFTER_MINUTES * 60000),
  };
};

const buildQrPayload = (trainingId, session) =>
  `${process.env.FRONTEND_URL}/qr-checkin?t=${trainingId}&s=${session.sessionToken}`;

const attendanceIsLocked = async (trainingId) => {
  const training = await Training.findById(trainingId).select('status attendanceLockedAt');
  return !training || training.status === 'completed' || Boolean(training.attendanceLockedAt);
};

// POST /api/.../trainings/:trainingId/qr-session/open
export const openQRSession = async (req, res, next) => {
  try {
    const { trainingId } = req.params;
    const hasAccess = await checkAccess(trainingId, req.user._id, req.user.role);
    if (!hasAccess) return errorResponse(res, 'Access denied.', 403);
    if (await attendanceIsLocked(trainingId)) return errorResponse(res, 'Attendance is locked because this training is completed.', 400);

    // Close any existing open session first
    await QRSession.updateMany({ training: trainingId, isOpen: true }, { isOpen: false, closedAt: new Date() });

    const training = await Training.findById(trainingId).select('date startTime endTime');
    const window = checkInWindow(training);
    if (!window) return errorResponse(res, 'This training has no scheduled time, so check-in cannot be opened.', 400);
    if (Date.now() < window.opensAt.getTime()) {
      return errorResponse(res, `Check-in can open ${WINDOW_BEFORE_MINUTES} minutes before this session starts.`, 400);
    }
    if (Date.now() > window.closesAt.getTime()) {
      return errorResponse(res, 'This session has already finished. Mark attendance manually instead.', 400);
    }

    const sessionToken = randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_MINUTES * 60000);

    const session = await QRSession.create({
      training: trainingId, sessionToken, isOpen: true,
      openedBy: req.user._id, expiresAt,
    });

    const checkUrl = buildQrPayload(trainingId, session);
    const qrDataUrl = await generateQRDataUrl(checkUrl);

    return successResponse(res, {
      session: { _id: session._id, expiresAt, isOpen: true, opensAt: window.opensAt },
      qrDataUrl,
      checkUrl,
      sessionMinutes: SESSION_MINUTES,
    }, 'Check-in opened.');
  } catch (err) { next(err); }
};

// GET /api/.../trainings/:trainingId/qr-session/current
// Returns the same fixed code so the moderator can recover it after reloading.
export const currentQRCode = async (req, res, next) => {
  try {
    const { trainingId } = req.params;
    const hasAccess = await checkAccess(trainingId, req.user._id, req.user.role);
    if (!hasAccess) return errorResponse(res, 'Access denied.', 403);

    const session = await QRSession.findOne({ training: trainingId, isOpen: true });
    if (!session) return errorResponse(res, 'No active check-in for this training.', 404);
    if (session.expiresAt < new Date()) {
      await QRSession.findByIdAndUpdate(session._id, { isOpen: false, closedAt: new Date() });
      return errorResponse(res, 'Check-in has expired.', 400);
    }

    const checkUrl = buildQrPayload(trainingId, session);
    const qrDataUrl = await generateQRDataUrl(checkUrl);

    return successResponse(res, {
      qrDataUrl,
      checkUrl,
      expiresAt: session.expiresAt,
      sessionMinutes: SESSION_MINUTES,
    }, 'Current check-in code.');
  } catch (err) { next(err); }
};

// POST /api/.../trainings/:trainingId/qr-session/close
export const closeQRSession = async (req, res, next) => {
  try {
    const { trainingId } = req.params;
    const hasAccess = await checkAccess(trainingId, req.user._id, req.user.role);
    if (!hasAccess) return errorResponse(res, 'Access denied.', 403);

    await QRSession.updateMany({ training: trainingId, isOpen: true }, { isOpen: false, closedAt: new Date() });
    return successResponse(res, null, 'QR session closed.');
  } catch (err) { next(err); }
};

// POST /api/participant/qr-checkin  — participant scans QR
export const qrCheckIn = async (req, res, next) => {
  try {
    const { trainingId, sessionToken } = req.body;
    const participantId = req.user._id;

    if (await attendanceIsLocked(trainingId)) return errorResponse(res, 'Attendance is closed for this completed training.', 400);

    // 1. Verify QR session is open and valid
    const session = await QRSession.findOne({ training: trainingId, sessionToken, isOpen: true });
    if (!session) return errorResponse(res, 'QR session is not active or has expired.', 400);
    if (session.expiresAt < new Date()) {
      await QRSession.findByIdAndUpdate(session._id, { isOpen: false, closedAt: new Date() });
      return errorResponse(res, 'QR session has expired.', 400);
    }

    // 2. The configured pre-session boundary still applies. Once opened, the
    //    QR session's own ten-minute expiry is its upper bound.
    const scheduled = await Training.findById(trainingId).select('date startTime endTime');
    const window = checkInWindow(scheduled);
    if (!window) return errorResponse(res, 'This training has no scheduled time.', 400);
    const now = new Date();
    if (now < window.opensAt) return errorResponse(res, 'Check-in has not opened yet for this session.', 400);

    // 3. Verify participant has approved registration for this training
    const registration = await Registration.findOne({
      participant: participantId, training: trainingId, status: 'approved',
    });
    if (!registration) return errorResponse(res, 'You do not have an approved registration for this training.', 403);

    // 4. Check for duplicate check-in
    const existing = await Attendance.findOne({ participant: participantId, training: trainingId });
    if (existing && existing.status === 'present') {
      return errorResponse(res, 'You have already checked in for this training.', 409);
    }

    // 5. Mark attendance
    const attendance = await Attendance.findOneAndUpdate(
      { participant: participantId, training: trainingId },
      { status: 'present', checkinTime: new Date(), method: 'qr', markedBy: req.user._id },
      { upsert: true, new: true }
    );

    return successResponse(res, { attendance }, 'Check-in successful! You are marked Present.');
  } catch (err) { next(err); }
};

// GET /api/.../trainings/:trainingId/attendance
export const getAttendance = async (req, res, next) => {
  try {
    const { trainingId } = req.params;
    const hasAccess = await checkAccess(trainingId, req.user._id, req.user.role);
    if (!hasAccess) return errorResponse(res, 'Access denied.', 403);

    // Attendance rows are created on approval but are not removed if the registration is later
    // cancelled or rejected, so the roster is scoped to currently-approved participants rather
    // than to whatever attendance rows happen to exist.
    const approvedIds = await Registration.find({ training: trainingId, status: 'approved' }).distinct('participant');
    const records = await Attendance.find({ training: trainingId, participant: { $in: approvedIds } })
      .populate('participant', 'fullName email phone profilePhoto participantType')
      .populate('markedBy', 'fullName role')
      .populate('updatedBy', 'fullName role')
      .limit(5000);
    records.sort((a, b) => (a.participant?.fullName || '').localeCompare(b.participant?.fullName || ''));

    const stats = {
      total: records.length,
      present: records.filter((r) => r.status === 'present').length,
      absent: records.filter((r) => r.status === 'absent').length,
      late: records.filter((r) => r.status === 'late').length,
      not_marked: records.filter((r) => r.status === 'not_marked').length,
    };

    const training = await Training.findById(trainingId).select('status completedAt attendanceReviewEndsAt attendanceFinalizedAt attendanceLockedAt attendanceCorrectionEndsAt').lean();
    const reviewOpen = training?.status === 'completed' && !training.attendanceFinalizedAt && training.attendanceReviewEndsAt && new Date(training.attendanceReviewEndsAt) > new Date();
    const correctionEndsAt = attendanceCorrectionEndsAt(training);
    const correctionOpen = training?.status === 'completed' && correctionEndsAt && correctionEndsAt > new Date();
    return successResponse(res, { records, stats, review: {
      open: Boolean(reviewOpen),
      endsAt: training?.attendanceReviewEndsAt || null,
      finalizedAt: training?.attendanceFinalizedAt || null,
      correctionOpen: Boolean(correctionOpen),
      correctionEndsAt: correctionEndsAt || null,
    } });
  } catch (err) { next(err); }
};

// A correction made after certificates have been issued has to carry its own consequence, since
// the finalisation step that would normally act on it has already run. Marking someone present
// re-queues issuance - the worker only issues for participants who are present and have no
// certificate yet, so this never duplicates. Marking them away from present revokes the
// credential instead of leaving a certificate standing for a session they did not attend.
const applyCertificateConsequence = async ({ training, record, status, previousStatus, correctionReason, actorId }) => {
  if (status === 'present') {
    await enqueueCertificateIssuance({ trainingId: training._id, requestedBy: actorId, restart: true });
    return 'A certificate will be issued and emailed shortly.';
  }
  if (previousStatus !== 'present') return 'No certificate change was needed.';
  const certificate = await Certificate.findOne({ participant: record.participant?._id || record.participant, training: training._id });
  if (!certificate || certificate.isRevoked) return 'No active certificate needed revoking.';
  certificate.isRevoked = true;
  certificate.revokedAt = new Date();
  certificate.revokedReason = `Attendance corrected to ${status}: ${correctionReason}`;
  await certificate.save();
  return 'Their certificate has been revoked.';
};

// PATCH /api/.../trainings/:trainingId/attendance/:attendanceId
export const updateAttendance = async (req, res, next) => {
  try {
    const { trainingId, attendanceId } = req.params;
    const hasAccess = await checkAccess(trainingId, req.user._id, req.user.role);
    if (!hasAccess) return errorResponse(res, 'Access denied.', 403);
    const { status } = req.body;
    const correctionReason = String(req.body.correctionReason || '').trim();
    const allowed = ['present', 'absent', 'late', 'not_marked'];
    if (!allowed.includes(status)) return errorResponse(res, 'Invalid attendance status.', 400);

    const training = await Training.findById(trainingId).select('status completedAt attendanceReviewEndsAt attendanceFinalizedAt attendanceCorrectionEndsAt');
    if (!training) return errorResponse(res, 'Training not found.', 404);
    const completed = training.status === 'completed';
    const now = new Date();
    const reviewOpen = completed && !training.attendanceFinalizedAt && training.attendanceReviewEndsAt && training.attendanceReviewEndsAt > now;
    // Sessions completed before this field existed derive the same window from completedAt.
    const correctionEndsAt = attendanceCorrectionEndsAt(training);
    const correctionOpen = completed && correctionEndsAt && correctionEndsAt > now;
    if (completed && !reviewOpen && !correctionOpen) {
      return errorResponse(res, 'The correction period for this session has closed. Contact the administrator if a record is still wrong.', 400);
    }
    // The moderator ran the session and knows who was there, so they may correct while the
    // review is open. Once certificates are out, only an administrator can change a record.
    if (completed && !reviewOpen && req.user.role !== 'admin') {
      return errorResponse(res, 'The review window has closed. Only an administrator can correct attendance now.', 400);
    }
    if (completed && status === 'not_marked') return errorResponse(res, 'Completed-session attendance must be present, absent, or late.', 400);
    if (completed && correctionReason.length < 5) return errorResponse(res, 'Enter a correction reason of at least 5 characters.', 400);

    const current = await Attendance.findOne({ _id: attendanceId, training: trainingId });
    if (!current) return errorResponse(res, 'Attendance record not found.', 404);
    // Attendance only means something for an approved place. A cancelled or rejected
    // registration must not be markable, or it produces attendance with no entitlement behind it.
    const registration = await Registration.findOne({ participant: current.participant, training: trainingId }).select('status').lean();
    if (!registration || registration.status !== 'approved') {
      return errorResponse(res, `This participant's registration is ${registration ? registration.status : 'missing'}, so their attendance cannot be changed. Approve the registration first.`, 400);
    }
    const changedAt = new Date();
    const previousStatus = current.status;
    current.status = status;
    current.method = 'manual';
    current.updatedBy = req.user._id;
    if (['present', 'late'].includes(status) && !current.checkinTime) current.checkinTime = training.completedAt || changedAt;
    if (status === 'absent' || status === 'not_marked') current.checkinTime = null;
    if (completed) {
      current.correctionReason = correctionReason;
      current.correctedAt = changedAt;
      current.correctedBy = req.user._id;
      current.correctionHistory.push({ from: previousStatus, to: status, reason: correctionReason, changedBy: req.user._id, changedAt });
    }
    const record = await current.save();
    await record.populate('participant', 'fullName email');

    if (completed && !reviewOpen && previousStatus !== status) {
      // The review window is closed, so no finalisation step is coming to act on this change.
      // The correction carries its own consequence instead.
      const outcome = await applyCertificateConsequence({
        training, record, status, previousStatus, correctionReason, actorId: req.user._id,
      });
      return successResponse(res, { attendance: record }, `${record.participant?.fullName || 'Participant'} attendance corrected. ${outcome}`);
    }
    if (completed) return successResponse(res, { attendance: record }, `${record.participant?.fullName || 'Participant'} attendance corrected. Certificates will be processed when the review window closes.`);

    return successResponse(res, { attendance: record }, 'Attendance updated.');
  } catch (err) { next(err); }
};

// POST /api/.../trainings/:trainingId/attendance/manual — bulk manual attendance
export const createManualAttendance = async (req, res, next) => {
  try {
    const { trainingId } = req.params;
    const { participantId, status } = req.body;
    const hasAccess = await checkAccess(trainingId, req.user._id, req.user.role);
    if (!hasAccess) return errorResponse(res, 'Access denied.', 403);
    if (await attendanceIsLocked(trainingId)) return errorResponse(res, 'Attendance is locked because this training is completed.', 400);

    const registration = await Registration.findOne({
      participant: participantId, training: trainingId, status: 'approved',
    });
    if (!registration) return errorResponse(res, 'Participant does not have an approved registration.', 400);

    const attendance = await Attendance.findOneAndUpdate(
      { participant: participantId, training: trainingId },
      { status: status || 'present', method: 'manual', markedBy: req.user._id,
        ...(status === 'present' ? { checkinTime: new Date() } : {}) },
      { upsert: true, new: true }
    ).populate('participant', 'fullName email');

    return successResponse(res, { attendance }, 'Attendance recorded manually.');
  } catch (err) { next(err); }
};
