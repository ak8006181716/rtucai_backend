import multer from 'multer';

// Setup multer memory storage (saves to buffer in req.files)
const storage = multer.memoryStorage();

// File type validation helper
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
  
  if (allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error('Error: Only images (JPEG/JPG/PNG/GIF) and PDFs are allowed!'), false);
  }
};

// Configured multer instance: accepts up to 5 files under the field name 'files' (each max 5MB)
export const uploadMedia = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
}).array('files', 5);
