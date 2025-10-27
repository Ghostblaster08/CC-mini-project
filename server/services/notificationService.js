import Medication from '../models/Medication.js';
import User from '../models/User.js';
import { sendMedicationReminderEmail } from './emailService.js';

// Send medication reminders based on schedule
export const sendMedicationReminders = async () => {
  try {
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

    // Find all active medications
    const medications = await Medication.find({ isActive: true }).populate('patient');

    for (const medication of medications) {
      // Check each scheduled time
      for (const schedule of medication.schedule) {
        if (schedule.time === currentTimeString && !schedule.taken) {
          // Send reminder email
          try {
            await sendMedicationReminderEmail(
              medication.patient,
              medication,
              schedule.time
            );
            console.log(`Reminder sent for ${medication.name} to ${medication.patient.email}`);
          } catch (error) {
            console.error(`Failed to send reminder to ${medication.patient.email}:`, error);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in sendMedicationReminders:', error);
  }
};

// Log medication intake
export const logMedicationIntake = async (medicationId, scheduleTime, taken, notes = '') => {
  try {
    const medication = await Medication.findById(medicationId);
    
    if (!medication) {
      throw new Error('Medication not found');
    }

    // Update schedule
    const scheduleItem = medication.schedule.find(s => s.time === scheduleTime);
    if (scheduleItem) {
      scheduleItem.taken = taken;
      scheduleItem.takenAt = new Date();
    }

    // Add to adherence history
    medication.adherenceHistory.push({
      date: new Date(),
      taken,
      scheduledTime: scheduleTime,
      actualTime: new Date(),
      notes
    });

    await medication.save();
    return medication;
  } catch (error) {
    console.error('Error logging medication intake:', error);
    throw error;
  }
};

export default { sendMedicationReminders, logMedicationIntake };
