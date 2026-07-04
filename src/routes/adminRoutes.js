import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  getStats,
  getUsers,
  updateUserRole,
  deleteUser,
  getComplaints,
  updateComplaintStatus,
  deleteComplaint,
  getMissionMembers,
  updateMissionMemberStatus,
  deleteMissionMember,
  getChatLogs,
  deleteChatLog
} from '../controllers/adminController.js';

const router = express.Router();

// Apply protect and admin middleware to all routes below
router.use(protect);
router.use(admin);

// ─── Dashboard Stats ───────────────────────────────────────────
router.get('/stats', getStats);

// ─── User Management ───────────────────────────────────────────
router.route('/users')
  .get(getUsers);

router.route('/users/:id')
  .put(updateUserRole)
  .delete(deleteUser);

// ─── Complaint Management ──────────────────────────────────────
router.route('/complaints')
  .get(getComplaints);

router.route('/complaints/:id')
  .put(updateComplaintStatus)
  .delete(deleteComplaint);

// ─── Mission Members Management ────────────────────────────────
router.route('/mission-members')
  .get(getMissionMembers);

router.route('/mission-members/:id')
  .put(updateMissionMemberStatus)
  .delete(deleteMissionMember);

// ─── Chat Log Management ───────────────────────────────────────
router.route('/chat-logs')
  .get(getChatLogs);

router.route('/chat-logs/:id')
  .delete(deleteChatLog);

export default router;
