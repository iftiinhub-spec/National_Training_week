import { validationResult } from 'express-validator';
import { deleteFile } from './upload.js';

const FIELD_LABELS = {
  fullName: 'Full name',
  participantId: 'Participant',
  trainingId: 'Training',
  eventDay: 'Event day',
  eventId: 'Event',
  meetingUrl: 'Meeting URL',
  startTime: 'Start time',
  endTime: 'End time',
  registrationStart: 'Registration opening time',
  registrationDeadline: 'Registration deadline',
  contentRating: 'Content rating',
  trainerRating: 'Trainer rating',
  organizationRating: 'Organization rating',
  sessionToken: 'QR session',
  certificateId: 'Certificate ID',
};

export const formatValidationField = (path = 'input') => {
  const cleanPath = String(path).replace(/\.\*/g, '').replace(/\[(\d+)\]/g, ' $1');
  if (FIELD_LABELS[cleanPath]) return FIELD_LABELS[cleanPath];
  return cleanPath
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\b(ids?|url|qr)\b/gi, (value) => value.toLowerCase() === 'ids' ? 'IDs' : value.toUpperCase())
    .replace(/^./, (value) => value.toUpperCase());
};

// Middleware to check validation results from express-validator
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (req.file?.path) deleteFile(req.file.path);
    const details = errors.array().map((err) => ({
      field: err.path,
      label: formatValidationField(err.path),
      message: err.msg,
      location: err.location,
    }));
    const first = details[0];
    return res.status(400).json({
      success: false,
      message: `${first.label}: ${first.message}`,
      errors: details,
    });
  }
  next();
};
