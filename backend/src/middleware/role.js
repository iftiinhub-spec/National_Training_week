// Role-based authorization middleware
// Must be used AFTER the protect middleware

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated.',
      });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}.`,
      });
    }
    next();
  };
};

// Shorthand middlewares
export const adminOnly = authorize('admin');
export const moderatorOnly = authorize('moderator');
export const participantOnly = authorize('participant');
export const adminOrModerator = authorize('admin', 'moderator');
