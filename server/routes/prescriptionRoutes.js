import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import uploadLocal from '../middleware/uploadLocal.js';
import Prescription from '../models/Prescription.js';
import { sendPrescriptionReadyEmail } from '../services/emailService.js';
import User from '../models/User.js';
import { uploadToS3 } from '../config/aws.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   GET /api/prescriptions
// @desc    Get all prescriptions for logged in user
// @access  Private
router.get('/', async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'patient') {
      query.patient = req.user._id;
    } else if (req.user.role === 'pharmacy') {
      query.pharmacy = req.user._id;
    }

    const prescriptions = await Prescription.find(query)
      .populate('patient', 'name email phone')
      .populate('pharmacy', 'name email')
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

// @route   POST /api/prescriptions
// @desc    Create new prescription (upload)
// @access  Private (Patient)
router.post('/', authorize('patient'), uploadLocal.single('prescriptionFile'), async (req, res) => {
  try {
    console.log('📝 Prescription upload request received');
    console.log('File:', req.file);
    console.log('Body:', req.body);

    let s3Data = null;
    
    // If file uploaded, try to upload to S3
    if (req.file) {
      try {
        console.log('📤 Uploading to S3...');
        const fileBuffer = fs.readFileSync(req.file.path);
        const fileObject = {
          buffer: fileBuffer,
          originalname: req.file.filename,
          mimetype: req.file.mimetype
        };
        
        s3Data = await uploadToS3(fileObject, 'prescriptions');
        console.log('✅ File uploaded to S3:', s3Data);
        
        // Delete local file after successful S3 upload
        fs.unlinkSync(req.file.path);
        console.log('🗑️ Local file deleted');
      } catch (s3Error) {
        console.error('⚠️ S3 upload failed, keeping local copy:', s3Error.message);
        // Continue with local file if S3 fails
      }
    }

    const prescriptionData = {
      patient: req.user._id,
      prescriptionNumber: req.body.prescriptionNumber,
      prescribedBy: {
        name: req.body.doctorName,
        hospital: req.body.hospital || '',
        contact: req.body.doctorContact || ''
      },
      prescriptionDate: req.body.prescriptionDate,
      notes: req.body.notes || '',
      status: 'pending',
      medications: [] // Empty for now, can be added later
    };

    // Add file info (S3 if available, otherwise local)
    if (s3Data) {
      prescriptionData.prescriptionImage = {
        url: s3Data.url,
        key: s3Data.key,
        uploadedAt: new Date()
      };
    } else if (req.file) {
      prescriptionData.prescriptionImage = {
        url: `/uploads/prescriptions/${req.file.filename}`,
        filename: req.file.filename,
        uploadedAt: new Date()
      };
    }

    const prescription = await Prescription.create(prescriptionData);
    console.log('✅ Prescription created:', prescription._id);

    res.status(201).json({
      success: true,
      message: s3Data ? 'Prescription uploaded to S3 successfully' : 'Prescription uploaded successfully',
      data: prescription
    });
  } catch (error) {
    console.error('❌ Error uploading prescription:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/prescriptions/:id
// @desc    Get single prescription
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patient', 'name email phone address')
      .populate('pharmacy', 'name email phone');

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    // Check authorization
    if (prescription.patient._id.toString() !== req.user._id.toString() &&
        prescription.pharmacy?._id.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this prescription'
      });
    }

    // Generate signed URL for prescription image if exists
    if (prescription.prescriptionImage?.key) {
      prescription.prescriptionImage.signedUrl = getSignedUrl(prescription.prescriptionImage.key);
    }

    res.status(200).json({
      success: true,
      data: prescription
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/prescriptions/:id/status
// @desc    Update prescription status
// @access  Private (Pharmacy)
router.put('/:id/status', authorize('pharmacy', 'admin'), async (req, res) => {
  try {
    const { status } = req.body;

    const prescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      { 
        status,
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

    // Send email notification if status is 'ready'
    if (status === 'ready') {
      try {
        await sendPrescriptionReadyEmail(prescription.patient, prescription);
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Prescription status updated successfully',
      data: prescription
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/prescriptions/:id
// @desc    Delete prescription
// @access  Private (Patient, Admin)
router.delete('/:id', authorize('patient', 'admin'), async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    // Check ownership
    if (prescription.patient.toString() !== req.user._id.toString() && 
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this prescription'
      });
    }

    // Delete from S3 if exists
    if (prescription.prescriptionImage?.key) {
      try {
        await deleteFromS3(prescription.prescriptionImage.key);
      } catch (s3Error) {
        console.error('Failed to delete from S3:', s3Error);
      }
    }

    await prescription.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Prescription deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
