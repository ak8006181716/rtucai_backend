import Complaint from '../models/Complaint.js';
import cloudinary from '../config/cloudinary.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

/**
 * Helper to upload in-memory file buffer directly to Cloudinary
 */
const uploadFromBuffer = (fileBuffer, fileName) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'rtucai_complaints',
        resource_type: 'auto'
      },
      (error, result) => {
        if (error) {
          logger.error(`Cloudinary upload failed for file: ${fileName}`, error);
          return reject(error);
        }
        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * @desc    File a new complaint with media uploads matching Google Form screenshots
 * @route   POST /api/complaints
 * @access  Public
 */
export const createComplaint = async (req, res, next) => {
  try {
    const {
      email,
      fullName,
      mobileNumber,
      emailAddress,
      gender,
      state,
      city,
      address,
      category,
      companyName,
      incidentDate,
      lossAmount,
      explainComplaint,
      detailedDescription
    } = req.body;

    // Check required fields
    if (
      !email ||
      !fullName ||
      !mobileNumber ||
      !emailAddress ||
      !gender ||
      !state ||
      !city ||
      !address ||
      !category ||
      !companyName ||
      !incidentDate ||
      !explainComplaint ||
      !detailedDescription
    ) {
      const error = new Error('Please fill in all required form fields.');
      error.statusCode = 400;
      throw error;
    }

    const mediaUrls = [];

    // If evidence files are attached via multer, upload them to Cloudinary
    if (req.files && req.files.length > 0) {
      logger.info(`Received ${req.files.length} evidence file(s). Uploading to Cloudinary...`);
      
      const uploadPromises = req.files.map(file => 
        uploadFromBuffer(file.buffer, file.originalname)
      );

      const uploadResults = await Promise.all(uploadPromises);
      
      uploadResults.forEach(result => {
        mediaUrls.push(result.secure_url);
      });

      logger.info(`Uploaded files successfully. URLs: ${mediaUrls.join(', ')}`);
    }

    // Save complaint to database
    const complaint = await Complaint.create({
      email,
      fullName,
      mobileNumber,
      emailAddress,
      gender,
      state,
      city,
      address,
      category,
      companyName,
      incidentDate,
      lossAmount,
      explainComplaint,
      detailedDescription,
      mediaUrls
    });

    logger.info(`Complaint submitted successfully. Tracking ID: ${complaint.trackingId}`);

    return res.status(201).json({
      success: true,
      message: 'Complaint registered successfully. Use the tracking ID to check the status.',
      data: {
        id: complaint._id,
        trackingId: complaint.trackingId,
        fullName: complaint.fullName,
        category: complaint.category,
        status: complaint.status,
        mediaUrls: complaint.mediaUrls,
        createdAt: complaint.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get complaint status/details by ID or Tracking ID
 * @route   GET /api/complaints/:id
 * @access  Public
 */
export const getComplaintStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    let searchCriteria = {};

    if (mongoose.Types.ObjectId.isValid(id)) {
      searchCriteria = { $or: [{ _id: id }, { trackingId: id }] };
    } else {
      searchCriteria = { trackingId: id };
    }

    const complaint = await Complaint.findOne(searchCriteria);

    if (!complaint) {
      const error = new Error(`Complaint not found with ID or tracking code: ${id}`);
      error.statusCode = 404;
      throw error;
    }

    return res.status(200).json({
      success: true,
      data: {
        trackingId: complaint.trackingId,
        fullName: complaint.fullName,
        mobileNumber: complaint.mobileNumber,
        emailAddress: complaint.emailAddress,
        gender: complaint.gender,
        state: complaint.state,
        city: complaint.city,
        address: complaint.address,
        category: complaint.category,
        companyName: complaint.companyName,
        incidentDate: complaint.incidentDate,
        lossAmount: complaint.lossAmount,
        explainComplaint: complaint.explainComplaint,
        detailedDescription: complaint.detailedDescription,
        status: complaint.status,
        mediaUrls: complaint.mediaUrls,
        createdAt: complaint.createdAt,
        updatedAt: complaint.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all complaints filed by a specific email
 * @route   GET /api/complaints/email/:email
 * @access  Public
 */
export const getComplaintsByEmail = async (req, res, next) => {
  try {
    const { email } = req.params;

    const complaints = await Complaint.find({ email }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: complaints.length,
      data: complaints.map(c => ({
        trackingId: c.trackingId,
        fullName: c.fullName,
        category: c.category,
        status: c.status,
        mediaUrls: c.mediaUrls,
        createdAt: c.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
};
