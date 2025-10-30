import fetch from 'node-fetch';

class PrescriptionParserService {
  constructor() {
    // Flask service URL - update this with your EC2 instance IP
    this.flaskServiceUrl = process.env.FLASK_SERVICE_URL || 'http://localhost:5000';
    this.timeout = 60000; // 60 seconds timeout for PDF processing
  }

  /**
   * Parse prescription from S3 URL
   * @param {string} fileUrl - S3 URL of the prescription file
   * @returns {Promise<Object>} Parsed medications data
   */
  async parsePrescriptionFromUrl(fileUrl) {
    try {
      console.log(`🔍 Parsing prescription from URL: ${fileUrl}`);
      
      const response = await fetch(`${this.flaskServiceUrl}/parse-prescription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file_url: fileUrl }),
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        throw new Error(`Flask service responded with status: ${response.status}`);
      }

      const result = await response.json();
      console.log(`✅ Prescription parsed successfully: ${result.medications_found} medications found`);
      
      return result;
    } catch (error) {
      console.error('❌ Error parsing prescription:', error.message);
      throw new Error(`Prescription parsing failed: ${error.message}`);
    }
  }

  /**
   * Parse prescription from file buffer
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} originalname - Original filename
   * @param {string} mimetype - File MIME type
   * @returns {Promise<Object>} Parsed medications data
   */
  async parsePrescriptionFromBuffer(fileBuffer, originalname, mimetype) {
    try {
      console.log(`🔍 Parsing prescription from buffer: ${originalname}`);
      
      const FormData = await import('form-data');
      const form = new FormData.default();
      
      form.append('file', fileBuffer, {
        filename: originalname,
        contentType: mimetype
      });

      const response = await fetch(`${this.flaskServiceUrl}/parse-prescription`, {
        method: 'POST',
        body: form,
        timeout: this.timeout
      });

      if (!response.ok) {
        throw new Error(`Flask service responded with status: ${response.status}`);
      }

      const result = await response.json();
      console.log(`✅ Prescription parsed successfully: ${result.medications_found} medications found`);
      
      return result;
    } catch (error) {
      console.error('❌ Error parsing prescription:', error.message);
      throw new Error(`Prescription parsing failed: ${error.message}`);
    }
  }

  /**
   * Parse medications from text
   * @param {string} text - Text content to parse
   * @returns {Promise<Object>} Parsed medications data
   */
  async parsePrescriptionFromText(text) {
    try {
      console.log('🔍 Parsing prescription from text');
      
      const response = await fetch(`${this.flaskServiceUrl}/parse-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
        timeout: this.timeout
      });

      if (!response.ok) {
        throw new Error(`Flask service responded with status: ${response.status}`);
      }

      const result = await response.json();
      console.log(`✅ Text parsed successfully: ${result.medications_found} medications found`);
      
      return result;
    } catch (error) {
      console.error('❌ Error parsing text:', error.message);
      throw new Error(`Text parsing failed: ${error.message}`);
    }
  }

  /**
   * Health check for the Flask service
   * @returns {Promise<boolean>} Service health status
   */
  async healthCheck() {
    try {
      const response = await fetch(`${this.flaskServiceUrl}/health`, {
        method: 'GET',
        timeout: 5000 // 5 seconds for health check
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Flask service is healthy: ${result.status}`);
        return true;
      } else {
        console.warn(`⚠️ Flask service health check failed: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.error('❌ Flask service health check error:', error.message);
      return false;
    }
  }

  /**
   * Format parsed medications for database storage
   * @param {Array} medications - Parsed medications from Flask service
   * @returns {Array} Formatted medications for database
   */
  formatMedicationsForDB(medications) {
    return medications.map(med => ({
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      instructions: med.instructions || `Take ${med.dosage} ${med.frequency}`,
      isActive: true,
      source: 'prescription_parser',
      parsedAt: new Date(med.parsed_at || new Date())
    }));
  }
}

export default new PrescriptionParserService();