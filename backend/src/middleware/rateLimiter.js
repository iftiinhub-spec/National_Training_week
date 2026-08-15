import rateLimit from 'express-rate-limit';

const accountOrIpKey = (req) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  return email ? `account:${email}` : `ip:${req.ip}`;
};

// Strict rate limiter for auth endpoints (login, register, password reset)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // count failed attempts only; successful requests are skipped below
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many attempts. Please try again in 15 minutes.',
  },
  skipSuccessfulRequests: true,
  keyGenerator: accountOrIpKey,
});

// General API rate limiter
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Math.max(100, Number(process.env.API_RATE_LIMIT_MAX) || 5_000),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please slow down.',
  },
  // Public read endpoints and health checks must stay available and should not
  // consume the operational admin/moderator request budget.
  skip: (req) => req.method === 'GET' && (
    req.path === '/health' || req.path.startsWith('/public/')
  ),
});

// QR check-in rate limiter (prevent rapid scanning)
export const qrRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  keyGenerator: (req) => req.user?._id ? `participant:${req.user._id}` : `ip:${req.ip}`,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many check-in attempts. Please wait a moment.',
  },
});
