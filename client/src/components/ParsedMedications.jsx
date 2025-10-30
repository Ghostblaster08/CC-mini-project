import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { prescriptionAPI, medicationAPI } from '../api';
import Button from './ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import Badge from './ui/Badge';

const ParsedMedications = ({ onMedicationsCreated }) => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedMedications, setSelectedMedications] = useState({});

  useEffect(() => {
    fetchPrescriptionsWithParsedMeds();
  }, []);

  const fetchPrescriptionsWithParsedMeds = async () => {
    try {
      const response = await prescriptionAPI.getAll();
      const prescriptionsWithMeds = response.data.data.filter(
        prescription => prescription.medications && prescription.medications.length > 0
      );
      setPrescriptions(prescriptionsWithMeds);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      toast.error('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleMedicationSelect = (prescriptionId, medicationIndex, selected) => {
    setSelectedMedications(prev => ({
      ...prev,
      [`${prescriptionId}-${medicationIndex}`]: selected
    }));
  };

  const handleCreateMedications = async (prescriptionId) => {
    try {
      setCreating(true);
      
      // Get selected medication indexes for this prescription
      const prescription = prescriptions.find(p => p._id === prescriptionId);
      const selectedIndexes = [];
      
      prescription.medications.forEach((_, index) => {
        if (selectedMedications[`${prescriptionId}-${index}`]) {
          selectedIndexes.push(index);
        }
      });

      if (selectedIndexes.length === 0) {
        toast.warn('Please select at least one medication to create schedule');
        return;
      }

      const response = await prescriptionAPI.createMedications(prescriptionId, {
        medicationIndexes: selectedIndexes
      });

      if (response.data.success) {
        toast.success(`Created ${response.data.data.createdMedications.length} medication schedules!`);
        
        // Clear selections for this prescription
        const updatedSelections = { ...selectedMedications };
        prescription.medications.forEach((_, index) => {
          delete updatedSelections[`${prescriptionId}-${index}`];
        });
        setSelectedMedications(updatedSelections);
        
        // Notify parent component
        if (onMedicationsCreated) {
          onMedicationsCreated(response.data.data.createdMedications);
        }
      }
    } catch (error) {
      console.error('Error creating medications:', error);
      toast.error(error.response?.data?.message || 'Failed to create medication schedules');
    } finally {
      setCreating(false);
    }
  };

  const handleReparse = async (prescriptionId) => {
    try {
      setLoading(true);
      const response = await prescriptionAPI.parse(prescriptionId);
      
      if (response.data.success) {
        toast.success(`Found ${response.data.data.newMedications?.length || 0} new medications!`);
        fetchPrescriptionsWithParsedMeds();
      } else {
        toast.info('No new medications found in prescription');
      }
    } catch (error) {
      console.error('Error reparsing prescription:', error);
      toast.error('Failed to reparse prescription');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent style={{ padding: '2rem', textAlign: 'center' }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p style={{ marginTop: '1rem', color: 'hsl(var(--muted-foreground))' }}>
            Loading parsed medications...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (prescriptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>💊 Parsed Medications</CardTitle>
          <CardDescription>
            Upload prescriptions to automatically extract medication information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p style={{ color: 'hsl(var(--muted-foreground))', textAlign: 'center', padding: '2rem' }}>
            No prescriptions with parsed medications found.
            <br />
            Upload a prescription to get started!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {prescriptions.map((prescription, prescIndex) => (
        <motion.div
          key={prescription._id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: prescIndex * 0.1 }}
        >
          <Card>
            <CardHeader>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <CardTitle>
                    💊 Prescription #{prescription.prescriptionNumber}
                  </CardTitle>
                  <CardDescription>
                    Dr. {prescription.prescribedBy.name} • {new Date(prescription.prescriptionDate).toLocaleDateString()}
                    {prescription.parsingResult?.success && (
                      <Badge variant="success" style={{ marginLeft: '0.5rem' }}>
                        ✓ Parsed {prescription.medications.length} medications
                      </Badge>
                    )}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReparse(prescription._id)}
                  disabled={loading}
                >
                  🔄 Reparse
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Medications List */}
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {prescription.medications.map((medication, medIndex) => (
                    <div
                      key={medIndex}
                      style={{
                        padding: '1rem',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.5rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: selectedMedications[`${prescription._id}-${medIndex}`] 
                          ? 'hsl(var(--primary) / 0.05)' 
                          : 'transparent'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                          {medication.name}
                        </h4>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>
                          <span>💊 {medication.dosage}</span>
                          <span>⏰ {medication.frequency}</span>
                          {medication.source === 'prescription_parser' && (
                            <Badge variant="secondary" size="sm">AI Parsed</Badge>
                          )}
                        </div>
                        {medication.instructions && (
                          <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', fontStyle: 'italic' }}>
                            "{medication.instructions}"
                          </p>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                          type="checkbox"
                          checked={selectedMedications[`${prescription._id}-${medIndex}`] || false}
                          onChange={(e) => handleMedicationSelect(prescription._id, medIndex, e.target.checked)}
                          style={{
                            width: '1rem',
                            height: '1rem',
                            accentColor: 'hsl(var(--primary))'
                          }}
                        />
                        <label style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>
                          Select
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                  <div style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>
                    {Object.keys(selectedMedications).filter(key => 
                      key.startsWith(prescription._id) && selectedMedications[key]
                    ).length} of {prescription.medications.length} medications selected
                  </div>
                  
                  <Button
                    onClick={() => handleCreateMedications(prescription._id)}
                    disabled={creating || Object.keys(selectedMedications).filter(key => 
                      key.startsWith(prescription._id) && selectedMedications[key]
                    ).length === 0}
                  >
                    {creating ? '⏳ Creating...' : '➕ Create Medication Schedules'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default ParsedMedications;