import { getTrainingDateTime } from './trainingDateTime.js';

export const getRegistrationWindowState = (event, now = new Date()) => {
  const start = event?.registrationStart ? new Date(event.registrationStart) : null;
  const deadline = event?.registrationDeadline ? new Date(event.registrationDeadline) : null;

  if (!start || !deadline || !Number.isFinite(start.getTime()) || !Number.isFinite(deadline.getTime())) {
    return 'unconfigured';
  }
  if (now < start) return 'scheduled';
  if (now >= deadline) return 'closed';
  return 'open';
};

// Registration for a session closes when that session's own day begins, rather than on a single
// event-wide deadline. getTrainingDateTime builds the instant in Africa/Nairobi (+03:00), which is
// what every other date rule in the system uses — computing it in UTC would leave registration open
// until 03:00 local on the morning of each session.
export const registrationClosesAt = (training) => getTrainingDateTime(training?.date, '00:00');

// Returns why registration is closed, so callers can explain it instead of guessing.
export const registrationState = (training, event, now = new Date()) => {
  if (!training) return { open: false, reason: 'not_found' };
  if (training.status !== 'registration_open') return { open: false, reason: 'not_open' };

  const opensAt = event?.registrationStart ? new Date(event.registrationStart) : null;
  if (opensAt && Number.isFinite(opensAt.getTime()) && now < opensAt) {
    return { open: false, reason: 'not_started', opensAt };
  }

  const closesAt = registrationClosesAt(training);
  // A session with no usable date is treated as closed: a wrongly closed session is a support
  // question, a wrongly open one corrupts capacity and the attendance sheet.
  if (!closesAt) return { open: false, reason: 'no_date' };
  if (now >= closesAt) return { open: false, reason: 'day_reached', closesAt };

  return { open: true, closesAt };
};

export const registrationIsOpen = (training, event, now = new Date()) =>
  registrationState(training, event, now).open;

// `status` is an operational field an admin sets; once a session's day arrives it no longer
// describes what the public can actually do. This is the status the public should be shown.
export const publicDisplayStatus = (training, event, now = new Date()) => {
  if (training?.status === 'registration_open' && !registrationIsOpen(training, event, now)) {
    return 'registration_closed';
  }
  return training?.status;
};
