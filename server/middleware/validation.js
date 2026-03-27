import { body, validationResult } from 'express-validator';
import logger from '../utils/logger.js';

// Common validator to check results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(err => ({ field: err.param, message: err.msg }));
    logger.warn('Validation failed', { errors: errorDetails, ip: req.ip });
    return res.status(400).json({ errors: errorDetails });
  }
  next();
};

export const validateAnalyzeMeal = [
  body('image')
    .exists().withMessage('Image is required')
    .isString().withMessage('Image must be a base64 string')
    .matches(/^data:image\/[a-zA-Z]+;base64,/).withMessage('Invalid image format (must be data URI)'),
  body('mimeType')
    .exists().withMessage('MimeType is required')
    .isIn(['image/jpeg', 'image/png', 'image/webp']).withMessage('Unsupported mime type'),
  validate
];

export const validateSearchFitness = [
  body('query')
    .exists().withMessage('Query is required')
    .isString().withMessage('Query must be a string')
    .trim()
    .isLength({ min: 3, max: 500 }).withMessage('Query must be between 3 and 500 characters')
    // Expanded regex for common fitness queries
    .matches(/^[a-zA-Z0-9\s.,?!'"()%:\/-]+$/).withMessage('Query contains invalid characters'),
  validate
];

export const validateExerciseGuide = [
  body('exerciseName')
    .exists().withMessage('Exercise name is required')
    .isString().withMessage('Exercise name must be a string')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Exercise name length invalid')
    .matches(/^[a-zA-Z0-9\s-]+$/).withMessage('Exercise name contains invalid characters'),
  validate
];
