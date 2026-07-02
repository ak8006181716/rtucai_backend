import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB } from './config/db.js';
import logger from './utils/logger.js';

const PORT = process.env.PORT || 5000;

// Start server function
const startServer = async () => {
  try {
    // 1. Establish database connection
    await connectDB();

    // 2. Start listening for requests
    app.listen(PORT, () => {
      logger.info(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

startServer();
