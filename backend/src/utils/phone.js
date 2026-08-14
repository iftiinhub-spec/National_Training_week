import { parsePhoneNumberFromString } from 'libphonenumber-js/max';

const SOMALIA_PREFIXES = ['61', '77', '63', '62', '90', '65', '66', '68', '69', '71'];

export const normalizePhone = (value) => {
  if (!value) return '';
  let digits = String(value).replace(/\D/g, '');
  if (digits.startsWith('2520') && digits.length === 13) digits = `252${digits.slice(4)}`;
  return digits ? `+${digits}` : '';
};

export const INTERNATIONAL_PHONE_PATTERN = /^\+[1-9]\d{6,14}$/;

export const isValidInternationalPhone = (value) => {
  const normalized = normalizePhone(value);
  if (normalized.startsWith('+252')) {
    const national = normalized.slice(4);
    return national.length === 9 && SOMALIA_PREFIXES.some((prefix) => national.startsWith(prefix));
  }
  const parsed = normalized && parsePhoneNumberFromString(normalized);
  return Boolean(parsed?.isPossible() && parsed?.isValid());
};
