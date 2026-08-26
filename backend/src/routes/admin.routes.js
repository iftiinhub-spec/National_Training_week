import express from 'express';
import { body, param, query } from 'express-validator';
import { protect } from '../middleware/auth.js';
import { adminOnly } from '../middleware/role.js';
import { uploadImage, verifyUploadedImage } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { assignmentValidation, attendanceValidation, categoryValidation, eventDayValidation, eventValidation, idParam, invitationValidation, manualAttendanceValidation, meetingValidation, moderatorCreateValidation, moderatorUpdateValidation, optionalObjectIdQueries, paginationValidation, recordingValidation, registrationStatusValidation, trainerValidation, trainingValidation, validateObjectIdParam } from '../middleware/validationRules.js';

// Controllers
import { getEvents, getEvent, createEvent, updateEvent, deleteEvent, getEventDays, createEventDay, updateEventDay, deleteEventDay } from '../controllers/admin/event.controller.js';
import { getCategories, getCategory, createCategory, updateCategory, deleteCategory } from '../controllers/admin/category.controller.js';
import { getTrainers, getTrainer, createTrainer, updateTrainer, deleteTrainer, deleteTrainers, reviewTrainer } from '../controllers/admin/trainer.controller.js';
import { getTrainings, getTraining, createTraining, updateTraining, updateTrainingStatus, completeTraining, assignTrainingStaff, deleteTraining } from '../controllers/admin/training.controller.js';
import { getParticipants, getParticipant, toggleParticipantStatus, deleteParticipant, deleteParticipants, getModerators, getModerator, createModerator, updateModerator, toggleModeratorStatus, resetModeratorPassword, deleteModerator, deleteModerators } from '../controllers/admin/user.controller.js';
import { getRegistrations, getRegistration, updateRegistrationStatus, approveFilteredRegistrations, emailFilteredRegistrations, deleteRegistration, deleteRegistrations } from '../controllers/admin/registration.controller.js';
import { getMeeting, createMeeting, updateMeeting, deleteMeeting, releaseMeeting, sendTrainerInvitation, sendParticipantInvitations, getCommunications } from '../controllers/admin/meeting.controller.js';
import { openQRSession, closeQRSession, getAttendance, updateAttendance, createManualAttendance } from '../controllers/admin/attendance.controller.js';
import { getTrainingFeedback } from '../controllers/admin/feedback.controller.js';
import { generateCertificate, bulkGenerateCertificates, getCertificateJob, getCertificates, revokeCertificate } from '../controllers/admin/certificate.controller.js';
import { getRecordings, getRecording, createRecording, updateRecording, togglePublish, deleteRecording, restoreRecording } from '../controllers/admin/recording.controller.js';
import { getOverview, registrationReport, attendanceReport, participantsByRegion, participantsByType, participantsByGender, certificateReport, feedbackReport, dailyAttendanceSummary } from '../controllers/admin/report.controller.js';
import { getContactMessages, markAsRead, deleteContactMessage } from '../controllers/admin/contact.controller.js';
import { getSettings, updateSettings, sendTestEmail, uploadCertificateSignature, removeCertificateSignature } from '../controllers/admin/settings.controller.js';
import { createFAQ, deleteFAQ, getFAQs, toggleFAQPublish, updateFAQ } from '../controllers/admin/faq.controller.js';
import { createSponsor, deleteSponsor, getSponsors, toggleSponsorStatus, updateSponsor } from '../controllers/admin/sponsor.controller.js';
import { HUMAN_NAME_MESSAGE, isValidHumanName, normalizeHumanName } from '../utils/humanName.js';

const router = express.Router();
['id', 'eventId', 'dayId', 'trainingId', 'attendanceId'].forEach((name) => router.param(name, validateObjectIdParam));
router.use(protect, adminOnly);

// Events & Days
router.route('/events').get(paginationValidation, validate, getEvents).post(eventValidation, validate, createEvent);
router.route('/events/:id').get(idParam(), validate, getEvent).put(idParam(), eventValidation, validate, updateEvent).delete(idParam(), validate, deleteEvent);
router.route('/events/:eventId/days').get(idParam('eventId', 'event ID'), validate, getEventDays).post(idParam('eventId', 'event ID'), eventDayValidation, validate, createEventDay);
router.route('/events/:eventId/days/:dayId').put(idParam('eventId', 'event ID'), idParam('dayId', 'event-day ID'), eventDayValidation, validate, updateEventDay).delete(idParam('eventId', 'event ID'), idParam('dayId', 'event-day ID'), validate, deleteEventDay);

// Categories
router.route('/categories').get(paginationValidation, validate, getCategories).post(categoryValidation, validate, createCategory);
router.route('/categories/:id').get(idParam(), validate, getCategory).put(idParam(), categoryValidation, validate, updateCategory).delete(idParam(), validate, deleteCategory);

// Trainers
router.delete('/trainers', body('ids').isArray({ min: 1 }).withMessage('Select at least one trainer.'), body('ids.*').isMongoId().withMessage('Valid trainer IDs are required.'), validate, deleteTrainers);
router.route('/trainers').get(paginationValidation, validate, getTrainers).post(uploadImage.single('photo'), verifyUploadedImage, body('password').isLength({ min: 8, max: 128 }).withMessage('Password must be between 8 and 128 characters.'), trainerValidation, validate, createTrainer);
router.route('/trainers/:id').get(getTrainer).put(uploadImage.single('photo'), verifyUploadedImage, trainerValidation, validate, updateTrainer).delete(deleteTrainer);
router.patch('/trainers/:id/access', body('status').isIn(['pending', 'approved', 'rejected', 'suspended']), body('reason').optional({ checkFalsy: true }).trim().isLength({ max: 500 }), validate, reviewTrainer);

// Trainings
router.route('/trainings').get(paginationValidation, ...optionalObjectIdQueries('event', 'eventDay', 'category'), validate, getTrainings).post(uploadImage.single('coverImage'), verifyUploadedImage, trainingValidation, validate, createTraining);
router.route('/trainings/:id').get(idParam(), validate, getTraining).put(idParam(), uploadImage.single('coverImage'), verifyUploadedImage, trainingValidation, validate, updateTraining).delete(idParam(), validate, deleteTraining);
router.patch('/trainings/:id/status', idParam(), body('status').isIn(['draft', 'published', 'registration_open', 'registration_closed', 'ongoing', 'completed', 'cancelled']), validate, updateTrainingStatus);
router.post('/trainings/:id/complete', idParam(), validate, completeTraining);
router.patch('/trainings/:id/assign', idParam(), assignmentValidation, validate, assignTrainingStaff);

// Meeting & Communications (also accessible by moderator — handled in controller)
router.route('/trainings/:trainingId/meeting').get(idParam('trainingId', 'training ID'), validate, getMeeting).post(idParam('trainingId', 'training ID'), meetingValidation, validate, createMeeting).put(idParam('trainingId', 'training ID'), meetingValidation, validate, updateMeeting).delete(idParam('trainingId', 'training ID'), validate, deleteMeeting);
router.patch('/trainings/:trainingId/meeting/release', body('isReleased').optional().isBoolean().toBoolean(), validate, releaseMeeting);
router.post('/trainings/:trainingId/invitations/trainer', validate, sendTrainerInvitation);
router.post('/trainings/:trainingId/invitations/participants', idParam('trainingId', 'training ID'), invitationValidation, validate, sendParticipantInvitations);
router.get('/trainings/:trainingId/communications', getCommunications);

// Attendance
router.post('/trainings/:trainingId/qr-session/open', openQRSession);
router.post('/trainings/:trainingId/qr-session/close', closeQRSession);
router.get('/trainings/:trainingId/attendance', getAttendance);
router.patch('/trainings/:trainingId/attendance/:attendanceId', idParam('trainingId', 'training ID'), idParam('attendanceId', 'attendance ID'), attendanceValidation, validate, updateAttendance);
router.post('/trainings/:trainingId/attendance/manual', idParam('trainingId', 'training ID'), manualAttendanceValidation, validate, createManualAttendance);

// Feedback
router.get('/trainings/:trainingId/feedback', getTrainingFeedback);

// Registrations
router.route('/registrations').get(paginationValidation, ...optionalObjectIdQueries('event', 'eventDay', 'training', 'participant'), query('status').optional({ checkFalsy: true }).isIn(['pending', 'approved', 'rejected', 'cancelled']), validate, getRegistrations);
router.patch('/registrations/approve-filtered', ...optionalObjectIdQueries('event', 'eventDay', 'training', 'participant'), validate, approveFilteredRegistrations);
router.post('/registrations/email-filtered', query('training').isMongoId().withMessage('Select a training session before sending.'), body('subject').trim().isLength({ min: 5, max: 150 }).withMessage('Subject must be between 5 and 150 characters.'), body('message').trim().isLength({ min: 10, max: 2000 }).withMessage('Message must be between 10 and 2000 characters.'), validate, emailFilteredRegistrations);
router.delete('/registrations', body('ids').isArray({ min: 1 }).withMessage('Select at least one registration.'), body('ids.*').isMongoId().withMessage('Valid registration IDs are required.'), validate, deleteRegistrations);
router.route('/registrations/:id').get(idParam(), validate, getRegistration).delete(idParam(), validate, deleteRegistration);
router.patch('/registrations/:id/status', idParam(), registrationStatusValidation, validate, updateRegistrationStatus);

// Certificates
router.post('/certificates/generate',
  body('participantId').isMongoId().withMessage('Valid participant ID is required.'),
  body('trainingId').isMongoId().withMessage('Valid training ID is required.'), validate, generateCertificate);
router.post('/certificates/bulk-generate',
  body('trainingId').isMongoId().withMessage('Valid training ID is required.'), validate, bulkGenerateCertificates);
router.get('/certificates/jobs/:trainingId',
  param('trainingId').isMongoId().withMessage('Valid training ID is required.'), validate, getCertificateJob);
router.get('/certificates', getCertificates);
router.patch('/certificates/:id/revoke',
  param('id').isMongoId().withMessage('Valid certificate ID is required.'),
  body('reason').trim().isLength({ min: 5, max: 300 }).withMessage('Revocation reason must be between 5 and 300 characters.'), validate, revokeCertificate);

// Recordings
router.route('/recordings').get(paginationValidation, validate, getRecordings).post(recordingValidation, validate, createRecording);
router.route('/recordings/:id').get(idParam(), validate, getRecording).put(idParam(), recordingValidation, validate, updateRecording).delete(idParam(), validate, deleteRecording);
router.patch('/recordings/:id/publish', idParam(), validate, togglePublish);
router.patch('/recordings/:id/restore', idParam(), validate, restoreRecording);

// Reports
router.get('/reports/overview', getOverview);
router.get('/reports/registrations', registrationReport);
router.get('/reports/attendance', attendanceReport);
router.get('/reports/participants-by-region', participantsByRegion);
router.get('/reports/participants-by-type', participantsByType);
router.get('/reports/participants-by-gender', participantsByGender);
router.get('/reports/certificates', certificateReport);
router.get('/reports/feedback', feedbackReport);
router.get('/reports/daily-attendance', dailyAttendanceSummary);

// Users
router.delete('/participants', body('ids').isArray({ min: 1 }).withMessage('Select at least one participant.'), body('ids.*').isMongoId().withMessage('Valid participant IDs are required.'), validate, deleteParticipants);
router.route('/participants').get(paginationValidation, validate, getParticipants);
router.route('/participants/:id').get(idParam(), validate, getParticipant).delete(idParam(), validate, deleteParticipant);
router.patch('/participants/:id/toggle-status', idParam(), validate, toggleParticipantStatus);
router.delete('/moderators', body('ids').isArray({ min: 1 }).withMessage('Select at least one moderator.'), body('ids.*').isMongoId().withMessage('Valid moderator IDs are required.'), validate, deleteModerators);
router.route('/moderators').get(paginationValidation, validate, getModerators).post(moderatorCreateValidation, validate, createModerator);
router.route('/moderators/:id').get(idParam(), validate, getModerator).put(idParam(), moderatorUpdateValidation, validate, updateModerator).delete(idParam(), validate, deleteModerator);
router.patch('/moderators/:id/toggle-status', idParam(), validate, toggleModeratorStatus);
router.patch('/moderators/:id/reset-password', idParam(), body('newPassword').isLength({ min: 8, max: 128 }), validate, resetModeratorPassword);

// Contact messages
router.route('/contact-messages').get(paginationValidation, validate, getContactMessages);
router.patch('/contact-messages/:id/read', idParam(), validate, markAsRead);
router.delete('/contact-messages/:id', idParam(), validate, deleteContactMessage);

// Frequently asked questions
const faqValidation = [
  body('question').trim().isLength({ min: 5, max: 200 }).withMessage('Question must be between 5 and 200 characters.'),
  body('answer').trim().isLength({ min: 10, max: 2000 }).withMessage('Answer must be between 10 and 2000 characters.'),
  body('category').optional({ checkFalsy: true }).isIn(['General', 'Registration', 'Training Sessions', 'Attendance', 'Certificates', 'Trainer Applications', 'Technical Support']).withMessage('Select a valid FAQ category.'),
  body('displayOrder').optional().isInt({ min: 0, max: 9999 }).withMessage('Display order must be a non-negative number.'),
  body('isPublished').optional().isBoolean().withMessage('Published status must be true or false.'),
];
router.route('/faqs').get(getFAQs).post(faqValidation, validate, createFAQ);
router.route('/faqs/:id')
  .put(param('id').isMongoId().withMessage('Valid FAQ ID is required.'), ...faqValidation, validate, updateFAQ)
  .delete(param('id').isMongoId().withMessage('Valid FAQ ID is required.'), validate, deleteFAQ);
router.patch('/faqs/:id/publish',
  param('id').isMongoId().withMessage('Valid FAQ ID is required.'),
  body('isPublished').isBoolean().withMessage('Published status must be true or false.'),
  validate,
  toggleFAQPublish);

// Co-organizers
const sponsorValidation = [
  body('event').isMongoId().withMessage('Select a valid event edition.'),
  body('name').trim().isLength({ min: 2, max: 120 }).withMessage('Co-organizer name must be between 2 and 120 characters.'),
  body('websiteUrl').optional({ checkFalsy: true }).isURL({ protocols: ['http', 'https'], require_protocol: true }).withMessage('Website URL must start with http:// or https://.'),
  body('description').optional({ checkFalsy: true }).trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters.'),
  body('category').isIn(['Strategic Co-Organizer', 'Lead Co-Organizer', 'Co-Organizer', 'Supporting Co-Organizer', 'Media Co-Organizer']).withMessage('Select a valid co-organizer category.'),
  body('displayOrder').optional().isInt({ min: 0, max: 9999 }).withMessage('Display order must be between 0 and 9999.'),
  body('isActive').optional().isBoolean().withMessage('Active status must be true or false.'),
  body('isFeatured').optional().isBoolean().withMessage('Featured status must be true or false.'),
];
router.route('/sponsors')
  .get(getSponsors)
  .post(uploadImage.single('sponsorLogo'), verifyUploadedImage, sponsorValidation, validate, createSponsor);
router.route('/sponsors/:id')
  .put(param('id').isMongoId().withMessage('Valid sponsor ID is required.'), uploadImage.single('sponsorLogo'), verifyUploadedImage, sponsorValidation, validate, updateSponsor)
  .delete(param('id').isMongoId().withMessage('Valid sponsor ID is required.'), validate, deleteSponsor);
router.patch('/sponsors/:id/status',
  param('id').isMongoId().withMessage('Valid sponsor ID is required.'),
  body('isActive').isBoolean().withMessage('Active status must be true or false.'),
  validate,
  toggleSponsorStatus);

// Public identity and email presentation settings (SMTP credentials remain environment-only)
router.route('/settings').get(getSettings).put([
  body('organizerName').trim().isLength({ min: 2, max: 100 }).withMessage('Organizer name must be between 2 and 100 characters.'),
  body('contactEmail').isEmail().withMessage('A valid public contact email is required.').normalizeEmail(),
  body('replyToEmail').isEmail().withMessage('A valid reply-to email is required.').normalizeEmail(),
  body('location').trim().isLength({ min: 2, max: 120 }).withMessage('Location must be between 2 and 120 characters.'),
  body('facebookUrl').optional({ checkFalsy: true }).isURL({ protocols: ['https'], require_protocol: true }).withMessage('Facebook URL must start with https://.'),
  body('tiktokUrl').optional({ checkFalsy: true }).isURL({ protocols: ['https'], require_protocol: true }).withMessage('TikTok URL must start with https://.'),
  body('instagramUrl').optional({ checkFalsy: true }).isURL({ protocols: ['https'], require_protocol: true }).withMessage('Instagram URL must start with https://.'),
  body('linkedinUrl').optional({ checkFalsy: true }).isURL({ protocols: ['https'], require_protocol: true }).withMessage('LinkedIn URL must start with https://.'),
  body('xUrl').optional({ checkFalsy: true }).isURL({ protocols: ['https'], require_protocol: true }).withMessage('X URL must start with https://.'),
  body('emailSenderName').trim().isLength({ min: 2, max: 100 }).withMessage('Email sender name must be between 2 and 100 characters.'),
  body('smtpUser').optional({ checkFalsy: true }).isEmail().withMessage('A valid Gmail sender address is required.').normalizeEmail(),
  body('smtpPassword').optional({ checkFalsy: true }).isLength({ min: 16, max: 32 }).withMessage('The Google App Password must be between 16 and 32 characters.'),
  body('certificateSignatoryName').customSanitizer(normalizeHumanName).custom(isValidHumanName).withMessage(HUMAN_NAME_MESSAGE),
  body('certificateSignatoryTitle').trim().isLength({ min: 2, max: 120 }).withMessage('Signatory title must be between 2 and 120 characters.'),
], validate, updateSettings);
router.post('/settings/test-email', body('email').isEmail().withMessage('A valid test recipient email is required.').normalizeEmail(), validate, sendTestEmail);
router.post('/settings/certificate-signature', uploadImage.single('certificateSignature'), verifyUploadedImage, uploadCertificateSignature);
router.delete('/settings/certificate-signature', removeCertificateSignature);

export default router;
