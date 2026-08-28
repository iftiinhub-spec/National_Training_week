import 'dotenv/config';
import mongoose from 'mongoose';
import { randomBytes } from 'node:crypto';
import connectDB from './config/db.js';
import Training from './models/Training.js';

const slugify = (title) => (title || '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .slice(0, 60)
  .replace(/^-+|-+$/g, '');

const backfillTrainingSlugs = async () => {
  await connectDB();

  const trainings = await Training.find({ $or: [{ slug: { $exists: false } }, { slug: null }] })
    .select('_id title');
  let updated = 0;

  for (const training of trainings) {
    const base = slugify(training.title);
    let slug = base ? `${base}-${randomBytes(3).toString('hex')}` : randomBytes(6).toString('hex');

    // Extremely unlikely, but keep retrying rather than aborting the whole run on a collision.
    while (await Training.exists({ slug })) {
      slug = base ? `${base}-${randomBytes(3).toString('hex')}` : randomBytes(6).toString('hex');
    }

    await Training.updateOne({ _id: training._id }, { $set: { slug } });
    updated += 1;
  }

  await Training.syncIndexes();

  console.log(`Backfill complete. ${updated} of ${trainings.length} trainings updated.`);
};

backfillTrainingSlugs()
  .catch((error) => {
    console.error(`Backfill failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
