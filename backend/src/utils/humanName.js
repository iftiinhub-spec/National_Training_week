const LETTER = /[\p{L}\p{M}]/gu;
const ALLOWED_NAME = /^[\p{L}\p{M}](?:[\p{L}\p{M}\s.'’\-]*[\p{L}\p{M}])?$/u;
const REPEATED_SEPARATOR = /[.'’\-]{2,}/u;

export const normalizeHumanName = (value) => typeof value === 'string'
  ? value.normalize('NFC').trim().replace(/\s+/g, ' ')
  : value;

export const isValidHumanName = (value) => {
  const name = normalizeHumanName(value);
  if (typeof name !== 'string' || name.length < 2 || name.length > 100) return false;
  if (!ALLOWED_NAME.test(name) || REPEATED_SEPARATOR.test(name)) return false;
  return (name.match(LETTER) || []).length >= 2;
};

export const HUMAN_NAME_MESSAGE = 'Enter a valid name using letters, spaces, apostrophes, periods, or hyphens.';
