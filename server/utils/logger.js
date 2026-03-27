import winston from 'winston';

const { combine, timestamp, json, printf, colorize } = winston.format;

// Fields to redact/scrub
const SENSITIVE_FIELDS = ['password', 'token', 'authorization', 'image', 'base64', 'apiKey', 'secret'];

const scrubSensitiveData = winston.format((info) => {
  const scrub = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    // Handle arrays
    if (Array.isArray(obj)) return obj.map(scrub);
    
    // Handle objects
    const newObj = { ...obj };
    for (const key in newObj) {
      if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        newObj[key] = '[REDACTED]';
      } else if (typeof newObj[key] === 'object') {
        newObj[key] = scrub(newObj[key]);
      } else if (typeof newObj[key] === 'string' && newObj[key].length > 1000) {
          // Truncate long strings (e.g. huge text blocks) unless whitelisted
          newObj[key] = `${newObj[key].substring(0, 100)}... [TRUNCATED]`;
      }
    }
    return newObj;
  };

  return scrub(info);
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    scrubSensitiveData(),
    json()
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        printf(({ level, message, timestamp, ...meta }) => {
          return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
        })
      )
    }),
    // Add file transport for production logs if needed
    // new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

export default logger;
