import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

export const connectToDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    return;
  }

  const uri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/inventory_test_db';

  await mongoose.connect(uri);
};

export const closeDatabaseConnection = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
};

export const clearDatabase = async () => {
  if (mongoose.connection.readyState === 0) return;

  const collections = await mongoose.connection.db.collections();

  for (const collection of collections) {
    await collection.deleteMany({});
  }
};
