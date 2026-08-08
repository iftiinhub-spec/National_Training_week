import Recording from '../../models/Recording.js';
import { successResponse, errorResponse, getPagination, paginatedResponse } from '../../utils/apiResponse.js';

// GET /api/admin/recordings
export const getRecordings = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};
    if (req.query.training) filter.training = req.query.training;
    if (req.query.isPublished !== undefined) filter.isPublished = req.query.isPublished === 'true';

    const [recordings, total] = await Promise.all([
      Recording.find(filter)
        .populate('training', 'title date coverImage event')
        .populate('createdBy', 'fullName')
        .sort({ createdAt: -1 }).skip(skip).limit(limit),
      Recording.countDocuments(filter),
    ]);
    return paginatedResponse(res, recordings, total, page, limit);
  } catch (err) { next(err); }
};

export const getRecording = async (req, res, next) => {
  try {
    const recording = await Recording.findById(req.params.id)
      .populate('training', 'title date coverImage event eventDay category')
      .populate('createdBy', 'fullName');
    if (!recording) return errorResponse(res, 'Recording not found.', 404);
    return successResponse(res, { recording });
  } catch (err) { next(err); }
};

export const createRecording = async (req, res, next) => {
  try {
    const existing = await Recording.findOne({ training: req.body.training });
    if (existing) return errorResponse(res, 'A recording already exists for this training. Use PUT to update.', 409);

    const recording = await Recording.create({ ...req.body, createdBy: req.user._id });
    return successResponse(res, { recording }, 'Recording added successfully.', 201);
  } catch (err) { next(err); }
};

export const updateRecording = async (req, res, next) => {
  try {
    const recording = await Recording.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!recording) return errorResponse(res, 'Recording not found.', 404);
    return successResponse(res, { recording }, 'Recording updated successfully.');
  } catch (err) { next(err); }
};

// PATCH /api/admin/recordings/:id/publish
export const togglePublish = async (req, res, next) => {
  try {
    const recording = await Recording.findById(req.params.id);
    if (!recording) return errorResponse(res, 'Recording not found.', 404);
    recording.isPublished = !recording.isPublished;
    if (recording.isPublished && !recording.publishedAt) recording.publishedAt = new Date();
    await recording.save();
    return successResponse(res, { recording }, `Recording ${recording.isPublished ? 'published' : 'unpublished'}.`);
  } catch (err) { next(err); }
};

export const deleteRecording = async (req, res, next) => {
  try {
    const recording = await Recording.findByIdAndDelete(req.params.id);
    if (!recording) return errorResponse(res, 'Recording not found.', 404);
    return successResponse(res, null, 'Recording deleted successfully.');
  } catch (err) { next(err); }
};

// GET /api/public/recordings — published only
export const getPublicRecordings = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = { isPublished: true };
    const [recordings, total] = await Promise.all([
      Recording.find(filter)
        .populate({ path: 'training', select: 'title date coverImage', populate: { path: 'event', select: 'name year' } })
        .sort({ publishedAt: -1 }).skip(skip).limit(limit),
      Recording.countDocuments(filter),
    ]);
    return paginatedResponse(res, recordings, total, page, limit, 'Published recordings');
  } catch (err) { next(err); }
};
