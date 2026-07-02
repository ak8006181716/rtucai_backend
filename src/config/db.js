import mongoose from 'mongoose';
import logger from '../utils/logger.js';
import Mission from '../models/Mission.js';
import User from '../models/User.js';

/**
 * Connects to MongoDB
 */
export const connectDB = async () => {
  try {
    const dbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/rtucai';
    
    await mongoose.connect(dbUri);
    
    logger.info('Database connection is successfully Connected.');

    // Seed default mission data if database is empty
    await seedDefaultMissionData();

    // Seed default admin if no admin exists
    await seedDefaultAdmin();
  } catch (error) {
    logger.error('Failed to connect to the database', error);
    process.exit(1);
  }
};

/**
 * Seed default mission data if no mission data exists
 */
const seedDefaultMissionData = async () => {
  try {
    const count = await Mission.countDocuments();
    if (count > 0) {
      logger.info('Mission data already present. Skipping seeder.');
      return;
    }

    const defaultMission = {
      vision: 'To create a world where every citizen can understand important documents, digital agreements and public policies before making decisions that affect their life, finances, health and legal rights.',
      missionStatements: [
        'Simplify complex Terms & Conditions.',
        'Promote informed consent.',
        'Support transparency and accountability.',
        'Empower citizens through AI-assisted understanding.',
        'Encourage fair and understandable communication between organizations and consumers.'
      ],
      focusAreas: [
        {
          title: 'Banking',
          description: 'Understanding loans, charges, policies and customer rights in plain language.'
        },
        {
          title: 'Insurance',
          description: 'Explaining policy terms, exclusions, deductibles and claim processes clearly.'
        },
        {
          title: 'Housing & Real Estate',
          description: 'Helping citizens understand allotment conditions, agreements and regulatory requirements.'
        },
        {
          title: 'Telecom & Digital',
          description: 'Making digital contracts and user agreements easier to understand for everyone.'
        },
        {
          title: 'E-Commerce',
          description: 'Simplifying online purchase terms, warranties and dispute resolution processes.'
        },
        {
          title: 'Government Services',
          description: 'Improving access to understandable public information, schemes and citizen rights.'
        },
        {
          title: 'Artificial Intelligence',
          description: 'Promoting responsible, transparent and explainable AI systems for citizens.'
        },
        {
          title: 'Talent Registry',
          description: 'Connecting skilled citizens, professionals and innovators with opportunities.'
        }
      ],
      metrics: [
        {
          label: 'Citizen Impact Mission',
          value: '100CR+'
        },
        {
          label: 'Infinite Opportunity Network',
          value: '369∞'
        },
        {
          label: 'Focus Areas',
          value: '7+'
        },
        {
          label: 'Digital Trust Ecosystem',
          value: 'TRUST FIRST®'
        }
      ]
    };

    await Mission.create(defaultMission);
    logger.info('Default mission data successfully seeded from rtucai.com.');
  } catch (error) {
    logger.error('Error seeding default mission data:', error);
  }
};
/**
 * Seed a default admin account on server startup if none exists.
 * Admin credentials are loaded from environment variables.
 * This is the ONLY way admin accounts are created — not via /api/auth/register.
 */
const seedDefaultAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      logger.info(`Admin account already exists (${adminExists.email}). Skipping admin seeder.`);
      return;
    }

    const name = process.env.ADMIN_NAME || 'RTUCAI Admin';
    const email = process.env.ADMIN_EMAIL || 'admin@rtucai.in';
    const password = process.env.ADMIN_PASSWORD;

    if (!password) {
      logger.warn('ADMIN_PASSWORD is not set in .env. Skipping admin seeder.');
      return;
    }

    // Directly create the user with role='admin'
    // The pre-save hook will hash the password automatically
    const admin = new User({ name, email, password, role: 'admin' });
    await admin.save();

    logger.info(`✅ Default admin seeded successfully: ${email}`);
    logger.warn('Please change the default admin password after first login.');
  } catch (error) {
    logger.error('Error seeding default admin:', error);
  }
};
