import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import User from '../models/User.js';
import Prescription from '../models/Prescription.js';
import Inventory from '../models/Inventory.js';

const router = express.Router();

// All routes are protected and require pharmacy role
router.use(protect);
router.use(authorize('pharmacy', 'admin'));

// @route   GET /api/pharmacy/dashboard
// @desc    Get pharmacy dashboard data
// @access  Private (Pharmacy)
router.get('/dashboard', async (req, res) => {
  try {
    // Get prescription statistics
    const totalPrescriptions = await Prescription.countDocuments({ pharmacy: req.user._id });
    const pendingPrescriptions = await Prescription.countDocuments({ 
      pharmacy: req.user._id, 
      status: 'pending' 
    });
    const readyPrescriptions = await Prescription.countDocuments({ 
      pharmacy: req.user._id, 
      status: 'ready' 
    });

    // Get inventory statistics
    const totalInventory = await Inventory.countDocuments({ pharmacy: req.user._id });
    const lowStockItems = await Inventory.find({ 
      pharmacy: req.user._id 
    }).then(items => items.filter(item => item.needsReorder()));

    // Get recent prescriptions
    const recentPrescriptions = await Prescription.find({ pharmacy: req.user._id })
      .populate('patient', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalPrescriptions,
          pendingPrescriptions,
          readyPrescriptions,
          totalInventory: totalInventory,
          lowStockItems: lowStockItems.length
        },
        recentPrescriptions,
        lowStockItems
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/pharmacy/prescriptions/pending
// @desc    Get pending prescriptions for pharmacy
// @access  Private (Pharmacy)
router.get('/prescriptions/pending', async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ 
      status: 'pending' 
    })
      .populate('patient', 'name email phone address')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      data: prescriptions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/pharmacy/prescriptions/:id/process
// @desc    Process a prescription
// @access  Private (Pharmacy)
router.post('/prescriptions/:id/process', async (req, res) => {
  try {
    const prescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'processing',
        pharmacy: req.user._id 
      },
      { new: true }
    ).populate('patient', 'name email');

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Prescription is now being processed',
      data: prescription
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
