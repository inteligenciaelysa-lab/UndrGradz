const os = require('os');
const prisma = require('../database/prisma');

// In-memory ring buffer for recent system error logs (max 50)
const errorLogBuffer = [];

const recordSystemError = (err, context = {}) => {
  errorLogBuffer.unshift({
    timestamp: new Date().toISOString(),
    message: err.message || String(err),
    stack: err.stack ? err.stack.split('\n').slice(0, 3).join('\n') : null,
    context,
  });
  if (errorLogBuffer.length > 50) {
    errorLogBuffer.pop();
  }
};

const getSystemHealth = async () => {
  const startTime = Date.now();
  let dbStatus = 'HEALTHY';
  let dbLatencyMs = 0;

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
  } catch (err) {
    dbStatus = 'UNHEALTHY';
    recordSystemError(err, { component: 'Database' });
  }

  // Socket.io metrics safely checked
  let socketCount = 0;
  try {
    const io = global.ioInstance;
    if (io && io.sockets) {
      socketCount = io.sockets.sockets.size || 0;
    }
  } catch (e) {}

  const memoryUsage = process.memoryUsage();
  const freeMemMb = Math.round(os.freemem() / (1024 * 1024));
  const totalMemMb = Math.round(os.totalmem() / (1024 * 1024));
  const heapUsedMb = Math.round(memoryUsage.heapUsed / (1024 * 1024));
  const heapTotalMb = Math.round(memoryUsage.heapTotal / (1024 * 1024));

  const cpus = os.cpus();
  const cpuLoadAvg = os.loadavg ? os.loadavg() : [0, 0, 0];

  return {
    backend: {
      status: 'ONLINE',
      uptimeSeconds: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
    },
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
      provider: 'PostgreSQL',
    },
    socketIo: {
      status: 'ACTIVE',
      connectedClients: socketCount,
    },
    serverResources: {
      memory: {
        heapUsedMb,
        heapTotalMb,
        systemFreeMb: freeMemMb,
        systemTotalMb: totalMemMb,
        memoryUsagePercent: Math.round(((totalMemMb - freeMemMb) / totalMemMb) * 100),
      },
      cpu: {
        cores: cpus.length,
        model: cpus[0] ? cpus[0].model : 'CPU',
        loadAvg: cpuLoadAvg.map(val => Number(val.toFixed(2))),
      },
    },
    recentErrors: errorLogBuffer.slice(0, 10),
  };
};

module.exports = {
  getSystemHealth,
  recordSystemError,
};
