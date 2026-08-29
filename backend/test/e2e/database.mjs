import mongoose from 'mongoose';
import User from '../../src/models/User.js';
import Trainer from '../../src/models/Trainer.js';
import Event from '../../src/models/Event.js';
import EventDay from '../../src/models/EventDay.js';
import Category from '../../src/models/Category.js';
import Training from '../../src/models/Training.js';
import fs from 'node:fs';
import path from 'node:path';

const mode = process.argv[2];
const uri = process.env.MONGODB_URI;
if (!uri) throw new Error('MONGODB_URI is required.');

const parsed = new URL(uri);
const databaseName = parsed.pathname.replace(/^\//, '').split('?')[0];
if (!databaseName.endsWith('_e2e')) {
  throw new Error(`Refusing E2E database operation for unsafe database name: ${databaseName || '(empty)'}`);
}

await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
try {
  if (mode === 'verify') {
    const [users, trainings] = await Promise.all([User.countDocuments(), Training.countDocuments()]);
    if (users !== 3 || trainings !== 1) throw new Error(`E2E fixture verification failed: ${users} users, ${trainings} trainings.`);
    const admin = await User.findOne({ email: 'admin.e2e@example.com' }).select('+passwordHash');
    if (!admin || !(await admin.comparePassword('AdminE2E123!'))) throw new Error('E2E admin password verification failed.');
    console.log(`E2E fixtures verified: ${users} users, ${trainings} training.`);
  } else if (mode === 'cleanup') {
    await mongoose.connection.dropDatabase();
    console.log(`Removed isolated E2E database: ${databaseName}`);
  } else if (mode === 'setup') {
    await mongoose.connection.dropDatabase();
    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);

    const admin = await User.create({
      fullName: 'Browser Test Administrator', email: 'admin.e2e@example.com',
      passwordHash: 'AdminE2E123!', role: 'admin', isActive: true,
    });
    const moderator = await User.create({
      fullName: 'Browser Test Moderator', email: 'moderator.e2e@example.com',
      passwordHash: 'ModeratorE2E123!', role: 'moderator', isActive: true,
    });
    const trainerUser = await User.create({
      fullName: 'Browser Test Trainer', email: 'trainer.e2e@example.com',
      passwordHash: 'TrainerE2E123!', role: 'trainer', isActive: true, accountStatus: 'approved',
    });
    const passwordChecks = await Promise.all([
      admin.comparePassword('AdminE2E123!'),
      moderator.comparePassword('ModeratorE2E123!'),
      trainerUser.comparePassword('TrainerE2E123!'),
    ]);
    if (passwordChecks.some((valid) => !valid)) throw new Error('Seeded E2E account password verification failed.');
    const trainer = await Trainer.create({
      name: 'Browser Test Trainer', email: trainerUser.email, user: trainerUser._id,
      title: 'Dr.', organization: 'E2E Academy', biography: 'Isolated browser workflow trainer.',
      expertise: ['Testing'], accessStatus: 'approved', isActive: true,
    });
    trainerUser.trainerProfile = trainer._id;
    await trainerUser.save({ validateBeforeSave: false });

    const event = await Event.create({
      name: 'E2E National Training Week', theme: 'Safe Browser Testing', year: now.getFullYear(),
      startDate: dayStart, endDate: dayStart,
      registrationStart: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      registrationDeadline: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      status: 'published', isActive: true, isCurrent: true,
    });
    const eventDay = await EventDay.create({ event: event._id, dayNumber: 1, theme: 'End-to-End Day', date: dayStart });
    const category = await Category.create({ name: 'E2E Testing', description: 'Isolated automated testing category.' });
    const training = await Training.create({
      title: 'E2E Complete Workflow Session', description: 'A session used only inside the isolated E2E database.',
      event: event._id, eventDay: eventDay._id, category: category._id,
      trainer: trainer._id, moderator: moderator._id, date: dayStart,
      startTime: '00:00', endTime: '00:01', status: 'published', capacity: 100,
      registrationRequired: true, language: 'English', level: 'general',
    });
    const fixturePath = process.env.E2E_FIXTURE_PATH;
    if (!fixturePath) throw new Error('E2E_FIXTURE_PATH is required.');
    fs.mkdirSync(path.dirname(fixturePath), { recursive: true });
    fs.writeFileSync(fixturePath, JSON.stringify({
      trainingId: String(training._id),
    }));
    console.log(JSON.stringify({ admin: String(admin._id), moderator: String(moderator._id), trainer: String(trainer._id), training: String(training._id) }));
  } else {
    throw new Error('Use setup or cleanup.');
  }
} finally {
  await mongoose.disconnect();
}
