import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Send email function
export const sendEmail = async (options) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: options.email,
    subject: options.subject,
    html: options.html || options.message
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Send medication reminder
export const sendMedicationReminderEmail = async (user, medication, scheduledTime) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .medication { background-color: white; padding: 15px; margin: 10px 0; border-left: 4px solid #4CAF50; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💊 Medication Reminder</h1>
        </div>
        <div class="content">
          <p>Hello ${user.name},</p>
          <p>This is a reminder to take your medication:</p>
          <div class="medication">
            <h3>${medication.name}</h3>
            <p><strong>Dosage:</strong> ${medication.dosage}</p>
            <p><strong>Scheduled Time:</strong> ${scheduledTime}</p>
            <p><strong>Instructions:</strong> ${medication.instructions || 'Take as prescribed'}</p>
          </div>
          <p>Please remember to log your medication intake in the Ashray app.</p>
          <p>Stay healthy!</p>
        </div>
        <div class="footer">
          <p>This is an automated message from Ashray Pharmacy System</p>
          <p>© 2025 Ashray. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    email: user.email,
    subject: `Medication Reminder: ${medication.name}`,
    html
  });
};

// Send prescription ready notification
export const sendPrescriptionReadyEmail = async (user, prescription) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Prescription Ready for Pickup</h1>
        </div>
        <div class="content">
          <p>Hello ${user.name},</p>
          <p>Your prescription #${prescription.prescriptionNumber} is ready for pickup!</p>
          <p>Please visit the pharmacy at your earliest convenience.</p>
          <p>Thank you for choosing Ashray Pharmacy System.</p>
        </div>
        <div class="footer">
          <p>© 2025 Ashray. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    email: user.email,
    subject: 'Your Prescription is Ready',
    html
  });
};

export default { sendEmail, sendMedicationReminderEmail, sendPrescriptionReadyEmail };
