import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV !== 'production';

const isLocalRequest = (req: any): boolean => {
  const ip = req.ip || req.connection?.remoteAddress || '';
  return (
    isDev ||
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip === '::ffff:127.0.0.1' ||
    req.hostname === 'localhost' ||
    req.headers?.host?.includes('localhost') ||
    req.headers?.host?.includes('127.0.0.1')
  );
};

/**
 * Global rate limiter: generous in dev/test, safe in prod.
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100000 : 5000,
  skip: (req) => isLocalRequest(req),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Please try again in a few moments.',
  },
});

/**
 * Authentication limiter: generous in dev/test, protective in prod.
 * Previously was set to max: 5 which locked out normal testing and signups.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100000 : 200,
  skip: (req) => isLocalRequest(req),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Too many authentication attempts. Please try again in a few moments.',
  },
});
