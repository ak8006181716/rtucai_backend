import User from '../models/User.js';
import Complaint from '../models/Complaint.js';
import MissionMember from '../models/MissionMember.js';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

/**
 * Generate a JWT token signed with the user ID
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body; // role is intentionally excluded — only seeded admin has role='admin'

    if (!name || !email || !password) {
      const error = new Error('Please fill in all fields: name, email, password.');
      error.statusCode = 400;
      throw error;
    }

    logger.info(`User registration attempt for email: ${email}`);

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      const error = new Error('User already exists with this email address.');
      error.statusCode = 400;
      throw error;
    }

    // Check if the registering email is already approved as a mission member
    const approvedMember = await MissionMember.findOne({ email, status: 'approved' });
    const initialRole = approvedMember ? 'member' : 'user';

    // Create user — admin is seeded at server startup
    const user = await User.create({
      name,
      email,
      password,
      role: initialRole
    });

    logger.info(`User registered successfully: ${email}`);

    // Generate JWT token
    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const error = new Error('Please provide email and password.');
      error.statusCode = 400;
      throw error;
    }

    logger.info(`User login attempt for email: ${email}`);

    // Find user in database and explicitly request password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    logger.info(`User logged in successfully: ${email}`);

    // Generate JWT token
    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'User logged in successfully',
      token,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
export const getUserProfile = async (req, res, next) => {
  try {
    // Fetch all complaints associated with the user's email
    const complaints = await Complaint.find({ email: req.user.email }).sort({ createdAt: -1 });

    // req.user is set by the protect middleware after verifying the JWT
    return res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        createdAt: req.user.createdAt,
        complaints: complaints.map(c => ({
          id: c._id,
          trackingId: c.trackingId,
          title: c.title,
          description: c.description,
          category: c.category,
          status: c.status,
          mediaUrls: c.mediaUrls,
          createdAt: c.createdAt
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};
