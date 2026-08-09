import 'dotenv/config';
import app from './app.js';
import connectDB from './config/db.js';

const PORT = process.env.PORT || 5113;
const PUBLIC_URL = process.env.BACKEND_URL || process.env.FRONTEND_URL || `http://localhost:${PORT}`;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`\n🚀 National Training Week server running on port ${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV}`);
      console.log(`   API: ${PUBLIC_URL}/api`);
      console.log(`   Health: ${PUBLIC_URL}/api/health\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
