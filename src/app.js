import express from 'express';
import cors from 'cors';
import apiRouter from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/errorMiddleware.js';

const app = express();

// Configure CORS
const whitelist = [
  'http://127.0.0.1:5500', 
  'http://localhost:5500', 
  'https://rtucai.com', 
  'https://www.rtucai.com', 
  'https://rtuai.vercel.app', 
  'https://www.rtuai.vercel.app', 
  'http://localhost:3000', 
  'https://rtu-ai-frontend-git-main-ankit-projects-62459343.vercel.app', 
  'https://rtu-ai-frontend.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (whitelist.indexOf(origin) !== -1) return callback(null, true);
    
    try {
      const url = new URL(origin);
      const hostname = url.hostname;
      if (
        hostname === 'localhost' || 
        hostname === '127.0.0.1' || 
        hostname.startsWith('192.168.') || 
        hostname.startsWith('10.') || 
        hostname.startsWith('172.')
      ) {
        return callback(null, true);
      }
    } catch (e) {
      // url parse fail
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Standard middlewares 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route welcome message
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to RTUCAI Backend API. Please access /api/health for system status.'
  });
});

// API routes
app.use('/api', apiRouter);

// Fallback middlewares for error handling and unknown routes
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
