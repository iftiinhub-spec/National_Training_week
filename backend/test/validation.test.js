import test from 'node:test';
import assert from 'node:assert/strict';
import { validationResult } from 'express-validator';
import {
  eventValidation,
  feedbackValidation,
  meetingValidation,
  optionalObjectIdQueries,
  qrCheckinValidation,
  recordingValidation,
  trainingValidation,
} from '../src/middleware/validationRules.js';
import { escapeRegex } from '../src/utils/search.js';
import { pick } from '../src/utils/pick.js';
import { hasValidImageSignature } from '../src/middleware/upload.js';
import { isValidHumanName, normalizeHumanName } from '../src/utils/humanName.js';
import User from '../src/models/User.js';
import Training from '../src/models/Training.js';
import { formatValidationField } from '../src/middleware/validate.js';
import { eventDayTimelineError } from '../src/utils/eventTimeline.js';

const runRules = async (rules, body = {}, params = {}, query = {}) => {
  const req = { body, params, query };
  for (const rule of rules) await rule.run(req);
  return validationResult(req).array();
};

test('regex search input is treated as literal text', () => {
  assert.equal(escapeRegex('john.*(admin)'), 'john\\.\\*\\(admin\\)');
});

test('QR check-in rejects malformed IDs and tokens', async () => {
  const errors = await runRules(qrCheckinValidation, { trainingId: 'bad', sessionToken: 'bad' });
  assert.deepEqual(errors.map(({ path }) => path).sort(), ['sessionToken', 'trainingId']);
});

test('feedback only accepts ratings from one to five', async () => {
  const errors = await runRules(feedbackValidation, {
    contentRating: 0, trainerRating: 6, organizationRating: 3,
  });
  assert.deepEqual(errors.map(({ path }) => path).sort(), ['contentRating', 'trainerRating']);
});

test('meetings require an HTTPS URL', async () => {
  const errors = await runRules(meetingValidation, { platform: 'zoom', meetingUrl: 'http://example.com' });
  assert.equal(errors.some(({ path }) => path === 'meetingUrl'), true);
});

test('recordings accept supported HTTPS media and reject unsupported URLs', async () => {
  const id = '507f1f77bcf86cd799439011';
  const valid = await runRules(recordingValidation, {
    training: id, title: 'AI Foundations', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  });
  const invalid = await runRules(recordingValidation, {
    training: id, title: 'AI Foundations', url: 'https://example.com/page',
  });
  assert.deepEqual(valid, []);
  assert.equal(invalid.some(({ path }) => path === 'url'), true);
});

test('optional public ID queries reject MongoDB operators and malformed IDs', async () => {
  const rules = optionalObjectIdQueries('event');
  assert.deepEqual(await runRules(rules, {}, {}, { event: '507f1f77bcf86cd799439011' }), []);
  const malformed = await runRules(rules, {}, {}, { event: '$ne:null' });
  assert.equal(malformed.some(({ path }) => path === 'event'), true);
});

test('event validation rejects an impossible year and invalid dates', async () => {
  const errors = await runRules(eventValidation, {
    name: 'NTW', year: 1900, startDate: 'not-a-date', endDate: 'not-a-date',
  });
  assert.equal(errors.length >= 3, true);
});

test('event day can share the event start date when registration closes before that date', () => {
  const event = {
    name: 'National Training Week 2030',
    year: 2030,
    startDate: '2030-05-20',
    endDate: '2030-05-20',
    registrationStart: '2030-05-19T07:00:00+03:00',
    registrationDeadline: '2030-05-19T23:00:00+03:00',
  };
  assert.equal(eventDayTimelineError(event, '2030-05-20'), null);
  assert.match(eventDayTimelineError(event, '2030-05-21'), /between 2030-05-20 and 2030-05-20/);
});

test('valid training payload passes boundary validation', async () => {
  const id = '507f1f77bcf86cd799439011';
  const errors = await runRules(trainingValidation, {
    title: 'AI Foundations', event: id, eventDay: id, date: '2030-01-01',
    startTime: '09:00', endTime: '11:00', capacity: 100,
  });
  assert.deepEqual(errors, []);
});

test('training validation accepts multiple unique trainer IDs', async () => {
  const ids = ['507f1f77bcf86cd799439011', '507f191e810c19729de860ea'];
  const errors = await runRules(trainingValidation, {
    title: 'Panel Session', event: ids[0], eventDay: ids[0], trainers: ids,
    date: '2030-01-01', startTime: '09:00', endTime: '11:00', capacity: 100,
  });
  assert.deepEqual(errors, []);
});

test('training model keeps multiple trainers and a legacy primary trainer', async () => {
  const ids = ['507f1f77bcf86cd799439011', '507f191e810c19729de860ea'];
  const training = new Training({
    title: 'Panel Session', event: ids[0], eventDay: ids[0], trainers: ids,
    date: '2030-01-01', startTime: '09:00', endTime: '11:00',
  });
  await training.validate();
  assert.deepEqual(training.trainers.map(String), ids);
  assert.equal(String(training.trainer), ids[0]);
});

test('field allowlisting removes unexpected update properties', () => {
  assert.deepEqual(pick({ name: 'AI', isActive: true, role: 'admin' }, ['name', 'isActive']), {
    name: 'AI', isActive: true,
  });
});

test('image signatures reject disguised text files', () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  assert.equal(hasValidImageSignature(png), true);
  assert.equal(hasValidImageSignature(Buffer.from('not really an image')), false);
});

test('human names reject punctuation-only and numeric values', () => {
  for (const invalid of ['...........................', '123456', '--', '. Ibrahim', 'Ibrahim .', 'A']) {
    assert.equal(isValidHumanName(invalid), false, `${invalid} should be rejected`);
  }
});

test('human names support international and normal punctuation forms', () => {
  for (const valid of ['Ibrahim Mohamed', 'Mary-Jane O’Neil', 'Dr. Ibrahim', 'محمد علي']) {
    assert.equal(isValidHumanName(valid), true, `${valid} should be accepted`);
  }
  assert.equal(normalizeHumanName('  Ibrahim    Mohamed  '), 'Ibrahim Mohamed');
});

test('user model independently rejects an invalid participant name', () => {
  const user = new User({
    fullName: '...........', email: 'person@example.com', passwordHash: 'password123',
    role: 'participant', phone: '+252612345678',
  });
  assert.equal(user.validateSync()?.errors.fullName?.message.includes('valid name'), true);
});

test('validation fields are presented as clear user-facing labels', () => {
  assert.equal(formatValidationField('fullName'), 'Full name');
  assert.equal(formatValidationField('meetingUrl'), 'Meeting URL');
  assert.equal(formatValidationField('selectedIds.*'), 'Selected IDs');
});
