import express from 'express';
import { protect } from '../middleware/auth.js';
import { moderatorOnly } from '../middleware/role.js';
import Training from '../models/Training.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

import { getMeeting, createMeeting, updateMeeting, deleteMeeting, releaseMeeting, sendTrainerInvitation, sendParticipantInvitations, getCommunications } from '../controllers/admin/meeting.controller.js';
import { openQRSession, closeQRSession, getAttendance, updateAttendance, createManualAttendance } from '../controllers/admin/attendance.controller.js';
import { getTrainingFeedback } from '../controllers/admin/feedback.controller.js';
import { completeTraining } from '../controllers/admin/training.controller.js';

const router = express.Router();
router.use(protect, moderatorOnly);

// Moderator Dashboard - assigned trainings
router.get('/dashboard', async (req, res, next) => {
  try {
    const trainings = await Training.find({ moderator: req.user._id })
      .populate('event', 'name year')
      .populate('eventDay', 'dayNumber theme date')
      .populate('trainer', 'name title photo')
      .populate('category', 'name')
      .sort({ date: 1 });

    const upcoming = trainings.filter(t => new Date(t.date) >= new Date());
    const stats = {
      totalAssigned: trainings.length,
      upcoming: upcoming.length,
      completed: trainings.filter(t => t.status === 'completed').length,
    };

    return successResponse(res, { trainings, stats });
  } catch (err) { next(err); }
});

// My Trainings
router.get('/trainings', async (req, res, next) => {
  try {
    const trainings = await Training.find({ moderator: req.user._id })
      .populate('event', 'name year')
      .populate('eventDay', 'dayNumber theme')
      .populate('trainer', 'name title photo organization')
      .populate('category', 'name')
      .sort({ date: 1 });
    return successResponse(res, { trainings });
  } catch (err) { next(err); }
});

router.get('/trainings/:id', async (req, res, next) => {
  try {
    const training = await Training.findOne({ _id: req.params.id, moderator: req.user._id })
      .populate('event', 'name year theme')
      .populate('eventDay', 'dayNumber theme date')
      .populate('trainer', 'name title organization biography photo expertise email phone')
      .populate('category', 'name');
    if (!training) return errorResponse(res, 'Training not found or not assigned to you.', 404);
    return successResponse(res, { training });
  } catch (err) { next(err); }
});

// Participant list for assigned training
router.get('/trainings/:trainingId/participants', async (req, res, next) => {
  try {
    const training = await Training.findOne({ _id: req.params.trainingId, moderator: req.user._id });
    if (!training) return errorResponse(res, 'Access denied.', 403);
    const Registration = (await import('../models/Registration.js')).default;
    const registrations = await Registration.find({ training: req.params.trainingId })
      .populate('participant', 'fullName email phone profilePhoto participantType region organization')
      .sort({ registeredAt: -1 });
    return successResponse(res, { registrations });
  } catch (err) { next(err); }
});

// Meeting management (reuse admin controllers which check moderator access)
router.route('/trainings/:trainingId/meeting').get(getMeeting).post(createMeeting).put(updateMeeting).delete(deleteMeeting);
router.patch('/trainings/:trainingId/meeting/release', releaseMeeting);

// Communications
router.post('/trainings/:trainingId/invitations/trainer', sendTrainerInvitation);
router.post('/trainings/:trainingId/invitations/participants', sendParticipantInvitations);
router.get('/trainings/:trainingId/communications', getCommunications);

// Attendance
router.post('/trainings/:trainingId/qr-session/open', openQRSession);
router.post('/trainings/:trainingId/qr-session/close', closeQRSession);
router.get('/trainings/:trainingId/attendance', getAttendance);
router.patch('/trainings/:trainingId/attendance/:attendanceId', updateAttendance);
router.post('/trainings/:trainingId/attendance/manual', createManualAttendance);
router.post('/trainings/:id/complete', completeTraining);

// Feedback
router.get('/trainings/:trainingId/feedback', getTrainingFeedback);

export default router;
