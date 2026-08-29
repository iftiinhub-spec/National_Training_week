import Registration from '../../models/Registration.js';
import TrainingMaterial from '../../models/TrainingMaterial.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';
import { resolveMaterialPath } from '../../utils/materialFile.js';

// GET /api/participant/materials — every document from the sessions this participant joined
export const getMyMaterials = async (req, res, next) => {
  try {
    const trainingIds = await Registration.find({ participant: req.user._id, status: 'approved' })
      .distinct('training');
    if (!trainingIds.length) return successResponse(res, { materials: [] });

    const materials = await TrainingMaterial.find({ training: { $in: trainingIds } })
      .populate({
        path: 'training',
        select: 'title slug date startTime status eventDay',
        populate: { path: 'eventDay', select: 'dayNumber theme' },
      })
      .populate('trainer', 'name title')
      .sort({ createdAt: -1 })
      .limit(2000);

    return successResponse(res, { materials });
  } catch (err) { next(err); }
};

// GET /api/participant/materials/:id/download
export const downloadMaterial = async (req, res, next) => {
  try {
    const material = await TrainingMaterial.findById(req.params.id);
    if (!material || !material.file?.path) return errorResponse(res, 'Material file not found.', 404);

    // The file is not publicly served, so this registration check is the only way to reach it.
    const registration = await Registration.findOne({
      participant: req.user._id, training: material.training, status: 'approved',
    });
    if (!registration) return errorResponse(res, 'You do not have access to this material.', 403);

    const absolutePath = resolveMaterialPath(material);
    if (!absolutePath) return errorResponse(res, 'This material file is no longer available.', 404);

    return res.download(absolutePath, material.file.originalName || 'material');
  } catch (err) { next(err); }
};
