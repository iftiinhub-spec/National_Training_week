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

const router = express.Router();

router.get('/settings', getPublicSettings);

// Trainings & Trainers
router.get('/trainings', getPublicTrainings);
router.get('/trainings/:id', getPublicTraining);
router.get('/featured-trainings', getFeaturedTrainings);
router.get('/trainers', getPublicTrainers);
router.get('/trainers/:id', getPublicTrainer);
router.get('/categories', getCategories);

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
