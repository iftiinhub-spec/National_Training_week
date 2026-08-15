import { randomUUID } from 'node:crypto';

// Generate a unique certificate ID in format: NTW-YYYY-XXXXXXXX
export const generateCertificateId = (year = new Date().getFullYear()) => {
  const unique = randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase();
  return `NTW-${year}-${unique}`;
};

export const generateTrainerCertificateId = (year = new Date().getFullYear()) => {
  const unique = randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase();
  return `NTW-T-${year}-${unique}`;
};
