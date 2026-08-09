import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './src/config/db.js';
import User from './src/models/User.js';

const roleAccounts = [
  {
    role: 'admin',
    fullName: 'System Administrator',
    email: 'admin@ntw.elivateict.com',
    password: 'Admin@2026',
    phone: '+252610000001',
  },
  {
    role: 'moderator',
    fullName: 'NTW Moderator',
    email: 'moderator@ntw.elivateict.com',
    password: 'Moderator@2026',
    phone: '+252610000002',
  },
  {
    role: 'participant',
    fullName: 'NTW Participant',
    email: 'participant@ntw.elivateict.com',
    password: 'Participant@2026',
    phone: '+252610000003',
    gender: 'male',
    region: 'Banaadir',
    organization: 'National Training Week',
    profession: 'Participant',
    participantType: 'general_public',
  },
];

const createOrUpdateRoleAccount = async (account) => {
  const email = account.email.toLowerCase();
  let user = await User.findOne({ email }).select('+passwordHash');

  if (!user) {
    user = new User({ email });
  }

  user.fullName = account.fullName;
  user.email = email;
  user.passwordHash = account.password;
  user.role = account.role;
  user.phone = account.phone;
  user.gender = account.gender || '';
  user.region = account.region || '';
  user.organization = account.organization || '';
  user.profession = account.profession || '';
  user.participantType = account.participantType || '';
  user.accountStatus = 'approved';
  user.isActive = true;

  await user.save();
  return { role: account.role, email, password: account.password };
};

const seedAllRoles = async () => {
  await connectDB();

  const credentials = [];
  for (const account of roleAccounts) {
    credentials.push(await createOrUpdateRoleAccount(account));
  }

  console.log('\nAll role accounts are ready.\n');
  console.table(credentials);
  console.log('\nLogin credentials:');
  for (const credential of credentials) {
    console.log(`${credential.role}: ${credential.email} / ${credential.password}`);
  }
};

seedAllRoles()
  .catch((error) => {
    console.error(`All role setup failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
