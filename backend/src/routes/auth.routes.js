import express from 'express';
import { body } from 'express-validator';
import { register, login, getMe, updateProfile, changePassword, forgotPassword, resetPassword } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { uploadImage } from '../middleware/upload.js';
import { isValidInternationalPhone, normalizePhone } from '../utils/phone.js';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('fullName').trim().notEmpty().withMessage('Full name is required').isLength({ max: 100 }),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('phone').trim().notEmpty().withMessage('Phone number is required').customSanitizer(normalizePhone)
    .custom(isValidInternationalPhone).withMessage('Enter a valid phone number for its country code.'),
  body('gender').isIn(['male', 'female']).withMessage('Gender is required'),
  body('region').trim().notEmpty().withMessage('Region is required').isLength({ max: 100 }),
  body('organization').trim().notEmpty().withMessage('University or school is required').isLength({ max: 150 }),
  body('profession').trim().notEmpty().withMessage('Profession is required').isLength({ max: 100 }),
  body('participantType').isIn(['university_student', 'highschool_graduate', 'developer_it', 'professional', 'general_public', 'other'])
    .withMessage('Participant type is required'),
];
const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

router.post('/register', authRateLimiter, registerValidation, validate, register);
router.post('/login', authRateLimiter, loginValidation, validate, login);
router.post('/forgot-password', authRateLimiter, body('email').isEmail(), validate, forgotPassword);
router.post('/reset-password/:token', authRateLimiter,
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  validate, resetPassword
);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, uploadImage.single('profilePhoto'), updateProfile);
router.put('/change-password', protect,
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters.'),
  validate, changePassword
);

export default router;
