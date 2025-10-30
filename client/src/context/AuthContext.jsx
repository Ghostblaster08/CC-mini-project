import { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState(null);

  useEffect(() => {
    // Check for Cognito tokens
    const idToken = localStorage.getItem('idToken');
    const savedUser = localStorage.getItem('user');
    
    if (idToken && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    console.log('📡 AuthContext: Sending Cognito login request...');
    const response = await authAPI.login({ email, password });
    console.log('📡 AuthContext: Login response:', response.data);
    
    const { data, idToken, accessToken, refreshToken } = response.data;
    
    console.log('💾 Saving Cognito tokens to localStorage');
    
    // Store Cognito tokens
    localStorage.setItem('idToken', idToken);
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(data));
    setUser(data);
    
    console.log('✅ AuthContext: User authenticated with Cognito');
    return data;
  };

  const register = async (userData) => {
    console.log('📡 AuthContext: Sending Cognito registration request...');
    const response = await authAPI.register(userData);
    const { data, requiresVerification } = response.data;
    
    console.log('✅ Registration response:', { data, requiresVerification });
    
    if (requiresVerification) {
      setNeedsVerification(true);
      setVerificationEmail(userData.email);
      return { ...data, requiresVerification: true };
    }
    
    // If no verification needed, user can login immediately
    return data;
  };

  const verifyEmail = async (email, code) => {
    console.log('📡 AuthContext: Verifying email with code...');
    const response = await authAPI.verifyEmail({ email, code });
    console.log('✅ Email verified successfully');
    
    setNeedsVerification(false);
    setVerificationEmail(null);
    
    return response.data;
  };

  const resendVerificationCode = async (email) => {
    console.log('📡 AuthContext: Resending verification code...');
    const response = await authAPI.resendVerificationCode({ email });
    console.log('✅ Verification code resent');
    return response.data;
  };

  const forgotPassword = async (email) => {
    console.log('📡 AuthContext: Requesting password reset...');
    const response = await authAPI.forgotPassword({ email });
    console.log('✅ Password reset code sent');
    return response.data;
  };

  const resetPassword = async (email, code, newPassword) => {
    console.log('📡 AuthContext: Resetting password...');
    const response = await authAPI.resetPassword({ email, code, newPassword });
    console.log('✅ Password reset successful');
    return response.data;
  };

  const logout = async () => {
    try {
      // Call backend logout (clears Cognito session)
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    // Clear local storage
    localStorage.removeItem('idToken');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    
    console.log('✅ User logged out from Cognito');
  };

  const value = {
    user,
    login,
    register,
    verifyEmail,
    resendVerificationCode,
    forgotPassword,
    resetPassword,
    logout,
    loading,
    isAuthenticated: !!user,
    needsVerification,
    verificationEmail
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
