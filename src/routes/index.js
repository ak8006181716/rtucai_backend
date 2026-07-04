import express from 'express';
import authRoutes from './authRoutes.js';
import missionRoutes from './missionRoutes.js';
import complaintRoutes from './complaintRoutes.js';
import chatRoutes from './chatRoutes.js';
import adminRoutes from './adminRoutes.js';

const router = express.Router();

// Health Check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is healthy',
    timestamp: new Date().toISOString()
  });
});

// Auth Routes
router.use('/auth', authRoutes);

// Mission Routes
router.use('/mission', missionRoutes);

// Complaint Routes
router.use('/complaints', complaintRoutes);

// Chat (AI Chatbot) Routes
router.use('/chat', chatRoutes);

// Admin Routes (Protected admin-only endpoints)
router.use('/admin', adminRoutes);

export default router;
