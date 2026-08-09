import 'dotenv/config';
import connectDB from './config/db.js';
import User from './models/User.js';
import Event from './models/Event.js';
import EventDay from './models/EventDay.js';
import Category from './models/Category.js';
import Trainer from './models/Trainer.js';
import Training from './models/Training.js';

const seed = async () => {
  await connectDB();
  console.log('\n🌱  Full seed starting...\n');

  // ── 1. Admin ─────────────────────────────────────────────────────────────────
  let admin = await User.findOne({ email: process.env.ADMIN_EMAIL || 'admin@hormuud.edu.so' });
  if (!admin) {
    admin = await User.create({
      fullName: process.env.ADMIN_NAME || 'System Administrator',
      email: process.env.ADMIN_EMAIL || 'admin@hormuud.edu.so',
      passwordHash: process.env.ADMIN_PASSWORD || 'Admin@2026',
      role: 'admin',
    });
    console.log('✅  Admin created:', admin.email);
  } else {
    console.log('ℹ️   Admin already exists');
  }

  // ── 2. Event ─────────────────────────────────────────────────────────────────
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
      description: 'Six days of expert-led AI training for professionals, students, and the general public — 100% free and certified.',
      status: 'registration_open',
      isCurrent: true,
    });
    console.log('✅  Event created');
  } else {
    event.isCurrent = true;
    await event.save();
    console.log('ℹ️   Event already exists');
  }

  // ── 3. Event Days ────────────────────────────────────────────────────────────
  await EventDay.deleteMany({ event: event._id });
  const dayDefs = [
    { dayNumber: 1, theme: 'AI Literacy Day',                       date: new Date('2026-09-14') },
    { dayNumber: 2, theme: 'AI for Education',                      date: new Date('2026-09-15') },
    { dayNumber: 3, theme: 'AI for Business',                       date: new Date('2026-09-16') },
    { dayNumber: 4, theme: 'AI & Health',                           date: new Date('2026-09-17') },
    { dayNumber: 5, theme: 'AI for Graduates',                      date: new Date('2026-09-18') },
    { dayNumber: 6, theme: 'AI Innovation',                         date: new Date('2026-09-19') },
  ];
  const days = await EventDay.insertMany(dayDefs.map(d => ({ ...d, event: event._id })));
  console.log('✅  6 Event Days created');

  // ── 4. Categories ─────────────────────────────────────────────────────────────
  await Category.deleteMany({});
  const catDefs = [
    'Artificial Intelligence', 'Machine Learning', 'Data Science',
    'Cybersecurity', 'Digital Skills', 'Entrepreneurship',
    'Healthcare Technology', 'Education Technology', 'NLP & Language',
    'Computer Vision', 'Robotics & Automation', 'AI Ethics',
  ];
  const cats = await Category.insertMany(catDefs.map(n => ({ name: n })));
  const catMap = Object.fromEntries(cats.map(c => [c.name, c._id]));
  console.log('✅  Categories seeded');

  // ── 5. Trainers ───────────────────────────────────────────────────────────────
  await Trainer.deleteMany({});
  const trainerDefs = [
    { name: 'Dr. Ahmed Hassan',   title: 'Dr.',   organization: 'National Training Week',    photo: 'speakers/dr_ahmed_hassan.jpg', expertise: ['AI', 'Machine Learning'],         biography: 'AI researcher with 12 years of experience in ML systems and national digital transformation.' },
    { name: 'Prof. Fatima Osman', title: 'Prof.', organization: 'University of Mogadishu',   photo: 'speakers/prof_fatima_osman.jpg', expertise: ['Data Science', 'Statistics'],      biography: 'Professor of Data Science with specialisation in big data for development.' },
    { name: 'Eng. Mohamed Ali',   title: 'Eng.',  organization: 'Tech Somalia',              photo: 'speakers/eng_mohamed_ali.jpg', expertise: ['Cybersecurity', 'Networking'],     biography: 'Senior cybersecurity engineer with international certification and field experience.' },
    { name: 'Dr. Fadumo Ahmed',   title: 'Dr.',   organization: 'Mogadishu Teaching Hospital', photo: 'speakers/dr_fadumo_ahmed.jpg', expertise: ['Healthcare AI', 'Diagnostics'],  biography: 'Medical doctor and AI researcher pioneering telemedicine applications in Somalia.' },
    { name: 'Eng. Liban Abdi',    title: 'Eng.',  organization: 'Somali NLP Lab',            photo: 'speakers/eng_liban_abdi.jpg', expertise: ['NLP', 'Somali Language AI'],       biography: 'Computational linguist and lead developer of the first open-source Somali language model.' },
    { name: 'Eng. Sahra Osman',   title: 'Eng.',  organization: 'GreenTech Somalia',         photo: 'speakers/eng_sahra_osman.jpg', expertise: ['AI Agriculture', 'Climate Tech'],  biography: 'Environmental engineer applying AI to climate monitoring and sustainable agriculture.' },
  ];
  const trainers = await Trainer.insertMany(trainerDefs.map((t, i) => ({ ...t, email: `trainer${i+1}@ntw2026.so` })));
  console.log('✅  6 Trainers created');

  // ── 6. Moderator Users (one per session = 18 total) ──────────────────────────
  const modDefs = [
    // Day 1
    { fullName: 'Abdirahman Farah',     email: 'mod.d1s1@ntw2026.so' },
    { fullName: 'Hodan Mohamed',        email: 'mod.d1s2@ntw2026.so' },
    { fullName: 'Khalid Nuur',          email: 'mod.d1s3@ntw2026.so' },
    // Day 2
    { fullName: 'Sagal Ibrahim',        email: 'mod.d2s1@ntw2026.so' },
    { fullName: 'Bashir Warsame',       email: 'mod.d2s2@ntw2026.so' },
    { fullName: 'Amina Duale',          email: 'mod.d2s3@ntw2026.so' },
    // Day 3
    { fullName: 'Mahad Yusuf',          email: 'mod.d3s1@ntw2026.so' },
    { fullName: 'Farhiya Hassan',       email: 'mod.d3s2@ntw2026.so' },
    { fullName: 'Cabdi Guure',          email: 'mod.d3s3@ntw2026.so' },
    // Day 4
    { fullName: 'Nasteho Ali',          email: 'mod.d4s1@ntw2026.so' },
    { fullName: 'Zakariye Ahmed',       email: 'mod.d4s2@ntw2026.so' },
    { fullName: 'Mulki Abdi',           email: 'mod.d4s3@ntw2026.so' },
    // Day 5
    { fullName: 'Ifrah Jama',           email: 'mod.d5s1@ntw2026.so' },
    { fullName: 'Abdullahi Shire',      email: 'mod.d5s2@ntw2026.so' },
    { fullName: 'Luul Osman',           email: 'mod.d5s3@ntw2026.so' },
    // Day 6
    { fullName: 'Fowsiya Mohamud',      email: 'mod.d6s1@ntw2026.so' },
    { fullName: 'Guled Hassan',         email: 'mod.d6s2@ntw2026.so' },
    { fullName: 'Asad Ibrahim',         email: 'mod.d6s3@ntw2026.so' },
  ];

  await User.deleteMany({ role: 'moderator' });
  const mods = await User.insertMany(
    modDefs.map(m => ({
      ...m,
      passwordHash: 'Mod@NTW2026',
      role: 'moderator',
    }))
  );
  console.log('✅  18 Moderator accounts created  (password: Mod@NTW2026)');

  // ── 7. Training Sessions (3 per day = 18) ────────────────────────────────────
  await Training.deleteMany({ event: event._id });

  const [d1, d2, d3, d4, d5, d6] = days;
  const [t1, t2, t3, t4, t5, t6] = trainers;

  const sessions = [
    // ─── DAY 1: AI Literacy ───────────────────────────────────────────────────
    {
      title: 'Introduction to Artificial Intelligence',
      description: 'A beginner-friendly walkthrough of what AI is, how it works, and how it is already shaping daily life in Somalia and globally.',
      event: event._id, eventDay: d1._id, date: new Date('2026-09-14'),
      trainer: t1._id, moderator: mods[0]._id,
      category: catMap['Artificial Intelligence'],
      startTime: '09:00 AM', endTime: '11:00 AM',
      audience: 'General Public', level: 'beginner', status: 'registration_open',
    },
    {
      title: 'AI Ethics & Digital Citizenship',
      description: 'Exploring the moral, legal, and social responsibilities of AI use — from bias and privacy to digital rights and responsible adoption.',
      event: event._id, eventDay: d1._id, date: new Date('2026-09-14'),
      trainer: t2._id, moderator: mods[1]._id,
      category: catMap['AI Ethics'],
      startTime: '01:00 PM', endTime: '03:00 PM',
      audience: 'All Participants', level: 'general', status: 'registration_open',
    },
    {
      title: 'Essential Digital Skills for the AI Era',
      description: 'Hands-on skills for navigating AI tools, cloud platforms, and productivity apps — empowering every Somali professional for the digital economy.',
      event: event._id, eventDay: d1._id, date: new Date('2026-09-14'),
      trainer: t3._id, moderator: mods[2]._id,
      category: catMap['Digital Skills'],
      startTime: '04:00 PM', endTime: '06:00 PM',
      audience: 'Professionals & Students', level: 'beginner', status: 'registration_open',
    },

    // ─── DAY 2: AI for Education ──────────────────────────────────────────────
    {
      title: 'AI-Powered Personalized Learning',
      description: 'How adaptive AI platforms personalise study paths, detect learning gaps, and improve student outcomes in Somali classrooms.',
      event: event._id, eventDay: d2._id, date: new Date('2026-09-15'),
      trainer: t2._id, moderator: mods[3]._id,
      category: catMap['Education Technology'],
      startTime: '09:00 AM', endTime: '11:00 AM',
      audience: 'Educators & Students', level: 'general', status: 'registration_open',
    },
    {
      title: 'Building AI Tutors & Chatbot Assistants',
      description: 'Step-by-step workshop on building conversational AI tutors using GPT-based models — customised for Somali curriculum content.',
      event: event._id, eventDay: d2._id, date: new Date('2026-09-15'),
      trainer: t5._id, moderator: mods[4]._id,
      category: catMap['Artificial Intelligence'],
      startTime: '01:00 PM', endTime: '03:00 PM',
      audience: 'Developers & Teachers', level: 'intermediate', status: 'registration_open',
    },
    {
      title: 'Research Methods with AI Tools',
      description: 'Using AI for literature review, citation management, data analysis, and academic writing — a guide for university researchers.',
      event: event._id, eventDay: d2._id, date: new Date('2026-09-15'),
      trainer: t1._id, moderator: mods[5]._id,
      category: catMap['Data Science'],
      startTime: '04:00 PM', endTime: '06:00 PM',
      audience: 'University Researchers', level: 'intermediate', status: 'registration_open',
    },

    // ─── DAY 3: AI for Business ───────────────────────────────────────────────
    {
      title: 'AI for Business Automation & Productivity',
      description: 'Practical AI tools to automate repetitive tasks, optimise operations, and scale Somali businesses — from micro-enterprises to large firms.',
      event: event._id, eventDay: d3._id, date: new Date('2026-09-16'),
      trainer: t1._id, moderator: mods[6]._id,
      category: catMap['Entrepreneurship'],
      startTime: '09:00 AM', endTime: '11:00 AM',
      audience: 'Entrepreneurs & Managers', level: 'general', status: 'registration_open',
    },
    {
      title: 'Data-Driven Marketing with AI',
      description: 'Leveraging AI analytics, customer segmentation, and automated campaigns to drive growth for Somali startups and SMEs.',
      event: event._id, eventDay: d3._id, date: new Date('2026-09-16'),
      trainer: t2._id, moderator: mods[7]._id,
      category: catMap['Data Science'],
      startTime: '01:00 PM', endTime: '03:00 PM',
      audience: 'Business Professionals', level: 'intermediate', status: 'registration_open',
    },
    {
      title: 'FinTech & AI in Somali Financial Services',
      description: 'How AI is transforming mobile money, credit scoring, fraud detection, and financial inclusion across Somalia.',
      event: event._id, eventDay: d3._id, date: new Date('2026-09-16'),
      trainer: t3._id, moderator: mods[8]._id,
      category: catMap['Artificial Intelligence'],
      startTime: '04:00 PM', endTime: '06:00 PM',
      audience: 'Finance & Tech Professionals', level: 'advanced', status: 'registration_open',
    },

    // ─── DAY 4: AI & Health ───────────────────────────────────────────────────
    {
      title: 'AI Applications in Telemedicine & Diagnostics',
      description: 'Deploying AI for remote patient monitoring, medical image analysis, and clinical decision support in resource-limited Somali health settings.',
      event: event._id, eventDay: d4._id, date: new Date('2026-09-17'),
      trainer: t4._id, moderator: mods[9]._id,
      category: catMap['Healthcare Technology'],
      startTime: '09:00 AM', endTime: '11:00 AM',
      audience: 'Healthcare Workers', level: 'general', status: 'registration_open',
    },
    {
      title: 'NLP for Somali Language Speech & Text',
      description: 'Building and fine-tuning NLP models for Somali — text classification, speech-to-text, and language generation for public services.',
      event: event._id, eventDay: d4._id, date: new Date('2026-09-17'),
      trainer: t5._id, moderator: mods[10]._id,
      category: catMap['NLP & Language'],
      startTime: '02:00 PM', endTime: '04:00 PM',
      audience: 'AI Developers', level: 'advanced', status: 'registration_open',
    },
    {
      title: 'Smart Agriculture & AI Climate Monitoring',
      description: 'AI-powered crop yield prediction, drought early warning, and precision farming applications for Somali agri-communities.',
      event: event._id, eventDay: d4._id, date: new Date('2026-09-17'),
      trainer: t6._id, moderator: mods[11]._id,
      category: catMap['Robotics & Automation'],
      startTime: '07:00 PM', endTime: '09:00 PM',
      audience: 'General Public', level: 'intermediate', status: 'registration_open',
    },

    // ─── DAY 5: AI for Graduates ──────────────────────────────────────────────
    {
      title: 'Building Your AI Portfolio & GitHub Presence',
      description: 'A practical workshop for fresh graduates: create impressive AI projects, write clean documentation, and get hired by global tech teams.',
      event: event._id, eventDay: d5._id, date: new Date('2026-09-18'),
      trainer: t1._id, moderator: mods[12]._id,
      category: catMap['Digital Skills'],
      startTime: '09:00 AM', endTime: '11:00 AM',
      audience: 'Fresh Graduates', level: 'intermediate', status: 'registration_open',
    },
    {
      title: 'Machine Learning in Practice: End-to-End Projects',
      description: 'Build a complete ML pipeline — data collection, preprocessing, model training, evaluation, and deployment — using Python and scikit-learn.',
      event: event._id, eventDay: d5._id, date: new Date('2026-09-18'),
      trainer: t2._id, moderator: mods[13]._id,
      category: catMap['Machine Learning'],
      startTime: '01:00 PM', endTime: '03:00 PM',
      audience: 'IT & CS Graduates', level: 'advanced', status: 'registration_open',
    },
    {
      title: 'Remote Work & Freelancing with AI Skills',
      description: 'How to land remote AI projects on Upwork, Fiverr, and Toptal — pricing, client communication, and building a sustainable freelance AI career.',
      event: event._id, eventDay: d5._id, date: new Date('2026-09-18'),
      trainer: t3._id, moderator: mods[14]._id,
      category: catMap['Entrepreneurship'],
      startTime: '04:00 PM', endTime: '06:00 PM',
      audience: 'Graduates & Young Professionals', level: 'general', status: 'registration_open',
    },

    // ─── DAY 6: AI Innovation ─────────────────────────────────────────────────
    {
      title: 'Computer Vision & AI for Public Infrastructure',
      description: 'Deploying CV models for traffic management, infrastructure inspection, and urban planning — lessons and roadmap for Somali cities.',
      event: event._id, eventDay: d6._id, date: new Date('2026-09-19'),
      trainer: t1._id, moderator: mods[15]._id,
      category: catMap['Computer Vision'],
      startTime: '09:00 AM', endTime: '11:00 AM',
      audience: 'Engineers & Policy Makers', level: 'advanced', status: 'registration_open',
    },
    {
      title: 'Generative AI & Large Language Models',
      description: 'Deep-dive into GPT, Gemini, and Claude architectures — prompt engineering, fine-tuning, RAG pipelines, and responsible deployment strategies.',
      event: event._id, eventDay: d6._id, date: new Date('2026-09-19'),
      trainer: t5._id, moderator: mods[16]._id,
      category: catMap['Machine Learning'],
      startTime: '01:00 PM', endTime: '03:00 PM',
      audience: 'AI Developers & Researchers', level: 'advanced', status: 'registration_open',
    },
    {
      title: "Somalia's National AI Strategy & Roadmap",
      description: "A high-level capstone session mapping Somalia's path to AI-driven national transformation — policy, investment, talent, and international partnerships.",
      event: event._id, eventDay: d6._id, date: new Date('2026-09-19'),
      trainer: t4._id, moderator: mods[17]._id,
      category: catMap['Artificial Intelligence'],
      startTime: '04:00 PM', endTime: '06:00 PM',
      audience: 'All Participants', level: 'general', status: 'registration_open',
    },
  ];

  await Training.insertMany(sessions);
  console.log('✅  18 Training sessions created (3 per day × 6 days)');

  console.log('\n✨  Full seed complete!');
  console.log('──────────────────────────────────────────────');
  console.log(`   Admin    : ${process.env.ADMIN_EMAIL || 'admin@hormuud.edu.so'}  /  ${process.env.ADMIN_PASSWORD || 'Admin@2026'}`);
  console.log('   Moderators: mod.d1s1@ntw2026.so … mod.d6s3@ntw2026.so  /  Mod@NTW2026');
  console.log('──────────────────────────────────────────────\n');
  process.exit(0);
};

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
