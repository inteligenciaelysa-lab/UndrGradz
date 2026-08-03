require('dotenv').config();
const app = require('./src/app');
const prisma = require('./src/database/prisma');

const PORT = process.env.PORT || 3000;

const { setupSocket } = require('./src/socket');

// Explicit 0.0.0.0 bind required by some container platforms; matches previous default behavior.
const server = app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to the database successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
});

// Start WebSockets server
setupSocket(server);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    prisma.$disconnect();
    console.log('💤 Database disconnected. Process terminated.');
  });
});
