import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import AnimatedGrid from '../components/AnimatedGrid';
import './Auth.css';

const VerifyEmail = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyEmail, resendVerificationCode } = useAuth();
  
  const email = location.state?.email || localStorage.getItem('pendingVerificationEmail');

  useEffect(() => {
    if (!email) {
      toast.error('No email found. Please register again.');
      navigate('/register');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!code || code.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);

    try {
      await verifyEmail(email, code);
      toast.success('Email verified successfully!');
      localStorage.removeItem('pendingVerificationEmail');
      
      setTimeout(() => {
        navigate('/login', { state: { email, verified: true } });
      }, 1500);
    } catch (error) {
      console.error('Verification error:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Verification failed';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    
    setResending(true);

    try {
      await resendVerificationCode(email);
      toast.success('Verification code sent! Check your email.');
      setCountdown(60);
    } catch (error) {
      console.error('Resend error:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to resend code';
      toast.error(errorMsg);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-page">
      <AnimatedGrid />
      
      <motion.div
        className="auth-container"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="auth-card">
          <div className="auth-header">
            <h1>Verify Your Email</h1>
            <p>We sent a 6-digit code to <strong>{email}</strong></p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="code">Verification Code</label>
              <input
                id="code"
                type="text"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                style={{ fontSize: '1.5rem', letterSpacing: '0.5rem', textAlign: 'center' }}
                autoFocus
                required
              />
              <small>Enter the 6-digit code from your email</small>
            </div>

            <button type="submit" className="auth-button" disabled={loading || code.length !== 6}>
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>

            <div style={{ margin: '1.5rem 0', textAlign: 'center', color: '#888' }}>
              Didn't receive code?
            </div>

            <button type="button" onClick={handleResend} className="auth-button-secondary" disabled={resending || countdown > 0}>
              {resending ? 'Sending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
            </button>

            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <span style={{ color: '#888' }}>Wrong email? </span>
              <button type="button" onClick={() => navigate('/register')} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', textDecoration: 'underline' }}>
                Register again
              </button>
            </div>
          </form>
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem', color: '#888' }}>
          <p>💡 Tip: Check your spam folder</p>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
