import Recording from '../../models/Recording.js';
import { successResponse, errorResponse, getPagination, paginatedResponse } from '../../utils/apiResponse.js';
import { resolveTrainingScope } from '../../utils/trainingScope.js';
import Training from '../../models/Training.js';

// GET /api/admin/recordings
export const getRecordings = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};
    const trainingScope = await resolveTrainingScope(req.query);
    if (trainingScope) filter.training = trainingScope;
    if (req.query.isPublished !== undefined) filter.isPublished = req.query.isPublished === 'true';
    if (req.query.archived === 'true') filter.isArchived = true;
    else if (req.query.archived !== 'all') filter.isArchived = { $ne: true };

    const [recordings, total] = await Promise.all([
      Recording.find(filter)
        .populate({ path: 'training', select: 'title date coverImage event eventDay', populate: [{ path: 'event', select: 'name year' }, { path: 'eventDay', select: 'dayNumber theme date' }] })
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

    const recording = await Recording.create({ training: req.body.training, title: req.body.title, url: req.body.url, description: req.body.description || '', thumbnail: req.body.thumbnail || null, createdBy: req.user._id });
    return successResponse(res, { recording }, 'Recording added successfully.', 201);
  } catch (err) { next(err); }
};

export const updateRecording = async (req, res, next) => {
  try {
    const updates = Object.fromEntries(['training', 'title', 'url', 'description', 'thumbnail'].filter((field) => req.body[field] !== undefined).map((field) => [field, req.body[field]]));
    const recording = await Recording.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!recording) return errorResponse(res, 'Recording not found.', 404);
    return successResponse(res, { recording }, 'Recording updated successfully.');
  } catch (err) { next(err); }
};

// PATCH /api/admin/recordings/:id/publish
export const togglePublish = async (req, res, next) => {
  try {
    const recording = await Recording.findById(req.params.id);
    if (!recording) return errorResponse(res, 'Recording not found.', 404);
    if (recording.isArchived) return errorResponse(res, 'Restore this recording before changing its publication status.', 400);
    if (!recording.isPublished) {
      const training = await Training.findById(recording.training).select('status');
      if (!training || training.status !== 'completed') return errorResponse(res, 'A recording can only be published after its training session is completed.', 400);
    }
    recording.isPublished = !recording.isPublished;
    if (recording.isPublished && !recording.publishedAt) recording.publishedAt = new Date();
    await recording.save();
    return successResponse(res, { recording }, `Recording ${recording.isPublished ? 'published' : 'unpublished'}.`);
  } catch (err) { next(err); }
};

export const deleteRecording = async (req, res, next) => {
  try {
    const recording = await Recording.findById(req.params.id);
    if (!recording) return errorResponse(res, 'Recording not found.', 404);
    recording.isArchived = true;
    recording.archivedAt = new Date();
    recording.archivedBy = req.user._id;
    recording.isPublished = false;
    await recording.save();
    return successResponse(res, { recording }, 'Recording archived safely.');
  } catch (err) { next(err); }
};

export const restoreRecording = async (req, res, next) => {
  try {
    const recording = await Recording.findById(req.params.id);
    if (!recording) return errorResponse(res, 'Recording not found.', 404);
    recording.isArchived = false;
    recording.archivedAt = null;
    recording.archivedBy = null;
    await recording.save();
    return successResponse(res, { recording }, 'Recording restored as a hidden draft.');
  } catch (err) { next(err); }
};

// GET /api/public/recordings — published only
export const getPublicRecordings = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = { isPublished: true, isArchived: { $ne: true } };
    const trainingQuery = {};
    if (req.query.event) trainingQuery.event = req.query.event;
    if (req.query.eventDay) trainingQuery.eventDay = req.query.eventDay;
    if (req.query.category) trainingQuery.category = req.query.category;
    if (req.query.trainer) trainingQuery.$or = [{ trainers: req.query.trainer }, { trainer: req.query.trainer }];
    if (req.query.language) trainingQuery.language = req.query.language;
    if (Object.keys(trainingQuery).length) {
      const trainingIds = await Training.find(trainingQuery).distinct('_id');
      filter.training = { $in: trainingIds };
    }
    const [recordings, total] = await Promise.all([
      Recording.find(filter)
        .populate({ path: 'training', select: 'title date coverImage language event eventDay category trainer trainers', populate: [{ path: 'event', select: 'name year' }, { path: 'eventDay', select: 'dayNumber theme' }, { path: 'category', select: 'name' }, { path: 'trainer', select: 'name title' }, { path: 'trainers', select: 'name title' }] })
        .sort({ publishedAt: -1 }).skip(skip).limit(limit),
      Recording.countDocuments(filter),
    ]);
    return paginatedResponse(res, recordings, total, page, limit, 'Published recordings');
  } catch (err) { next(err); }
};

// GET /api/public/recordings/:id — one published recording
export const getPublicRecording = async (req, res, next) => {
  try {
    const recording = await Recording.findOne({
      _id: req.params.id,
      isPublished: true,
      isArchived: { $ne: true },
    }).populate({
      path: 'training',
      select: 'title date coverImage language event eventDay category trainer trainers',
      populate: [
        { path: 'event', select: 'name year' },
        { path: 'eventDay', select: 'dayNumber theme' },
        { path: 'category', select: 'name' },
        { path: 'trainer', select: 'name title' },
        { path: 'trainers', select: 'name title' },
      ],
    });
    if (!recording) return errorResponse(res, 'Recording not found.', 404);
    return successResponse(res, { recording });
  } catch (err) { next(err); }
};
