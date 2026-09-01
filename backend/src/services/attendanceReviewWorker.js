import Attendance from '../models/Attendance.js';
import Training from '../models/Training.js';
import { enqueueCertificateIssuance } from './completeTrainingSession.js';

const pollMs = Math.max(30_000, Number(process.env.ATTENDANCE_REVIEW_WORKER_POLL_MS) || 60_000);
let timer = null; let running = false; let stopped = false;

const finalizeOne = async () => {
  const now = new Date();
  await Training.updateMany(
    { attendanceFinalizedAt: null, attendanceFinalizingAt: { $lt: new Date(Date.now() - 10 * 60_000) } },
    { $set: { attendanceFinalizingAt: null } },
  );
  const training = await Training.findOneAndUpdate(
    { status: 'completed', attendanceReviewEndsAt: { $lte: now }, attendanceFinalizedAt: null, attendanceFinalizingAt: null },
    { $set: { attendanceFinalizingAt: now } },
    { new: true, sort: { attendanceReviewEndsAt: 1 } },
  );
  if (!training) return null;
  await Attendance.updateMany(
    { training: training._id, status: 'not_marked' },
    { $set: { status: 'absent', method: 'manual', updatedBy: training.completedBy } },
  );
  await enqueueCertificateIssuance({ trainingId: training._id, requestedBy: training.completedBy });
  await Training.updateOne(
    { _id: training._id, attendanceFinalizingAt: now },
    { $set: { attendanceFinalizedAt: new Date(), attendanceLockedAt: new Date(), attendanceFinalizingAt: null } },
  );
  return training;
};

const work = async () => {
  if (running || stopped) return;
  running = true;
  try { await finalizeOne(); }
  catch (error) { console.error('Attendance review worker error:', error.message); }
  finally { running = false; }
};

export const startAttendanceReviewWorker = () => {
  if (timer || process.env.DISABLE_ATTENDANCE_REVIEW_WORKER === 'true') return;
  stopped = false; timer = setInterval(() => { void work(); }, pollMs); timer.unref(); void work();
};
export const stopAttendanceReviewWorker = async () => {
  stopped = true; if (timer) clearInterval(timer); timer = null;
  while (running) await new Promise((resolve) => setTimeout(resolve, 50));
};
