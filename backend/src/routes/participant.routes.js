import express from 'express';
import { protect } from '../middleware/auth.js';
import { participantOnly } from '../middleware/role.js';
import { qrRateLimiter } from '../middleware/rateLimiter.js';

import { registerForTraining, getMyRegistrations, getMyRegistration, cancelRegistration, getMyAttendance, getParticipantDashboard } from '../controllers/participant/registration.controller.js';
import { submitFeedback, getMyFeedback } from '../controllers/admin/feedback.controller.js';
import { getMyCertificates, downloadCertificate } from '../controllers/admin/certificate.controller.js';
import { qrCheckIn } from '../controllers/admin/attendance.controller.js';

const router = express.Router();
router.use(protect, participantOnly);

// Dashboard
router.get('/dashboard', getParticipantDashboard);

// Registrations
router.post('/registrations', registerForTraining);
router.get('/registrations', getMyRegistrations);
router.get('/registrations/:id', getMyRegistration);
router.patch('/registrations/:id/cancel', cancelRegistration);

// Attendance (read-only for participant + QR check-in)
router.get('/attendance', getMyAttendance);
router.post('/qr-checkin', qrRateLimiter, qrCheckIn);

// Feedback
router.post('/trainings/:trainingId/feedback', submitFeedback);
router.get('/feedback', getMyFeedback);

// Certificates
router.get('/certificates', getMyCertificates);
router.get('/certificates/:id/download', downloadCertificate);

export default router;
