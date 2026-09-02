// Client-side mirror of the server's material upload cap (MAX_DOCUMENT_SIZE in
// backend/src/middleware/upload.js). Checking here means an oversized file is
// rejected instantly instead of after a long upload that the server discards.
export const MAX_MATERIAL_BYTES = 50 * 1024 * 1024;
export const MAX_MATERIAL_LABEL = '50MB';

// Rounds UP to one decimal so a file that is barely over the cap never prints as
// the cap itself ("That file is 50 MB. The maximum is 50MB" reads like a bug).
export const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = Math.ceil((bytes / 1024 ** index) * 10) / 10;
  return `${Number.isInteger(value) ? value : value.toFixed(1)} ${units[index]}`;
};

// Returns an error message when the file exceeds the cap, or '' when it is fine.
export const materialSizeError = (file) => {
  if (!file || file.size <= MAX_MATERIAL_BYTES) return '';
  return `That file is ${formatBytes(file.size)}. The maximum upload size is ${MAX_MATERIAL_LABEL}.`;
};
