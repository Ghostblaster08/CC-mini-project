import AWS from 'aws-sdk';
import crypto from 'crypto';

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sessionToken: process.env.AWS_SESSION_TOKEN,
  region: process.env.AWS_REGION || 'us-east-1'
});

const cognito = new AWS.CognitoIdentityServiceProvider();

/**
 * Generate SECRET_HASH for Cognito (required when app client has a secret)
 */
const generateSecretHash = (username) => {
  const clientSecret = process.env.AWS_COGNITO_CLIENT_SECRET;
  const clientId = process.env.AWS_COGNITO_CLIENT_ID;
  
  if (!clientSecret) {
    return null;
  }

  return crypto
    .createHmac('sha256', clientSecret)
    .update(username + clientId)
    .digest('base64');
};

export const cognitoService = {
  /**
   * Register a new user in Cognito
   */
  signUp: async (email, password, name, role, phone) => {
    const emailStr = String(email).trim();
    const nameStr = String(name).trim();
    
    console.log('🔍 Input values:', { email: emailStr, name: nameStr, role, phone });

    // Build user attributes array - ONLY standard attributes
    const userAttributes = [
      { Name: 'email', Value: emailStr },
      { Name: 'name', Value: nameStr }
    ];

    // Add phone if provided (must be in E.164 format)
    if (phone) {
      let formattedPhone = String(phone).trim();
      // Remove any non-digit characters
      formattedPhone = formattedPhone.replace(/\D/g, '');
      // Add +91 prefix if not present
      if (!formattedPhone.startsWith('91')) {
        formattedPhone = '91' + formattedPhone;
      }
      formattedPhone = '+' + formattedPhone;
      
      userAttributes.push({ Name: 'phone_number', Value: formattedPhone });
    }

    // Build signup params
    const params = {
      ClientId: process.env.AWS_COGNITO_CLIENT_ID,
      Username: emailStr,
      Password: String(password),
      UserAttributes: userAttributes
    };

    // Add SECRET_HASH if client secret exists
    const secretHash = generateSecretHash(emailStr);
    if (secretHash) {
      params.SecretHash = secretHash;
    }

    try {
      console.log('📤 Sending Cognito signUp request...');
      console.log('📋 User Attributes:', JSON.stringify(userAttributes, null, 2));
      
      const result = await cognito.signUp(params).promise();
      console.log('✅ Cognito signUp successful:', result.UserSub);

      return {
        userId: result.UserSub,
        email: emailStr,
        confirmed: false
      };
    } catch (error) {
      console.error('❌ Cognito signUp error:', error.message);
      console.error('Error code:', error.code);
      throw new Error(error.message || 'Cognito registration failed');
    }
  },

  /**
   * Confirm user signup with verification code
   */
  confirmSignUp: async (email, code) => {
    const emailStr = String(email).trim();
    
    const params = {
      ClientId: process.env.AWS_COGNITO_CLIENT_ID,
      Username: emailStr,
      ConfirmationCode: String(code)
    };

    const secretHash = generateSecretHash(emailStr);
    if (secretHash) {
      params.SecretHash = secretHash;
    }

    try {
      await cognito.confirmSignUp(params).promise();
      console.log('✅ Email verified for:', email);
      return true;
    } catch (error) {
      console.error('❌ Email verification error:', error.message);
      throw new Error(error.message || 'Email verification failed');
    }
  },

  /**
   * Resend confirmation code
   */
  resendConfirmationCode: async (email) => {
    const emailStr = String(email).trim();
    
    const params = {
      ClientId: process.env.AWS_COGNITO_CLIENT_ID,
      Username: emailStr
    };

    const secretHash = generateSecretHash(emailStr);
    if (secretHash) {
      params.SecretHash = secretHash;
    }

    try {
      await cognito.resendConfirmationCode(params).promise();
      console.log('✅ Verification code resent to:', email);
      return true;
    } catch (error) {
      console.error('❌ Resend code error:', error.message);
      throw new Error(error.message || 'Failed to resend code');
    }
  },

  /**
   * Sign in a user
   */
  signIn: async (email, password) => {
    const emailStr = String(email).trim();
    
    const params = {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: process.env.AWS_COGNITO_CLIENT_ID,
      AuthParameters: {
        USERNAME: emailStr,
        PASSWORD: String(password)
      }
    };

    const secretHash = generateSecretHash(emailStr);
    if (secretHash) {
      params.AuthParameters.SECRET_HASH = secretHash;
    }

    try {
      console.log('🔐 Attempting Cognito authentication...');
      const result = await cognito.initiateAuth(params).promise();
      
      if (!result.AuthenticationResult) {
        throw new Error('Authentication failed');
      }

      console.log('✅ Cognito authentication successful');
      
      return {
        accessToken: result.AuthenticationResult.AccessToken,
        idToken: result.AuthenticationResult.IdToken,
        refreshToken: result.AuthenticationResult.RefreshToken,
        expiresIn: result.AuthenticationResult.ExpiresIn
      };
    } catch (error) {
      console.error('❌ Cognito signIn error:', error.message);
      
      if (error.code === 'UserNotConfirmedException') {
        throw new Error('Please verify your email first');
      } else if (error.code === 'NotAuthorizedException') {
        throw new Error('Invalid email or password');
      } else if (error.code === 'UserNotFoundException') {
        throw new Error('User not found');
      }
      
      throw new Error(error.message || 'Login failed');
    }
  },

  /**
   * Get user info from access token
   */
  getUser: async (accessToken) => {
    const params = {
      AccessToken: String(accessToken)
    };

    try {
      const result = await cognito.getUser(params).promise();
      
      const attributes = {};
      result.UserAttributes.forEach(attr => {
        attributes[attr.Name] = attr.Value;
      });

      return {
        userId: result.Username,
        email: attributes.email,
        name: attributes.name,
        phone: attributes.phone_number,
        emailVerified: attributes.email_verified === 'true'
      };
    } catch (error) {
      console.error('❌ Get user error:', error.message);
      throw new Error('Failed to get user info');
    }
  },

  /**
   * Forgot password - send reset code
   */
  forgotPassword: async (email) => {
    const emailStr = String(email).trim();
    
    const params = {
      ClientId: process.env.AWS_COGNITO_CLIENT_ID,
      Username: emailStr
    };

    const secretHash = generateSecretHash(emailStr);
    if (secretHash) {
      params.SecretHash = secretHash;
    }

    try {
      await cognito.forgotPassword(params).promise();
      console.log('✅ Password reset code sent to:', email);
      return true;
    } catch (error) {
      console.error('❌ Forgot password error:', error.message);
      throw new Error(error.message || 'Failed to send reset code');
    }
  },

  /**
   * Confirm new password with reset code
   */
  confirmForgotPassword: async (email, code, newPassword) => {
    const emailStr = String(email).trim();
    
    const params = {
      ClientId: process.env.AWS_COGNITO_CLIENT_ID,
      Username: emailStr,
      ConfirmationCode: String(code),
      Password: String(newPassword)
    };

    const secretHash = generateSecretHash(emailStr);
    if (secretHash) {
      params.SecretHash = secretHash;
    }

    try {
      await cognito.confirmForgotPassword(params).promise();
      console.log('✅ Password reset successful for:', email);
      return true;
    } catch (error) {
      console.error('❌ Password reset error:', error.message);
      throw new Error(error.message || 'Password reset failed');
    }
  },

  /**
   * Sign out
   */
  signOut: async () => {
    console.log('✅ User signed out');
    return true;
  }
};

export default cognitoService;
