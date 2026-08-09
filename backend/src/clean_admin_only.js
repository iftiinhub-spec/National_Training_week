import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import Attendance from './models/Attendance.js';
import Category from './models/Category.js';
import Certificate from './models/Certificate.js';
import Communication from './models/Communication.js';
import ContactMessage from './models/ContactMessage.js';
import Event from './models/Event.js';
import EventDay from './models/EventDay.js';
import Feedback from './models/Feedback.js';
import Meeting from './models/Meeting.js';
import QRSession from './models/QRSession.js';
import Recording from './models/Recording.js';
import Registration from './models/Registration.js';
import Trainer from './models/Trainer.js';
import Training from './models/Training.js';
import User from './models/User.js';

const collections = [
  ['attendance', Attendance], ['categories', Category], ['certificates', Certificate],
  ['communications', Communication], ['contact messages', ContactMessage], ['events', Event],
  ['event days', EventDay], ['feedback', Feedback], ['meetings', Meeting],
  ['QR sessions', QRSession], ['recordings', Recording], ['registrations', Registration],
  ['trainer profiles', Trainer], ['trainings', Training],
];

const clean = async () => {
  await connectDB();
  const admins = await User.countDocuments({ role: 'admin' });
  if (!admins) throw new Error('Cleanup stopped because no administrator account exists.');

  for (const [label, Model] of collections) {
    const result = await Model.deleteMany({});
    console.log(`${label}: removed ${result.deletedCount}`);
  }
  const users = await User.deleteMany({ role: { $ne: 'admin' } });
  console.log(`non-admin users: removed ${users.deletedCount}`);
  console.log(`administrator accounts preserved: ${await User.countDocuments({ role: 'admin' })}`);
};

clean()
  .catch((error) => { console.error(`Cleanup failed: ${error.message}`); process.exitCode = 1; })
  .finally(async () => { await mongoose.disconnect(); });
