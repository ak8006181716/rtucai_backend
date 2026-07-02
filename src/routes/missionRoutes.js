import express from 'express';
import {
  getMissionInfo,
  updateMissionInfo,
  joinMission,
  getMissionMembers
} from '../controllers/missionController.js';

const router = express.Router();

// Public routes
router.get('/', getMissionInfo);
router.post('/join', joinMission);

// Admin / Management routes (auth protection middleware can be plugged in here)
router.put('/', updateMissionInfo);
router.get('/members', getMissionMembers);

export default router;
