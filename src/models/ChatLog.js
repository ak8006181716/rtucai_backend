import mongoose from 'mongoose';

const ChatLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    message: {
      type: String,
      required: [true, 'User message is required']
    },
    reply: {
      type: String,
      required: [true, 'Chatbot reply is required']
    },
    model: {
      type: String,
      default: ''
    },
    ipAddress: {
      type: String,
      default: ''
    },
    userAgent: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('ChatLog', ChatLogSchema);
