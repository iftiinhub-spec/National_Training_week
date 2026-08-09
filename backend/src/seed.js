import 'dotenv/config';
import connectDB from './config/db.js';
import User from './models/User.js';
import Event from './models/Event.js';
import EventDay from './models/EventDay.js';
import Category from './models/Category.js';
import Trainer from './models/Trainer.js';

const seed = async () => {
  await connectDB();
  console.log('🌱 Seeding database...');

  // ── Admin user ──────────────────────────────────────────────────────────────
  const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL });
  if (!adminExists) {
    await User.create({
      fullName: process.env.ADMIN_NAME || 'System Administrator',
      email: process.env.ADMIN_EMAIL || 'admin@hormuud.edu.so',
      passwordHash: process.env.ADMIN_PASSWORD || 'Admin@2026',
      role: 'admin',
    });
    console.log('✅ Admin user created');
  } else {
    console.log('ℹ️  Admin already exists');
  }

  // ── 2026 Event ──────────────────────────────────────────────────────────────
  let event = await Event.findOne({ year: 2026 });
  if (!event) {
    event = await Event.create({
      name: 'National Training Week 2026',
      theme: 'Artificial Intelligence for National Transformation',
      year: 2026,
      startDate: new Date('2026-09-14'),
      endDate: new Date('2026-09-19'),
      registrationStart: new Date('2026-08-01'),
      registrationDeadline: new Date('2026-09-10'),
      description: 'The 2026 National Training Week focuses on Artificial Intelligence and its transformative role in national development. Six days of expert-led training sessions for professionals, students, and the general public.',
      status: 'registration_open',
    });
    console.log('✅ 2026 Event created');
  } else {
    console.log('ℹ️  2026 Event already exists');
  }

  // ── Event Days ──────────────────────────────────────────────────────────────
  const existingDays = await EventDay.countDocuments({ event: event._id });
  if (existingDays === 0) {
    const days = [
      { dayNumber: 1, theme: 'AI Literacy Day', date: new Date('2026-09-14') },
      { dayNumber: 2, theme: 'AI for Education Day', date: new Date('2026-09-15') },
      { dayNumber: 3, theme: 'AI for Business and Entrepreneurship', date: new Date('2026-09-16') },
      { dayNumber: 4, theme: 'AI for Community & Health', date: new Date('2026-09-17') },
      { dayNumber: 5, theme: 'AI for Graduates Day', date: new Date('2026-09-18') },
      { dayNumber: 6, theme: 'AI and Innovation Day', date: new Date('2026-09-19') },
    ];
    await EventDay.insertMany(days.map((d) => ({ ...d, event: event._id })));
    console.log('✅ 6 Event Days created');
  } else {
    console.log('ℹ️  Event days already exist');
  }

  // ── Categories ───────────────────────────────────────────────────────────────
  const catCount = await Category.countDocuments();
  if (catCount === 0) {
    await Category.insertMany([
      { name: 'Artificial Intelligence', description: 'AI concepts, tools and applications' },
      { name: 'Machine Learning', description: 'ML algorithms and practical applications' },
      { name: 'Data Science', description: 'Data analysis and visualization' },
      { name: 'Cybersecurity', description: 'Digital security and privacy' },
      { name: 'Digital Skills', description: 'Essential digital literacy skills' },
      { name: 'Entrepreneurship', description: 'Business and startup skills' },
      { name: 'Healthcare Technology', description: 'Technology in health and medicine' },
      { name: 'Education Technology', description: 'Technology in teaching and learning' },
    ]);
    console.log('✅ Categories seeded');
  } else {
    console.log('ℹ️  Categories already exist');
  }

  // ── Sample Trainers ──────────────────────────────────────────────────────────
  const trainerCount = await Trainer.countDocuments();
  if (trainerCount === 0) {
    await Trainer.insertMany([
      { name: 'Dr. Ahmed Hassan', email: 'a.hassan@example.com', title: 'Dr.', organization: 'National Training Week', expertise: ['AI', 'Machine Learning'], biography: 'Expert in AI with 10+ years of research experience.' },
      { name: 'Prof. Fatima Osman', email: 'f.osman@example.com', title: 'Prof.', organization: 'University of Mogadishu', expertise: ['Data Science', 'Statistics'], biography: 'Professor of Data Science and Analytics.' },
      { name: 'Eng. Mohamed Ali', email: 'm.ali@example.com', title: 'Eng.', organization: 'Tech Somalia', expertise: ['Cybersecurity', 'Networking'], biography: 'Senior cybersecurity engineer with international experience.' },
    ]);
    console.log('✅ Sample trainers seeded');
  } else {
    console.log('ℹ️  Trainers already exist');
  }

  console.log('\n✨ Seeding complete!');
  console.log(`   Admin: ${process.env.ADMIN_EMAIL} / ${process.env.ADMIN_PASSWORD}`);
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
