import User from '../models/User.js';
import Trainer from '../models/Trainer.js';
import Training from '../models/Training.js';
import TrainingMaterial from '../models/TrainingMaterial.js';
import Registration from '../models/Registration.js';
import Attendance from '../models/Attendance.js';
import Feedback from '../models/Feedback.js';
import Meeting from '../models/Meeting.js';
import TrainerCertificate from '../models/TrainerCertificate.js';
import { errorResponse, successResponse } from '../utils/apiResponse.js';
import { sendAdminNewTrainerApplicationEmail, sendTrainerApplicationReceivedEmail } from '../utils/trainerStatusEmail.js';
import { generateTrainerAppreciationPDF } from '../utils/generateTrainerAppreciationPDF.js';
import { withPdfGenerationLimit } from '../utils/pdfGenerationLimit.js';
import { pick } from '../utils/pick.js';

const expertiseList = (value) => Array.isArray(value) ? value : String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
const materialPayload = (input) => pick(input, ['title', 'url', 'description']);

export const applyAsTrainer = async (req, res, next) => {
  try {
    const email = req.body.email.toLowerCase();
    if (await User.exists({ email })) return errorResponse(res, 'An account with this email already exists.', 409);
    const user = await User.create({ fullName: req.body.name, email, passwordHash: req.body.password, role: 'trainer', isActive: false, accountStatus: 'pending', phone: req.body.phone });
    try {
      const trainer = await Trainer.create({ name: req.body.name, email, phone: req.body.phone, title: req.body.title, organization: req.body.organization, biography: req.body.biography, expertise: expertiseList(req.body.expertise), photo: req.file ? `uploads/photo/${req.file.filename}` : null, user: user._id, accessStatus: 'pending', isActive: false });
      user.trainerProfile = trainer._id;
      await user.save({ validateBeforeSave: false });
      await sendTrainerApplicationReceivedEmail({ to: trainer.email, trainerName: trainer.name });
      await sendAdminNewTrainerApplicationEmail({ trainerName: trainer.name, trainerEmail: trainer.email });
      return successResponse(res, { application: { id: trainer._id, status: trainer.accessStatus } }, 'Trainer application submitted for administrator review.', 201);
    } catch (error) { await User.findByIdAndDelete(user._id); throw error; }
  } catch (error) { next(error); }
};

const ownTrainer = (user) => Trainer.findOne({ _id: user.trainerProfile, user: user._id, accessStatus: 'approved' });

export const getTrainerDashboard = async (req, res, next) => {
  try {
    const trainer = await ownTrainer(req.user);
    if (!trainer) return errorResponse(res, 'Approved trainer profile not found.', 403);
    const sessions = await Training.find({ trainer: trainer._id }).populate('event', 'name year').populate('eventDay', 'dayNumber theme date').populate('category', 'name').sort({ date: 1, startTime: 1 }).lean();
    const sessionIds = sessions.map((session) => session._id);
    const [participants, presentCounts, feedback, meetings, materials] = await Promise.all([
      Registration.find({ training: { $in: sessionIds }, status: 'approved' }).populate('participant', 'fullName').select('participant training').lean(),
      Attendance.aggregate([
        { $match: { training: { $in: sessionIds }, status: 'present' } },
        { $group: { _id: '$training', count: { $sum: 1 } } },
      ]),
      Feedback.find({ training: { $in: sessionIds } }).select('contentRating trainerRating comments suggestions training').lean(),
      Meeting.find({ training: { $in: sessionIds } }).select('platform meetingUrl meetingId passcode startTime endTime notes training').lean(),
      TrainingMaterial.find({ training: { $in: sessionIds }, trainer: trainer._id }).sort({ createdAt: -1 }).lean(),
    ]);

    const groupByTraining = (list) => list.reduce((map, item) => {
      const key = String(item.training);
      (map[key] ||= []).push(item);
      return map;
    }, {});
    const participantsByTraining = groupByTraining(participants);
    const feedbackByTraining = groupByTraining(feedback);
    const materialsByTraining = groupByTraining(materials);
    const meetingByTraining = Object.fromEntries(meetings.map((meeting) => [String(meeting.training), meeting]));
    const presentByTraining = Object.fromEntries(presentCounts.map((row) => [String(row._id), row.count]));

    const enriched = sessions.map((session) => {
      const key = String(session._id);
      return {
        ...session,
        participants: participantsByTraining[key] || [],
        attendancePresent: presentByTraining[key] || 0,
        feedback: feedbackByTraining[key] || [],
        meeting: meetingByTraining[key] || null,
        materials: materialsByTraining[key] || [],
      };
    });
    return successResponse(res, { trainer, sessions: enriched });
  } catch (error) { next(error); }
};

export const updateTrainerProfile = async (req, res, next) => {
  try {
    const trainer = await ownTrainer(req.user);
    if (!trainer) return errorResponse(res, 'Approved trainer profile not found.', 403);
    const allowed = ['title', 'name', 'phone', 'organization', 'biography'];
    allowed.forEach((field) => { if (req.body[field] !== undefined) trainer[field] = req.body[field]; });
    if (req.body.expertise !== undefined) trainer.expertise = expertiseList(req.body.expertise);
    if (req.file) trainer.photo = `uploads/photo/${req.file.filename}`;
    await trainer.save();
    const user = await User.findByIdAndUpdate(req.user._id, { fullName: trainer.name, phone: trainer.phone, profilePhoto: trainer.photo }, { new: true, runValidators: true });
    return successResponse(res, { trainer, user }, 'Trainer profile updated.');
  } catch (error) { next(error); }
};

export const getTrainerCertificates = async (req, res, next) => {
  try {
    const trainer = await ownTrainer(req.user);
    if (!trainer) return errorResponse(res, 'Approved trainer profile not found.', 403);
    const certificates = await TrainerCertificate.find({ trainer: trainer._id })
      .populate({ path: 'training', select: 'title date event', populate: { path: 'event', select: 'name year' } })
      .sort({ issuedAt: -1 });
    return successResponse(res, { certificates });
  } catch (error) { next(error); }
};

export const downloadTrainerCertificate = async (req, res, next) => {
  try {
    const trainer = await ownTrainer(req.user);
    if (!trainer) return errorResponse(res, 'Approved trainer profile not found.', 403);
    const certificate = await TrainerCertificate.findOne({ _id: req.params.id, trainer: trainer._id })
      .populate({ path: 'training', select: 'title event', populate: { path: 'event', select: 'name year' } });
    if (!certificate) return errorResponse(res, 'Certificate not found or not accessible.', 404);
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-certificate?id=${certificate.certificateId}`;
    const pdfBuffer = await withPdfGenerationLimit(() => generateTrainerAppreciationPDF({
      trainerName: trainer.name,
      trainingTitle: certificate.training.title,
      eventName: certificate.training.event?.name || 'National Training Week',
      issuedDate: certificate.issuedAt,
      certificateId: certificate.certificateId,
      verifyUrl,
    }));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="trainer-certificate-${certificate.certificateId}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) { next(error); }
};

const assignedTraining = async (user, trainingId) => {
  const trainer = await ownTrainer(user);
  if (!trainer) return null;
  const training = await Training.findOne({ _id: trainingId, trainer: trainer._id });
  return training ? { trainer, training } : null;
};

export const createMaterial = async (req, res, next) => {
  try {
    const assigned = await assignedTraining(req.user, req.params.trainingId);
    if (!assigned) return errorResponse(res, 'Assigned training not found.', 404);
    if (assigned.training.status === 'completed') return errorResponse(res, 'Materials cannot be changed after completion.', 400);
    const material = await TrainingMaterial.create({ ...materialPayload(req.body), training: assigned.training._id, trainer: assigned.trainer._id });
    return successResponse(res, { material }, 'Material added.', 201);
  } catch (error) { next(error); }
};

export const updateMaterial = async (req, res, next) => {
  try {
    const assigned = await assignedTraining(req.user, req.params.trainingId);
    if (!assigned || assigned.training.status === 'completed') return errorResponse(res, 'Material cannot be changed.', 400);
    const material = await TrainingMaterial.findOneAndUpdate({ _id: req.params.materialId, training: assigned.training._id, trainer: assigned.trainer._id }, materialPayload(req.body), { new: true, runValidators: true });
    if (!material) return errorResponse(res, 'Material not found.', 404);
    return successResponse(res, { material }, 'Material updated.');
  } catch (error) { next(error); }
};

export const deleteMaterial = async (req, res, next) => {
  try {
    const assigned = await assignedTraining(req.user, req.params.trainingId);
    if (!assigned || assigned.training.status === 'completed') return errorResponse(res, 'Material cannot be deleted.', 400);
    const material = await TrainingMaterial.findOneAndDelete({ _id: req.params.materialId, training: assigned.training._id, trainer: assigned.trainer._id });
    if (!material) return errorResponse(res, 'Material not found.', 404);
    return successResponse(res, null, 'Material deleted.');
  } catch (error) { next(error); }
};
