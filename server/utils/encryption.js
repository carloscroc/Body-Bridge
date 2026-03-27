import crypto from 'crypto';
import logger from './logger.js';

const ALGORITHM = 'aes-256-gcm';
// Default key for development only - in production this must be an environment variable!
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY 
  ? Buffer.from(process.env.ENCRYPTION_KEY, 'hex') 
  : crypto.randomBytes(32); 

if (!process.env.ENCRYPTION_KEY) {
  logger.warn('WARNING: Using a random encryption key. Data will not be decryptable after restart. Set ENCRYPTION_KEY in .env for persistence.');
}

export const encrypt = (text) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  return {
    iv: iv.toString('hex'),
    content: encrypted,
    authTag: authTag
  };
};

export const decrypt = (hash) => {
  try {
    const decipher = crypto.createDecipheriv(
      ALGORITHM, 
      ENCRYPTION_KEY, 
      Buffer.from(hash.iv, 'hex')
    );
    decipher.setAuthTag(Buffer.from(hash.authTag, 'hex'));
    let decrypted = decipher.update(hash.content, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    logger.error('Decryption failed:', error);
    return null;
  }
};
