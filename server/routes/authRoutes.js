import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { cognitoService } from '../services/cognitoService.js';

const router = express.Router();

// Generate JWT Token (legacy - for non-Cognito users)
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user with AWS Cognito
// @access  Public
router.post('/register', async (req, res) => {
  try {
    console.log('📝 Registration request received:', req.body);

    // Extract individual fields from request body
    const { name, email, password, role, phone } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, email, password, and role'
      });
    }

    // Check if user already exists in MongoDB
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    console.log('🔐 Registering user in Cognito...');
    
    // Register in Cognito - pass individual parameters
    const cognitoResult = await cognitoService.signUp(
      email,      // email
      password,   // password  
      name,       // name
      role,       // role
      phone       // phone (optional)
    );

    console.log('✅ Cognito registration successful:', cognitoResult.userId);

    // Create user profile in MongoDB
    console.log('💾 Creating user profile in MongoDB:', email);
    const user = await User.create({
      cognitoUserId: cognitoResult.userId,
      name,
      email: email.toLowerCase(),
      role,
      phone
    });

    console.log('✅ User registered successfully');

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email for verification code.',
      data: {
        userId: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Registration failed'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user with AWS Cognito
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password'
      });
    }

    console.log('🔐 Login request received:', email);

    // Authenticate with Cognito
    console.log('🔐 Authenticating with Cognito...');
    const tokens = await cognitoService.signIn(email, password);

    console.log('✅ Login successful:', email);

    // Get user profile from MongoDB
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User profile not found'
      });
    }

    res.json({
      success: true,
      message: 'Login successful',
      token: tokens.idToken,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(401).json({
      success: false,
      error: error.message || 'Invalid credentials'
    });
  }
});

// @route   POST /api/auth/verify
// @desc    Verify user email with confirmation code
// @access  Public
router.post('/verify', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and verification code'
      });
    }

    console.log('📧 Verifying email:', email);

    await cognitoService.confirmSignUp(email, code);

    console.log('✅ Email verified successfully:', email);

    res.json({
      success: true,
      message: 'Email verified successfully! You can now log in.'
    });
  } catch (error) {
    console.error('❌ Verification error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Verification failed'
    });
  }
});

// @route   POST /api/auth/resend-code
// @desc    Resend verification code
// @access  Public
router.post('/resend-code', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email'
      });
    }

    console.log('📧 Resending verification code to:', email);

    await cognitoService.resendConfirmationCode(email);

    res.json({
      success: true,
      message: 'Verification code sent! Check your email.'
    });
  } catch (error) {
    console.error('❌ Resend code error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to resend code'
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Request password reset code
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email'
      });
    }

    console.log('🔑 Sending password reset code to:', email);

    await cognitoService.forgotPassword(email);

    res.json({
      success: true,
      message: 'Password reset code sent! Check your email.'
    });
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to send reset code'
    });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with code
// @access  Public
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email, code, and new password'
      });
    }

    console.log('🔑 Resetting password for:', email);

    await cognitoService.confirmForgotPassword(email, code, newPassword);

    res.json({
      success: true,
      message: 'Password reset successful! You can now log in.'
    });
  } catch (error) {
    console.error('❌ Password reset error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Password reset failed'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', async (req, res) => {
  try {
    await cognitoService.signOut();
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

export default router;
