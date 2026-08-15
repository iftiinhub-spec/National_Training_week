import express from 'express';
import { getPublicTrainings, getPublicTraining, getPublicEvents, getPublicEvent, getCurrentEvent, getPublicProgram, getFeaturedTrainings } from '../controllers/public/training.controller.js';
import { getPublicRecordings } from '../controllers/admin/recording.controller.js';
import { getPublicTrainer, getPublicTrainers } from '../controllers/admin/trainer.controller.js';
import { verifyCertificate } from '../controllers/admin/certificate.controller.js';
import { createContactMessage } from '../controllers/admin/contact.controller.js';
import { getCategories } from '../controllers/admin/category.controller.js';
import { getPublicSettings } from '../controllers/admin/settings.controller.js';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { uploadImage, verifyUploadedImage } from '../middleware/upload.js';
import { applyAsTrainer } from '../controllers/trainerApplication.controller.js';
import { isValidInternationalPhone, normalizePhone } from '../utils/phone.js';
import { getPublicFAQs } from '../controllers/admin/faq.controller.js';
import { getPublicSponsors } from '../controllers/admin/sponsor.controller.js';
import { HUMAN_NAME_MESSAGE, isValidHumanName, normalizeHumanName } from '../utils/humanName.js';
import { idParam, optionalObjectIdQueries, paginationValidation, validateObjectIdParam } from '../middleware/validationRules.js';

const router = express.Router();
router.param('id', validateObjectIdParam);

router.get('/settings', getPublicSettings);
router.get('/faqs', getPublicFAQs);
router.get('/sponsors', getPublicSponsors);

// Trainings & Trainers
router.get('/trainings', paginationValidation, ...optionalObjectIdQueries('event', 'eventDay', 'category', 'trainer'), validate, getPublicTrainings);
router.get('/trainings/:id', idParam(), validate, getPublicTraining);
router.get('/featured-trainings', getFeaturedTrainings);
router.get('/trainers', paginationValidation, validate, getPublicTrainers);
router.get('/trainers/:id', idParam(), validate, getPublicTrainer);
router.get('/categories', getCategories);
router.post('/trainer-applications', uploadImage.single('photo'), verifyUploadedImage, [
  body('name').customSanitizer(normalizeHumanName).custom(isValidHumanName).withMessage(HUMAN_NAME_MESSAGE), body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }), body('phone').customSanitizer(normalizePhone).custom(isValidInternationalPhone),
  body('organization').trim().notEmpty().isLength({ max: 150 }), body('expertise').trim().notEmpty().isLength({ max: 1000 }),
  body('title').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  body('biography').trim().notEmpty().isLength({ min: 30, max: 2000 }),
], validate, applyAsTrainer);

// Events & Program
router.get('/events', paginationValidation, validate, getPublicEvents);
router.get('/current-event', getCurrentEvent);
router.get('/events/:id', idParam(), validate, getPublicEvent);
router.get('/program', getPublicProgram);

// Recordings (published only)
router.get('/recordings', paginationValidation, ...optionalObjectIdQueries('event', 'eventDay', 'category', 'trainer'), validate, getPublicRecordings);

// Certificate verification
router.get('/verify/:certificateId', param('certificateId').trim().matches(/^[A-Za-z0-9-]{6,100}$/).withMessage('Invalid certificate ID.'), validate, verifyCertificate);

// Contact form
router.post('/contact', [
  body('name').customSanitizer(normalizeHumanName).custom(isValidHumanName).withMessage(HUMAN_NAME_MESSAGE),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('subject').trim().isLength({ min: 2, max: 200 }).withMessage('Subject must be between 2 and 200 characters.'),
  body('message').trim().isLength({ min: 10, max: 5000 }).withMessage('Message must be between 10 and 5000 characters.'),
], validate, createContactMessage);

export default router;
