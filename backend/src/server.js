import 'dotenv/config';
import app from './app.js';
import connectDB from './config/db.js';
import mongoose from 'mongoose';
import { startCertificateIssuanceWorker, stopCertificateIssuanceWorker } from './services/certificateIssuanceWorker.js';
import { closeEmailTransporter } from './utils/email.js';

const PORT = process.env.PORT || 5113;
const PUBLIC_URL = process.env.BACKEND_URL || process.env.FRONTEND_URL || `http://localhost:${PORT}`;
const requiredProductionSettings = ['MONGODB_URI', 'JWT_SECRET', 'FRONTEND_URL', 'CORS_ORIGINS'];

const validateEnvironment = () => {
  if (process.env.NODE_ENV !== 'production') return;
  const missing = requiredProductionSettings.filter((name) => !process.env[name]?.trim());
  if (missing.length) throw new Error(`Missing required production settings: ${missing.join(', ')}`);
  if (process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters in production.');
  }
};

const startServer = async () => {
  try {
    validateEnvironment();
    await connectDB();
    if (process.env.DISABLE_BACKGROUND_WORKERS !== 'true') {
      startCertificateIssuanceWorker();
    }
    const server = app.listen(PORT, () => {
      console.log(`\n🚀 National Training Week server running on port ${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV}`);
      console.log(`   API: ${PUBLIC_URL}/api`);
      console.log(`   Health: ${PUBLIC_URL}/api/health\n`);
    });
    let shuttingDown = false;
    const shutdown = async (signal) => {
      if (shuttingDown) return;
      shuttingDown = true;
      console.log(`${signal} received. Closing HTTP server.`);
      const forcedExit = setTimeout(() => process.exit(1), 15_000);
      forcedExit.unref();
      server.close();
      await stopCertificateIssuanceWorker();
      closeEmailTransporter();
      await mongoose.disconnect();
      clearTimeout(forcedExit);
      process.exit(0);
    };
    process.once('SIGTERM', () => { void shutdown('SIGTERM'); });
    process.once('SIGINT', () => { void shutdown('SIGINT'); });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
