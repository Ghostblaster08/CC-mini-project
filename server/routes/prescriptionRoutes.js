import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import uploadLocal from '../middleware/uploadLocal.js';
import Prescription from '../models/Prescription.js';
import { sendPrescriptionReadyEmail } from '../services/emailService.js';
import User from '../models/User.js';
import { uploadToS3 } from '../config/aws.js';
import prescriptionParserService from '../services/prescriptionParserService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   GET /api/prescriptions/test-flask
// @desc    Test Flask service connection
// @access  Private
router.get('/test-flask', async (req, res) => {
  try {
    console.log('🧪 Testing Flask service connection...');
    const isHealthy = await prescriptionParserService.healthCheck();
    
    res.status(200).json({
      success: true,
      flaskServiceHealthy: isHealthy,
      flaskServiceUrl: process.env.FLASK_SERVICE_URL,
      message: isHealthy ? 'Flask service is connected and healthy!' : 'Flask service is not responding'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      flaskServiceUrl: process.env.FLASK_SERVICE_URL
    });
  }
});

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
    let prescriptionFileData = null;

    // Check if this is a direct S3 upload (pre-signed URL method)
    if (req.body.prescriptionFile && typeof req.body.prescriptionFile === 'string') {
      console.log('🎯 Direct S3 upload detected (pre-signed URL)');
      try {
        const fileData = JSON.parse(req.body.prescriptionFile);
        prescriptionFileData = {
          url: fileData.url,
          key: fileData.key,
          filename: fileData.key.split('/').pop(),
          uploadedToS3: true
        };
        console.log('✅ S3 file data received:', prescriptionFileData);
      } catch (parseError) {
        console.error('❌ Error parsing prescriptionFile:', parseError);
      }
    }
    // If file uploaded via traditional method, try to upload to S3
    else if (req.file) {
      try {
        console.log('📤 Traditional upload - attempting S3...');
        const fileBuffer = fs.readFileSync(req.file.path);
        const fileObject = {
          buffer: fileBuffer,
          originalname: req.file.filename,
          mimetype: req.file.mimetype
        };
        
        s3Data = await uploadToS3(fileObject, 'prescriptions');
        console.log('✅ File uploaded to S3:', s3Data);
        
        prescriptionFileData = {
          url: s3Data.url,
          key: s3Data.key,
          filename: req.file.filename,
          uploadedToS3: true
        };
        
        // Delete local file after successful S3 upload
        fs.unlinkSync(req.file.path);
        console.log('🗑️ Local file deleted');
      } catch (s3Error) {
        console.error('⚠️ S3 upload failed, keeping local copy:', s3Error.message);
        // Fall back to local file
        prescriptionFileData = {
          url: `/uploads/prescriptions/${req.file.filename}`,
          filename: req.file.filename,
          uploadedToS3: false
        };
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
      medications: [] // Will be populated after parsing
    };

    // Add file info
    if (prescriptionFileData) {
      prescriptionData.prescriptionFile = prescriptionFileData;
      prescriptionData.prescriptionImage = prescriptionFileData; // For backward compatibility
      console.log('📎 File attached:', prescriptionFileData.uploadedToS3 ? 'S3' : 'Local');
    }

    // Parse prescription if file was uploaded successfully
    let parsedMedications = [];
    if (prescriptionFileData?.uploadedToS3) {
      try {
        console.log('🔍 Attempting to parse prescription...');
        const parseResult = await prescriptionParserService.parsePrescriptionFromUrl(prescriptionFileData.url);
        
        if (parseResult.success && parseResult.medications && parseResult.medications.length > 0) {
          parsedMedications = prescriptionParserService.formatMedicationsForDB(parseResult.medications);
          prescriptionData.medications = parsedMedications;
          prescriptionData.parsingResult = {
            success: true,
            medicationsFound: parseResult.medications_found,
            extractedTextLength: parseResult.extracted_text_length,
            processedAt: parseResult.processed_at
          };
          console.log(`✅ Successfully parsed ${parsedMedications.length} medications`);
        } else {
          console.log('⚠️ No medications found in prescription');
          prescriptionData.parsingResult = {
            success: false,
            error: 'No medications found',
            processedAt: new Date().toISOString()
          };
        }
      } catch (parseError) {
        console.error('❌ Prescription parsing failed:', parseError.message);
        prescriptionData.parsingResult = {
          success: false,
          error: parseError.message,
          processedAt: new Date().toISOString()
        };
      }
    } else if (req.file && !prescriptionFileData?.uploadedToS3) {
      // Try parsing local file if S3 upload failed
      try {
        console.log('🔍 Attempting to parse local file...');
        const fileBuffer = fs.readFileSync(req.file.path);
        const parseResult = await prescriptionParserService.parsePrescriptionFromBuffer(
          fileBuffer, 
          req.file.filename, 
          req.file.mimetype
        );
        
        if (parseResult.success && parseResult.medications && parseResult.medications.length > 0) {
          parsedMedications = prescriptionParserService.formatMedicationsForDB(parseResult.medications);
          prescriptionData.medications = parsedMedications;
          prescriptionData.parsingResult = {
            success: true,
            medicationsFound: parseResult.medications_found,
            extractedTextLength: parseResult.extracted_text_length,
            processedAt: parseResult.processed_at
          };
          console.log(`✅ Successfully parsed ${parsedMedications.length} medications from local file`);
        }
      } catch (parseError) {
        console.error('❌ Local file parsing failed:', parseError.message);
        prescriptionData.parsingResult = {
          success: false,
          error: parseError.message,
          processedAt: new Date().toISOString()
        };
      }
    }

    const prescription = await Prescription.create(prescriptionData);
    console.log('✅ Prescription created:', prescription._id);

    // Prepare response message
    let message = prescriptionFileData?.uploadedToS3 ? 'Prescription uploaded to S3 successfully!' : 'Prescription uploaded successfully';
    if (parsedMedications.length > 0) {
      message += ` Found ${parsedMedications.length} medication${parsedMedications.length > 1 ? 's' : ''}.`;
    }

    res.status(201).json({
      success: true,
      message,
      data: prescription,
      parsedMedications: parsedMedications.length > 0 ? parsedMedications : undefined
    });
  } catch (error) {
    console.error('❌ Error uploading prescription:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/prescriptions/:id/parse
// @desc    Parse prescription and create medications
// @access  Private (Patient)
router.post('/:id/parse', authorize('patient'), async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    // Check authorization
    if (prescription.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this prescription'
      });
    }

    // Check if prescription has a file to parse
    if (!prescription.prescriptionFile?.url && !prescription.prescriptionImage?.url) {
      return res.status(400).json({
        success: false,
        message: 'No prescription file found to parse'
      });
    }

    try {
      const fileUrl = prescription.prescriptionFile?.url || prescription.prescriptionImage?.url;
      console.log(`🔍 Re-parsing prescription ${prescription._id} from URL: ${fileUrl}`);
      
      const parseResult = await prescriptionParserService.parsePrescriptionFromUrl(fileUrl);
      
      if (parseResult.success && parseResult.medications && parseResult.medications.length > 0) {
        const parsedMedications = prescriptionParserService.formatMedicationsForDB(parseResult.medications);
        
        // Update prescription with parsed medications
        prescription.medications = [...prescription.medications, ...parsedMedications];
        prescription.parsingResult = {
          success: true,
          medicationsFound: parseResult.medications_found,
          extractedTextLength: parseResult.extracted_text_length,
          processedAt: parseResult.processed_at
        };
        
        await prescription.save();
        
        console.log(`✅ Successfully re-parsed and updated prescription with ${parsedMedications.length} medications`);
        
        res.status(200).json({
          success: true,
          message: `Successfully parsed ${parsedMedications.length} medication${parsedMedications.length > 1 ? 's' : ''} from prescription`,
          data: {
            prescription,
            newMedications: parsedMedications
          }
        });
      } else {
        prescription.parsingResult = {
          success: false,
          error: 'No medications found',
          processedAt: new Date().toISOString()
        };
        await prescription.save();
        
        res.status(200).json({
          success: false,
          message: 'No medications found in prescription',
          data: prescription
        });
      }
    } catch (parseError) {
      console.error('❌ Prescription re-parsing failed:', parseError.message);
      
      prescription.parsingResult = {
        success: false,
        error: parseError.message,
        processedAt: new Date().toISOString()
      };
      await prescription.save();
      
      res.status(500).json({
        success: false,
        message: `Failed to parse prescription: ${parseError.message}`,
        data: prescription
      });
    }
  } catch (error) {
    console.error('❌ Error in prescription parsing:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/prescriptions/:id/create-medications
// @desc    Create medication schedules from parsed prescription
// @access  Private (Patient)
router.post('/:id/create-medications', authorize('patient'), async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    // Check authorization
    if (prescription.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this prescription'
      });
    }

    // Check if prescription has medications to create
    if (!prescription.medications || prescription.medications.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No medications found in prescription. Try parsing the prescription first.'
      });
    }

    const { medicationIndexes, scheduleData } = req.body;
    const createdMedications = [];

    // Import Medication model
    const { default: Medication } = await import('../models/Medication.js');

    // Create medications for specified indexes or all if none specified
    const indexesToProcess = medicationIndexes || prescription.medications.map((_, index) => index);
    
    for (const index of indexesToProcess) {
      const prescMedication = prescription.medications[index];
      if (!prescMedication) continue;

      try {
        // Create medication schedule
        const medicationData = {
          patient: req.user._id,
          name: prescMedication.name,
          dosage: prescMedication.dosage,
          frequency: prescMedication.frequency || 'As needed',
          instructions: prescMedication.instructions || `Take ${prescMedication.dosage} ${prescMedication.frequency || 'as directed'}`,
          isActive: true,
          source: 'prescription',
          prescriptionId: prescription._id,
          startDate: new Date(),
          // Default schedule - can be customized by user later
          schedule: scheduleData?.[index] || {
            times: ['09:00'], // Default to 9 AM
            days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
          }
        };

        const medication = await Medication.create(medicationData);
        createdMedications.push(medication);
        
        console.log(`✅ Created medication schedule for: ${prescMedication.name}`);
      } catch (medError) {
        console.error(`❌ Failed to create medication for ${prescMedication.name}:`, medError.message);
      }
    }

    res.status(201).json({
      success: true,
      message: `Successfully created ${createdMedications.length} medication schedule${createdMedications.length > 1 ? 's' : ''}`,
      data: {
        createdMedications,
        prescription
      }
    });
  } catch (error) {
    console.error('❌ Error creating medications from prescription:', error);
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
