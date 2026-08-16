import Feedback from '../../models/Feedback.js';
import Attendance from '../../models/Attendance.js';
import Training from '../../models/Training.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

// POST /api/participant/trainings/:trainingId/feedback
export const submitFeedback = async (req, res, next) => {
  try {
    const { trainingId } = req.params;
    const participantId = req.user._id;

    // 1. Verify training exists
    const training = await Training.findById(trainingId);
    if (!training) return errorResponse(res, 'Training not found.', 404);

    // 2. Enforce: only attendees (present) can submit feedback
    const attendance = await Attendance.findOne({ participant: participantId, training: trainingId });
    if (!attendance || attendance.status !== 'present') {
      return errorResponse(res, 'You can only submit feedback if you attended this training.', 403);
    }

    // 3. Prevent duplicate feedback (backend enforced)
    const existing = await Feedback.findOne({ participant: participantId, training: trainingId });
    if (existing) return errorResponse(res, 'You have already submitted feedback for this training.', 409);

    const { contentRating, trainerRating, organizationRating, comments, suggestions } = req.body;
    const feedback = await Feedback.create({
      participant: participantId, training: trainingId,
      contentRating, trainerRating, organizationRating, comments, suggestions,
    });

    return successResponse(res, { feedback }, 'Feedback submitted successfully.', 201);
  } catch (err) { next(err); }
};

// GET /api/.../trainings/:trainingId/feedback — admin or assigned moderator
export const getTrainingFeedback = async (req, res, next) => {
  try {
    const { trainingId } = req.params;

    // Moderator access check
    if (req.user.role === 'moderator') {
      const training = await Training.findById(trainingId);
      if (!training || String(training.moderator) !== String(req.user._id)) {
        return errorResponse(res, 'Access denied.', 403);
      }
    }

    const feedback = await Feedback.find({ training: trainingId })
      .populate('participant', 'fullName email profilePhoto')
      .sort({ submittedAt: -1 })
      .limit(5000);

    const stats = feedback.length > 0 ? {
      count: feedback.length,
      avgContent: (feedback.reduce((s, f) => s + f.contentRating, 0) / feedback.length).toFixed(2),
      avgTrainer: (feedback.reduce((s, f) => s + f.trainerRating, 0) / feedback.length).toFixed(2),
      avgOrganization: (feedback.reduce((s, f) => s + f.organizationRating, 0) / feedback.length).toFixed(2),
    } : { count: 0, avgContent: 0, avgTrainer: 0, avgOrganization: 0 };

    return successResponse(res, { feedback, stats });
  } catch (err) { next(err); }
};

// GET /api/participant/feedback — participant views own feedback
export const getMyFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.find({ participant: req.user._id })
      .populate('training', 'title date event')
      .sort({ submittedAt: -1 });
    return successResponse(res, { feedback });
  } catch (err) { next(err); }
};
