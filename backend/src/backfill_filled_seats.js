import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import Training from './models/Training.js';
import Registration from './models/Registration.js';

const backfillFilledSeats = async () => {
  await connectDB();

  const trainings = await Training.find({}).select('_id capacity filledSeats');
  let updated = 0;

  for (const training of trainings) {
    const approvedCount = await Registration.countDocuments({ training: training._id, status: 'approved' });
    if (training.filledSeats !== approvedCount) {
      await Training.updateOne({ _id: training._id }, { $set: { filledSeats: approvedCount } });
      updated += 1;
    }
  }

  console.log(`Backfill complete. ${updated} of ${trainings.length} trainings updated.`);
};

backfillFilledSeats()
  .catch((error) => {
    console.error(`Backfill failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
