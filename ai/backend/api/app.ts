/**
 * API Router Configuration
 * Central routing for all AI backend endpoints
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { searchRouter } from './routes/search';
import { ragRouter } from './routes/rag';
import { chatRouter } from './routes/chat';
// import { analyticsRouter } from './routes/analytics'; // Temporarily disabled due to TS errors
import { healthRouter } from './routes/health';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { authMiddleware } from './middleware/auth';
import { validationMiddleware } from './middleware/validation';

const app = express();
const API_VERSION = 'v1';

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.openai.com", "https://*.search.windows.net"]
    }
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// General middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(`/api/${API_VERSION}`, limiter);

// Request logging
app.use(requestLogger);

// API routes with authentication and validation
app.use(`/api/${API_VERSION}/search`, authMiddleware, validationMiddleware, searchRouter);
app.use(`/api/${API_VERSION}/rag`, authMiddleware, validationMiddleware, ragRouter);
app.use(`/api/${API_VERSION}/chat`, authMiddleware, validationMiddleware, chatRouter);
// app.use(`/api/${API_VERSION}/analytics`, authMiddleware, validationMiddleware, analyticsRouter); // Temporarily disabled

// Health check (no auth required)
app.use(`/api/${API_VERSION}/health`, healthRouter);

// API documentation
app.get(`/api/${API_VERSION}`, (req, res) => {
  res.json({
    name: 'Project Pulse AI API',
    version: API_VERSION,
    description: 'AI-powered backend services for Project Pulse',
    endpoints: {
      search: `GET/POST /api/${API_VERSION}/search`,
      rag: `POST /api/${API_VERSION}/rag`,
      chat: `POST /api/${API_VERSION}/chat`,
      analytics: `POST /api/${API_VERSION}/analytics`,
      health: `GET /api/${API_VERSION}/health`
    },
    documentation: `https://docs.projectpulse.ai/api/${API_VERSION}`
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `The requested endpoint ${req.originalUrl} does not exist`,
    availableEndpoints: [
      `/api/${API_VERSION}/search`,
      `/api/${API_VERSION}/rag`, 
      `/api/${API_VERSION}/chat`,
      `/api/${API_VERSION}/analytics`,
      `/api/${API_VERSION}/health`
    ]
  });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;