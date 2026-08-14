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
