import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

// Explicitly call dotenv.config() here to ensure variables are loaded before config is evaluated
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export default cloudinary;
