import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  pharmacy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  medicationName: {
    type: String,
    required: [true, 'Medication name is required'],
    trim: true
  },
  genericName: {
    type: String,
    trim: true
  },
  manufacturer: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['antibiotic', 'pain-relief', 'cardiovascular', 'diabetes', 'respiratory', 'vitamin', 'other'],
    default: 'other'
  },
  dosageForm: {
    type: String,
    enum: ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'drops', 'other'],
    required: true
  },
  strength: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 0
  },
  reorderLevel: {
    type: Number,
    default: 10
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  batchNumber: {
    type: String
  },
  expiryDate: {
    type: Date
  },
  supplier: {
    name: String,
    contact: String
  },
  location: {
    shelf: String,
    rack: String
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  requiresPrescription: {
    type: Boolean,
    default: true
  },
  restockHistory: [{
    date: {
      type: Date,
      default: Date.now
    },
    quantity: Number,
    supplier: String,
    cost: Number
  }]
}, {
  timestamps: true
});

// Method to check if reorder is needed
inventorySchema.methods.needsReorder = function() {
  return this.quantity <= this.reorderLevel;
};

const Inventory = mongoose.model('Inventory', inventorySchema);

export default Inventory;
