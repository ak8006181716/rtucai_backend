import mongoose from 'mongoose';

const ComplaintSchema = new mongoose.Schema(
  {
    trackingId: {
      type: String,
      unique: true
    },
    // recorded account email from Google form
    email: {
      type: String,
      required: [true, 'Please add a contact email'],
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email'
      ]
    },
    fullName: {
      type: String,
      required: [true, 'Please add full name']
    },
    mobileNumber: {
      type: String,
      required: [true, 'Please add mobile number']
    },
    emailAddress: {
      type: String,
      required: [true, 'Please add email address']
    },
    gender: {
      type: String,
      required: [true, 'Please select gender'],
      enum: ['Male', 'Female', 'Other']
    },
    state: {
      type: String,
      required: [true, 'Please add state']
    },
    city: {
      type: String,
      required: [true, 'Please add city']
    },
    address: {
      type: String,
      required: [true, 'Please add address']
    },
    category: {
      type: String,
      required: [true, 'Please select a complaint category']
    },
    companyName: {
      type: String,
      required: [true, 'Please add company/seller/platform name']
    },
    incidentDate: {
      type: Date,
      required: [true, 'Please add date of incident']
    },
    lossAmount: {
      type: String // Handled as string to support "No loss" or text estimates, e.g. "Rs. 15,000"
    },
    explainComplaint: {
      type: String,
      required: [true, 'Please provide an explanation of the complaint']
    },
    detailedDescription: {
      type: String,
      required: [true, 'Please provide a detailed description of the issue']
    },
    mediaUrls: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved'],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

// Pre-save hook to generate a clean, unique tracking ID before saving
ComplaintSchema.pre('save', function () {
  if (!this.trackingId) {
    const randomHex = Math.random().toString(36).substring(2, 10).toUpperCase();
    this.trackingId = `RTU-${randomHex.substring(0, 4)}-${randomHex.substring(4, 8)}`;
  }
});

export default mongoose.model('Complaint', ComplaintSchema);
