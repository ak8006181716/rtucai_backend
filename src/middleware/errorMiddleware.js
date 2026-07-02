import logger from '../utils/logger.js';

/**
 * Global Error Handling Middleware
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log full stack trace only for server errors (>= 500), use warning for client errors
  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} - ${message}`, err.stack);
  } else {
    logger.warn(`${req.method} ${req.originalUrl} - ${statusCode} - ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message: message,
    // Only return stack trace in development mode
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

/**
 * 404 Route handler for unknown paths
 */
export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};
