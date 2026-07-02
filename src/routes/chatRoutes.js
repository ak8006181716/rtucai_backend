import express from 'express';
import { chat } from '../controllers/chatController.js';

const router = express.Router();

/**
 * POST /api/chat
 * Public endpoint — no authentication required.
 * Body: { message: string, history?: Array }
 */
router.post('/', chat);

export default router;
