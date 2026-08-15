import express from 'express';
import { body, param } from 'express-validator';
import { register, login, getMe, updateProfile, changePassword, forgotPassword, resetPassword } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { uploadImage, verifyUploadedImage } from '../middleware/upload.js';
import { isValidInternationalPhone, normalizePhone } from '../utils/phone.js';
import { getCountries } from 'libphonenumber-js';
import { HUMAN_NAME_MESSAGE, isValidHumanName, normalizeHumanName } from '../utils/humanName.js';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('fullName').customSanitizer(normalizeHumanName).custom(isValidHumanName).withMessage(HUMAN_NAME_MESSAGE),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('phone').trim().notEmpty().withMessage('Phone number is required').customSanitizer(normalizePhone)
    .custom(isValidInternationalPhone).withMessage('Enter a valid phone number for its country code.'),
  body('gender').isIn(['male', 'female']).withMessage('Gender is required'),
  body('country').trim().toUpperCase().custom((value) => getCountries().includes(value)).withMessage('Select a valid country.'),
  body('region').trim().custom((value, { req }) => req.body.country !== 'SO' || Boolean(value)).withMessage('Region is required for participants in Somalia.').isLength({ max: 100 }),
  body('city').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  body('organization').trim().isLength({ max: 150 }).custom((value, { req }) => req.body.participantType === 'general_public' || Boolean(value)).withMessage('Organization or institution is required for this participant type.'),
  body('profession').trim().notEmpty().withMessage('Profession is required').isLength({ max: 100 }),
  body('participantType').isIn(['university_student', 'highschool_graduate', 'developer_it', 'professional', 'general_public', 'teacher_educator', 'entrepreneur_business', 'health_worker', 'community_organization', 'other'])
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
  param('token').isHexadecimal().isLength({ min: 64, max: 64 }).withMessage('Invalid password reset token.'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  validate, resetPassword
);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, uploadImage.single('profilePhoto'), verifyUploadedImage, [
  body('fullName').optional().customSanitizer(normalizeHumanName).custom(isValidHumanName).withMessage(HUMAN_NAME_MESSAGE),
  body('phone').optional({ checkFalsy: true }).customSanitizer(normalizePhone).custom(isValidInternationalPhone),
  body('city').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  body('region').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  body('organization').optional({ checkFalsy: true }).trim().isLength({ max: 150 }),
  body('profession').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
], validate, updateProfile);
router.put('/change-password', protect,
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters.'),
  validate, changePassword
);

export default router;
