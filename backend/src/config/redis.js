const Redis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL;
const isRedisEnabled = !!REDIS_URL;

// Dedicated pub/sub clients for the Socket.io Redis adapter. Left null when
// REDIS_URL is not set (local dev), so socket.js falls back to Socket.io's
// built-in in-memory adapter with zero extra setup required.
let pubClient = null;
let subClient = null;

if (isRedisEnabled) {
  pubClient = new Redis(REDIS_URL);
  subClient = pubClient.duplicate();

  pubClient.on('error', (err) => console.error('❌ Redis pubClient error:', err.message));
  subClient.on('error', (err) => console.error('❌ Redis subClient error:', err.message));
}

module.exports = { pubClient, subClient, isRedisEnabled };
