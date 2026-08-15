import os from 'node:os';
import { randomUUID } from 'node:crypto';
import Attendance from '../models/Attendance.js';
import Certificate from '../models/Certificate.js';
import CertificateIssuanceJob from '../models/CertificateIssuanceJob.js';
import Registration from '../models/Registration.js';
import TrainerCertificate from '../models/TrainerCertificate.js';
import Training from '../models/Training.js';
import { sendCertificateIssuedEmail, sendTrainerCertificateIssuedEmail } from '../utils/email.js';
import { generateCertificateId, generateTrainerCertificateId } from '../utils/generateCertificateId.js';

const workerId = `${os.hostname()}:${process.pid}:${randomUUID().slice(0, 8)}`;
const batchSize = Math.max(1, Math.min(Number(process.env.CERTIFICATE_BATCH_SIZE) || 25, 100));
const pollInterval = Math.max(500, Number(process.env.CERTIFICATE_WORKER_POLL_MS) || 2_000);
const maxEmailAttempts = Math.max(1, Number(process.env.CERTIFICATE_EMAIL_MAX_ATTEMPTS) || 5);
const maxJobRuns = Math.max(20, Number(process.env.CERTIFICATE_JOB_MAX_RUNS) || 500);
const staleLockMs = Math.max(60_000, Number(process.env.CERTIFICATE_JOB_STALE_MS) || 10 * 60_000);
const retryDelayMs = Math.max(5_000, Number(process.env.CERTIFICATE_RETRY_DELAY_MS) || 60_000);

let timer = null;
let running = false;
let stopped = false;

const emailUpdate = async (Model, certificate, result) => {
  await Model.updateOne({ _id: certificate._id }, result.success ? {
    $set: { emailStatus: 'sent', emailSentAt: new Date(), emailLastError: '' },
  } : {
    $set: { emailStatus: 'failed', emailLastError: String(result.error || 'Email delivery failed.').slice(0, 500) },
  });
};

const issueParticipantCertificate = async ({ participant, training, requestedBy }) => {
  let certificate = await Certificate.findOne({ participant: participant._id, training: training._id });
  if (!certificate) {
    try {
      certificate = await Certificate.create({
        participant: participant._id,
        training: training._id,
        certificateId: generateCertificateId(training.event?.year || new Date().getFullYear()),
        issuedBy: requestedBy,
      });
    } catch (error) {
      if (error.code !== 11000) throw error;
      certificate = await Certificate.findOne({ participant: participant._id, training: training._id });
    }
  }
  if (!certificate || certificate.emailStatus === 'sent' || certificate.emailAttempts >= maxEmailAttempts) return;
  await Certificate.updateOne({ _id: certificate._id }, { $set: { emailStatus: 'processing' }, $inc: { emailAttempts: 1 } });
  const result = await sendCertificateIssuedEmail({
    to: participant.email,
    participantName: participant.fullName,
    trainingTitle: training.title,
    certificateId: certificate.certificateId,
    verifyUrl: `${process.env.FRONTEND_URL}/verify-certificate?id=${certificate.certificateId}`,
    portalUrl: `${process.env.FRONTEND_URL}/portal/certificates`,
  });
  await emailUpdate(Certificate, certificate, result);
};

const issueTrainerCertificate = async ({ training, requestedBy }) => {
  if (!training.trainer) return;
  let certificate = await TrainerCertificate.findOne({ trainer: training.trainer._id, training: training._id });
  if (!certificate) {
    try {
      certificate = await TrainerCertificate.create({
        trainer: training.trainer._id,
        training: training._id,
        certificateId: generateTrainerCertificateId(training.event?.year || new Date().getFullYear()),
        issuedBy: requestedBy,
      });
    } catch (error) {
      if (error.code !== 11000) throw error;
      certificate = await TrainerCertificate.findOne({ trainer: training.trainer._id, training: training._id });
    }
  }
  if (!certificate || certificate.emailStatus === 'sent' || certificate.emailAttempts >= maxEmailAttempts) return;
  await TrainerCertificate.updateOne({ _id: certificate._id }, { $set: { emailStatus: 'processing' }, $inc: { emailAttempts: 1 } });
  const result = await sendTrainerCertificateIssuedEmail({
    to: training.trainer.email,
    trainerName: training.trainer.name,
    trainingTitle: training.title,
    certificateId: certificate.certificateId,
    verifyUrl: `${process.env.FRONTEND_URL}/verify-certificate?id=${certificate.certificateId}`,
    portalUrl: `${process.env.FRONTEND_URL}/trainer/certificates`,
  });
  await emailUpdate(TrainerCertificate, certificate, result);
};

const processJob = async (job) => {
  const training = await Training.findById(job.training)
    .populate('event', 'name year')
    .populate('trainer', 'name email');
  if (!training || training.status !== 'completed') throw new Error('Completed training not found for certificate job.');

  const presentIds = await Attendance.find({ training: training._id, status: 'present' }).distinct('participant');
  const registrations = presentIds.length ? await Registration.find({
    training: training._id,
    status: 'approved',
    participant: { $in: presentIds },
  }).populate('participant', 'fullName email').lean() : [];
  const validRegistrations = registrations.filter((registration) => registration.participant?.email);
  const certificates = await Certificate.find({ training: training._id }).select('participant emailStatus emailAttempts').lean();
  const certificateByParticipant = new Map(certificates.map((certificate) => [String(certificate.participant), certificate]));
  const candidates = validRegistrations.filter((registration) => {
    const certificate = certificateByParticipant.get(String(registration.participant._id));
    return !certificate || (certificate.emailStatus !== 'sent' && (certificate.emailAttempts || 0) < maxEmailAttempts);
  });

  for (const registration of candidates.slice(0, batchSize)) {
    await issueParticipantCertificate({ participant: registration.participant, training, requestedBy: job.requestedBy });
    await CertificateIssuanceJob.updateOne({ _id: job._id, lockedBy: workerId }, { $set: { lockedAt: new Date() } });
  }
  await issueTrainerCertificate({ training, requestedBy: job.requestedBy });

  const [participantCertificates, participantEmailsSent, participantEmailsFailed, trainerCertificate] = await Promise.all([
    Certificate.countDocuments({ training: training._id }),
    Certificate.countDocuments({ training: training._id, emailStatus: 'sent' }),
    Certificate.countDocuments({ training: training._id, emailStatus: 'failed', emailAttempts: { $gte: maxEmailAttempts } }),
    TrainerCertificate.findOne({ training: training._id }).select('emailStatus emailAttempts').lean(),
  ]);
  const processedParticipants = participantEmailsSent + participantEmailsFailed;
  const participantsFinished = processedParticipants >= validRegistrations.length;
  const trainerFinished = !training.trainer || trainerCertificate?.emailStatus === 'sent' || trainerCertificate?.emailAttempts >= maxEmailAttempts;
  const finished = participantsFinished && trainerFinished;
  const hasErrors = participantEmailsFailed > 0
    || validRegistrations.length < registrations.length
    || (training.trainer && trainerCertificate?.emailStatus !== 'sent');

  await CertificateIssuanceJob.updateOne({ _id: job._id, lockedBy: workerId }, {
    $set: {
      status: finished ? (hasErrors ? 'completed_with_errors' : 'completed') : 'queued',
      nextRunAt: finished ? new Date() : new Date(Date.now() + (candidates.length > batchSize ? 250 : retryDelayMs)),
      lockedAt: null,
      lockedBy: '',
      completedAt: finished ? new Date() : null,
      lastError: '',
      summary: {
        eligible: registrations.length,
        participantCertificates,
        participantEmailsSent,
        participantEmailsFailed,
        trainerCertificateIssued: Boolean(trainerCertificate),
        trainerEmailSent: trainerCertificate?.emailStatus === 'sent',
        trainerEmailFailed: Boolean(trainerCertificate && trainerCertificate.emailStatus === 'failed' && trainerCertificate.emailAttempts >= maxEmailAttempts),
      },
    },
  });
};

const claimJob = async () => {
  const staleBefore = new Date(Date.now() - staleLockMs);
  await CertificateIssuanceJob.updateMany(
    { status: 'processing', lockedAt: { $lt: staleBefore } },
    { $set: { status: 'queued', lockedAt: null, lockedBy: '', nextRunAt: new Date() } },
  );
  return CertificateIssuanceJob.findOneAndUpdate(
    { status: { $in: ['queued', 'failed'] }, nextRunAt: { $lte: new Date() }, attempts: { $lt: maxJobRuns } },
    { $set: { status: 'processing', lockedAt: new Date(), lockedBy: workerId }, $inc: { attempts: 1 } },
    { new: true, sort: { nextRunAt: 1, createdAt: 1 } },
  );
};

const reconcileCompletedTrainings = async () => {
  // Certificates created by the former synchronous workflow have no delivery
  // fields. Treat them as already notified to avoid duplicate historical mail.
  await Promise.all([
    Certificate.updateMany({ emailStatus: { $exists: false } }, { $set: { emailStatus: 'sent', emailAttempts: 1 } }),
    TrainerCertificate.updateMany({ emailStatus: { $exists: false } }, { $set: { emailStatus: 'sent', emailAttempts: 1 } }),
  ]);
  const completed = await Training.find({ status: 'completed', completedBy: { $ne: null } })
    .select('_id completedBy').limit(1_000).lean();
  if (!completed.length) return;
  const existingTrainingIds = new Set((await CertificateIssuanceJob.find({
    training: { $in: completed.map((training) => training._id) },
  }).distinct('training')).map(String));
  const missing = completed.filter((training) => !existingTrainingIds.has(String(training._id)));
  if (!missing.length) return;
  await CertificateIssuanceJob.bulkWrite(missing.map((training) => ({
    updateOne: {
      filter: { training: training._id },
      update: { $setOnInsert: { training: training._id, requestedBy: training.completedBy, status: 'queued', nextRunAt: new Date() } },
      upsert: true,
    },
  })), { ordered: false });
};

const work = async () => {
  if (running || stopped) return;
  running = true;
  let job;
  try {
    job = await claimJob();
    if (job) await processJob(job);
  } catch (error) {
    console.error('Certificate worker error:', error.message);
    if (job) {
      const terminal = job.attempts >= maxJobRuns;
      await CertificateIssuanceJob.updateOne({ _id: job._id, lockedBy: workerId }, {
        $set: {
          status: 'failed',
          lockedAt: null,
          lockedBy: '',
          nextRunAt: terminal ? new Date(8640000000000000) : new Date(Date.now() + retryDelayMs),
          lastError: String(error.message || error).slice(0, 500),
        },
      }).catch(() => {});
    }
  } finally {
    running = false;
  }
};

export const startCertificateIssuanceWorker = () => {
  if (timer || process.env.DISABLE_CERTIFICATE_WORKER === 'true') return;
  stopped = false;
  timer = setInterval(work, pollInterval);
  timer.unref();
  void reconcileCompletedTrainings()
    .catch((error) => console.error('Certificate job reconciliation error:', error.message))
    .finally(() => { void work(); });
};

export const stopCertificateIssuanceWorker = async () => {
  stopped = true;
  if (timer) clearInterval(timer);
  timer = null;
  while (running) await new Promise((resolve) => setTimeout(resolve, 50));
};
