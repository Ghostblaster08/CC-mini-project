import os
import io
import json
import logging
import traceback
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
import PyPDF2
import fitz  # PyMuPDF
import requests
from PIL import Image
import pytesseract
import re
from werkzeug.utils import secure_filename
import tempfile

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins="*")

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['UPLOAD_FOLDER'] = '/tmp/uploads'
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg'}

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_pdf(pdf_path):
    """Extract text from PDF using multiple methods"""
    text = ""
    
    try:
        # Method 1: PyMuPDF (better for complex PDFs)
        logger.info("Extracting text using PyMuPDF...")
        doc = fitz.open(pdf_path)
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            text += page.get_text()
        doc.close()
        logger.info(f"PyMuPDF extracted {len(text)} characters")
        
        if len(text.strip()) > 50:  # If we got substantial text
            return text
            
    except Exception as e:
        logger.warning(f"PyMuPDF failed: {e}")
    
    try:
        # Method 2: PyPDF2 (fallback)
        logger.info("Extracting text using PyPDF2...")
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text += page.extract_text()
        logger.info(f"PyPDF2 extracted {len(text)} characters")
        
    except Exception as e:
        logger.warning(f"PyPDF2 failed: {e}")
    
    # Method 3: OCR as last resort (convert PDF to images and OCR)
    if len(text.strip()) < 50:
        try:
            logger.info("Attempting OCR extraction...")
            doc = fitz.open(pdf_path)
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                pix = page.get_pixmap()
                img_data = pix.tobytes("png")
                img = Image.open(io.BytesIO(img_data))
                ocr_text = pytesseract.image_to_string(img)
                text += ocr_text
            doc.close()
            logger.info(f"OCR extracted {len(text)} characters")
            
        except Exception as e:
            logger.warning(f"OCR failed: {e}")
    
    return text

def extract_text_from_image(image_path):
    """Extract text from image using OCR"""
    try:
        logger.info("Extracting text from image using OCR...")
        img = Image.open(image_path)
        text = pytesseract.image_to_string(img)
        logger.info(f"OCR extracted {len(text)} characters from image")
        return text
    except Exception as e:
        logger.error(f"Image OCR failed: {e}")
        return ""

def parse_medications_from_text(text):
    """Parse medications from extracted text using pattern matching"""
    medications = []
    
    # Clean up text
    text = text.strip()
    if not text:
        return medications
    
    logger.info(f"Parsing medications from {len(text)} characters of text")
    
    # Common medication patterns
    # Pattern 1: Medicine Name - Dosage - Frequency
    pattern1 = r'(\b[A-Z][a-zA-Z\s]{2,30})\s*[-–—]\s*(\d+(?:\.\d+)?\s*(?:mg|g|ml|units?))\s*[-–—]\s*([^.\n]+)'
    
    # Pattern 2: Number. Medicine Name Dosage Frequency
    pattern2 = r'\d+\.\s*([A-Z][a-zA-Z\s]{2,30})\s+(\d+(?:\.\d+)?\s*(?:mg|g|ml|units?))\s+([^.\n]+)'
    
    # Pattern 3: Medicine Name (Dosage) - Frequency
    pattern3 = r'([A-Z][a-zA-Z\s]{2,30})\s*\((\d+(?:\.\d+)?\s*(?:mg|g|ml|units?))\)\s*[-–—]\s*([^.\n]+)'
    
    # Pattern 4: Simple line-by-line parsing
    lines = text.split('\n')
    
    # Try regex patterns first
    for pattern in [pattern1, pattern2, pattern3]:
        matches = re.findall(pattern, text, re.IGNORECASE | re.MULTILINE)
        for match in matches:
            med_name = match[0].strip()
            dosage = match[1].strip()
            frequency = match[2].strip()
            
            if len(med_name) > 2 and any(char.isalpha() for char in med_name):
                medications.append({
                    'name': med_name,
                    'dosage': dosage,
                    'frequency': frequency.split('.')[0]  # Take only first sentence
                })
    
    # If no medications found with regex, try manual parsing
    if not medications:
        logger.info("Regex patterns failed, trying manual parsing...")
        
        # Look for common medication keywords
        med_keywords = ['tablet', 'capsule', 'syrup', 'mg', 'ml', 'once', 'twice', 'daily', 'morning', 'evening']
        
        for line in lines:
            line = line.strip()
            if len(line) > 10 and any(keyword in line.lower() for keyword in med_keywords):
                # Try to extract medication info from line
                parts = re.split(r'[-–—]', line)
                if len(parts) >= 2:
                    name_part = parts[0].strip()
                    rest = ' - '.join(parts[1:]).strip()
                    
                    # Extract dosage
                    dosage_match = re.search(r'(\d+(?:\.\d+)?\s*(?:mg|g|ml|units?))', rest)
                    dosage = dosage_match.group(1) if dosage_match else 'Not specified'
                    
                    # Extract frequency
                    freq_patterns = [
                        r'(once|twice|thrice)\s+(?:a\s+)?day',
                        r'(\d+)\s+times?\s+(?:a\s+)?day',
                        r'(morning|evening|night)',
                        r'(daily|weekly)'
                    ]
                    
                    frequency = 'As directed'
                    for freq_pattern in freq_patterns:
                        freq_match = re.search(freq_pattern, rest, re.IGNORECASE)
                        if freq_match:
                            frequency = freq_match.group(0)
                            break
                    
                    if len(name_part) > 2:
                        medications.append({
                            'name': name_part,
                            'dosage': dosage,
                            'frequency': frequency
                        })
    
    # Remove duplicates and clean up
    seen = set()
    clean_medications = []
    for med in medications:
        med_key = med['name'].lower().strip()
        if med_key not in seen and len(med['name'].strip()) > 2:
            seen.add(med_key)
            clean_medications.append({
                'name': med['name'].title(),
                'dosage': med['dosage'],
                'frequency': med['frequency'],
                'instructions': f"Take {med['dosage']} {med['frequency']}",
                'parsed_at': datetime.utcnow().isoformat()
            })
    
    logger.info(f"Successfully parsed {len(clean_medications)} medications")
    return clean_medications

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'prescription-parser',
        'timestamp': datetime.utcnow().isoformat()
    })

@app.route('/parse-prescription', methods=['POST'])
def parse_prescription():
    """Parse prescription from uploaded file or S3 URL"""
    try:
        logger.info("Received prescription parsing request")
        
        # Check if file is uploaded directly
        if 'file' in request.files:
            file = request.files['file']
            if file.filename == '':
                return jsonify({'error': 'No file selected'}), 400
            
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(file_path)
                logger.info(f"File saved locally: {filename}")
        
        # Check if S3 URL is provided
        elif 'file_url' in request.json:
            file_url = request.json['file_url']
            logger.info(f"Downloading file from S3: {file_url}")
            
            # Download file from S3
            response = requests.get(file_url)
            if response.status_code != 200:
                return jsonify({'error': 'Failed to download file from S3'}), 400
            
            # Determine file extension from URL or content type
            content_type = response.headers.get('content-type', '')
            if 'pdf' in content_type:
                extension = '.pdf'
            elif 'image' in content_type:
                extension = '.jpg'
            else:
                # Try to get extension from URL
                extension = '.pdf'  # Default to PDF
                if file_url.lower().endswith(('.png', '.jpg', '.jpeg')):
                    extension = file_url[file_url.rfind('.'):]
            
            filename = f"temp_{datetime.now().strftime('%Y%m%d_%H%M%S')}{extension}"
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            
            with open(file_path, 'wb') as f:
                f.write(response.content)
            
            logger.info(f"File downloaded and saved: {filename}")
        
        else:
            return jsonify({'error': 'No file or file URL provided'}), 400
        
        # Extract text based on file type
        file_extension = filename.lower().split('.')[-1]
        
        if file_extension == 'pdf':
            extracted_text = extract_text_from_pdf(file_path)
        elif file_extension in ['png', 'jpg', 'jpeg']:
            extracted_text = extract_text_from_image(file_path)
        else:
            return jsonify({'error': 'Unsupported file type'}), 400
        
        # Parse medications from extracted text
        medications = parse_medications_from_text(extracted_text)
        
        # Clean up temporary file
        try:
            os.remove(file_path)
            logger.info(f"Temporary file removed: {filename}")
        except Exception as e:
            logger.warning(f"Failed to remove temporary file: {e}")
        
        # Return results
        response_data = {
            'success': True,
            'extracted_text_length': len(extracted_text),
            'medications_found': len(medications),
            'medications': medications,
            'processed_at': datetime.utcnow().isoformat()
        }
        
        logger.info(f"Successfully processed prescription: {len(medications)} medications found")
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Error processing prescription: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

@app.route('/parse-text', methods=['POST'])
def parse_text():
    """Parse medications from provided text"""
    try:
        if not request.json or 'text' not in request.json:
            return jsonify({'error': 'No text provided'}), 400
        
        text = request.json['text']
        medications = parse_medications_from_text(text)
        
        return jsonify({
            'success': True,
            'medications_found': len(medications),
            'medications': medications,
            'processed_at': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error parsing text: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)