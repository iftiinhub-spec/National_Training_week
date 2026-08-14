import express from 'express';
import { getPublicTrainings, getPublicTraining, getPublicEvents, getPublicEvent, getCurrentEvent, getPublicProgram, getFeaturedTrainings } from '../controllers/public/training.controller.js';
import { getPublicRecordings } from '../controllers/admin/recording.controller.js';
import { getPublicTrainer, getPublicTrainers } from '../controllers/admin/trainer.controller.js';
import { verifyCertificate } from '../controllers/admin/certificate.controller.js';
import { createContactMessage } from '../controllers/admin/contact.controller.js';
import { getCategories } from '../controllers/admin/category.controller.js';
import { getPublicSettings } from '../controllers/admin/settings.controller.js';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { uploadImage } from '../middleware/upload.js';
import { applyAsTrainer } from '../controllers/trainerApplication.controller.js';
import { isValidInternationalPhone, normalizePhone } from '../utils/phone.js';
import { getPublicFAQs } from '../controllers/admin/faq.controller.js';

const router = express.Router();

router.get('/settings', getPublicSettings);
router.get('/faqs', getPublicFAQs);

// Trainings & Trainers
router.get('/trainings', getPublicTrainings);
router.get('/trainings/:id', getPublicTraining);
router.get('/featured-trainings', getFeaturedTrainings);
router.get('/trainers', getPublicTrainers);
router.get('/trainers/:id', getPublicTrainer);
router.get('/categories', getCategories);
router.post('/trainer-applications', uploadImage.single('photo'), [
  body('name').trim().notEmpty().isLength({ max: 100 }), body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }), body('phone').customSanitizer(normalizePhone).custom(isValidInternationalPhone),
  body('organization').trim().notEmpty().isLength({ max: 150 }), body('expertise').trim().notEmpty(),
  body('biography').trim().notEmpty().isLength({ min: 30, max: 2000 }),
], validate, applyAsTrainer);

// Events & Program
router.get('/events', getPublicEvents);
router.get('/current-event', getCurrentEvent);
router.get('/events/:id', getPublicEvent);
router.get('/program', getPublicProgram);

// Recordings (published only)
router.get('/recordings', getPublicRecordings);

// Certificate verification
router.get('/verify/:certificateId', verifyCertificate);

// Contact form
router.post('/contact', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('message').trim().notEmpty().withMessage('Message is required'),
], validate, createContactMessage);

export default router;
