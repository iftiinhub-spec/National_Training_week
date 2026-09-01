import Certificate from '../../models/Certificate.js';
import TrainerCertificate from '../../models/TrainerCertificate.js';
import CertificateIssuanceJob from '../../models/CertificateIssuanceJob.js';
import Registration from '../../models/Registration.js';
import Attendance from '../../models/Attendance.js';
import Training from '../../models/Training.js';
import { generateCertificateId } from '../../utils/generateCertificateId.js';
import { generateCertificatePDF } from '../../utils/generatePDF.js';
import { successResponse, errorResponse, getPagination, paginatedResponse } from '../../utils/apiResponse.js';
import { sendCertificateIssuedEmail } from '../../utils/email.js';
import { enqueueCertificateIssuance } from '../../services/completeTrainingSession.js';
import { withPdfGenerationLimit } from '../../utils/pdfGenerationLimit.js';

// POST /api/admin/certificates/generate  — generate for eligible participant
export const generateCertificate = async (req, res, next) => {
  try {
    const { participantId, trainingId } = req.body;

    // 1. Verify training is Completed
    const training = await Training.findById(trainingId).populate('event', 'name year');
    if (!training) return errorResponse(res, 'Training not found.', 404);
    if (training.status !== 'completed') {
      return errorResponse(res, 'Certificate can only be issued for completed trainings.', 400);
    }
    if (training.attendanceReviewEndsAt && !training.attendanceFinalizedAt) return errorResponse(res, 'Certificates are available after the six-hour attendance review closes.', 400);

    // 2. Verify approved registration
    const registration = await Registration.findOne({ participant: participantId, training: trainingId, status: 'approved' });
    if (!registration) return errorResponse(res, 'Participant does not have an approved registration.', 400);

    // 3. Verify attendance = Present
    const attendance = await Attendance.findOne({ participant: participantId, training: trainingId });
    if (!attendance || attendance.status !== 'present') {
      return errorResponse(res, 'Participant must be marked Present to receive a certificate.', 400);
    }

    // 4. Check if certificate already exists (not revoked)
    const existing = await Certificate.findOne({ participant: participantId, training: trainingId, isRevoked: false });
    if (existing) return errorResponse(res, 'An active certificate already exists for this participant.', 409);

    const certId = generateCertificateId(training.event?.year || new Date().getFullYear());
    const certificate = await Certificate.create({
      participant: participantId, training: trainingId,
      certificateId: certId, issuedBy: req.user._id,
    });

    const populated = await Certificate.findById(certificate._id)
      .populate('participant', 'fullName email')
      .populate('training', 'title date event')
      .populate('issuedBy', 'fullName');

    const verifyUrl = `${process.env.FRONTEND_URL}/verify-certificate?id=${certificate.certificateId}`;
    const emailResult = await sendCertificateIssuedEmail({
      to: populated.participant.email,
      participantName: populated.participant.fullName,
      trainingTitle: populated.training.title,
      certificateId: populated.certificateId,
      verifyUrl,
      portalUrl: `${process.env.FRONTEND_URL}/portal/certificates`,
      relatedModel: 'Certificate',
      relatedId: certificate._id,
      dedupeKey: `certificate:${certificate._id}`,
    });
    await Certificate.updateOne({ _id: certificate._id }, emailResult.queued ? {
      $set: { emailStatus: 'pending', emailLastError: '' }, $inc: { emailAttempts: 1 },
    } : emailResult.success ? {
      $set: { emailStatus: 'sent', emailSentAt: new Date(), emailLastError: '' }, $inc: { emailAttempts: 1 },
    } : {
      $set: { emailStatus: 'failed', emailLastError: String(emailResult.error || 'Email delivery failed.').slice(0, 500) }, $inc: { emailAttempts: 1 },
    });

    return successResponse(res, { certificate: populated, emailDelivered: !emailResult.queued && emailResult.success, emailQueued: emailResult.queued }, emailResult.queued ? 'Certificate issued and its email was safely queued.' : emailResult.success ? 'Certificate issued and participant notified.' : 'Certificate issued, but its notification email could not be delivered.', 201);
  } catch (err) { next(err); }
};

// POST /api/admin/certificates/bulk-generate  — generate for all eligible participants
export const bulkGenerateCertificates = async (req, res, next) => {
  try {
    const { trainingId } = req.body;
    const training = await Training.findById(trainingId);
    if (!training) return errorResponse(res, 'Training not found.', 404);
    if (training.status !== 'completed') {
      return errorResponse(res, 'Training must be completed before bulk generating certificates.', 400);
    }
    if (training.attendanceReviewEndsAt && !training.attendanceFinalizedAt) return errorResponse(res, 'Certificates are available after the six-hour attendance review closes.', 400);

    const job = await enqueueCertificateIssuance({ trainingId, requestedBy: req.user._id, restart: true });
    return successResponse(res, { job: { id: job._id, status: job.status } }, 'Certificate issuance has been queued. Emails will be delivered safely in the background.');
  } catch (err) { next(err); }
};

// GET /api/admin/certificates
export const getCertificates = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};
    if (req.query.training) filter.training = req.query.training;
    if (req.query.participant) filter.participant = req.query.participant;
    if (req.query.isRevoked !== undefined) filter.isRevoked = req.query.isRevoked === 'true';

    const [certs, total] = await Promise.all([
      Certificate.find(filter)
        .populate('participant', 'fullName email')
        .populate('training', 'title date')
        .populate('issuedBy', 'fullName')
        .sort({ issuedAt: -1 }).skip(skip).limit(limit),
      Certificate.countDocuments(filter),
    ]);
    return paginatedResponse(res, certs, total, page, limit);
  } catch (err) { next(err); }
};

// PATCH /api/admin/certificates/:id/revoke
export const revokeCertificate = async (req, res, next) => {
  try {
    const reason = req.body.reason?.trim();
    if (!reason) return errorResponse(res, 'A revocation reason is required.', 400);
    const cert = await Certificate.findByIdAndUpdate(
      req.params.id,
      { isRevoked: true, revokedAt: new Date(), revokedReason: reason },
      { new: true }
    );
    if (!cert) return errorResponse(res, 'Certificate not found.', 404);
    return successResponse(res, { certificate: cert }, 'Certificate revoked.');
  } catch (err) { next(err); }
};

// GET /api/participant/certificates — own certificates
export const getMyCertificates = async (req, res, next) => {
  try {
    const certs = await Certificate.find({ participant: req.user._id, isRevoked: false })
      .populate('training', 'title date event coverImage')
      .populate({ path: 'training', populate: { path: 'event', select: 'name year' } })
      .sort({ issuedAt: -1 });
    return successResponse(res, { certificates: certs });
  } catch (err) { next(err); }
};

// GET /api/participant/certificates/:id/download — PDF download
export const downloadCertificate = async (req, res, next) => {
  try {
    const cert = await Certificate.findOne({ _id: req.params.id, participant: req.user._id, isRevoked: false })
      .populate('participant', 'fullName')
      .populate({ path: 'training', populate: { path: 'event', select: 'name year' } });

    if (!cert) return errorResponse(res, 'Certificate not found or not accessible.', 404);

    const verifyUrl = `${process.env.FRONTEND_URL}/verify-certificate?id=${cert.certificateId}`;

    const pdfBuffer = await withPdfGenerationLimit(() => generateCertificatePDF({
      participantName: cert.participant.fullName,
      trainingTitle: cert.training.title,
      eventName: cert.training.event?.name || 'National Training Week',
      issuedDate: cert.issuedAt,
      certificateId: cert.certificateId,
      verifyUrl,
    }));

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificate-${cert.certificateId}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) { next(err); }
};

// GET /api/public/verify/:certificateId — public certificate verification
export const verifyCertificate = async (req, res, next) => {
  try {
    const cert = await Certificate.findOne({ certificateId: req.params.certificateId })
      .populate('participant', 'fullName') // Only expose name, not full profile
      .populate({ path: 'training', populate: { path: 'event', select: 'name year' } });

    if (cert) {
      if (cert.isRevoked) return errorResponse(res, 'This certificate has been revoked.', 400);
      return successResponse(res, {
        valid: true,
        certificateId: cert.certificateId,
        participantName: cert.participant.fullName,
        recipientName: cert.participant.fullName,
        certificateType: 'Certificate of Participation',
        trainingTitle: cert.training.title,
        eventName: cert.training.event?.name,
        issuedAt: cert.issuedAt,
      }, 'Certificate is valid.');
    }

    const trainerCert = await TrainerCertificate.findOne({ certificateId: req.params.certificateId })
      .populate('trainer', 'name')
      .populate({ path: 'training', populate: { path: 'event', select: 'name year' } });
    if (!trainerCert) return errorResponse(res, 'Certificate not found. It may be invalid.', 404);
    return successResponse(res, {
      valid: true,
      certificateId: trainerCert.certificateId,
      participantName: trainerCert.trainer.name,
      recipientName: trainerCert.trainer.name,
      certificateType: 'Certificate of Appreciation',
      trainingTitle: trainerCert.training.title,
      eventName: trainerCert.training.event?.name,
      issuedAt: trainerCert.issuedAt,
    }, 'Certificate is valid.');
  } catch (err) { next(err); }
};

export const getCertificateJob = async (req, res, next) => {
  try {
    const job = await CertificateIssuanceJob.findOne({ training: req.params.trainingId })
      .select('status attempts nextRunAt completedAt lastError summary updatedAt').lean();
    return successResponse(res, { job });
  } catch (err) { next(err); }
};
