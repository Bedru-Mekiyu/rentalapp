// src/config/db.js
import mongoose from 'mongoose';

export async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URL;
  const mongoUri = MONGODB_URI;

  if (!MONGODB_URI) {
    console.error('MongoDB URI missing. Set MONGODB_URI (or MONGODB_URL).');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected');

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
}
