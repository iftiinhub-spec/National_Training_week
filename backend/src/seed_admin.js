import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User from './models/User.js';

const createAdmin = async () => {
  const fullName = process.env.ADMIN_NAME?.trim() || 'System Administrator';
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env before creating the administrator.');
  }
  if (password.length < 8) {
    throw new Error('ADMIN_PASSWORD must contain at least 8 characters.');
  }

  await connectDB();

  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role !== 'admin') {
      throw new Error('That email already belongs to a non-admin account. Choose another ADMIN_EMAIL.');
    }
    console.log(`Administrator already exists: ${email}`);
    return;
  }

  await User.create({ fullName, email, passwordHash: password, role: 'admin' });
  console.log(`Administrator created successfully: ${email}`);
};

createAdmin()
  .catch((error) => {
    console.error(`Admin setup failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
