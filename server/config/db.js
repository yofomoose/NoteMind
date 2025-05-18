const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Подключение к базе данных MongoDB
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // MongoDB автоматически использует новый драйвер, поэтому многие опции больше не требуются
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;