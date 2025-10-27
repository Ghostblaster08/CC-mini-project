import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import Medication from '../models/Medication.js';
import { logMedicationIntake } from '../services/notificationService.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   GET /api/medications
// @desc    Get all medications for logged in patient
// @access  Private (Patient, Caregiver)
router.get('/', authorize('patient', 'caregiver'), async (req, res) => {
  try {
    const medications = await Medication.find({ 
      patient: req.user._id 
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: medications.length,
      data: medications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/medications
// @desc    Create new medication schedule
// @access  Private (Patient, Caregiver)
router.post('/', authorize('patient', 'caregiver'), async (req, res) => {
  try {
    const medicationData = {
      ...req.body,
      patient: req.user._id
    };

    const medication = await Medication.create(medicationData);

    res.status(201).json({
      success: true,
      message: 'Medication schedule created successfully',
      data: medication
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/medications/:id
// @desc    Get single medication
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const medication = await Medication.findById(req.params.id);

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found'
      });
    }

    // Check ownership
    if (medication.patient.toString() !== req.user._id.toString() && 
        req.user.role !== 'caregiver' && 
        req.user.role !== 'pharmacy') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this medication'
      });
    }

    res.status(200).json({
      success: true,
      data: medication
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/medications/:id
// @desc    Update medication
// @access  Private (Patient, Caregiver)
router.put('/:id', authorize('patient', 'caregiver'), async (req, res) => {
  try {
    let medication = await Medication.findById(req.params.id);

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found'
      });
    }

    // Check ownership
    if (medication.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this medication'
      });
    }

    medication = await Medication.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Medication updated successfully',
      data: medication
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/medications/:id
// @desc    Delete medication
// @access  Private (Patient, Caregiver)
router.delete('/:id', authorize('patient', 'caregiver'), async (req, res) => {
  try {
    const medication = await Medication.findById(req.params.id);

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found'
      });
    }

    // Check ownership
    if (medication.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this medication'
      });
    }

    await medication.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Medication deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/medications/:id/log-intake
// @desc    Log medication intake
// @access  Private (Patient, Caregiver)
router.post('/:id/log-intake', authorize('patient', 'caregiver'), async (req, res) => {
  try {
    const { scheduleTime, taken, notes } = req.body;

    const medication = await logMedicationIntake(
      req.params.id,
      scheduleTime,
      taken,
      notes
    );

    res.status(200).json({
      success: true,
      message: 'Medication intake logged successfully',
      data: medication
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/medications/:id/adherence
// @desc    Get medication adherence report
// @access  Private
router.get('/:id/adherence', async (req, res) => {
  try {
    const medication = await Medication.findById(req.params.id);

    if (!medication) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found'
      });
    }

    const adherenceRate = medication.getAdherenceRate();
    
    res.status(200).json({
      success: true,
      data: {
        medication: medication.name,
        adherenceRate: `${adherenceRate}%`,
        history: medication.adherenceHistory,
        totalDoses: medication.adherenceHistory.length,
        takenDoses: medication.adherenceHistory.filter(h => h.taken).length,
        missedDoses: medication.adherenceHistory.filter(h => !h.taken).length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
