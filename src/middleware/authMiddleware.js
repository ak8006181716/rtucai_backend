import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import logger from '../utils/logger.js';

/**
 * Middleware to protect routes (Authentication helper)
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for Bearer token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Verify token exists
    if (!token) {
      const error = new Error('Not authorized, no token provided.');
      error.statusCode = 401;
      throw error;
    }

    try {
      // Decode and verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user in database, excluding the password hash
      req.user = await User.findById(decoded.id);

      if (!req.user) {
        const error = new Error('Not authorized, user not found.');
        error.statusCode = 401;
        throw error;
      }

      next();
    } catch (err) {
      logger.error('Token validation failed', err);
      const error = new Error('Not authorized, token is invalid or expired.');
      error.statusCode = 401;
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to restrict access to admin users only
 */
export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    const error = new Error('Not authorized as an admin.');
    error.statusCode = 403;
    next(error);
  }
};

