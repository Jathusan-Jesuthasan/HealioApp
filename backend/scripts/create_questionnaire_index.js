import mongoose from 'mongoose';
import Questionnaire from '../models/Questionnaire.js';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGO_URI;

async function main() {
  if (!uri) {
    console.error('MONGO_URI not set');
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log('Connected to MongoDB for migration');

  // Find duplicates (questionnaires sharing same user)
  const duplicates = await Questionnaire.aggregate([
    { $group: { _id: '$user', count: { $sum: 1 }, docs: { $push: '$_id' } } },
    { $match: { count: { $gt: 1 } } }
  ]);

  if (duplicates.length) {
    console.warn('Found duplicate questionnaires for the following users:');
    duplicates.forEach((d) => console.warn(`user: ${d._id} count: ${d.count} docs: ${d.docs.join(',')}`));
    console.warn('Please resolve duplicates before creating unique index. Exiting.');
    process.exit(2);
  }

  try {
    await Questionnaire.collection.createIndex({ user: 1 }, { unique: true });
    console.log('Unique index created on questionnaire.user');
  } catch (err) {
    console.error('Failed to create index:', err.message || err);
    process.exit(3);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
