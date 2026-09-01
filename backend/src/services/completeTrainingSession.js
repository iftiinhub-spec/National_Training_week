import Attendance from '../models/Attendance.js';
import CertificateIssuanceJob from '../models/CertificateIssuanceJob.js';
import QRSession from '../models/QRSession.js';
import Registration from '../models/Registration.js';
import Training from '../models/Training.js';

const reviewWindowMs = Math.max(60_000, Number(process.env.ATTENDANCE_REVIEW_WINDOW_MS) || 6 * 60 * 60_000);

export const enqueueCertificateIssuance = async ({ trainingId, requestedBy, restart = false }) => {
  const initial = {
    training: trainingId,
    requestedBy,
    status: 'queued',
    attempts: 0,
    nextRunAt: new Date(),
    lockedAt: null,
    lockedBy: '',
    completedAt: null,
    lastError: '',
    summary: {
      eligible: 0,
      participantCertificates: 0,
      participantEmailsSent: 0,
      participantEmailsFailed: 0,
      trainerCertificateIssued: false,
      trainerEmailSent: false,
      trainerEmailFailed: false,
    },
  };
  const update = restart ? { $set: initial } : { $setOnInsert: initial };
  try {
    return await CertificateIssuanceJob.findOneAndUpdate(
      { training: trainingId },
      update,
      { new: true, upsert: true, runValidators: true },
    );
  } catch (error) {
    if (error.code === 11000) return CertificateIssuanceJob.findOne({ training: trainingId });
    throw error;
  }
};

export const completeTrainingSession = async ({ trainingId, completedBy }) => {
  const training = await Training.findById(trainingId);
  if (!training) return null;

  if (training.status !== 'completed') {
    const completedAt = new Date();
    training.status = 'completed';
    training.completedAt = completedAt;
    training.completedBy = completedBy;
    training.attendanceReviewEndsAt = new Date(completedAt.getTime() + reviewWindowMs);
    training.attendanceFinalizedAt = null;
    training.attendanceLockedAt = null;
    await training.save();
    await Attendance.updateMany(
      { training: trainingId, status: 'not_marked' },
      { $set: { status: 'absent', method: 'manual', updatedBy: completedBy } },
    );
  }

  await QRSession.updateMany(
    { training: trainingId, isOpen: true },
    { isOpen: false, closedAt: training.completedAt || new Date() },
  );

  const presentIds = await Attendance.find({ training: trainingId, status: 'present' }).distinct('participant');
  const eligible = presentIds.length
    ? await Registration.countDocuments({ training: trainingId, status: 'approved', participant: { $in: presentIds } })
    : 0;
  return {
    training,
    job: null,
    summary: { eligible, queued: false, reviewEndsAt: training.attendanceReviewEndsAt },
  };
};

export const attendanceReviewWindowMs = reviewWindowMs;
