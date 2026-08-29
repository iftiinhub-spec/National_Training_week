import { body, param, query } from 'express-validator';
import { isValidInternationalPhone, normalizePhone } from '../utils/phone.js';
import mongoose from 'mongoose';
import { HUMAN_NAME_MESSAGE, isValidHumanName, normalizeHumanName } from '../utils/humanName.js';

const humanName = (location, field, optional = false) => {
  let chain = location(field);
  if (optional) chain = chain.optional();
  return chain.customSanitizer(normalizeHumanName).custom(isValidHumanName).withMessage(HUMAN_NAME_MESSAGE);
};

export const validateObjectIdParam = (req, res, next, value, name) => {
  if (!mongoose.isObjectIdOrHexString(value)) {
    return res.status(400).json({ success: false, message: `Invalid ${name}.` });
  }
  return next();
};

const objectId = (location, name, label = 'ID') => location(name)
  .isMongoId().withMessage(`Valid ${label} is required.`);

export const idParam = (name = 'id', label = 'ID') => objectId(param, name, label);

// Accepts a readable slug or a legacy ObjectId, for public URLs that must keep old links working.
export const slugOrIdParam = (name, label = 'ID') => param(name)
  .trim()
  .isLength({ max: 120 })
  .custom((value) => mongoose.isObjectIdOrHexString(value) || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value))
  .withMessage(`Valid ${label} is required.`);

export const paginationValidation = [
  query('page').optional().isInt({ min: 1, max: 100000 }).withMessage('Page must be a positive integer.').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100.').toInt(),
  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search cannot exceed 100 characters.'),
];

export const optionalObjectIdQueries = (...names) => names.map((name) =>
  objectId(query, name, name).optional({ checkFalsy: true }));

export const registrationCreateValidation = [
  objectId(body, 'trainingId', 'training ID'),
];

export const qrCheckinValidation = [
  objectId(body, 'trainingId', 'training ID'),
  body('sessionToken').isUUID().withMessage('A valid QR session token is required.'),
];

export const feedbackValidation = [
  body('contentRating').isInt({ min: 1, max: 5 }).withMessage('Content rating must be between 1 and 5.').toInt(),
  body('trainerRating').isInt({ min: 1, max: 5 }).withMessage('Trainer rating must be between 1 and 5.').toInt(),
  body('organizationRating').isInt({ min: 1, max: 5 }).withMessage('Organization rating must be between 1 and 5.').toInt(),
  body('comments').optional({ checkFalsy: true }).trim().isLength({ max: 2000 }).withMessage('Comments cannot exceed 2000 characters.'),
  body('suggestions').optional({ checkFalsy: true }).trim().isLength({ max: 2000 }).withMessage('Suggestions cannot exceed 2000 characters.'),
];

export const attendanceValidation = [
  body('status').isIn(['present', 'absent', 'late', 'not_marked']).withMessage('Select a valid attendance status.'),
];

export const manualAttendanceValidation = [
  objectId(body, 'participantId', 'participant ID'),
  body('status').optional().isIn(['present', 'absent', 'late', 'not_marked']).withMessage('Select a valid attendance status.'),
];

export const meetingValidation = [
  body('platform').isIn(['zoom', 'google_meet', 'teams', 'other']).withMessage('Select a valid meeting platform.'),
  body('meetingUrl').isURL({ protocols: ['https'], require_protocol: true }).withMessage('Meeting URL must be a valid HTTPS URL.'),
  body('meetingId').optional({ checkFalsy: true }).trim().isLength({ max: 150 }),
  body('passcode').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  body('startTime').optional({ checkFalsy: true }).isISO8601().withMessage('Start time must be a valid date-time.'),
  body('endTime').optional({ checkFalsy: true }).isISO8601().withMessage('End time must be a valid date-time.'),
  body('notes').optional({ checkFalsy: true }).trim().isLength({ max: 2000 }),
];

export const invitationValidation = [
  body('type').optional().isIn(['invitation', 'reminder', 'announcement', 'cancellation', 'schedule_change']).withMessage('Select a valid communication type.'),
  body('selectedIds').optional().isArray({ max: 1000 }).withMessage('Selected participants must be a list.'),
  body('selectedIds.*').optional().isMongoId().withMessage('Every selected participant must have a valid ID.'),
];

export const moderatorCreateValidation = [
  humanName(body, 'fullName'),
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('password').isLength({ min: 8, max: 128 }).withMessage('Password must be between 8 and 128 characters.'),
  body('phone').optional({ checkFalsy: true }).customSanitizer(normalizePhone).custom(isValidInternationalPhone).withMessage('Enter a valid international phone number.'),
];

export const moderatorUpdateValidation = [
  humanName(body, 'fullName', true),
  body('phone').optional({ checkFalsy: true }).customSanitizer(normalizePhone).custom(isValidInternationalPhone),
  body('isActive').optional().isBoolean().toBoolean(),
];

export const trainerValidation = [
  humanName(body, 'name'),
  body('email').isEmail().normalizeEmail(),
  body('phone').optional({ checkFalsy: true }).customSanitizer(normalizePhone).custom(isValidInternationalPhone),
  body('title').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  body('organization').optional({ checkFalsy: true }).trim().isLength({ max: 150 }),
  body('biography').optional({ checkFalsy: true }).trim().isLength({ max: 2000 }),
  body('expertise').optional().custom((value) => Array.isArray(value) || typeof value === 'string').withMessage('Expertise must be text or a list.'),
  body('isActive').optional().isBoolean().toBoolean(),
  body('password').optional({ checkFalsy: true }).isLength({ min: 8, max: 128 }),
  body('accessStatus').optional().isIn(['pending', 'approved']),
];

export const trainerProfileValidation = [
  humanName(body, 'name', true),
  body('phone').optional({ checkFalsy: true }).customSanitizer(normalizePhone).custom(isValidInternationalPhone),
  body('title').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  body('organization').optional({ checkFalsy: true }).trim().isLength({ max: 150 }),
  body('biography').optional({ checkFalsy: true }).trim().isLength({ max: 2000 }),
  body('expertise').optional().custom((value) => Array.isArray(value) || typeof value === 'string'),
];

export const categoryValidation = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Category name must be between 2 and 100 characters.'),
  body('description').optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
  body('isActive').optional().isBoolean().toBoolean(),
];

export const recordingValidation = [
  objectId(body, 'training', 'training ID'),
  body('title').trim().isLength({ min: 2, max: 150 }),
  body('url')
    .isURL({ protocols: ['https'], require_protocol: true }).withMessage('Recording URL must be a valid HTTPS URL.')
    .custom((value) => {
      const parsed = new URL(value);
      const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
      const isYouTube = ['youtube.com', 'm.youtube.com', 'youtu.be', 'youtube-nocookie.com'].includes(host);
      const isDirectVideo = /\.(mp4|webm|ogg)$/i.test(parsed.pathname);
      if (!isYouTube && !isDirectVideo) throw new Error('Use a YouTube URL or a direct HTTPS MP4, WebM, or OGG video URL.');
      return true;
    }),
  body('description').optional({ checkFalsy: true }).trim().isLength({ max: 2000 }),
  body('thumbnail').optional({ checkFalsy: true }).isURL({ protocols: ['https'], require_protocol: true })
    .withMessage('Thumbnail URL must be a valid HTTPS URL.'),
];

export const registrationStatusValidation = [
  body('status').isIn(['approved', 'rejected', 'cancelled']).withMessage('Select a valid registration status.'),
];

export const assignmentValidation = [
  body('trainerIds').optional().isArray({ max: 10 }).withMessage('Select no more than 10 trainers.'),
  body('trainerIds.*').isMongoId().withMessage('Select valid trainers.'),
  body('moderatorId').optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('Select a valid moderator.'),
];

export const eventValidation = [
  body('name').trim().isLength({ min: 2, max: 150 }),
  body('theme').optional({ checkFalsy: true }).trim().isLength({ max: 250 }),
  body('year').isInt({ min: 2020, max: 2200 }).withMessage('Enter a valid event year.').toInt(),
  body('startDate').isISO8601().withMessage('Enter a valid event start date.'),
  body('endDate').isISO8601().withMessage('Enter a valid event end date.'),
  body('registrationStart').optional({ checkFalsy: true }).isISO8601(),
  body('registrationDeadline').optional({ checkFalsy: true }).isISO8601(),
  body('description').optional({ checkFalsy: true }).trim().isLength({ max: 5000 }),
  body('status').optional().isIn(['draft', 'published', 'cancelled']),
  body('isActive').optional().isBoolean().toBoolean(),
  body('isCurrent').optional().isBoolean().toBoolean(),
];

// Days are generated from the event's date range, so the only thing written to one is its theme.
export const eventDayValidation = [
  body('theme').trim().isLength({ min: 2, max: 250 }).withMessage('Enter a theme of at least 2 characters.'),
];

export const trainingValidation = [
  body('title').trim().isLength({ min: 2, max: 200 }),
  body('description').optional({ checkFalsy: true }).trim().isLength({ max: 10000 }),
  objectId(body, 'event', 'event ID'), objectId(body, 'eventDay', 'event-day ID'),
  objectId(body, 'category', 'category ID').optional({ checkFalsy: true }),
  body('trainers').customSanitizer((value) => value === undefined || value === '' ? [] : Array.isArray(value) ? value : [value]),
  body('trainers').isArray({ max: 10 }).withMessage('Select no more than 10 trainers.'),
  body('trainers.*').isMongoId().withMessage('Select valid trainers.'),
  objectId(body, 'moderator', 'moderator ID').optional({ checkFalsy: true }),
  body('date').optional().isISO8601(),
  body('startTime').matches(/^([01]\d|2[0-3]):[0-5]\d$/),
  body('endTime').matches(/^([01]\d|2[0-3]):[0-5]\d$/),
  body('audience').optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
  body('level').optional().isIn(['general', 'beginner', 'intermediate', 'advanced']),
  body('language').optional({ checkFalsy: true }).trim().isLength({ max: 50 }),
  body('capacity').optional({ nullable: true, checkFalsy: true }).isInt({ min: 1, max: 100000 }).toInt(),
  body('registrationRequired').optional().isBoolean().toBoolean(),
];
