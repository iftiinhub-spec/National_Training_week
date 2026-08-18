const validDate = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
};

export const eventTimelineError = (event) => {
  const startKey = validDate(event?.startDate)?.toISOString().slice(0, 10);
  const endKey = validDate(event?.endDate)?.toISOString().slice(0, 10);
  const startsAt = startKey ? validDate(`${startKey}T${event.startTime || '09:00'}:00+03:00`) : null;
  const opensAt = validDate(event?.registrationStart);
  const closesAt = validDate(event?.registrationDeadline);
  if (!startKey || !endKey || !startsAt) return 'Valid event start and end dates are required.';
  if (startKey > endKey) return 'The event end date cannot be before its start date.';
  if (Number(startKey.slice(0, 4)) !== Number(event.year) || Number(endKey.slice(0, 4)) !== Number(event.year)) return `The event dates must be in ${event.year}.`;
  if (!opensAt || !closesAt) return 'Valid registration opening and deadline date-times are required.';
  if (opensAt >= closesAt) return 'Registration must open before it closes.';
  if (closesAt >= startsAt) return 'Registration must close before the event starts.';
  return null;
};

export const eventDayTimelineError = (event, value) => {
  const parentError = eventTimelineError(event);
  if (parentError) return parentError;
  const dayKey = validDate(value)?.toISOString().slice(0, 10);
  const startKey = validDate(event.startDate).toISOString().slice(0, 10);
  const endKey = validDate(event.endDate).toISOString().slice(0, 10);
  if (!dayKey || dayKey < startKey || dayKey > endKey) return `Event day must be between ${startKey} and ${endKey}.`;
  return null;
};

export const eventStatusError = (event, status, now = new Date()) => {
  if (status === 'draft') return null;
  const timelineError = eventTimelineError(event);
  if (timelineError) return timelineError;
  const startKey = validDate(event.startDate).toISOString().slice(0, 10);
  const endKey = validDate(event.endDate).toISOString().slice(0, 10);
  const startsAt = validDate(`${startKey}T${event.startTime || '09:00'}:00+03:00`);
  const endsAt = validDate(`${endKey}T23:59:59.999+03:00`);
  const opensAt = validDate(event.registrationStart);
  const closesAt = validDate(event.registrationDeadline);
  const expected = now < opensAt ? 'registration_scheduled'
    : now < closesAt ? 'registration_open'
      : now < startsAt ? 'registration_closed'
        : now <= endsAt ? 'ongoing' : 'completed';
  return status === expected ? null : `Event status must be '${expected.replaceAll('_', ' ')}' for the current schedule.`;
};
