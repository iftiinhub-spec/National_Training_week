import Attendance from '../../models/Attendance.js';
import QRSession from '../../models/QRSession.js';
import Registration from '../../models/Registration.js';
import Training from '../../models/Training.js';
import { randomUUID } from 'node:crypto';
import { generateQRDataUrl } from '../../utils/qrGenerator.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

const checkAccess = async (trainingId, userId, role) => {
  if (role === 'admin') return true;
  const training = await Training.findById(trainingId);
  return training && String(training.moderator) === String(userId);
};

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

    const sessionToken = randomUUID();
    const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours

    const session = await QRSession.create({
      training: trainingId, sessionToken, isOpen: true,
      openedBy: req.user._id, expiresAt,
    });

    // QR encodes: {trainingId, sessionToken, checkUrl}
    const checkUrl = `${process.env.FRONTEND_URL}/qr-checkin?t=${trainingId}&s=${sessionToken}`;
    const qrDataUrl = await generateQRDataUrl(checkUrl);

    return successResponse(res, { session, qrDataUrl, checkUrl }, 'QR attendance session opened.');
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

    // 2. Verify participant has approved registration for this training
    const registration = await Registration.findOne({
      participant: participantId, training: trainingId, status: 'approved',
    });
    if (!registration) return errorResponse(res, 'You do not have an approved registration for this training.', 403);

    // 3. Check for duplicate check-in
    const existing = await Attendance.findOne({ participant: participantId, training: trainingId });
    if (existing && existing.status === 'present') {
      return errorResponse(res, 'You have already checked in for this training.', 409);
    }

    // 4. Mark attendance
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

    const records = await Attendance.find({ training: trainingId })
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

    const training = await Training.findById(trainingId).select('status completedAt attendanceReviewEndsAt attendanceFinalizedAt attendanceLockedAt').lean();
    const reviewOpen = training?.status === 'completed' && !training.attendanceFinalizedAt && training.attendanceReviewEndsAt && new Date(training.attendanceReviewEndsAt) > new Date();
    return successResponse(res, { records, stats, review: {
      open: Boolean(reviewOpen),
      endsAt: training?.attendanceReviewEndsAt || null,
      finalizedAt: training?.attendanceFinalizedAt || null,
    } });
  } catch (err) { next(err); }
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

    const training = await Training.findById(trainingId).select('status completedAt attendanceReviewEndsAt attendanceFinalizedAt');
    if (!training) return errorResponse(res, 'Training not found.', 404);
    const completed = training.status === 'completed';
    const reviewOpen = completed && !training.attendanceFinalizedAt && training.attendanceReviewEndsAt && training.attendanceReviewEndsAt > new Date();
    if (completed && (!reviewOpen || req.user.role !== 'admin')) return errorResponse(res, reviewOpen ? 'Only an administrator can correct attendance during review.' : 'The six-hour attendance review is closed.', 400);
    if (completed && status === 'not_marked') return errorResponse(res, 'Completed-session attendance must be present, absent, or late.', 400);
    if (completed && correctionReason.length < 5) return errorResponse(res, 'Enter a correction reason of at least 5 characters.', 400);

    const current = await Attendance.findOne({ _id: attendanceId, training: trainingId });
    if (!current) return errorResponse(res, 'Attendance record not found.', 404);
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

    if (completed) return successResponse(res, { attendance: record }, `${record.participant?.fullName || 'Participant'} attendance corrected. Certificates will be processed when the six-hour review closes.`);

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
