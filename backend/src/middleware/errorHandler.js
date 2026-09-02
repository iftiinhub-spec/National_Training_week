import { MAX_DOCUMENT_SIZE, MAX_FILE_SIZE } from './upload.js';

// Centralized error handler - must be last middleware in Express chain
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = `${field ? field.charAt(0).toUpperCase() + field.slice(1) : 'Value'} already exists.`;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Upload failures are things the user can correct, not server faults.
  if (err.name === 'MulterError') {
    statusCode = 400;
    // Documents arrive on the `file` field; every other field is an image, which has a tighter cap.
    const limit = err.field === 'file' ? MAX_DOCUMENT_SIZE : MAX_FILE_SIZE;
    message = err.code === 'LIMIT_FILE_SIZE'
      ? `The file is too large. The maximum upload size is ${Math.round(limit / (1024 * 1024))}MB.`
      : err.code === 'LIMIT_FILE_COUNT' ? 'Only one file can be uploaded at a time.' : 'File upload failed.';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired.';
  }

  // Log the real cause server-side before the response (below) masks it for clients.
  if (statusCode >= 500) {
    console.error(`[${req.method} ${req.originalUrl}]`, err);
  }

  // Hide database, filesystem, SMTP, and implementation details for
  // unexpected production failures.
  if (statusCode >= 500 && process.env.NODE_ENV === 'production') {
    message = 'Internal server error.';
  }

  // Do NOT expose stack traces or internal details to clients
  const response = {
    success: false,
    message,
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export default errorHandler;
