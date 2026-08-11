import Attendance from '../models/Attendance.js';
import Certificate from '../models/Certificate.js';
import QRSession from '../models/QRSession.js';
import Registration from '../models/Registration.js';
import Training from '../models/Training.js';
import { generateCertificateId } from '../utils/generateCertificateId.js';
import { sendCertificateIssuedEmail } from '../utils/email.js';

export const completeTrainingSession = async ({ trainingId, completedBy }) => {
  const training = await Training.findById(trainingId).populate('event', 'name year');
  if (!training) return null;

  if (training.status !== 'completed') {
    const completedAt = new Date();
    training.status = 'completed';
    training.completedAt = completedAt;
    training.completedBy = completedBy;
    training.attendanceLockedAt = completedAt;
    await training.save();
  }

  await QRSession.updateMany(
    { training: trainingId, isOpen: true },
    { isOpen: false, closedAt: training.completedAt || new Date() },
  );

  const registrations = await Registration.find({ training: trainingId, status: 'approved' })
    .populate('participant', 'fullName email');
  const presentIds = new Set((await Attendance.find({ training: trainingId, status: 'present' }).select('participant'))
    .map((record) => String(record.participant)));

  let issued = 0;
  let skipped = 0;
  let notified = 0;
  const errors = [];

  for (const registration of registrations) {
    const participant = registration.participant;
    if (!participant || !presentIds.has(String(participant._id))) { skipped += 1; continue; }
    try {
      let certificate = await Certificate.findOne({ participant: participant._id, training: trainingId });
      if (certificate) { skipped += 1; continue; }
      certificate = await Certificate.create({
        participant: participant._id,
        training: trainingId,
        certificateId: generateCertificateId(training.event?.year || new Date().getFullYear()),
        issuedBy: completedBy,
      });
      issued += 1;
      const emailResult = await sendCertificateIssuedEmail({
        to: participant.email,
        participantName: participant.fullName,
        trainingTitle: training.title,
        certificateId: certificate.certificateId,
        verifyUrl: `${process.env.FRONTEND_URL}/verify-certificate?id=${certificate.certificateId}`,
        portalUrl: `${process.env.FRONTEND_URL}/portal/certificates`,
      });
      if (emailResult.success) notified += 1;
    } catch (error) {
      if (error.code === 11000) { skipped += 1; continue; }
      errors.push({ participantId: participant._id, message: error.message });
    }
  }

  return { training, summary: { eligible: presentIds.size, issued, skipped, notified, errors } };
};
