import User from '../../models/User.js';
import { successResponse, errorResponse, getPagination, paginatedResponse } from '../../utils/apiResponse.js';
import { escapeRegex } from '../../utils/search.js';

// --- Participant Management ---
export const getParticipants = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = { role: 'participant' };
    if (req.query.search) {
      filter.$or = [
        { fullName: { $regex: escapeRegex(req.query.search), $options: 'i' } },
        { email: { $regex: escapeRegex(req.query.search), $options: 'i' } },
      ];
    }
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    if (req.query.region) filter.region = req.query.region;
    if (req.query.participantType) filter.participantType = req.query.participantType;

    const [participants, total] = await Promise.all([
      User.find(filter).select('-passwordHash').sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);
    return paginatedResponse(res, participants, total, page, limit);
  } catch (err) { next(err); }
};

export const getParticipant = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: 'participant' }).select('-passwordHash');
    if (!user) return errorResponse(res, 'Participant not found.', 404);
    return successResponse(res, { participant: user });
  } catch (err) { next(err); }
};

export const toggleParticipantStatus = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: 'participant' });
    if (!user) return errorResponse(res, 'Participant not found.', 404);
    user.isActive = !user.isActive;
    await user.save();
    return successResponse(res, { participant: user }, `Participant ${user.isActive ? 'activated' : 'deactivated'}.`);
  } catch (err) { next(err); }
};

// --- Moderator Management ---
export const getModerators = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = { role: 'moderator' };
    if (req.query.search) {
      filter.$or = [
        { fullName: { $regex: escapeRegex(req.query.search), $options: 'i' } },
        { email: { $regex: escapeRegex(req.query.search), $options: 'i' } },
      ];
    }
    const [moderators, total] = await Promise.all([
      User.find(filter).select('-passwordHash').sort({ fullName: 1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);
    return paginatedResponse(res, moderators, total, page, limit);
  } catch (err) { next(err); }
};

export const getModerator = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: 'moderator' }).select('-passwordHash');
    if (!user) return errorResponse(res, 'Moderator not found.', 404);
    return successResponse(res, { moderator: user });
  } catch (err) { next(err); }
};

export const createModerator = async (req, res, next) => {
  try {
    const { fullName, email, password, phone } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return errorResponse(res, 'An account with this email already exists.', 409);
    const moderator = await User.create({ fullName, email, passwordHash: password, phone, role: 'moderator' });
    return successResponse(res, { moderator }, 'Moderator account created successfully.', 201);
  } catch (err) { next(err); }
};

export const updateModerator = async (req, res, next) => {
  try {
    const allowed = ['fullName', 'phone', 'isActive'];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const moderator = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'moderator' },
      updates,
      { new: true, runValidators: true }
    ).select('-passwordHash');
    if (!moderator) return errorResponse(res, 'Moderator not found.', 404);
    return successResponse(res, { moderator }, 'Moderator updated successfully.');
  } catch (err) { next(err); }
};

export const toggleModeratorStatus = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: 'moderator' });
    if (!user) return errorResponse(res, 'Moderator not found.', 404);
    user.isActive = !user.isActive;
    await user.save();
    return successResponse(res, { moderator: user }, `Moderator ${user.isActive ? 'activated' : 'deactivated'}.`);
  } catch (err) { next(err); }
};

export const resetModeratorPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    const user = await User.findOne({ _id: req.params.id, role: 'moderator' });
    if (!user) return errorResponse(res, 'Moderator not found.', 404);
    user.passwordHash = newPassword;
    user.tokenVersion += 1;
    await user.save();
    return successResponse(res, null, 'Moderator password reset successfully.');
  } catch (err) { next(err); }
};
