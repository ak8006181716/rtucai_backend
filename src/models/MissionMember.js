import mongoose from 'mongoose';

const MissionMemberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name']
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email'
      ]
    },
    phone: {
      type: String
    },
    role: {
      type: String,
      enum: ['volunteer', 'advocate', 'writer', 'other'],
      default: 'volunteer'
    },
    message: {
      type: String
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('MissionMember', MissionMemberSchema);
