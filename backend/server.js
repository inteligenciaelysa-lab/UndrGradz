require('dotenv').config();
const app = require('./src/app');
const prisma = require('./src/database/prisma');

const PORT = process.env.PORT || 3000;

const { setupSocket } = require('./src/socket');

const server = app.listen(PORT, async () => {
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
