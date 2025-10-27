import mongoose from 'mongoose';

const medicationSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Medication name is required'],
    trim: true
  },
  dosage: {
    type: String,
    required: [true, 'Dosage is required']
  },
  frequency: {
    type: String,
    required: [true, 'Frequency is required'],
    enum: ['once-daily', 'twice-daily', 'thrice-daily', 'four-times-daily', 'as-needed', 'custom']
  },
  schedule: [{
    time: {
      type: String,
      required: true // Format: "HH:MM"
    },
    taken: {
      type: Boolean,
      default: false
    },
    takenAt: {
      type: Date
    }
  }],
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  instructions: {
    type: String,
    trim: true
  },
  prescribedBy: {
    type: String,
    trim: true
  },
  refillReminder: {
    enabled: {
      type: Boolean,
      default: false
    },
    daysBeforeRefill: {
      type: Number,
      default: 7
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  adherenceHistory: [{
    date: {
      type: Date,
      default: Date.now
    },
    taken: {
      type: Boolean,
      required: true
    },
    scheduledTime: String,
    actualTime: Date,
    notes: String
  }]
}, {
  timestamps: true
});

// Method to calculate adherence rate
medicationSchema.methods.getAdherenceRate = function() {
  const totalDoses = this.adherenceHistory.length;
  if (totalDoses === 0) return 0;
  
  const takenDoses = this.adherenceHistory.filter(h => h.taken).length;
  return ((takenDoses / totalDoses) * 100).toFixed(2);
};

const Medication = mongoose.model('Medication', medicationSchema);

export default Medication;
