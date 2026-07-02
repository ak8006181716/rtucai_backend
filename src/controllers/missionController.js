import Mission from '../models/Mission.js';
import MissionMember from '../models/MissionMember.js';
import logger from '../utils/logger.js';

/**
 * @desc    Get current Mission, Vision, and Focus Areas info
 * @route   GET /api/mission
 * @access  Public
 */
export const getMissionInfo = async (req, res, next) => {
  try {
    const missionData = await Mission.findOne().sort({ createdAt: -1 });
    
    if (!missionData) {
      const error = new Error('Mission data not found.');
      error.statusCode = 404;
      throw error;
    }

    return res.status(200).json({
      success: true,
      data: missionData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update Mission info details
 * @route   PUT /api/mission
 * @access  Private/Admin
 */
export const updateMissionInfo = async (req, res, next) => {
  try {
    const { vision, missionStatements, focusAreas, metrics } = req.body;

    let missionData = await Mission.findOne().sort({ createdAt: -1 });

    if (!missionData) {
      // Create new one if somehow missing
      missionData = new Mission({
        vision,
        missionStatements,
        focusAreas,
        metrics
      });
    } else {
      if (vision) missionData.vision = vision;
      if (missionStatements) missionData.missionStatements = missionStatements;
      if (focusAreas) missionData.focusAreas = focusAreas;
      if (metrics) missionData.metrics = metrics;
    }

    const updatedMission = await missionData.save();

    logger.info('Mission data updated successfully.');

    return res.status(200).json({
      success: true,
      message: 'Mission updated successfully',
      data: updatedMission
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Submit a signup request to "Join the Mission"
 * @route   POST /api/mission/join
 * @access  Public
 */
export const joinMission = async (req, res, next) => {
  try {
    const { name, email, phone, role, message } = req.body;

    // Validation
    if (!name || !email) {
      const error = new Error('Name and email are required fields.');
      error.statusCode = 400;
      throw error;
    }

    // Role check
    const validRoles = ['volunteer', 'advocate', 'writer', 'other'];
    if (role && !validRoles.includes(role)) {
      const error = new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    // Check if email already registered to join
    const existingMember = await MissionMember.findOne({ email });
    if (existingMember) {
      const error = new Error('You have already requested to join the mission with this email.');
      error.statusCode = 400;
      throw error;
    }

    const newMember = await MissionMember.create({
      name,
      email,
      phone,
      role: role || 'volunteer',
      message
    });

    logger.info(`New member joined mission: ${name} (${email}) as ${role || 'volunteer'}`);

    return res.status(201).json({
      success: true,
      message: 'Thank you for joining the RTUCAI mission! Your request has been recorded.',
      data: newMember
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all citizens who signed up to join the mission
 * @route   GET /api/mission/members
 * @access  Private/Admin
 */
export const getMissionMembers = async (req, res, next) => {
  try {
    const members = await MissionMember.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: members.length,
      data: members
    });
  } catch (error) {
    next(error);
  }
};
