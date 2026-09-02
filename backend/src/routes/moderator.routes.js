import express from 'express';
import { protect } from '../middleware/auth.js';
import { moderatorOnly } from '../middleware/role.js';
import Training from '../models/Training.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

import { getMeeting, createMeeting, updateMeeting, deleteMeeting, releaseMeeting, sendTrainerInvitation, sendParticipantInvitations, getCommunications } from '../controllers/admin/meeting.controller.js';
import { openQRSession, closeQRSession, currentQRCode, getAttendance, updateAttendance, createManualAttendance } from '../controllers/admin/attendance.controller.js';
import { getTrainingFeedback } from '../controllers/admin/feedback.controller.js';
import { completeTraining } from '../controllers/admin/training.controller.js';
import { validate } from '../middleware/validate.js';
import { attendanceValidation, idParam, invitationValidation, manualAttendanceValidation, meetingValidation, validateObjectIdParam } from '../middleware/validationRules.js';

const router = express.Router();
['id', 'trainingId', 'attendanceId'].forEach((name) => router.param(name, validateObjectIdParam));
router.use(protect, moderatorOnly);

// Moderator Dashboard - assigned trainings
router.get('/dashboard', async (req, res, next) => {
  try {
    const trainings = await Training.find({ moderator: req.user._id })
      .populate('event', 'name year')
      .populate('eventDay', 'dayNumber theme date')
      .populate('trainer', 'name title photo')
      .populate('trainers', 'name title photo')
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
      .populate('trainers', 'name title photo organization')
      .populate('category', 'name')
      .sort({ date: 1 });
    return successResponse(res, { trainings });
  } catch (err) { next(err); }
});

router.get('/trainings/:id', idParam(), validate, async (req, res, next) => {
  try {
    const training = await Training.findOne({ _id: req.params.id, moderator: req.user._id })
      .populate('event', 'name year theme')
      .populate('eventDay', 'dayNumber theme date')
      .populate('trainer', 'name title organization biography photo expertise email phone')
      .populate('trainers', 'name title organization biography photo expertise email phone')
      .populate('category', 'name');
    if (!training) return errorResponse(res, 'Training not found or not assigned to you.', 404);
    return successResponse(res, { training });
  } catch (err) { next(err); }
});

// Participant list for assigned training
router.get('/trainings/:trainingId/participants', idParam('trainingId', 'training ID'), validate, async (req, res, next) => {
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
router.route('/trainings/:trainingId/meeting')
  .get(idParam('trainingId', 'training ID'), validate, getMeeting)
  .post(idParam('trainingId', 'training ID'), meetingValidation, validate, createMeeting)
  .put(idParam('trainingId', 'training ID'), meetingValidation, validate, updateMeeting)
  .delete(idParam('trainingId', 'training ID'), validate, deleteMeeting);
router.patch('/trainings/:trainingId/meeting/release', idParam('trainingId', 'training ID'), validate, releaseMeeting);

// Communications
router.post('/trainings/:trainingId/invitations/trainer', idParam('trainingId', 'training ID'), validate, sendTrainerInvitation);
router.post('/trainings/:trainingId/invitations/participants', idParam('trainingId', 'training ID'), invitationValidation, validate, sendParticipantInvitations);
router.get('/trainings/:trainingId/communications', idParam('trainingId', 'training ID'), validate, getCommunications);

// Attendance
router.post('/trainings/:trainingId/qr-session/open', idParam('trainingId', 'training ID'), validate, openQRSession);
router.post('/trainings/:trainingId/qr-session/close', idParam('trainingId', 'training ID'), validate, closeQRSession);
router.get('/trainings/:trainingId/qr-session/current', idParam('trainingId', 'training ID'), validate, currentQRCode);
router.get('/trainings/:trainingId/attendance', idParam('trainingId', 'training ID'), validate, getAttendance);
router.patch('/trainings/:trainingId/attendance/:attendanceId', idParam('trainingId', 'training ID'), idParam('attendanceId', 'attendance ID'), attendanceValidation, validate, updateAttendance);
router.post('/trainings/:trainingId/attendance/manual', idParam('trainingId', 'training ID'), manualAttendanceValidation, validate, createManualAttendance);
router.post('/trainings/:id/complete', idParam(), validate, completeTraining);

// Feedback
router.get('/trainings/:trainingId/feedback', idParam('trainingId', 'training ID'), validate, getTrainingFeedback);

export default router;
