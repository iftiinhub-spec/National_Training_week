import multer from 'multer';
import path from 'path';
import { randomUUID } from 'node:crypto';
import fs from 'fs';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; // 5MB default
const ALLOWED_FIELDS = new Set(['profilePhoto', 'photo', 'coverImage', 'certificateSignature', 'sponsorLogo']);

const ensureUploadDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads', file.fieldname);
    ensureUploadDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    // Generate safe filename - never trust original filename
    const safeName = `${randomUUID()}${ext}`;
    cb(null, safeName);
  },
});

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_FIELDS.has(file.fieldname)) {
    return cb(new Error('Unexpected upload field.'), false);
  }
  // Validate MIME type
  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    return cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
  }
  // Validate extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
    return cb(new Error('Invalid file extension.'), false);
  }
  cb(null, true);
};

export const uploadImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

export const hasValidImageSignature = (buffer) => {
  if (buffer.length < 12) return false;
  const jpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const png = buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const webp = buffer.subarray(0, 4).toString('ascii') === 'RIFF'
    && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  return jpeg || png || webp;
};

// Multer's MIME value comes from the client. Verify the actual file header too.
export const verifyUploadedImage = async (req, res, next) => {
  if (!req.file) return next();
  try {
    const handle = await fs.promises.open(req.file.path, 'r');
    const buffer = Buffer.alloc(16);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    await handle.close();
    if (!hasValidImageSignature(buffer.subarray(0, bytesRead))) {
      deleteFile(req.file.path);
      req.file = undefined;
      return res.status(400).json({ success: false, message: 'Uploaded file is not a valid JPEG, PNG, or WebP image.' });
    }
    return next();
  } catch (error) {
    if (req.file?.path) deleteFile(req.file.path);
    return next(error);
  }
};

// Delete a file from disk
export const deleteFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// --- Training materials (documents) ---
// Stored OUTSIDE the statically served uploads/ directory, so a document can only be reached
// through the authenticated download route that checks for an approved registration.
const ALLOWED_DOCUMENT_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'application/vnd.ms-powerpoint': ['.ppt'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
  'text/plain': ['.txt'],
  'application/zip': ['.zip'],
};
const MAX_DOCUMENT_SIZE = parseInt(process.env.MAX_DOCUMENT_SIZE) || 25 * 1024 * 1024; // 25MB default

export const MATERIALS_DIR = path.join(process.cwd(), process.env.MATERIALS_DIR || 'private_uploads/materials');

const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureUploadDir(MATERIALS_DIR);
    cb(null, MATERIALS_DIR);
  },
  filename: (req, file, cb) => {
    // Never trust the original filename on disk; the real name is kept in the database.
    cb(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`);
  },
});

// Rejections carry a 400 so the error handler reports them as user-correctable, not as a crash.
const rejectUpload = (message) => Object.assign(new Error(message), { statusCode: 400 });

const documentFilter = (req, file, cb) => {
  if (file.fieldname !== 'file') return cb(rejectUpload('Unexpected upload field.'), false);
  const extensions = ALLOWED_DOCUMENT_TYPES[file.mimetype];
  if (!extensions) {
    return cb(rejectUpload('Invalid file type. Allowed: PDF, PowerPoint, Word, Excel, text and zip files.'), false);
  }
  if (!extensions.includes(path.extname(file.originalname).toLowerCase())) {
    return cb(rejectUpload('The file extension does not match its content type.'), false);
  }
  cb(null, true);
};

export const uploadMaterial = multer({
  storage: documentStorage,
  fileFilter: documentFilter,
  limits: { fileSize: MAX_DOCUMENT_SIZE, files: 1 },
});
