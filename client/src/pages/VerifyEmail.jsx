import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import './Auth.css';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const { verifyEmail, resendVerificationCode, verificationEmail } = useAuth();
  const [code, setCode] = useState('');
  const [email, setEmail] = useState(verificationEmail || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await verifyEmail(email, code);
      setSuccess('Email verified successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      console.error('Verification error:', err);
      setError(err.response?.data?.message || 'Verification failed. Please check your code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setError('');
    setSuccess('');
    setResending(true);

    try {
      await resendVerificationCode(email);
      setSuccess('Verification code resent! Check your email.');
    } catch (err) {
      console.error('Resend error:', err);
      setError(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-container">
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="auth-header">
          <h1 className="auth-title">Verify Your Email</h1>
          <p className="auth-subtitle">
            Enter the 6-digit verification code sent to your email
          </p>
        </div>

        {error && (
          <motion.div
            className="auth-error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            className="auth-success"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {success}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={!!verificationEmail}
            />
          </div>

          <div className="form-group">
            <label htmlFor="code">Verification Code</label>
            <input
              type="text"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              maxLength={6}
              pattern="[0-9]{6}"
              required
              style={{
                fontSize: '1.5rem',
                letterSpacing: '0.5rem',
                textAlign: 'center'
              }}
            />
            <small>6-digit code from your email</small>
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading || !code || code.length !== 6}
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>

          <div className="auth-links">
            <button
              type="button"
              onClick={handleResendCode}
              className="link-button"
              disabled={resending || !email}
            >
              {resending ? 'Sending...' : "Didn't receive code? Resend"}
            </button>
          </div>

          <div className="auth-divider" />

          <div className="auth-links">
            <span>Already verified?</span>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="link-button"
            >
              Go to Login
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
