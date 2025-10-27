import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { patientAPI, medicationAPI } from '../api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import Button from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Badge from '../components/ui/Badge';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  console.log('📊 Dashboard component mounted');
  console.log('👤 Current user:', user);

  useEffect(() => {
    console.log('📊 Dashboard useEffect triggered');
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      console.log('📡 Fetching dashboard data...');
      const response = await patientAPI.getDashboard();
      console.log('✅ Dashboard data received:', response.data.data);
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('❌ Dashboard error:', error);
      // Don't show error toast on initial load for new users
    } finally {
      setLoading(false);
      console.log('✅ Dashboard loading complete');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const handleLogIntake = async (medicationId, scheduleTime, taken) => {
    try {
      await medicationAPI.logIntake(medicationId, {
        scheduleTime,
        taken,
        notes: ''
      });
      toast.success('Medication intake logged!');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to log intake');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(var(--background))' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'hsl(var(--primary))' }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}>
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div>
            <h1 className="font-calligraphic" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
              Welcome back, {user?.name}! 👋
            </h1>
            <p style={{ color: 'hsl(var(--muted-foreground))' }}>
              Here's your health overview
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </motion.div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardDescription>Active Medications</CardDescription>
                <CardTitle style={{ fontSize: '2.5rem', color: 'hsl(var(--primary))' }}>
                  {dashboardData?.activeMedications || 0}
                </CardTitle>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardDescription>Adherence Rate</CardDescription>
                <CardTitle style={{ fontSize: '2.5rem', color: 'hsl(var(--success))' }}>
                  {dashboardData?.adherenceRate || 0}%
                </CardTitle>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardDescription>Total Prescriptions</CardDescription>
                <CardTitle style={{ fontSize: '2.5rem', color: 'hsl(var(--secondary))' }}>
                  {dashboardData?.totalPrescriptions || 0}
                </CardTitle>
              </CardHeader>
            </Card>
          </motion.div>
        </div>

        {/* Welcome Message for New Users */}
        {(!dashboardData || dashboardData?.activeMedications === 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>🎉 Welcome to Ashray!</CardTitle>
                <CardDescription>Your cloud-based pharmacy management system</CardDescription>
              </CardHeader>
              <CardContent>
                <p style={{ marginBottom: '1rem' }}>
                  You're all set! Here's what you can do:
                </p>
                <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', lineHeight: '1.8' }}>
                  <li>Upload prescriptions (stored securely in AWS S3)</li>
                  <li>Set medication reminders</li>
                  <li>Track your adherence</li>
                  <li>Connect with pharmacies</li>
                </ul>
                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <Button onClick={() => navigate('/prescriptions')}>Upload Prescription</Button>
                  <Button variant="outline">Add Medication</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* AWS Integration Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          style={{ marginTop: '2rem' }}
        >
          <Card style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.1), hsl(var(--secondary) / 0.1))' }}>
            <CardHeader>
              <CardTitle>☁️ AWS Cloud Integration</CardTitle>
              <CardDescription>Your data is secure and scalable</CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <Badge variant="success">✓ MongoDB Atlas</Badge>
                  <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: 'hsl(var(--muted-foreground))' }}>
                    Database connected
                  </p>
                </div>
                <div>
                  <Badge variant="default">📁 AWS S3</Badge>
                  <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: 'hsl(var(--muted-foreground))' }}>
                    Ready for file uploads
                  </p>
                </div>
                <div>
                  <Badge variant="secondary">🚀 Express API</Badge>
                  <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: 'hsl(var(--muted-foreground))' }}>
                    Backend running
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
