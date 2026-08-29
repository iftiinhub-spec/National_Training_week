import 'dotenv/config';
import mongoose from 'mongoose';
import { randomBytes } from 'node:crypto';
import connectDB from './config/db.js';
import Training, { slugifyTitle } from './models/Training.js';

// Rewrites every training slug into its clean, readable form. Slugs are assigned in creation order
// and a counter is appended only on a real title collision, so the result is stable and repeatable.
// Re-running this is safe: a training whose slug is already correct is left untouched.
const backfillTrainingSlugs = async () => {
  await connectDB();

  const trainings = await Training.find({}).select('_id title slug').sort({ createdAt: 1 }).lean();
  const taken = new Set();
  let updated = 0;

  for (const training of trainings) {
    const base = slugifyTitle(training.title) || randomBytes(6).toString('hex');
    let slug = base;
    let counter = 1;
    while (taken.has(slug)) {
      counter += 1;
      slug = `${base}-${counter}`;
    }
    taken.add(slug);

    if (training.slug !== slug) {
      await Training.updateOne({ _id: training._id }, { $set: { slug } });
      console.log(`  ${training.slug || '(none)'} -> ${slug}`);
      updated += 1;
    }
  }

  await Training.syncIndexes();

  console.log(`\nBackfill complete. ${updated} of ${trainings.length} training slugs rewritten.`);
};

backfillTrainingSlugs()
  .catch((error) => {
    console.error(`Backfill failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
