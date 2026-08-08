import Trainer from '../../models/Trainer.js';
import { successResponse, errorResponse, getPagination, paginatedResponse } from '../../utils/apiResponse.js';

export const getTrainers = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};
    if (req.query.active === 'true') filter.isActive = true;
    if (req.query.search) filter.name = { $regex: req.query.search, $options: 'i' };
    const [trainers, total] = await Promise.all([
      Trainer.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
      Trainer.countDocuments(filter),
    ]);
    return paginatedResponse(res, trainers, total, page, limit);
  } catch (err) { next(err); }
};

export const getPublicTrainers = async (req, res, next) => {
  try {
    const trainers = await Trainer.find({ isActive: true }).sort({ name: 1 });
    return successResponse(res, { trainers });
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
    const data = { ...req.body };
    if (req.file) data.photo = `uploads/photo/${req.file.filename}`;
    if (data.expertise && typeof data.expertise === 'string') {
      data.expertise = data.expertise.split(',').map((s) => s.trim());
    }
    const trainer = await Trainer.create(data);
    return successResponse(res, { trainer }, 'Trainer profile created successfully.', 201);
  } catch (err) { next(err); }
};

export const updateTrainer = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.file) data.photo = `uploads/photo/${req.file.filename}`;
    if (data.expertise && typeof data.expertise === 'string') {
      data.expertise = data.expertise.split(',').map((s) => s.trim());
    }
    const trainer = await Trainer.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!trainer) return errorResponse(res, 'Trainer not found.', 404);
    return successResponse(res, { trainer }, 'Trainer profile updated successfully.');
  } catch (err) { next(err); }
};

export const deleteTrainer = async (req, res, next) => {
  try {
    const trainer = await Trainer.findByIdAndDelete(req.params.id);
    if (!trainer) return errorResponse(res, 'Trainer not found.', 404);
    return successResponse(res, null, 'Trainer profile deleted successfully.');
  } catch (err) { next(err); }
};
