import Attendance from '../../models/Attendance.js';
import QRSession from '../../models/QRSession.js';
import Registration from '../../models/Registration.js';
import Training from '../../models/Training.js';
import { v4 as uuidv4 } from 'uuid';
import { generateQRDataUrl } from '../../utils/qrGenerator.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

const checkAccess = async (trainingId, userId, role) => {
  if (role === 'admin') return true;
  const training = await Training.findById(trainingId);
  return training && String(training.moderator) === String(userId);
};

// POST /api/.../trainings/:trainingId/qr-session/open
export const openQRSession = async (req, res, next) => {
  try {
    const { trainingId } = req.params;
    const hasAccess = await checkAccess(trainingId, req.user._id, req.user.role);
    if (!hasAccess) return errorResponse(res, 'Access denied.', 403);

    // Close any existing open session first
    await QRSession.updateMany({ training: trainingId, isOpen: true }, { isOpen: false, closedAt: new Date() });

    const sessionToken = uuidv4();
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
      .sort({ 'participant.fullName': 1 });

    const stats = {
      total: records.length,
      present: records.filter((r) => r.status === 'present').length,
      absent: records.filter((r) => r.status === 'absent').length,
      late: records.filter((r) => r.status === 'late').length,
      not_marked: records.filter((r) => r.status === 'not_marked').length,
    };

    return successResponse(res, { records, stats });
  } catch (err) { next(err); }
};

// PATCH /api/.../trainings/:trainingId/attendance/:attendanceId
export const updateAttendance = async (req, res, next) => {
  try {
    const { trainingId, attendanceId } = req.params;
    const hasAccess = await checkAccess(trainingId, req.user._id, req.user.role);
    if (!hasAccess) return errorResponse(res, 'Access denied.', 403);

    const { status } = req.body;
    const allowed = ['present', 'absent', 'late', 'not_marked'];
    if (!allowed.includes(status)) return errorResponse(res, 'Invalid attendance status.', 400);

    const record = await Attendance.findOneAndUpdate(
      { _id: attendanceId, training: trainingId },
      { status, method: 'manual', updatedBy: req.user._id, ...(status === 'present' ? { checkinTime: new Date() } : {}) },
      { new: true }
    ).populate('participant', 'fullName email');

    if (!record) return errorResponse(res, 'Attendance record not found.', 404);
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
