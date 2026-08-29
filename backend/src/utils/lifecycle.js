import { getTrainingDateTime } from './trainingDateTime.js';

// Every date rule in this system is read in Nairobi time (+03:00). Keeping that in one constant
// stops a rule from being written in UTC by accident, which would shift day boundaries by 3 hours.
const NAIROBI_OFFSET = '+03:00';

const toDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
};

// Admin forms send calendar dates and Nairobi wall-clock date-times without an offset. Calendar
// dates stay at UTC midnight so their YYYY-MM-DD identity is stable; date-times represent EAT.
export const parseNairobiInput = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T00:00:00.000Z`);
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return new Date(`${value}:00${NAIROBI_OFFSET}`);
  return toDate(value);
};

export const dayKey = (value) => toDate(value)?.toISOString().slice(0, 10) || null;

export const startOfDay = (value) => {
  const key = dayKey(value);
  return key ? new Date(`${key}T00:00:00${NAIROBI_OFFSET}`) : null;
};

export const endOfDay = (value) => {
  const key = dayKey(value);
  return key ? new Date(`${key}T23:59:59.999${NAIROBI_OFFSET}`) : null;
};

const earliest = (...dates) => dates.filter(Boolean).sort((a, b) => a - b)[0] || null;

// ---------------------------------------------------------------------------
// Session (training) lifecycle
//
// `status` on a session records only what an admin decided: draft, published, cancelled or
// completed. Everything that depends on the clock — whether registration is open, whether the
// session is running, whether it is over — is derived here and nowhere else. Storing a clock-based
// value is what previously let the database, the API and the admin screen disagree with each other.
// ---------------------------------------------------------------------------

// When registration starts. Defaults to the event's opening date-time; a session can override it.
export const registrationOpensAt = (training, event) =>
  toDate(training?.registrationOpensAt) || toDate(event?.registrationStart) || null;

// When registration ends. Whichever of these comes first:
//   1. the moment an admin closed this session early,
//   2. the start of the session's own day (so day 4 stays open while day 1 is running),
//   3. the event-wide cut-off, when the organisers set one (it is optional).
export const registrationClosesAt = (training, event) => earliest(
  toDate(training?.registrationClosesAt),
  startOfDay(training?.date),
  toDate(event?.registrationDeadline),
);

export const sessionStartsAt = (training) => getTrainingDateTime(training?.date, training?.startTime);
export const sessionEndsAt = (training) => getTrainingDateTime(training?.date, training?.endTime);

// The one function that answers "what is happening with this session right now?".
// `registeredCount` is optional; pass it where a live count is available so a full session is
// reported as closed instead of inviting a registration that will be rejected a moment later.
export const sessionPhase = (training, event, { now = new Date(), registeredCount = null } = {}) => {
  const closed = (reason) => ({ open: false, reason });

  if (!training) return { phase: 'draft', registration: closed('not_found') };
  if (training.status === 'cancelled') return { phase: 'cancelled', registration: closed('cancelled') };
  if (training.status === 'draft') return { phase: 'draft', registration: closed('draft') };

  const opensAt = registrationOpensAt(training, event);
  const closesAt = registrationClosesAt(training, event);
  const startsAt = sessionStartsAt(training);
  const endsAt = sessionEndsAt(training);
  const window = { opensAt, closesAt };
  const result = (phase, registration) => ({ phase, registration: { ...window, ...registration } });

  if (training.status === 'completed' || (endsAt && now >= endsAt)) return result('ended', closed('ended'));
  if (startsAt && now >= startsAt) return result('live', closed('live'));
  // A session with no usable schedule is treated as closed: a wrongly closed session is a support
  // question, a wrongly open one corrupts capacity and the attendance sheet.
  if (!opensAt || !closesAt) return result('registration_closed', closed('not_scheduled'));
  if (now < opensAt) return result('scheduled', closed('not_started'));
  if (now >= closesAt) return result('registration_closed', closed('closed'));

  const capacity = Number(training.capacity) || 0;
  const taken = registeredCount ?? training.filledSeats ?? 0;
  if (capacity > 0 && taken >= capacity) return result('registration_closed', closed('full'));

  return result('registration_open', { open: true });
};

export const registrationIsOpen = (training, event, options) => sessionPhase(training, event, options).registration.open;

// Plain-English wording, shared by the API messages and the screens, so a participant and an
// administrator are never told two different things about the same session.
export const SESSION_PHASE_LABELS = {
  draft: 'Draft',
  scheduled: 'Registration not open yet',
  registration_open: 'Registration open',
  registration_closed: 'Registration closed',
  live: 'Happening now',
  ended: 'Finished',
  cancelled: 'Cancelled',
};

export const registrationClosedReason = (registration = {}) => {
  const at = (value) => new Date(value).toLocaleString('en-US', { timeZone: 'Africa/Nairobi' });
  switch (registration.reason) {
    case 'not_started': return `Registration for this session opens on ${at(registration.opensAt)}.`;
    case 'closed': return `Registration for this session closed on ${at(registration.closesAt)}.`;
    case 'full': return 'This session is full.';
    case 'live': return 'This session has already started.';
    case 'ended': return 'This session is already finished.';
    case 'cancelled': return 'This session was cancelled.';
    case 'draft': return 'This session is not published yet.';
    case 'not_scheduled': return 'This session does not have a complete schedule yet.';
    default: return 'This session is not open for registration.';
  }
};

// Attaches the derived state to an API payload. Controllers call this instead of computing dates,
// and the screens read `phase` — so no screen ever has to repeat a rule that lives here.
export const withSessionPhase = (training, event, options) => {
  if (!training) return training;
  const plain = typeof training.toObject === 'function' ? training.toObject() : { ...training };
  const parentEvent = event || (plain.event && typeof plain.event === 'object' ? plain.event : null);
  const { phase, registration } = sessionPhase(plain, parentEvent, options);
  return { ...plain, phase, phaseLabel: SESSION_PHASE_LABELS[phase], registration };
};

// ---------------------------------------------------------------------------
// Event lifecycle — same idea: the event stores draft / published / cancelled, the rest is derived.
// ---------------------------------------------------------------------------

export const EVENT_PHASE_LABELS = {
  draft: 'Draft',
  scheduled: 'Registration not open yet',
  registration_open: 'Registration open',
  registration_closed: 'Registration closed',
  running: 'Running now',
  finished: 'Finished',
  cancelled: 'Cancelled',
};

export const eventPhase = (event, now = new Date()) => {
  if (!event) return 'draft';
  if (event.status === 'cancelled') return 'cancelled';
  if (event.status === 'draft') return 'draft';
  const startsAt = startOfDay(event.startDate);
  const endsAt = endOfDay(event.endDate);
  const opensAt = toDate(event.registrationStart);
  const closesAt = toDate(event.registrationDeadline);
  if (endsAt && now > endsAt) return 'finished';
  if (startsAt && now >= startsAt) return 'running';
  if (!opensAt || now < opensAt) return 'scheduled';
  if (closesAt && now >= closesAt) return 'registration_closed';
  return 'registration_open';
};

export const withEventPhase = (event, now = new Date()) => {
  if (!event) return event;
  const plain = typeof event.toObject === 'function' ? event.toObject() : { ...event };
  const phase = eventPhase(plain, now);
  return { ...plain, phase, phaseLabel: EVENT_PHASE_LABELS[phase] };
};

// Every day between the event's first and last date, inclusive. Days are generated from this list
// rather than typed in, so they can never be duplicated, out of order, or outside the event.
export const eventDayKeys = (event) => {
  const start = dayKey(event?.startDate);
  const end = dayKey(event?.endDate);
  if (!start || !end || start > end) return [];
  const keys = [];
  const cursor = new Date(`${start}T00:00:00.000Z`);
  const last = new Date(`${end}T00:00:00.000Z`);
  while (cursor <= last && keys.length < 60) {
    keys.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return keys;
};

// Returns persisted day records that would fall outside a proposed event range. Controllers use
// this before saving changed event dates, so a rejected resize cannot leave the event and its
// existing programme describing two different date ranges.
export const eventDaysOutsideRange = (days, event) => {
  const allowed = new Set(eventDayKeys(event));
  return (days || []).filter((day) => !allowed.has(dayKey(day?.date)));
};
