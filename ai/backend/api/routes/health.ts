/**
 * Health Check API Routes
 * Provides service health status and monitoring
 */

import { Router, Request, Response } from 'express';
import { query, validationResult } from 'express-validator';
import { aiServiceOrchestrator } from '../../orchestrator/aiOrchestrator';
import { APIResponse } from '../types/api';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Validation rules
const healthQueryValidation = [
  query('detailed')
    .optional()
    .isBoolean()
    .withMessage('Detailed must be a boolean'),
  
  query('service')
    .optional()
    .isIn(['search', 'chat', 'rag', 'analytics', 'all'])
    .withMessage('Service must be search, chat, rag, analytics, or all')
];

/**
 * GET /api/v1/health
 * Basic health check
 */
router.get('/', healthQueryValidation, asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    } as APIResponse<null>);
  }

  const detailed = req.query.detailed === 'true';
  const service = req.query.service as string;

  try {
    if (service && service !== 'all') {
      // Get metrics for specific service
      const metrics = aiServiceOrchestrator.getServiceMetrics(service);
      
      return res.json({
        success: true,
        data: {
          service,
          metrics,
          status: metrics && typeof metrics === 'object' && 'uptime' in metrics
            ? (typeof metrics.uptime === 'number' ? 
                (metrics.uptime > 95 ? 'healthy' : metrics.uptime > 70 ? 'degraded' : 'unhealthy') : 
                'unknown') 
            : 'unknown'
        },
        metadata: {
          timestamp: new Date().toISOString(),
          checkType: 'service-specific'
        }
      } as APIResponse<any>);
    }

    // Get overall health status
    const healthStatus = await aiServiceOrchestrator.getServiceHealth();
    
    if (detailed) {
      // Include detailed metrics
      const allMetrics = aiServiceOrchestrator.getServiceMetrics();
      
      return res.json({
        success: true,
        data: {
          health: healthStatus,
          metrics: allMetrics,
          systemInfo: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            nodeVersion: process.version,
            platform: process.platform
          }
        },
        metadata: {
          timestamp: new Date().toISOString(),
          checkType: 'detailed'
        }
      } as APIResponse<any>);
    }

    // Basic health status
    res.json({
      success: true,
      data: {
        overall: healthStatus.overall,
        services: healthStatus.services.map(s => ({
          name: s.name,
          status: s.status,
          uptime: s.uptime
        })),
        summary: {
          healthy: healthStatus.services.filter(s => s.status === 'healthy').length,
          total: healthStatus.services.length
        }
      },
      metadata: {
        timestamp: new Date().toISOString(),
        checkType: 'basic'
      }
    } as APIResponse<any>);

  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      data: {
        overall: 'unhealthy',
        services: []
      },
      metadata: {
        timestamp: new Date().toISOString(),
        checkType: 'error'
      }
    } as APIResponse<any>);
  }
}));

/**
 * GET /api/v1/health/ping
 * Simple ping endpoint
 */
router.get('/ping', asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      message: 'pong',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    },
    metadata: {
      timestamp: new Date().toISOString()
    }
  } as APIResponse<any>);
}));

/**
 * GET /api/v1/health/ready
 * Readiness probe for Kubernetes/container orchestration
 */
router.get('/ready', asyncHandler(async (req: Request, res: Response) => {
  try {
    const healthStatus = await aiServiceOrchestrator.getServiceHealth();
    
    if (healthStatus.overall === 'healthy' || healthStatus.overall === 'degraded') {
      res.json({
        success: true,
        data: {
          ready: true,
          status: healthStatus.overall,
          services: healthStatus.services.length
        },
        metadata: {
          timestamp: new Date().toISOString()
        }
      } as APIResponse<any>);
    } else {
      res.status(503).json({
        success: false,
        data: {
          ready: false,
          status: healthStatus.overall,
          services: healthStatus.services.length
        },
        metadata: {
          timestamp: new Date().toISOString()
        }
      } as APIResponse<any>);
    }
  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'Service not ready',
      message: error instanceof Error ? error.message : 'Unknown error',
      data: {
        ready: false
      },
      metadata: {
        timestamp: new Date().toISOString()
      }
    } as APIResponse<any>);
  }
}));

/**
 * GET /api/v1/health/live
 * Liveness probe for Kubernetes/container orchestration
 */
router.get('/live', asyncHandler(async (req: Request, res: Response) => {
  // Simple liveness check - just verify the service is running
  res.json({
    success: true,
    data: {
      alive: true,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      pid: process.pid
    },
    metadata: {
      timestamp: new Date().toISOString()
    }
  } as APIResponse<any>);
}));

/**
 * GET /api/v1/health/metrics
 * Detailed metrics endpoint
 */
router.get('/metrics', asyncHandler(async (req: Request, res: Response) => {
  const allMetrics = aiServiceOrchestrator.getServiceMetrics();
  
  // Convert to Prometheus-style metrics format
  let metricsText = '# HELP ai_requests_total Total number of AI service requests\n';
  metricsText += '# TYPE ai_requests_total counter\n';
  
  for (const [service, metrics] of Object.entries(allMetrics)) {
    if (typeof metrics === 'object' && metrics !== null) {
      metricsText += `ai_requests_total{service="${service}",status="success"} ${metrics.successfulRequests}\n`;
      metricsText += `ai_requests_total{service="${service}",status="error"} ${metrics.failedRequests}\n`;
      metricsText += `ai_response_time_avg{service="${service}"} ${metrics.averageResponseTime}\n`;
      metricsText += `ai_uptime_percent{service="${service}"} ${metrics.uptime}\n`;
    }
  }

  // System metrics
  const memUsage = process.memoryUsage();
  metricsText += `\n# HELP process_memory_usage Memory usage in bytes\n`;
  metricsText += `# TYPE process_memory_usage gauge\n`;
  metricsText += `process_memory_usage{type="rss"} ${memUsage.rss}\n`;
  metricsText += `process_memory_usage{type="heapUsed"} ${memUsage.heapUsed}\n`;
  metricsText += `process_memory_usage{type="heapTotal"} ${memUsage.heapTotal}\n`;
  
  metricsText += `\n# HELP process_uptime_seconds Process uptime in seconds\n`;
  metricsText += `# TYPE process_uptime_seconds gauge\n`;
  metricsText += `process_uptime_seconds ${process.uptime()}\n`;

  res.setHeader('Content-Type', 'text/plain');
  res.send(metricsText);
}));

/**
 * POST /api/v1/health/reset-metrics
 * Reset service metrics (for testing/debugging)
 */
router.post('/reset-metrics', [
  query('service')
    .optional()
    .isString()
    .withMessage('Service must be a string')
], asyncHandler(async (req: Request, res: Response) => {
  const service = req.query.service as string;
  
  try {
    if (service) {
      aiServiceOrchestrator.resetMetrics(service);
    } else {
      aiServiceOrchestrator.resetMetrics();
    }
    
    res.json({
      success: true,
      data: {
        message: service ? `Metrics reset for service: ${service}` : 'All metrics reset',
        resetAt: new Date().toISOString()
      },
      metadata: {
        timestamp: new Date().toISOString()
      }
    } as APIResponse<any>);
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to reset metrics',
      message: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        timestamp: new Date().toISOString()
      }
    } as APIResponse<any>);
  }
}));

export { router as healthRouter };