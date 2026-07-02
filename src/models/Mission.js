import mongoose from 'mongoose';

const FocusAreaSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  }
});

const MetricSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true
  },
  value: {
    type: String,
    required: true
  }
});

const MissionSchema = new mongoose.Schema(
  {
    vision: {
      type: String,
      required: true
    },
    missionStatements: {
      type: [String],
      required: true
    },
    focusAreas: {
      type: [FocusAreaSchema],
      default: []
    },
    metrics: {
      type: [MetricSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Mission', MissionSchema);
