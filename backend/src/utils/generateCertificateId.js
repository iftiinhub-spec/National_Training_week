import { v4 as uuidv4 } from 'uuid';

// Generate a unique certificate ID in format: NTW-YYYY-XXXXXXXX
export const generateCertificateId = (year = new Date().getFullYear()) => {
  const unique = uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();
  return `NTW-${year}-${unique}`;
};
