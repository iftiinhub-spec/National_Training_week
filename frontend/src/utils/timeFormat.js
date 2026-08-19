const TWENTY_FOUR_HOUR_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const TWELVE_HOUR_PATTERN = /^(0?[1-9]|1[0-2]):([0-5]\d)\s*(AM|PM)$/i;

export const toTimeInputValue = (value = '') => {
  const input = String(value || '').trim();
  const twentyFourHourMatch = input.match(TWENTY_FOUR_HOUR_PATTERN);
  if (twentyFourHourMatch) return `${twentyFourHourMatch[1]}:${twentyFourHourMatch[2]}`;

  const twelveHourMatch = input.match(TWELVE_HOUR_PATTERN);
  if (!twelveHourMatch) return '';
  let hour = Number(twelveHourMatch[1]) % 12;
  if (twelveHourMatch[3].toUpperCase() === 'PM') hour += 12;
  return `${String(hour).padStart(2, '0')}:${twelveHourMatch[2]}`;
};

export const formatTime12 = (value) => {
  const normalized = toTimeInputValue(value);
  if (!normalized) return 'TBA';
  const [hour, minute] = normalized.split(':').map(Number);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export const formatTimeRange12 = (start, end) => (
  end ? `${formatTime12(start)} - ${formatTime12(end)}` : formatTime12(start)
);
