import express from 'express';
import {
  createComplaint,
  getComplaintStatus,
  getComplaintsByEmail
} from '../controllers/complaintController.js';
import { uploadMedia } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Route to submit a complaint. Uses the 'uploadMedia' middleware to parse file streams first
router.post('/', uploadMedia, createComplaint);

// Route to track status by Tracking ID or MongoDB ID
router.get('/:id', getComplaintStatus);

// Route to get all complaints associated with an email
router.get('/email/:email', getComplaintsByEmail);

export default router;
