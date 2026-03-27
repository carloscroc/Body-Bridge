import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

// Local imports
import logger from './utils/logger.js';
import { authenticateToken } from './middleware/auth.js';
import { 
  validateAnalyzeMeal, 
  validateSearchFitness, 
  validateExerciseGuide 
} from './middleware/validation.js';

// Configuration
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local'), quiet: true });
dotenv.config({ path: path.join(__dirname, '../.env'), quiet: true });

const app = express();
const port = process.env.PORT || 3000;

// Security Middleware
// This server currently hosts API endpoints (not the HTML document), so CSP here isn't the primary control.
// Enforce CSP at the frontend hosting layer (or when serving HTML) to affect the document.
app.use(helmet());
app.disable('x-powered-by'); // Hide Express signature

// CORS configuration
const devAllowedOrigins = new Set([
  'http://localhost:7770',
  'http://127.0.0.1:7770',
  'https://carlos-caban.tail68c757.ts.net',
]);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (process.env.NODE_ENV === 'production') {
      const allowed = new Set(
        (process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])
          .concat(process.env.ADDITIONAL_ALLOWED_ORIGINS ? process.env.ADDITIONAL_ALLOWED_ORIGINS.split(',') : [])
          .map((s) => s.trim())
          .filter(Boolean)
      );
      return allowed.has(origin) ? callback(null, true) : callback(new Error('Not allowed by CORS'));
    }
    return devAllowedOrigins.has(origin) ? callback(null, true) : callback(new Error('Not allowed by CORS'));
  },
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400
};
app.use(cors(corsOptions));

// Body Parser with limits
app.use(express.json({ limit: '10mb' })); // Reduced from 50mb to mitigate DoS, sufficient for optimized images

// Logging
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Rate Limiting
// General API limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// Stricter limiter for heavy AI endpoints
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 AI generations per windowMs
  message: 'AI usage quota exceeded, please try again later.',
});

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY?.trim();
const hasGeminiKey = Boolean(apiKey && apiKey !== 'PLACEHOLDER_API_KEY');
const ai = hasGeminiKey ? new GoogleGenAI({ apiKey }) : null;

if (!hasGeminiKey) {
  logger.warn('GEMINI_API_KEY is missing; AI endpoints will return 503 until it is configured.');
}

// Helper to catch async errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const requireAi = (req, res, next) => {
  if (ai) {
    return next();
  }

  return res.status(503).json({
    error: 'AI features are unavailable. Set GEMINI_API_KEY in .env.local and restart the server.',
  });
};

// --- ROUTES ---

// Health Check
app.get('/health', (req, res) => res.status(200).json({ status: 'ok', timestamp: new Date() }));

// --- Auth (dev-mode cookie session) ---

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  path: '/',
};

app.post('/api/auth/login', (req, res) => {
  // Dev-only auth: mint a short-lived JWT and set it in an HttpOnly cookie.
  // Replace with real OIDC provider/session in production.
  const email = (req.body?.email || 'alex@example.com').toString();
  const sub = crypto.createHash('sha256').update(email).digest('hex').slice(0, 24);

  const token = jwt.sign(
    { sub, email, roles: ['user'] },
    process.env.JWT_SECRET || 'your-256-bit-secret',
    { expiresIn: '1h' }
  );

  res.cookie('forge_session', token, cookieOptions);
  res.json({ user: { sub, email, roles: ['user'] } });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('forge_session', { path: '/' });
  res.status(204).end();
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user ?? null });
});

// Endpoint: Analyze Meal
app.post('/api/analyze-meal', 
  authenticateToken, 
  aiLimiter, 
  requireAi,
  validateAnalyzeMeal, // Includes validation middleware
  asyncHandler(async (req, res) => {
    // Validation handled by middleware
    const { image, mimeType } = req.body;

    logger.info('Processing meal analysis request');

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
            { inlineData: { data: image.split(',')[1] || image, mimeType } }, // Strip data URI prefix if present
            { text: 'Analyze this meal photo. Estimate calories, macros, and provide fitness feedback.' }
          ]
        },
        config: { thinkingConfig: { thinkingBudget: 24000 } }
      });

      res.json({ text: (typeof response.text === 'function' ? response.text() : response.text) || 'Analysis failed.' });
    } catch (error) {
      logger.error('AI Analysis failed:', error);
      res.status(500).json({ error: 'Failed to analyze image.' });
    }
}));

// Endpoint: Search Fitness
app.post('/api/search-fitness', 
  authenticateToken, 
  aiLimiter, 
  requireAi,
  validateSearchFitness,
  asyncHandler(async (req, res) => {
    const { query } = req.body;

    logger.info(`Processing fitness search: ${query}`);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: query,
        config: { tools: [{ googleSearch: {} }] }
      });

      const links = response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.map(c => ({ web: c.web, maps: c.maps }))
        .filter(i => i.web || i.maps) || [];

      res.json({ text: (typeof response.text === 'function' ? response.text() : response.text) || 'No results.', links });
    } catch (error) {
      logger.error('AI Search failed:', error);
      res.status(500).json({ error: 'Failed to search fitness info.' });
    }
}));

// Endpoint: Exercise Guide
app.post('/api/exercise-guide', 
  authenticateToken, 
  aiLimiter, 
  requireAi,
  validateExerciseGuide,
  asyncHandler(async (req, res) => {
    const { exerciseName } = req.body;

    logger.info(`Processing exercise guide: ${exerciseName}`);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Provide a professional coach's guide for ${exerciseName}...` 
      });

      res.json({ text: (typeof response.text === 'function' ? response.text() : response.text) || 'Guide unavailable.' });
    } catch (error) {
      logger.error('AI Guide failed:', error);
      res.status(500).json({ error: 'Failed to generate guide.' });
    }
}));

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(port, () => {
  logger.info(`Backend secure proxy running on http://localhost:${port}`);
});
