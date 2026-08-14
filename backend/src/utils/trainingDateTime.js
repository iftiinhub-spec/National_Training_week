const TWELVE_HOUR_PATTERN = /^(0?[1-9]|1[0-2]):([0-5]\d)\s*(AM|PM)$/i;
const TWENTY_FOUR_HOUR_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const normalizeTrainingTime = (value) => {
  const input = String(value || '').trim();
  const twentyFourHourMatch = input.match(TWENTY_FOUR_HOUR_PATTERN);
  if (twentyFourHourMatch) return `${twentyFourHourMatch[1]}:${twentyFourHourMatch[2]}`;

  const twelveHourMatch = input.match(TWELVE_HOUR_PATTERN);
  if (!twelveHourMatch) return null;
  let hour = Number(twelveHourMatch[1]) % 12;
  if (twelveHourMatch[3].toUpperCase() === 'PM') hour += 12;
  return `${String(hour).padStart(2, '0')}:${twelveHourMatch[2]}`;
};

export const getTrainingDateTime = (date, time) => {
  const normalizedTime = normalizeTrainingTime(time);
  if (!date || !normalizedTime) return null;

  const trainingDate = new Date(date);
  if (!Number.isFinite(trainingDate.getTime())) return null;
  const datePart = trainingDate.toISOString().slice(0, 10);
  const result = new Date(`${datePart}T${normalizedTime}:00+03:00`);
  return Number.isFinite(result.getTime()) ? result : null;
};
