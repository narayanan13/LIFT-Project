import jwt from 'jsonwebtoken';

// CRITICAL: JWT_SECRET must be set in environment variables
// Generate a strong secret using: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    'JWT_SECRET environment variable is not set. ' +
    'Please set a strong JWT secret in your environment variables. ' +
    'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
  );
}

export function verifyJwt(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

export function signJwt(payload, options) {
  return jwt.sign(payload, JWT_SECRET, options);
}
