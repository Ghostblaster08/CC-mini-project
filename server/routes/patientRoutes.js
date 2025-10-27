import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import User from '../models/User.js';
import Medication from '../models/Medication.js';
import Prescription from '../models/Prescription.js';

const router = express.Router();

// All routes are protected and require patient or caregiver role
router.use(protect);

// @route   GET /api/patients/dashboard
// @desc    Get patient dashboard data
// @access  Private (Patient, Caregiver)
router.get('/dashboard', authorize('patient', 'caregiver'), async (req, res) => {
  try {
    const userId = req.user._id;

    // Get active medications
    const medications = await Medication.find({ 
      patient: userId, 
      isActive: true 
    });

    // Get recent prescriptions
    const prescriptions = await Prescription.find({ patient: userId })
      .sort({ createdAt: -1 })
      .limit(5);

    // Calculate adherence rate
    let totalAdherence = 0;
    medications.forEach(med => {
      totalAdherence += parseFloat(med.getAdherenceRate());
    });
    const averageAdherence = medications.length > 0 
      ? (totalAdherence / medications.length).toFixed(2) 
      : 0;

    // Get today's schedule
    const today = new Date().toISOString().split('T')[0];
    const todaySchedule = [];
    medications.forEach(med => {
      med.schedule.forEach(sch => {
        todaySchedule.push({
          medication: med.name,
          time: sch.time,
          taken: sch.taken,
          dosage: med.dosage
        });
      });
    });

    res.status(200).json({
      success: true,
      data: {
        medications,
        prescriptions,
        adherenceRate: averageAdherence,
        todaySchedule: todaySchedule.sort((a, b) => a.time.localeCompare(b.time))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/patients/profile
// @desc    Get patient profile
// @access  Private
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/patients/profile
// @desc    Update patient profile
// @access  Private
router.put('/profile', async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, address },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
