import crypto from 'crypto';

export function hashPassword(password, salt = null) {
  salt = salt || crypto.randomBytes(16).toString('hex');
  const iterations = 100000;
  const keylen = 64;
  const digest = 'sha512';
  const derived = crypto.pbkdf2Sync(password, salt, iterations, keylen, digest).toString('hex');
  return `${iterations}$${salt}$${derived}`;
}

export function verifyPassword(password, stored) {
  if (!stored) return false;
  const [iterationsStr, salt, derived] = stored.split('$');
  const iterations = parseInt(iterationsStr, 10) || 100000;
  const keylen = 64;
  const digest = 'sha512';
  const candidate = crypto.pbkdf2Sync(password, salt, iterations, keylen, digest).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(candidate, 'hex'), Buffer.from(derived, 'hex'));
}
