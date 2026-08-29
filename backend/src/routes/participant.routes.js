import express from 'express';
import { protect } from '../middleware/auth.js';
import { participantOnly } from '../middleware/role.js';
import { qrRateLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { feedbackValidation, idParam, optionalObjectIdQueries, paginationValidation, qrCheckinValidation, registrationCreateValidation, validateObjectIdParam } from '../middleware/validationRules.js';
import { query } from 'express-validator';

import { registerForTraining, getMyRegistrations, getMyRegistration, cancelRegistration, getMyAttendance, getParticipantDashboard } from '../controllers/participant/registration.controller.js';
import { submitFeedback, getMyFeedback } from '../controllers/admin/feedback.controller.js';
import { getMyCertificates, downloadCertificate } from '../controllers/admin/certificate.controller.js';
import { qrCheckIn } from '../controllers/admin/attendance.controller.js';

const router = express.Router();
['id', 'trainingId'].forEach((name) => router.param(name, validateObjectIdParam));
router.use(protect, participantOnly);

// Dashboard
router.get('/dashboard', getParticipantDashboard);

// Registrations
router.post('/registrations', registrationCreateValidation, validate, registerForTraining);
router.get('/registrations', paginationValidation, ...optionalObjectIdQueries('training'), query('status').optional({ checkFalsy: true }).isIn(['pending', 'approved', 'rejected', 'cancelled']), validate, getMyRegistrations);
router.get('/registrations/:id', idParam(), validate, getMyRegistration);
router.patch('/registrations/:id/cancel', idParam(), validate, cancelRegistration);

// Attendance (read-only for participant + QR check-in)
router.get('/attendance', getMyAttendance);
router.post('/qr-checkin', qrRateLimiter, qrCheckinValidation, validate, qrCheckIn);

// Feedback
router.post('/trainings/:trainingId/feedback', idParam('trainingId', 'training ID'), feedbackValidation, validate, submitFeedback);
router.get('/feedback', getMyFeedback);

// Certificates
router.get('/certificates', getMyCertificates);
router.get('/certificates/:id/download', idParam(), validate, downloadCertificate);

export default router;
