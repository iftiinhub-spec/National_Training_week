import User from '../models/User.js';
import Trainer from '../models/Trainer.js';
import Training from '../models/Training.js';
import TrainingMaterial from '../models/TrainingMaterial.js';
import Registration from '../models/Registration.js';
import Attendance from '../models/Attendance.js';
import Feedback from '../models/Feedback.js';
import Meeting from '../models/Meeting.js';
import { errorResponse, successResponse } from '../utils/apiResponse.js';

const expertiseList = (value) => Array.isArray(value) ? value : String(value || '').split(',').map((item) => item.trim()).filter(Boolean);

export const applyAsTrainer = async (req, res, next) => {
  try {
    const email = req.body.email.toLowerCase();
    if (await User.exists({ email })) return errorResponse(res, 'An account with this email already exists.', 409);
    const user = await User.create({ fullName: req.body.name, email, passwordHash: req.body.password, role: 'trainer', isActive: false, accountStatus: 'pending', phone: req.body.phone });
    try {
      const trainer = await Trainer.create({ name: req.body.name, email, phone: req.body.phone, title: req.body.title, organization: req.body.organization, biography: req.body.biography, expertise: expertiseList(req.body.expertise), photo: req.file ? `uploads/photo/${req.file.filename}` : null, user: user._id, accessStatus: 'pending', isActive: false });
      user.trainerProfile = trainer._id;
      await user.save({ validateBeforeSave: false });
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
    const enriched = await Promise.all(sessions.map(async (session) => {
      const [participants, attendance, feedback, meeting, materials] = await Promise.all([
        Registration.find({ training: session._id, status: 'approved' }).populate('participant', 'fullName').select('participant').lean(),
        Attendance.countDocuments({ training: session._id, status: 'present' }),
        Feedback.find({ training: session._id }).select('contentRating trainerRating comments suggestions').lean(),
        Meeting.findOne({ training: session._id }).select('platform meetingUrl meetingId passcode startTime endTime notes').lean(),
        TrainingMaterial.find({ training: session._id, trainer: trainer._id }).sort({ createdAt: -1 }).lean(),
      ]);
      return { ...session, participants, attendancePresent: attendance, feedback, meeting, materials };
    }));
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
    const material = await TrainingMaterial.create({ ...req.body, training: assigned.training._id, trainer: assigned.trainer._id });
    return successResponse(res, { material }, 'Material added.', 201);
  } catch (error) { next(error); }
};

export const updateMaterial = async (req, res, next) => {
  try {
    const assigned = await assignedTraining(req.user, req.params.trainingId);
    if (!assigned || assigned.training.status === 'completed') return errorResponse(res, 'Material cannot be changed.', 400);
    const material = await TrainingMaterial.findOneAndUpdate({ _id: req.params.materialId, training: assigned.training._id, trainer: assigned.trainer._id }, req.body, { new: true, runValidators: true });
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
