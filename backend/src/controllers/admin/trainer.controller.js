import Trainer from '../../models/Trainer.js';
import Training from '../../models/Training.js';
import { successResponse, errorResponse, getPagination, paginatedResponse } from '../../utils/apiResponse.js';
import { escapeRegex } from '../../utils/search.js';
import User from '../../models/User.js';
import Event from '../../models/Event.js';
import { pick } from '../../utils/pick.js';

const trainerPayload = (input) => pick(input, ['name', 'email', 'phone', 'password', 'title', 'organization', 'biography', 'expertise', 'isActive', 'accessStatus']);

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
      status: { $in: ['published', 'registration_open', 'registration_closed', 'ongoing', 'completed'] },
      trainer: { $ne: null },
    };
    if (req.query.event) sessionFilter.event = req.query.event;
    else {
      const currentEvent = await Event.findOne({ status: { $ne: 'draft' }, isActive: { $ne: false }, isCurrent: true })
        || await Event.findOne({ status: { $ne: 'draft' }, isActive: { $ne: false }, endDate: { $gte: new Date() } }).sort({ startDate: 1 })
        || await Event.findOne({ status: { $ne: 'draft' }, isActive: { $ne: false } }).sort({ year: -1 });
      if (currentEvent) sessionFilter.event = currentEvent._id;
    }
    if (req.query.eventDay) sessionFilter.eventDay = req.query.eventDay;
    const sessions = await Training.find(sessionFilter)
      .select('title date startTime endTime trainer event eventDay category status')
      .populate('event', 'name year')
      .populate('eventDay', 'dayNumber theme date')
      .populate('category', 'name')
      .sort({ date: 1, startTime: 1 });
    const trainerIds = [...new Set(sessions.map((session) => String(session.trainer)))];
    const trainers = await Trainer.find({ _id: { $in: trainerIds } }).sort({ name: 1 }).lean();
    const enriched = trainers.map((trainer) => ({
      ...trainer,
      sessions: sessions.filter((session) => String(session.trainer) === String(trainer._id)),
    }));
    return successResponse(res, { trainers: enriched });
  } catch (err) { next(err); }
};

export const getPublicTrainer = async (req, res, next) => {
  try {
    const trainer = await Trainer.findById(req.params.id).lean();
    if (!trainer) return errorResponse(res, 'Trainer not found.', 404);
    const sessionFilter = {
      trainer: trainer._id,
      status: { $in: ['published', 'registration_open', 'registration_closed', 'ongoing', 'completed'] },
    };
    if (req.query.event) sessionFilter.event = req.query.event;
    const sessions = await Training.find(sessionFilter)
      .select('title description coverImage date startTime endTime audience level language status event eventDay category')
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
    const { status, reason = '' } = req.body;
    if (!['approved', 'rejected', 'suspended', 'pending'].includes(status)) return errorResponse(res, 'Invalid trainer access status.', 400);
    const trainer = await Trainer.findById(req.params.id);
    if (!trainer) return errorResponse(res, 'Trainer not found.', 404);
    trainer.accessStatus = status;
    trainer.reviewReason = reason;
    trainer.reviewedAt = new Date();
    trainer.reviewedBy = req.user._id;
    trainer.isActive = status === 'approved';
    await trainer.save();
    if (trainer.user) await User.findByIdAndUpdate(trainer.user, { isActive: status === 'approved', accountStatus: status === 'approved' ? 'approved' : status === 'pending' ? 'pending' : 'rejected' });
    return successResponse(res, { trainer }, `Trainer access ${status}.`);
  } catch (error) { next(error); }
};

export const deleteTrainer = async (req, res, next) => {
  try {
    const trainer = await Trainer.findById(req.params.id);
    if (!trainer) return errorResponse(res, 'Trainer not found.', 404);
    if (await Training.exists({ trainer: trainer._id })) {
      return errorResponse(res, 'This trainer is assigned to a training. Reassign those trainings before deleting the account.', 409);
    }
    await Trainer.findByIdAndDelete(trainer._id);
    if (trainer.user) await User.findByIdAndDelete(trainer.user);
    return successResponse(res, null, 'Trainer account deleted successfully.');
  } catch (err) { next(err); }
};
