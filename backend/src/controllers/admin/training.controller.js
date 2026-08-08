import Training from '../../models/Training.js';
import Registration from '../../models/Registration.js';
import { successResponse, errorResponse, getPagination, paginatedResponse } from '../../utils/apiResponse.js';

const VALID_TRANSITIONS = {
  draft: ['published', 'cancelled'],
  published: ['registration_open', 'cancelled', 'draft'],
  registration_open: ['registration_closed', 'cancelled'],
  registration_closed: ['ongoing', 'cancelled'],
  ongoing: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

// GET /api/admin/trainings
export const getTrainings = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};
    if (req.query.event) filter.event = req.query.event;
    if (req.query.eventDay) filter.eventDay = req.query.eventDay;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.search) filter.title = { $regex: req.query.search, $options: 'i' };

    const [trainings, total] = await Promise.all([
      Training.find(filter)
        .populate('event', 'name year')
        .populate('eventDay', 'dayNumber theme date')
        .populate('category', 'name')
        .populate('trainer', 'name title organization photo')
        .populate('moderator', 'fullName email')
        .sort({ date: 1 })
        .skip(skip).limit(limit),
      Training.countDocuments(filter),
    ]);
    return paginatedResponse(res, trainings, total, page, limit);
  } catch (err) { next(err); }
};

// GET /api/admin/trainings/:id
export const getTraining = async (req, res, next) => {
  try {
    const training = await Training.findById(req.params.id)
      .populate('event', 'name year theme')
      .populate('eventDay', 'dayNumber theme date')
      .populate('category', 'name')
      .populate('trainer', 'name title organization photo biography expertise')
      .populate('moderator', 'fullName email phone');
    if (!training) return errorResponse(res, 'Training not found.', 404);
    return successResponse(res, { training });
  } catch (err) { next(err); }
};

// POST /api/admin/trainings
export const createTraining = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.file) data.coverImage = `uploads/coverImage/${req.file.filename}`;
    const training = await Training.create(data);
    return successResponse(res, { training }, 'Training created successfully.', 201);
  } catch (err) { next(err); }
};

// PUT /api/admin/trainings/:id
export const updateTraining = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.file) data.coverImage = `uploads/coverImage/${req.file.filename}`;
    // Remove status from update — use dedicated status endpoint
    delete data.status;
    const training = await Training.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!training) return errorResponse(res, 'Training not found.', 404);
    return successResponse(res, { training }, 'Training updated successfully.');
  } catch (err) { next(err); }
};

// PATCH /api/admin/trainings/:id/status
export const updateTrainingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const training = await Training.findById(req.params.id);
    if (!training) return errorResponse(res, 'Training not found.', 404);

    const allowed = VALID_TRANSITIONS[training.status] || [];
    if (!allowed.includes(status)) {
      return errorResponse(res, `Cannot transition from '${training.status}' to '${status}'.`, 400);
    }

    training.status = status;
    await training.save();
    return successResponse(res, { training }, `Training status updated to '${status}'.`);
  } catch (err) { next(err); }
};

// PATCH /api/admin/trainings/:id/assign
export const assignTrainingStaff = async (req, res, next) => {
  try {
    const { trainerId, moderatorId } = req.body;
    const update = {};
    if (trainerId !== undefined) update.trainer = trainerId || null;
    if (moderatorId !== undefined) update.moderator = moderatorId || null;

    const training = await Training.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('trainer', 'name title organization')
      .populate('moderator', 'fullName email');
    if (!training) return errorResponse(res, 'Training not found.', 404);
    return successResponse(res, { training }, 'Assignments updated successfully.');
  } catch (err) { next(err); }
};

// DELETE /api/admin/trainings/:id
export const deleteTraining = async (req, res, next) => {
  try {
    const training = await Training.findById(req.params.id);
    if (!training) return errorResponse(res, 'Training not found.', 404);
    if (['ongoing', 'completed'].includes(training.status)) {
      return errorResponse(res, 'Cannot delete an ongoing or completed training.', 400);
    }
    await Training.findByIdAndDelete(req.params.id);
    return successResponse(res, null, 'Training deleted successfully.');
  } catch (err) { next(err); }
};
