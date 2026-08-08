import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; // 5MB default

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
    const safeName = `${uuidv4()}${ext}`;
    cb(null, safeName);
  },
});

const fileFilter = (req, file, cb) => {
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

// Delete a file from disk
export const deleteFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// Get public URL for an uploaded file
export const getFileUrl = (req, relativePath) => {
  if (!relativePath) return null;
  return `${req.protocol}://${req.get('host')}/${relativePath.replace(/\\/g, '/')}`;
};
