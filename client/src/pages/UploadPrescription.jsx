import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { prescriptionAPI } from '../api';
import Button from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import './UploadPrescription.css';

const UploadPrescription = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [formData, setFormData] = useState({
    prescriptionNumber: '',
    doctorName: '',
    prescriptionDate: '',
    notes: ''
  });

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(selectedFile.type)) {
      toast.error('Please upload a valid image (JPG, PNG) or PDF file');
      return;
    }

    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setFile(selectedFile);

    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      console.log('📤 Uploading via backend to S3...');
      
      // Create FormData with file and metadata
      const data = new FormData();
      data.append('prescriptionFile', file);
      data.append('prescriptionNumber', formData.prescriptionNumber);
      data.append('doctorName', formData.doctorName);
      data.append('prescriptionDate', formData.prescriptionDate);
      data.append('notes', formData.notes);

      // Upload via backend (backend will attempt S3, fallback to local)
      const response = await prescriptionAPI.create(data);
      
      console.log('✅ Upload successful:', response.data);
      
      // Check if uploaded to S3 or local
      if (response.data.data?.prescriptionFile?.uploadedToS3 || 
          response.data.data?.prescriptionImage?.url?.includes('s3.amazonaws.com')) {
        toast.success('🎉 Prescription uploaded successfully to AWS S3!');
      } else {
        toast.success('✅ Prescription uploaded successfully!');
      }
      
      // Reset form
      setFile(null);
      setPreview(null);
      setUploadProgress(0);
      setFormData({
        prescriptionNumber: '',
        doctorName: '',
        prescriptionDate: '',
        notes: ''
      });
    } catch (error) {
      console.error('❌ Upload error:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to upload prescription');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-page" style={{ minHeight: '100vh', background: 'hsl(var(--background))', padding: '2rem 1rem' }}>
      <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: '2rem' }}
        >
          <h1 className="font-calligraphic" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
            Upload Prescription
          </h1>
          <p style={{ color: 'hsl(var(--muted-foreground))' }}>
            Securely upload your prescription to AWS S3
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Prescription Details</CardTitle>
              <CardDescription>
                Upload a scanned copy or photo of your prescription
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit}>
                {/* Drag and Drop Area */}
                <div
                  className={`drop-zone ${dragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {file ? (
                    <div className="file-preview">
                      {preview ? (
                        <img src={preview} alt="Preview" className="preview-image" />
                      ) : (
                        <div className="pdf-icon">
                          <span style={{ fontSize: '4rem' }}>📄</span>
                          <p>{file.name}</p>
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFile(null);
                          setPreview(null);
                        }}
                        style={{ marginTop: '1rem' }}
                      >
                        Remove File
                      </Button>
                    </div>
                  ) : (
                    <div className="drop-prompt">
                      <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>📤</span>
                      <p style={{ fontSize: '1.125rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                        Drag and drop your prescription here
                      </p>
                      <p style={{ color: 'hsl(var(--muted-foreground))', marginBottom: '1rem' }}>
                        or
                      </p>
                      <label htmlFor="file-input">
                        <Button type="button" as="span">
                          Browse Files
                        </Button>
                      </label>
                      <input
                        id="file-input"
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={handleFileInput}
                        style={{ display: 'none' }}
                      />
                      <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', marginTop: '1rem' }}>
                        Supported formats: JPG, PNG, PDF (max 5MB)
                      </p>
                    </div>
                  )}
                </div>

                {/* Form Fields */}
                <div style={{ marginTop: '1.5rem', display: 'grid', gap: '1rem' }}>
                  <div>
                    <label className="form-label">Prescription Number *</label>
                    <input
                      type="text"
                      name="prescriptionNumber"
                      required
                      className="form-input"
                      placeholder="RX-123456"
                      value={formData.prescriptionNumber}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label className="form-label">Doctor Name *</label>
                    <input
                      type="text"
                      name="doctorName"
                      required
                      className="form-input"
                      placeholder="Dr. Smith"
                      value={formData.doctorName}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label className="form-label">Prescription Date *</label>
                    <input
                      type="date"
                      name="prescriptionDate"
                      required
                      className="form-input"
                      value={formData.prescriptionDate}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label className="form-label">Notes (Optional)</label>
                    <textarea
                      name="notes"
                      className="form-input"
                      rows="3"
                      placeholder="Any additional information..."
                      value={formData.notes}
                      onChange={handleChange}
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <Button
                    type="submit"
                    disabled={uploading || !file}
                    className="w-full"
                  >
                    {uploading ? (
                      <>
                        <span className="animate-spin" style={{ marginRight: '0.5rem' }}>⏳</span>
                        Uploading to Cloud...
                      </>
                    ) : (
                      <>
                        <span style={{ marginRight: '0.5rem' }}>☁️</span>
                        Upload to AWS S3
                      </>
                    )}
                  </Button>
                </div>

                {/* AWS Info */}
                <div style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  background: 'hsl(var(--muted) / 0.3)',
                  borderRadius: 'var(--radius)',
                  fontSize: '0.875rem',
                  color: 'hsl(var(--muted-foreground))'
                }}>
                  <p>
                    🔒 Your prescription will be securely encrypted and stored in AWS S3.
                    Only you and authorized pharmacies can access your files.
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default UploadPrescription;
