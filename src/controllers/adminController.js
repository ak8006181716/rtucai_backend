import User from '../models/User.js';
import Complaint from '../models/Complaint.js';
import Mission from '../models/Mission.js';
import MissionMember from '../models/MissionMember.js';
import ChatLog from '../models/ChatLog.js';
import logger from '../utils/logger.js';

// ─── ADMIN DASHBOARD STATS ──────────────────────────────────────────────────
export const getStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalMissions = await Mission.countDocuments();
    const totalChatLogs = await ChatLog.countDocuments();

    // Complaint stats
    const totalComplaints = await Complaint.countDocuments();
    const complaintsPending = await Complaint.countDocuments({ status: 'pending' });
    const complaintsReviewed = await Complaint.countDocuments({ status: 'reviewed' });
    const complaintsResolved = await Complaint.countDocuments({ status: 'resolved' });

    // Mission member stats
    const totalMissionMembers = await MissionMember.countDocuments();
    const membersPending = await MissionMember.countDocuments({ status: 'pending' });
    const membersApproved = await MissionMember.countDocuments({ status: 'approved' });
    const membersRejected = await MissionMember.countDocuments({ status: 'rejected' });

    res.status(200).json({
      success: true,
      data: {
        users: { total: totalUsers },
        complaints: {
          total: totalComplaints,
          pending: complaintsPending,
          reviewed: complaintsReviewed,
          resolved: complaintsResolved
        },
        missions: { total: totalMissions },
        missionMembers: {
          total: totalMissionMembers,
          pending: membersPending,
          approved: membersApproved,
          rejected: membersRejected
        },
        chatLogs: { total: totalChatLogs }
      }
    });
  } catch (error) {
    logger.error('Error fetching admin stats:', error);
    next(error);
  }
};

// ─── USERS MANAGEMENT ───────────────────────────────────────────────────────
export const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    if (req.query.role) {
      query.role = req.query.role;
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: users.length,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: users
    });
  } catch (error) {
    logger.error('Error fetching users:', error);
    next(error);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing role. Must be "user" or "admin".'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Prevent demoting oneself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'You cannot change your own admin role status.'
      });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User role successfully updated to ${role}.`,
      data: user
    });
  } catch (error) {
    logger.error('Error updating user role:', error);
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Prevent deleting oneself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'You cannot delete your own admin user account.'
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User successfully deleted.'
    });
  } catch (error) {
    logger.error('Error deleting user:', error);
    next(error);
  }
};

// ─── COMPLAINTS MANAGEMENT ──────────────────────────────────────────────────
export const getComplaints = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { fullName: searchRegex },
        { email: searchRegex },
        { trackingId: searchRegex }
      ];
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.category) {
      query.category = req.query.category;
    }

    const total = await Complaint.countDocuments(query);
    const complaints = await Complaint.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: complaints.length,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: complaints
    });
  } catch (error) {
    logger.error('Error fetching complaints:', error);
    next(error);
  }
};

export const updateComplaintStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status || !['pending', 'reviewed', 'resolved'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing status. Must be "pending", "reviewed", or "resolved".'
      });
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'Complaint not found'
      });
    }

    complaint.status = status;
    await complaint.save();

    res.status(200).json({
      success: true,
      message: `Complaint status successfully updated to ${status}.`,
      data: complaint
    });
  } catch (error) {
    logger.error('Error updating complaint status:', error);
    next(error);
  }
};

export const deleteComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'Complaint not found'
      });
    }

    await complaint.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Complaint successfully deleted.'
    });
  } catch (error) {
    logger.error('Error deleting complaint:', error);
    next(error);
  }
};

// ─── MISSION MEMBERS MANAGEMENT ──────────────────────────────────────────────
export const getMissionMembers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.role) {
      query.role = req.query.role;
    }

    const total = await MissionMember.countDocuments(query);
    const members = await MissionMember.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: members.length,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: members
    });
  } catch (error) {
    logger.error('Error fetching mission members:', error);
    next(error);
  }
};

export const updateMissionMemberStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing status. Must be "pending", "approved", or "rejected".'
      });
    }

    const member = await MissionMember.findById(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        error: 'Mission member registration not found'
      });
    }

    member.status = status;
    await member.save();

    res.status(200).json({
      success: true,
      message: `Mission member signup status successfully updated to ${status}.`,
      data: member
    });
  } catch (error) {
    logger.error('Error updating mission member status:', error);
    next(error);
  }
};

export const deleteMissionMember = async (req, res, next) => {
  try {
    const member = await MissionMember.findById(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        error: 'Mission member registration not found'
      });
    }

    await member.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Mission member registration successfully deleted.'
    });
  } catch (error) {
    logger.error('Error deleting mission member signup:', error);
    next(error);
  }
};

// ─── CHAT LOGS MANAGEMENT ───────────────────────────────────────────────────
export const getChatLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [{ message: searchRegex }, { reply: searchRegex }];
    }

    if (req.query.model) {
      query.model = req.query.model;
    }

    const total = await ChatLog.countDocuments(query);
    const logs = await ChatLog.find(query)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: logs.length,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: logs
    });
  } catch (error) {
    logger.error('Error fetching chat logs:', error);
    next(error);
  }
};

export const deleteChatLog = async (req, res, next) => {
  try {
    const log = await ChatLog.findById(req.params.id);

    if (!log) {
      return res.status(404).json({
        success: false,
        error: 'Chat log not found'
      });
    }

    await log.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Chat log successfully deleted.'
    });
  } catch (error) {
    logger.error('Error deleting chat log:', error);
    next(error);
  }
};
