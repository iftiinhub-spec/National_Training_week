import test from 'node:test';
import assert from 'node:assert/strict';
import {
  eventDayKeys,
  eventDaysOutsideRange,
  eventPhase,
  parseNairobiInput,
  registrationClosesAt,
  sessionPhase,
} from '../src/utils/lifecycle.js';
import { eventTimelineError } from '../src/utils/eventTimeline.js';

// A six-day edition that is already running: it started on 29 August and ends on 3 September.
// Registration opened on 28 August and the organisers set no event-wide cut-off.
const runningEvent = {
  status: 'published',
  year: 2026,
  startDate: '2026-08-29',
  endDate: '2026-09-03',
  registrationStart: '2026-08-28T16:20:00+03:00',
  registrationDeadline: null,
};

const session = (date, overrides = {}) => ({
  status: 'published',
  date: `${date}T00:00:00.000Z`,
  startTime: '13:00',
  endTime: '14:00',
  ...overrides,
});

// 30 August, mid-morning in Nairobi: day 2 of the edition is under way.
const duringEvent = new Date('2026-08-30T09:00:00+03:00');

test('a later day of a running event still accepts registration', () => {
  const { phase, registration } = sessionPhase(session('2026-09-03'), runningEvent, { now: duringEvent });
  assert.equal(phase, 'registration_open');
  assert.equal(registration.open, true);
});

test('registration for a session closes when its own day begins', () => {
  const today = sessionPhase(session('2026-08-30'), runningEvent, { now: duringEvent });
  assert.equal(today.phase, 'registration_closed');
  assert.equal(today.registration.reason, 'closed');

  const yesterday = sessionPhase(session('2026-08-29'), runningEvent, { now: duringEvent });
  assert.equal(yesterday.phase, 'ended');
});

test('the day boundary is read in Nairobi time, not UTC', () => {
  // 01:30 Nairobi on 3 September is still 22:30 UTC on 2 September. Reading the boundary in UTC
  // would leave the session open for another three hours.
  const justAfterMidnight = new Date('2026-09-03T01:30:00+03:00');
  const { phase } = sessionPhase(session('2026-09-03'), runningEvent, { now: justAfterMidnight });
  assert.equal(phase, 'registration_closed');
});

test('date-only inputs keep their calendar key while date-times are read in Nairobi', () => {
  assert.equal(parseNairobiInput('2026-08-29').toISOString(), '2026-08-29T00:00:00.000Z');
  assert.equal(parseNairobiInput('2026-08-29T14:30').toISOString(), '2026-08-29T11:30:00.000Z');
});

test('an administrator can close one session early and open it again', () => {
  const closedEarly = session('2026-09-03', { registrationClosesAt: new Date('2026-08-29T12:00:00+03:00') });
  assert.equal(sessionPhase(closedEarly, runningEvent, { now: duringEvent }).phase, 'registration_closed');

  const reopened = { ...closedEarly, registrationClosesAt: null };
  assert.equal(sessionPhase(reopened, runningEvent, { now: duringEvent }).phase, 'registration_open');
});

test('an event-wide cut-off only ever brings the closing time forward', () => {
  const withCutOff = { ...runningEvent, registrationDeadline: new Date('2026-08-29T23:59:00+03:00') };
  const later = session('2026-09-03');
  assert.equal(sessionPhase(later, withCutOff, { now: duringEvent }).phase, 'registration_closed');

  // The session's own day is earlier than a cut-off placed after the event, so the day still wins.
  const lateCutOff = { ...runningEvent, registrationDeadline: new Date('2026-09-30T00:00:00+03:00') };
  assert.equal(
    registrationClosesAt(session('2026-09-03'), lateCutOff).toISOString(),
    new Date('2026-09-03T00:00:00+03:00').toISOString()
  );
});

test('an empty event-wide cut-off is treated as absent, not as the Unix epoch', () => {
  assert.equal(eventTimelineError(runningEvent), null);
  assert.equal(eventTimelineError({ ...runningEvent, registrationDeadline: '' }), null);
});

test('a full session reports itself closed', () => {
  const full = session('2026-09-03', { capacity: 30 });
  assert.equal(sessionPhase(full, runningEvent, { now: duringEvent, registeredCount: 30 }).registration.reason, 'full');
  assert.equal(sessionPhase(full, runningEvent, { now: duringEvent, registeredCount: 29 }).registration.open, true);
});

test('draft and cancelled sessions never take registration', () => {
  for (const status of ['draft', 'cancelled']) {
    const { phase, registration } = sessionPhase(session('2026-09-03', { status }), runningEvent, { now: duringEvent });
    assert.equal(phase, status);
    assert.equal(registration.open, false);
  }
});

test('a session is live between its start and end time', () => {
  const midSession = new Date('2026-09-03T13:30:00+03:00');
  assert.equal(sessionPhase(session('2026-09-03'), runningEvent, { now: midSession }).phase, 'live');
});

test('an event reports what its dates say, not a stored value', () => {
  assert.equal(eventPhase(runningEvent, duringEvent), 'running');
  assert.equal(eventPhase(runningEvent, new Date('2026-08-28T10:00:00+03:00')), 'scheduled');
  assert.equal(eventPhase(runningEvent, new Date('2026-08-28T20:00:00+03:00')), 'registration_open');
  assert.equal(eventPhase(runningEvent, new Date('2026-09-10T10:00:00+03:00')), 'finished');
  assert.equal(eventPhase({ ...runningEvent, status: 'draft' }, duringEvent), 'draft');
});

test('one day is generated for every date of the edition', () => {
  const keys = eventDayKeys(runningEvent);
  assert.deepEqual(keys, ['2026-08-29', '2026-08-30', '2026-08-31', '2026-09-01', '2026-09-02', '2026-09-03']);
  assert.deepEqual(eventDayKeys({ startDate: '2026-08-29', endDate: '2026-08-29' }), ['2026-08-29']);
  assert.deepEqual(eventDayKeys({ startDate: '2026-08-29', endDate: '2026-08-28' }), []);
});

test('an event resize identifies persisted days outside the proposed range before saving', () => {
  const days = [
    { _id: 'day-1', date: '2026-08-29T00:00:00.000Z' },
    { _id: 'day-2', date: '2026-08-30T00:00:00.000Z' },
    { _id: 'day-3', date: '2026-08-31T00:00:00.000Z' },
  ];
  const proposed = { startDate: '2026-08-30', endDate: '2026-08-31' };
  assert.deepEqual(eventDaysOutsideRange(days, proposed).map((day) => day._id), ['day-1']);
});
