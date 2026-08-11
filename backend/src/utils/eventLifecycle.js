export const getAutomaticEventStatus = (event, now = new Date()) => {
  if (!event || event.status === 'draft' || event.status === 'completed') return event?.status;
  const eventStart = event.startDate
    ? new Date(`${new Date(event.startDate).toISOString().slice(0, 10)}T${event.startTime || '09:00'}:00+03:00`)
    : null;
  const eventEnd = event.endDate
    ? new Date(`${new Date(event.endDate).toISOString().slice(0, 10)}T23:59:59+03:00`)
    : null;
  if (eventEnd && now > eventEnd) return 'completed';
  if (eventStart && now >= eventStart) return 'ongoing';
  if (event.registrationDeadline && now >= new Date(event.registrationDeadline)) return 'registration_closed';
  if (event.registrationStart && now >= new Date(event.registrationStart)) return 'registration_open';
  return 'registration_scheduled';
};

export const syncEventStatus = async (event) => {
  if (!event) return event;
  const status = getAutomaticEventStatus(event);
  if (status && status !== event.status) {
    event.status = status;
    await event.save();
  }
  return event;
};
