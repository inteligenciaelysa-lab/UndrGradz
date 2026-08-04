// Explicit allowlist for cross-origin requests, replacing the old "reflect any
// Origin" behavior now that the app is split across real subdomains.
// Override in production via ALLOWED_ORIGINS (comma-separated).
const DEFAULT_ALLOWED_ORIGINS = [
  'https://undrgradz.com',
  'https://app.undrgradz.com',
  'https://admin.undrgradz.com',
  'https://api.undrgradz.com',
];

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : DEFAULT_ALLOWED_ORIGINS;

const isProduction = process.env.NODE_ENV === 'production' || !!process.env.K_SERVICE;

// Requests with no Origin header (native apps, curl, server-to-server) are
// allowed through — there is no browser origin to check in that case.
// Outside production (local dev, LAN testing) any origin is still reflected,
// since dev hosts vary (localhost, 192.168.x.x, etc.) and aren't worth listing.
const corsOriginCallback = (origin, callback) => {
  if (!origin || origin === 'null' || !isProduction || allowedOrigins.includes(origin)) {
    return callback(null, true);
  }
  return callback(new Error(`Origin not allowed by CORS: ${origin}`));
};

module.exports = { allowedOrigins, corsOriginCallback };
