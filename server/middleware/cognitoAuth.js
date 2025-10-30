import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const client = jwksClient({
  jwksUri: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_COGNITO_USER_POOL_ID}/.well-known/jwks.json`,
  cache: true,
  cacheMaxAge: 600000, // 10 minutes
  rateLimit: true,
  jwksRequestsPerMinute: 10
});

/**
 * Get signing key from Cognito JWKS
 */
const getKey = (header, callback) => {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
      return;
    }
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
};

/**
 * Verify Cognito ID Token
 */
export const verifyCognitoToken = (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'No token provided. Authorization header must be in format: Bearer <token>' 
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token signature and decode
    jwt.verify(token, getKey, {
      issuer: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.AWS_COGNITO_USER_POOL_ID}`,
      audience: process.env.AWS_COGNITO_CLIENT_ID,
      algorithms: ['RS256']
    }, (err, decoded) => {
      if (err) {
        console.error('❌ Token verification failed:', err.message);
        
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ 
            message: 'Token has expired',
            error: 'TOKEN_EXPIRED'
          });
        }
        
        if (err.name === 'JsonWebTokenError') {
          return res.status(401).json({ 
            message: 'Invalid token',
            error: 'INVALID_TOKEN'
          });
        }

        return res.status(401).json({ 
          message: 'Token verification failed',
          error: err.message
        });
      }

      // Attach decoded user info to request
      req.user = {
        userId: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        role: decoded['custom:role'] || 'patient',
        cognitoUsername: decoded['cognito:username'],
        emailVerified: decoded.email_verified
      };

      console.log('✅ Token verified for user:', req.user.email);
      next();
    });

  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    res.status(500).json({ 
      message: 'Internal server error during authentication',
      error: error.message
    });
  }
};

/**
 * Role-based authorization middleware
 * Usage: protect(['pharmacy', 'admin'])
 */
export const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required. Please use verifyCognitoToken middleware first.' 
      });
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}. Your role: ${userRole}`,
        error: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    console.log(`✅ Role check passed for ${req.user.email} (${userRole})`);
    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token
 * Useful for endpoints that behave differently for authenticated vs anonymous users
 */
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No token, continue as anonymous
    req.user = null;
    return next();
  }

  // Token exists, verify it
  verifyCognitoToken(req, res, next);
};

export default verifyCognitoToken;
