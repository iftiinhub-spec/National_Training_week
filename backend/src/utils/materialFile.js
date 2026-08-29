import fs from 'node:fs';
import path from 'node:path';
import { MATERIALS_DIR } from '../middleware/upload.js';

// Material files live outside the statically served uploads/ directory, so they are only ever
// reached through a route that has already authorised the caller.
export const resolveMaterialPath = (material) => {
  const stored = material?.file?.path;
  if (!stored) return null;
  // Reduce to a bare filename before resolving, so a stored value can never escape the directory.
  const absolute = path.resolve(MATERIALS_DIR, path.basename(stored));
  if (!absolute.startsWith(path.resolve(MATERIALS_DIR))) return null;
  return fs.existsSync(absolute) ? absolute : null;
};

export const removeMaterialFile = (material) => {
  const absolute = resolveMaterialPath(material);
  if (absolute) fs.promises.unlink(absolute).catch(() => null);
};

// Removes a file multer already wrote to disk when the request is rejected afterwards.
export const discardUpload = (file) => {
  if (file?.path) fs.promises.unlink(file.path).catch(() => null);
};
