import express from 'express';
import { body, param } from 'express-validator';
import { protect } from '../middleware/auth.js';
import { adminOnly } from '../middleware/role.js';
import { uploadImage } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';

// Controllers
import { getEvents, getEvent, createEvent, updateEvent, deleteEvent, getEventDays, createEventDay, updateEventDay, deleteEventDay } from '../controllers/admin/event.controller.js';
import { getCategories, getCategory, createCategory, updateCategory, deleteCategory } from '../controllers/admin/category.controller.js';
import { getTrainers, getTrainer, createTrainer, updateTrainer, deleteTrainer } from '../controllers/admin/trainer.controller.js';
import { getTrainings, getTraining, createTraining, updateTraining, updateTrainingStatus, assignTrainingStaff, deleteTraining } from '../controllers/admin/training.controller.js';
import { getParticipants, getParticipant, toggleParticipantStatus, updateParticipantAccountStatus, getModerators, getModerator, createModerator, updateModerator, toggleModeratorStatus, resetModeratorPassword } from '../controllers/admin/user.controller.js';
import { getRegistrations, getRegistration, updateRegistrationStatus } from '../controllers/admin/registration.controller.js';
import { getMeeting, createMeeting, updateMeeting, deleteMeeting, releaseMeeting, sendTrainerInvitation, sendParticipantInvitations, getCommunications } from '../controllers/admin/meeting.controller.js';
import { openQRSession, closeQRSession, getAttendance, updateAttendance, createManualAttendance } from '../controllers/admin/attendance.controller.js';
import { getTrainingFeedback } from '../controllers/admin/feedback.controller.js';
import { generateCertificate, bulkGenerateCertificates, getCertificates, revokeCertificate } from '../controllers/admin/certificate.controller.js';
import { getRecordings, getRecording, createRecording, updateRecording, togglePublish, deleteRecording } from '../controllers/admin/recording.controller.js';
import { getOverview, registrationReport, attendanceReport, participantsByRegion, participantsByType, certificateReport, feedbackReport, dailyAttendanceSummary } from '../controllers/admin/report.controller.js';
import { getContactMessages, markAsRead, deleteContactMessage } from '../controllers/admin/contact.controller.js';
import { getSettings, updateSettings, sendTestEmail } from '../controllers/admin/settings.controller.js';

const router = express.Router();
router.use(protect, adminOnly);

// Events & Days
router.route('/events').get(getEvents).post(createEvent);
router.route('/events/:id').get(getEvent).put(updateEvent).delete(deleteEvent);
router.route('/events/:eventId/days').get(getEventDays).post(createEventDay);
router.route('/events/:eventId/days/:dayId').put(updateEventDay).delete(deleteEventDay);

// Categories
router.route('/categories').get(getCategories).post(createCategory);
router.route('/categories/:id').get(getCategory).put(updateCategory).delete(deleteCategory);

// Trainers
router.route('/trainers').get(getTrainers).post(uploadImage.single('photo'), createTrainer);
router.route('/trainers/:id').get(getTrainer).put(uploadImage.single('photo'), updateTrainer).delete(deleteTrainer);

// Trainings
router.route('/trainings').get(getTrainings).post(uploadImage.single('coverImage'), createTraining);
router.route('/trainings/:id').get(getTraining).put(uploadImage.single('coverImage'), updateTraining).delete(deleteTraining);
router.patch('/trainings/:id/status', updateTrainingStatus);
router.patch('/trainings/:id/assign', assignTrainingStaff);

// Meeting & Communications (also accessible by moderator — handled in controller)
router.route('/trainings/:trainingId/meeting').get(getMeeting).post(createMeeting).put(updateMeeting).delete(deleteMeeting);
router.patch('/trainings/:trainingId/meeting/release', releaseMeeting);
router.post('/trainings/:trainingId/invitations/trainer', sendTrainerInvitation);
router.post('/trainings/:trainingId/invitations/participants', sendParticipantInvitations);
router.get('/trainings/:trainingId/communications', getCommunications);

// Attendance
router.post('/trainings/:trainingId/qr-session/open', openQRSession);
router.post('/trainings/:trainingId/qr-session/close', closeQRSession);
router.get('/trainings/:trainingId/attendance', getAttendance);
router.patch('/trainings/:trainingId/attendance/:attendanceId', updateAttendance);
router.post('/trainings/:trainingId/attendance/manual', createManualAttendance);

// Feedback
router.get('/trainings/:trainingId/feedback', getTrainingFeedback);

// Registrations
router.route('/registrations').get(getRegistrations);
router.route('/registrations/:id').get(getRegistration);
router.patch('/registrations/:id/status', updateRegistrationStatus);

// Certificates
router.post('/certificates/generate',
  body('participantId').isMongoId().withMessage('Valid participant ID is required.'),
  body('trainingId').isMongoId().withMessage('Valid training ID is required.'), validate, generateCertificate);
router.post('/certificates/bulk-generate',
  body('trainingId').isMongoId().withMessage('Valid training ID is required.'), validate, bulkGenerateCertificates);
router.get('/certificates', getCertificates);
router.patch('/certificates/:id/revoke',
  param('id').isMongoId().withMessage('Valid certificate ID is required.'),
  body('reason').trim().isLength({ min: 5, max: 300 }).withMessage('Revocation reason must be between 5 and 300 characters.'), validate, revokeCertificate);

// Recordings
router.route('/recordings').get(getRecordings).post(createRecording);
router.route('/recordings/:id').get(getRecording).put(updateRecording).delete(deleteRecording);
router.patch('/recordings/:id/publish', togglePublish);

// Reports
router.get('/reports/overview', getOverview);
router.get('/reports/registrations', registrationReport);
router.get('/reports/attendance', attendanceReport);
router.get('/reports/participants-by-region', participantsByRegion);
router.get('/reports/participants-by-type', participantsByType);
router.get('/reports/certificates', certificateReport);
router.get('/reports/feedback', feedbackReport);
router.get('/reports/daily-attendance', dailyAttendanceSummary);

// Users
router.route('/participants').get(getParticipants);
router.route('/participants/:id').get(getParticipant);
router.patch('/participants/:id/toggle-status', toggleParticipantStatus);
router.patch('/participants/:id/account-status',
  body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected.'),
  validate,
  updateParticipantAccountStatus,
);

router.route('/moderators').get(getModerators).post(createModerator);
router.route('/moderators/:id').get(getModerator).put(updateModerator);
router.patch('/moderators/:id/toggle-status', toggleModeratorStatus);
router.patch('/moderators/:id/reset-password', resetModeratorPassword);

// Contact messages
router.route('/contact-messages').get(getContactMessages);
router.patch('/contact-messages/:id/read', markAsRead);
router.delete('/contact-messages/:id', deleteContactMessage);

// Public identity and email presentation settings (SMTP credentials remain environment-only)
router.route('/settings').get(getSettings).put([
  body('organizerName').trim().isLength({ min: 2, max: 100 }).withMessage('Organizer name must be between 2 and 100 characters.'),
  body('contactEmail').isEmail().withMessage('A valid public contact email is required.').normalizeEmail(),
  body('replyToEmail').isEmail().withMessage('A valid reply-to email is required.').normalizeEmail(),
  body('location').trim().isLength({ min: 2, max: 120 }).withMessage('Location must be between 2 and 120 characters.'),
  body('facebookUrl').optional({ checkFalsy: true }).isURL({ protocols: ['https'], require_protocol: true }).withMessage('Facebook URL must start with https://.'),
  body('emailSenderName').trim().isLength({ min: 2, max: 100 }).withMessage('Email sender name must be between 2 and 100 characters.'),
  body('smtpUser').optional({ checkFalsy: true }).isEmail().withMessage('A valid Gmail sender address is required.').normalizeEmail(),
  body('smtpPassword').optional({ checkFalsy: true }).isLength({ min: 16, max: 32 }).withMessage('The Google App Password must be between 16 and 32 characters.'),
], validate, updateSettings);
router.post('/settings/test-email', body('email').isEmail().withMessage('A valid test recipient email is required.').normalizeEmail(), validate, sendTestEmail);

export default router;
