import Attendance from '../models/Attendance.js';
import Certificate from '../models/Certificate.js';
import CertificateIssuanceJob from '../models/CertificateIssuanceJob.js';
import Communication from '../models/Communication.js';
import Event from '../models/Event.js';
import EventDay from '../models/EventDay.js';
import Feedback from '../models/Feedback.js';
import Meeting from '../models/Meeting.js';
import QRSession from '../models/QRSession.js';
import Recording from '../models/Recording.js';
import Registration from '../models/Registration.js';
import Sponsor from '../models/Sponsor.js';
import TrainerCertificate from '../models/TrainerCertificate.js';
import Training from '../models/Training.js';
import TrainingMaterial from '../models/TrainingMaterial.js';
import { deleteFile } from '../middleware/upload.js';

const trainingRelatedModels = [
  Registration,
  Attendance,
  Meeting,
  Communication,
  Feedback,
  Certificate,
  TrainerCertificate,
  CertificateIssuanceJob,
  Recording,
  QRSession,
  TrainingMaterial,
];

export const deleteTrainingCascade = async (trainingOrId) => {
  const training = typeof trainingOrId === 'object'
    ? trainingOrId
    : await Training.findById(trainingOrId);
  if (!training) return { trainings: 0, relatedRecords: 0, files: 0 };

  const deleted = await Promise.all(
    trainingRelatedModels.map((Model) => Model.deleteMany({ training: training._id })),
  );
  if (training.coverImage) deleteFile(training.coverImage);
  await Training.deleteOne({ _id: training._id });

  return {
    trainings: 1,
    relatedRecords: deleted.reduce((total, result) => total + result.deletedCount, 0),
    files: training.coverImage ? 1 : 0,
  };
};

export const deleteEventDayCascade = async (dayOrId) => {
  const day = typeof dayOrId === 'object' ? dayOrId : await EventDay.findById(dayOrId);
  if (!day) return { days: 0, trainings: 0, relatedRecords: 0, files: 0 };

  const trainings = await Training.find({ eventDay: day._id });
  const trainingResults = await Promise.all(trainings.map(deleteTrainingCascade));
  await EventDay.deleteOne({ _id: day._id });

  return trainingResults.reduce((summary, result) => ({
    days: summary.days,
    trainings: summary.trainings + result.trainings,
    relatedRecords: summary.relatedRecords + result.relatedRecords,
    files: summary.files + result.files,
  }), { days: 1, trainings: 0, relatedRecords: 0, files: 0 });
};

export const deleteEventCascade = async (eventOrId) => {
  const event = typeof eventOrId === 'object' ? eventOrId : await Event.findById(eventOrId);
  if (!event) return { events: 0, days: 0, trainings: 0, relatedRecords: 0, coOrganizers: 0, files: 0 };

  const days = await EventDay.find({ event: event._id });
  const dayResults = await Promise.all(days.map(deleteEventDayCascade));
  const orphanTrainingResults = await Promise.all(
    (await Training.find({ event: event._id })).map(deleteTrainingCascade),
  );
  const coOrganizers = await Sponsor.find({ event: event._id });
  coOrganizers.forEach((item) => { if (item.logo) deleteFile(item.logo); });
  const coOrganizerDelete = await Sponsor.deleteMany({ event: event._id });
  await Event.deleteOne({ _id: event._id });

  return [...dayResults, ...orphanTrainingResults].reduce((summary, result) => ({
    ...summary,
    days: summary.days + (result.days || 0),
    trainings: summary.trainings + result.trainings,
    relatedRecords: summary.relatedRecords + result.relatedRecords,
    files: summary.files + result.files,
  }), {
    events: 1,
    days: 0,
    trainings: 0,
    relatedRecords: 0,
    coOrganizers: coOrganizerDelete.deletedCount,
    files: coOrganizers.filter((item) => item.logo).length,
  });
};
