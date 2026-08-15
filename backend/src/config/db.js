import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: Math.max(5, Number(process.env.MONGODB_MAX_POOL_SIZE) || 50),
      minPoolSize: Math.max(0, Number(process.env.MONGODB_MIN_POOL_SIZE) || 5),
      serverSelectionTimeoutMS: Math.max(5_000, Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS) || 10_000),
      socketTimeoutMS: Math.max(10_000, Number(process.env.MONGODB_SOCKET_TIMEOUT_MS) || 45_000),
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    if (process.env.NODE_ENV === 'test') console.log(`MongoDB test database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
