const mongoose = require('mongoose');

const connectDB = async () => {
  const connStr = process.env.MONGO_URI || 'mongodb://localhost:27017/inventory';

  // Try Atlas / configured URI first
  try {
    const conn = await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 5000, // Fail fast if Atlas unreachable
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return;
  } catch (error) {
    console.warn(`Atlas connection failed: ${error.message}`);
    console.log('Falling back to in-memory MongoDB for development...');
  }

  // Fallback: use mongodb-memory-server
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    const conn = await mongoose.connect(uri);
    console.log(`In-Memory MongoDB Connected: ${conn.connection.host}`);
    console.log('⚠️  Data will NOT persist after server restart.');
  } catch (fallbackError) {
    console.error(`Failed to start in-memory MongoDB: ${fallbackError.message}`);
    console.error('Run: npm i mongodb-memory-server');
    process.exit(1);
  }
};

module.exports = connectDB;
