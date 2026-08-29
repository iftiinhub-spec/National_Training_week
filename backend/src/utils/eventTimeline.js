import { dayKey, endOfDay, startOfDay } from './lifecycle.js';

const validDate = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
};

// The rules an edition's dates must follow. There is deliberately no rule forcing registration to
// finish before the event starts: registration closes per session, on that session's own day, so a
// six-day edition can keep taking sign-ups for its later days while its first days are running.
export const eventTimelineError = (event) => {
  const startKey = dayKey(event?.startDate);
  const endKey = dayKey(event?.endDate);
  if (!startKey || !endKey) return 'Valid event start and end dates are required.';
  if (startKey > endKey) return 'The event end date cannot be before its start date.';
  if (Number(startKey.slice(0, 4)) !== Number(event.year) || Number(endKey.slice(0, 4)) !== Number(event.year)) {
    return `The event dates must be in ${event.year}.`;
  }

  const opensAt = validDate(event?.registrationStart);
  if (!opensAt) return 'A valid registration opening date and time is required.';
  const eventEndsAt = endOfDay(endKey);
  if (opensAt > eventEndsAt) return 'Registration cannot open after the event has finished.';

  // The event-wide cut-off is optional. When it is set it only brings the closing time forward.
  const closesAt = validDate(event?.registrationDeadline);
  if (closesAt) {
    if (opensAt >= closesAt) return 'Registration must open before it closes.';
    if (closesAt > eventEndsAt) return 'The registration cut-off cannot be after the event has finished.';
  }
  return null;
};

export const eventDayTimelineError = (event, value) => {
  const parentError = eventTimelineError(event);
  if (parentError) return parentError;
  const key = dayKey(value);
  const startKey = dayKey(event.startDate);
  const endKey = dayKey(event.endDate);
  if (!key || key < startKey || key > endKey) return `Event day must be between ${startKey} and ${endKey}.`;
  return null;
};

// Kept for callers that need the event's own window as instants rather than as an error message.
export const eventWindow = (event) => ({
  startsAt: startOfDay(event?.startDate),
  endsAt: endOfDay(event?.endDate),
  opensAt: validDate(event?.registrationStart),
  closesAt: validDate(event?.registrationDeadline),
});
