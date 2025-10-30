import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pharmacy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  prescriptionNumber: {
    type: String,
    unique: true,
    required: true
  },
  prescribedBy: {
    name: {
      type: String,
      required: true
    },
    license: String,
    hospital: String,
    contact: String
  },
  medications: [{
    name: {
      type: String,
      required: true
    },
    dosage: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      default: 1
    },
    frequency: String,
    duration: String,
    instructions: String,
    isActive: {
      type: Boolean,
      default: true
    },
    source: {
      type: String,
      enum: ['manual', 'prescription_parser'],
      default: 'manual'
    },
    parsedAt: Date
  }],
  prescriptionDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  expiryDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'ready', 'completed', 'cancelled'],
    default: 'pending'
  },
  prescriptionImage: {
    url: String,
    key: String, // S3 key for deletion
    uploadedAt: Date,
    uploadedToS3: Boolean
  },
  prescriptionFile: {
    url: String,
    key: String,
    filename: String,
    uploadedToS3: Boolean,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  parsingResult: {
    success: Boolean,
    medicationsFound: Number,
    extractedTextLength: Number,
    error: String,
    processedAt: Date
  },
  notes: {
    type: String
  },
  refillsRemaining: {
    type: Number,
    default: 0
  },
  refillHistory: [{
    date: {
      type: Date,
      default: Date.now
    },
    pharmacy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: String
  }]
}, {
  timestamps: true
});

// Generate unique prescription number before saving
prescriptionSchema.pre('save', async function(next) {
  if (!this.prescriptionNumber) {
    this.prescriptionNumber = `RX${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }
  next();
});

const Prescription = mongoose.model('Prescription', prescriptionSchema);

export default Prescription;
