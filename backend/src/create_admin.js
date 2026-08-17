import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User from './models/User.js';

const createAdmin = async () => {
  const [fullName, email, password] = process.argv.slice(2);

  if (!fullName || !email || !password) {
    throw new Error('Usage: npm run create:admin -- "Full Name" email@example.com password123');
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (password.length < 8) {
    throw new Error('Password must contain at least 8 characters.');
  }

  await connectDB();

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw new Error(`An account with ${normalizedEmail} already exists (role: ${existing.role}). Choose a different email.`);
  }

  await User.create({ fullName, email: normalizedEmail, passwordHash: password, role: 'admin' });
  console.log(`Administrator created successfully: ${normalizedEmail}`);
};

createAdmin()
  .catch((error) => {
    console.error(`Admin creation failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
