/**
 * AI Backend Server
 * Main server entry point with proper initialization and shutdown handling
 */

import express from 'express';
import { createServer } from 'http';
import app from './app';
import { aiServiceOrchestrator } from '../orchestrator/aiOrchestrator';

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

// Create HTTP server
const server = createServer(app);

/**
 * Start the server
 */
async function startServer(): Promise<void> {
  try {
    console.log('🚀 Starting AI Backend Server...');
    
    // Health check for AI services
    console.log('🔍 Checking AI services health...');
    const healthStatus = await aiServiceOrchestrator.getServiceHealth();
    console.log(`📊 AI Services Status: ${healthStatus.overall}`);
    
    // Start HTTP server
    server.listen(PORT, HOST, () => {
      console.log(`✅ AI Backend Server running on http://${HOST}:${PORT}`);
      console.log(`📚 API Documentation: http://${HOST}:${PORT}/api/v1`);
      console.log(`🏥 Health Check: http://${HOST}:${PORT}/api/v1/health`);
      console.log(`📊 Metrics: http://${HOST}:${PORT}/api/v1/health/metrics`);
    });
    
    // Log available endpoints
    console.log('🛣️  Available Endpoints:');
    console.log(`   GET  /api/v1/health          - Service health status`);
    console.log(`   POST /api/v1/search          - AI-powered search`);
    console.log(`   POST /api/v1/rag/ask         - RAG question answering`);
    console.log(`   POST /api/v1/chat/completions - Chat completions`);
    console.log(`   POST /api/v1/analytics/analyze - Advanced analytics`);
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(signal: string): Promise<void> {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  // Stop accepting new connections
  server.close(async (error) => {
    if (error) {
      console.error('❌ Error closing server:', error);
      process.exit(1);
    }
    
    console.log('🔌 HTTP server closed');
    
    try {
      // Shutdown AI orchestrator
      await aiServiceOrchestrator.shutdown();
      console.log('🤖 AI services shut down');
      
      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (shutdownError) {
      console.error('❌ Error during shutdown:', shutdownError);
      process.exit(1);
    }
  });
  
  // Force exit after timeout
  setTimeout(() => {
    console.error('⏰ Shutdown timeout reached, forcing exit');
    process.exit(1);
  }, 30000); // 30 second timeout
}

// Handle process signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Start the server
if (require.main === module) {
  startServer();
}

export { app, server };