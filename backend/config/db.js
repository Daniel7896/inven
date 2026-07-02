const mongoose = require('mongoose');

const connectDB = async () => {
  const connStr = process.env.MONGO_URI;

  if (!connStr) {
    if (process.env.NODE_ENV === 'production') {
      console.error('FATAL ERROR: MONGO_URI is not defined in production environment variables.');
      process.exit(1);
    }
    console.warn('MONGO_URI is not defined. Using local fallback for development...');
  }

  const finalUri = connStr || 'mongodb://localhost:27017/inventory';

  // Try connecting to MongoDB (Atlas or local)
  try {
    const conn = await mongoose.connect(finalUri, {
      serverSelectionTimeoutMS: 5000, // Fail fast if unreachable
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return;
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    
    // In production, we must fail and exit immediately rather than risking silent data loss
    if (process.env.NODE_ENV === 'production') {
      console.error('FATAL ERROR: Database connection failed in production.');
      process.exit(1);
    }
  }

  // Fallback to in-memory MongoDB ONLY in development
  console.log('Falling back to in-memory MongoDB for local development...');
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    const conn = await mongoose.connect(uri);
    console.log(`In-Memory MongoDB Connected: ${conn.connection.host}`);
    console.log('⚠️  Data will NOT persist after server restart.');
  } catch (fallbackError) {
    console.error(`Failed to start in-memory MongoDB: ${fallbackError.message}`);
    console.error('Ensure mongodb-memory-server is installed in development.');
    process.exit(1);
  }
};

module.exports = connectDB;
