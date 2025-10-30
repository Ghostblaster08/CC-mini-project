import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import User from '../models/User.js';

const cognitoIssuer = process.env.AWS_COGNITO_USER_POOL_ID
  ? `https://cognito-idp.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${process.env.AWS_COGNITO_USER_POOL_ID}`
  : null;

const cognitoAudience = process.env.AWS_COGNITO_CLIENT_ID || null;

const jwks = cognitoIssuer
  ? jwksClient({
      cache: true,
      rateLimit: true,
      jwksUri: `${cognitoIssuer}/.well-known/jwks.json`
    })
  : null;

const getSigningKey = (header, callback) => {
  if (!jwks) {
    return callback(new Error('JWKS client not configured'));
  }
  jwks.getSigningKey(header.kid, (err, key) => {
    if (err) {
      return callback(err);
    }
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
};

const verifyCognitoToken = (token) =>
  new Promise((resolve, reject) => {
    if (!cognitoIssuer || !cognitoAudience) {
      return reject(new Error('Cognito verification not configured'));
    }

    jwt.verify(
      token,
      getSigningKey,
      {
        audience: cognitoAudience,
        issuer: cognitoIssuer,
        algorithms: ['RS256']
      },
      (err, decoded) => {
        if (err) {
          return reject(err);
        }
        resolve(decoded);
      }
    );
  });

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    let decoded;

    try {
      decoded = await verifyCognitoToken(token);
    } catch (cognitoError) {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    }

    let user;

    if (decoded?.iss && decoded.iss.includes('cognito')) {
      const email = decoded.email || decoded['cognito:username'];
      if (!email) {
        throw new Error('Unable to resolve Cognito user email');
      }
      user = await User.findOne({ email: email.toLowerCase() }).select('-password');
    } else if (decoded?.id) {
      user = await User.findById(decoded.id).select('-password');
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token failed'
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};
