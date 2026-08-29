import Trainer from '../../models/Trainer.js';
import Training from '../../models/Training.js';
import { successResponse, errorResponse, getPagination, paginatedResponse } from '../../utils/apiResponse.js';
import { escapeRegex } from '../../utils/search.js';
import User from '../../models/User.js';
import Event from '../../models/Event.js';
import TrainerCertificate from '../../models/TrainerCertificate.js';
import TrainingMaterial from '../../models/TrainingMaterial.js';
import { pick } from '../../utils/pick.js';
import { sendTrainerApprovedEmail, sendTrainerRejectedEmail } from '../../utils/trainerStatusEmail.js';
import { deleteFile } from '../../middleware/upload.js';

const trainerPayload = (input) => pick(input, ['name', 'email', 'phone', 'password', 'title', 'organization', 'biography', 'expertise', 'isActive', 'accessStatus']);
const idsFromRequest = (req) => [...new Set((req.body?.ids || [req.params.id]).filter(Boolean).map(String))];

const deleteTrainerIds = async (ids) => {
  const trainers = await Trainer.find({ _id: { $in: ids } }).select('user photo');
  const userIds = trainers.map((trainer) => trainer.user).filter(Boolean);
  trainers.forEach((trainer) => { if (trainer.photo) deleteFile(trainer.photo); });
  const deletedIdSet = new Set(ids.map(String));
  const affectedTrainings = await Training.find({ $or: [{ trainers: { $in: ids } }, { trainer: { $in: ids } }] });
  for (const training of affectedTrainings) {
    training.trainers = [...new Set([...(training.trainers || []), ...(training.trainer ? [training.trainer] : [])].map(String))]
      .filter((id) => !deletedIdSet.has(id));
    training.trainer = training.trainers[0] || null;
    await training.save();
  }
  const [materials, certificates, deletedTrainers] = await Promise.all([
    TrainingMaterial.deleteMany({ trainer: { $in: ids } }),
    TrainerCertificate.deleteMany({ trainer: { $in: ids } }),
    Trainer.deleteMany({ _id: { $in: ids } }),
  ]);
  if (userIds.length) await User.deleteMany({ _id: { $in: userIds }, role: 'trainer' });
  return {
    trainers: deletedTrainers.deletedCount,
    users: userIds.length,
    unassignedSessions: affectedTrainings.length,
    materials: materials.deletedCount,
    certificates: certificates.deletedCount,
    files: trainers.filter((trainer) => trainer.photo).length,
  };
};

export const getTrainers = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};
    if (req.query.active === 'true') filter.isActive = true;
    if (req.query.search) filter.name = { $regex: escapeRegex(req.query.search), $options: 'i' };
    const [trainers, total] = await Promise.all([
      Trainer.find(filter).populate('user', 'isActive').sort({ name: 1 }).skip(skip).limit(limit),
      Trainer.countDocuments(filter),
    ]);
    return paginatedResponse(res, trainers, total, page, limit);
  } catch (err) { next(err); }
};

export const getPublicTrainers = async (req, res, next) => {
  try {
    const sessionFilter = {
      status: { $in: ['published', 'completed'] },
      $or: [{ trainers: { $exists: true, $ne: [] } }, { trainer: { $ne: null } }],
    };
    if (req.query.event) sessionFilter.event = req.query.event;
    else {
      const currentEvent = await Event.findOne({ status: 'published', isActive: { $ne: false }, isCurrent: true })
        || await Event.findOne({ status: 'published', isActive: { $ne: false }, endDate: { $gte: new Date() } }).sort({ startDate: 1 })
        || await Event.findOne({ status: 'published', isActive: { $ne: false } }).sort({ year: -1 });
      if (currentEvent) sessionFilter.event = currentEvent._id;
    }
    if (req.query.eventDay) sessionFilter.eventDay = req.query.eventDay;
    const sessions = await Training.find(sessionFilter)
      .select('title date startTime endTime trainer trainers event eventDay category status')
      .populate('event', 'name year')
      .populate('eventDay', 'dayNumber theme date')
      .populate('category', 'name')
      .sort({ date: 1, startTime: 1 });
    const sessionTrainerIds = (session) => [...new Set([...(session.trainers || []).map(String), ...(session.trainer ? [String(session.trainer)] : [])])];
    const trainerIds = [...new Set(sessions.flatMap(sessionTrainerIds))];
    const trainers = await Trainer.find({ _id: { $in: trainerIds } }).sort({ name: 1 }).lean();
    const enriched = trainers.map((trainer) => ({
      ...trainer,
      sessions: sessions.filter((session) => sessionTrainerIds(session).includes(String(trainer._id))),
    }));
    return successResponse(res, { trainers: enriched });
  } catch (err) { next(err); }
};

export const getPublicTrainer = async (req, res, next) => {
  try {
    const trainer = await Trainer.findById(req.params.id).lean();
    if (!trainer) return errorResponse(res, 'Trainer not found.', 404);
    const sessionFilter = {
      $or: [{ trainers: trainer._id }, { trainer: trainer._id }],
      status: { $in: ['published', 'completed'] },
    };
    if (req.query.event) sessionFilter.event = req.query.event;
    const sessions = await Training.find(sessionFilter)
      .select('title slug description coverImage date startTime endTime audience level language status event eventDay category')
      .populate('event', 'name year')
      .populate('eventDay', 'dayNumber theme date')
      .populate('category', 'name')
      .sort({ date: 1, startTime: 1 });
    if (!sessions.length) return errorResponse(res, 'Trainer not found.', 404);
    return successResponse(res, { trainer: { ...trainer, sessions } });
  } catch (err) { next(err); }
};

export const getTrainer = async (req, res, next) => {
  try {
    const trainer = await Trainer.findById(req.params.id);
    if (!trainer) return errorResponse(res, 'Trainer not found.', 404);
    return successResponse(res, { trainer });
  } catch (err) { next(err); }
};

export const createTrainer = async (req, res, next) => {
  try {
    const data = trainerPayload(req.body);
    if (!data.password) return errorResponse(res, 'Password is required when creating a trainer account.', 400);
    if (data.password.length < 8) return errorResponse(res, 'Password must be at least 8 characters.', 400);
    if (await User.exists({ email: data.email.toLowerCase() })) return errorResponse(res, 'An account with this email already exists.', 409);
    if (req.file) data.photo = `uploads/photo/${req.file.filename}`;
    if (data.expertise && typeof data.expertise === 'string') {
      data.expertise = data.expertise.split(',').map((s) => s.trim());
    }
    const accessStatus = ['pending', 'approved'].includes(data.accessStatus) ? data.accessStatus : 'pending';
    const user = await User.create({ fullName: data.name, email: data.email, passwordHash: data.password, phone: data.phone, role: 'trainer', isActive: accessStatus === 'approved', accountStatus: accessStatus === 'approved' ? 'approved' : 'pending' });
    delete data.password;
    try {
      const trainer = await Trainer.create({ ...data, user: user._id, accessStatus, isActive: accessStatus === 'approved' });
      user.trainerProfile = trainer._id;
      await user.save({ validateBeforeSave: false });
      if (accessStatus === 'approved') await sendTrainerApprovedEmail({ to: trainer.email, trainerName: trainer.name });
      return successResponse(res, { trainer }, 'Trainer account created successfully.', 201);
    } catch (error) { await User.findByIdAndDelete(user._id); throw error; }
  } catch (err) { next(err); }
};

export const updateTrainer = async (req, res, next) => {
  try {
    const data = trainerPayload(req.body);
    const password = data.password;
    if (req.file) data.photo = `uploads/photo/${req.file.filename}`;
    if (data.expertise && typeof data.expertise === 'string') {
      data.expertise = data.expertise.split(',').map((s) => s.trim());
    }
    delete data.password;
    delete data.accessStatus;
    const existing = await Trainer.findById(req.params.id);
    if (!existing) return errorResponse(res, 'Trainer not found.', 404);
    if (!existing.user && password && password.length < 8) return errorResponse(res, 'Password must be at least 8 characters.', 400);
    if (data.email && data.email.toLowerCase() !== existing.email) {
      const duplicate = await User.exists({ email: data.email.toLowerCase(), _id: { $ne: existing.user } });
      if (duplicate) return errorResponse(res, 'An account with this email already exists.', 409);
    }
    const trainer = await Trainer.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (trainer.user) {
      await User.findByIdAndUpdate(trainer.user, { fullName: trainer.name, email: trainer.email, phone: trainer.phone, profilePhoto: trainer.photo }, { runValidators: true });
    } else if (password) {
      const approved = trainer.accessStatus === 'approved';
      const user = await User.create({ fullName: trainer.name, email: trainer.email, passwordHash: password, phone: trainer.phone, profilePhoto: trainer.photo, role: 'trainer', trainerProfile: trainer._id, isActive: approved, accountStatus: approved ? 'approved' : 'pending' });
      trainer.user = user._id;
      await trainer.save();
    }
    return successResponse(res, { trainer }, 'Trainer profile updated successfully.');
  } catch (err) { next(err); }
};

export const reviewTrainer = async (req, res, next) => {
  try {
    const { status } = req.body;
    const reason = String(req.body.reason || '').trim();
    if (!['approved', 'rejected', 'suspended', 'pending'].includes(status)) return errorResponse(res, 'Invalid trainer access status.', 400);
    if (status === 'rejected' && !reason) return errorResponse(res, 'A rejection note is required.', 400);
    const trainer = await Trainer.findById(req.params.id);
    if (!trainer) return errorResponse(res, 'Trainer not found.', 404);
    const previousStatus = trainer.accessStatus;
    trainer.accessStatus = status;
    trainer.reviewReason = reason;
    trainer.reviewedAt = new Date();
    trainer.reviewedBy = req.user._id;
    trainer.isActive = status === 'approved';
    await trainer.save();
    if (trainer.user) await User.findByIdAndUpdate(trainer.user, { isActive: status === 'approved', accountStatus: status === 'approved' ? 'approved' : status === 'pending' ? 'pending' : 'rejected' });
    let emailStatus = 'not_sent';
    if (status !== previousStatus && ['approved', 'rejected'].includes(status)) {
      const result = status === 'approved'
        ? await sendTrainerApprovedEmail({ to: trainer.email, trainerName: trainer.name })
        : await sendTrainerRejectedEmail({ to: trainer.email, trainerName: trainer.name, reason });
      emailStatus = result.success ? 'sent' : 'failed';
    }
    return successResponse(res, { trainer, emailStatus }, `Trainer access ${status}.`);
  } catch (error) { next(error); }
};

export const deleteTrainer = async (req, res, next) => {
  try {
    const summary = await deleteTrainerIds(idsFromRequest(req));
    if (!summary.trainers) return errorResponse(res, 'Trainer not found.', 404);
    return successResponse(res, { summary }, `Deleted ${summary.trainers} trainer profile(s) and unassigned ${summary.unassignedSessions} session(s).`);
  } catch (err) { next(err); }
};

export const deleteTrainers = async (req, res, next) => {
  try {
    const summary = await deleteTrainerIds(idsFromRequest(req));
    return successResponse(res, { summary }, `Deleted ${summary.trainers} trainer profile(s) and unassigned ${summary.unassignedSessions} session(s).`);
  } catch (err) { next(err); }
};
