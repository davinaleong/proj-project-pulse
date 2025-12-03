/**
 * API Integration Tests
 * Tests for complete API workflows
 */

import request from 'supertest';
import app from '../../api/app';
import { generateTestJWT } from '../utils/testUtils';

// Mock all services
jest.mock('../../services/searchService');
jest.mock('../../services/openaiService');
jest.mock('../../services/ragService');
jest.mock('../../orchestrator/aiOrchestrator');

describe('API Integration Tests', () => {
  const validJWT = generateTestJWT({ sub: 'test-user', client_id: 'test-client' });
  const validSharedSecret = process.env.SHARED_SECRET || 'test-shared-secret';

  describe('Authentication Endpoints', () => {
    describe('GET /api/v1/auth/info', () => {
      it('should return authentication info', async () => {
        const response = await request(app)
          .get('/api/v1/auth/info')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('methods');
        expect(response.body.data.methods).toContain('jwt-token');
        expect(response.body.data.methods).toContain('shared-secret');
      });
    });

    describe('POST /api/v1/auth/token', () => {
      it('should generate JWT token with valid request', async () => {
        const response = await request(app)
          .post('/api/v1/auth/token')
          .send({
            clientId: 'test-client',
            expiresIn: '1h'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('access_token');
        expect(response.body.data).toHaveProperty('expires_in');
        expect(response.body.data).toHaveProperty('token_type', 'Bearer');
      });

      it('should reject request without clientId', async () => {
        const response = await request(app)
          .post('/api/v1/auth/token')
          .send({
            expiresIn: '1h'
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Validation failed');
      });
    });

    describe('POST /api/v1/auth/verify', () => {
      it('should verify valid JWT token', async () => {
        const response = await request(app)
          .post('/api/v1/auth/verify')
          .send({
            token: validJWT
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('valid', true);
      });

      it('should reject invalid JWT token', async () => {
        const response = await request(app)
          .post('/api/v1/auth/verify')
          .send({
            token: 'invalid.jwt.token'
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('Search Endpoints', () => {
    describe('POST /api/v1/search', () => {
      it('should perform search with JWT authentication', async () => {
        const response = await request(app)
          .post('/api/v1/search')
          .set('Authorization', `Bearer ${validJWT}`)
          .send({
            query: 'project management',
            maxResults: 10,
            searchType: 'semantic'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('results');
        expect(response.body.data).toHaveProperty('totalCount');
      });

      it('should perform search with shared secret', async () => {
        const response = await request(app)
          .post('/api/v1/search')
          .set('X-Shared-Secret', validSharedSecret)
          .send({
            query: 'team collaboration',
            maxResults: 5
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('results');
      });

      it('should reject unauthenticated requests', async () => {
        const response = await request(app)
          .post('/api/v1/search')
          .send({
            query: 'test query'
          })
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Authentication required');
      });

      it('should validate search request parameters', async () => {
        const response = await request(app)
          .post('/api/v1/search')
          .set('Authorization', `Bearer ${validJWT}`)
          .send({
            query: '', // Empty query should fail validation
            maxResults: 10
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Validation failed');
      });
    });

    describe('GET /api/v1/search', () => {
      it('should perform search with query parameters', async () => {
        const response = await request(app)
          .get('/api/v1/search')
          .set('Authorization', `Bearer ${validJWT}`)
          .query({
            q: 'project management',
            max: 5,
            type: 'semantic'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('results');
      });
    });

    describe('POST /api/v1/search/semantic', () => {
      it('should perform semantic search', async () => {
        const response = await request(app)
          .post('/api/v1/search/semantic')
          .set('Authorization', `Bearer ${validJWT}`)
          .send({
            query: 'best practices for agile development',
            maxResults: 5
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('results');
      });
    });

    describe('GET /api/v1/search/status', () => {
      it('should return search service status', async () => {
        const response = await request(app)
          .get('/api/v1/search/status')
          .set('Authorization', `Bearer ${validJWT}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('status');
      });
    });
  });

  describe('RAG Endpoints', () => {
    describe('POST /api/v1/rag/ask', () => {
      it('should answer questions using RAG', async () => {
        const response = await request(app)
          .post('/api/v1/rag/ask')
          .set('Authorization', `Bearer ${validJWT}`)
          .send({
            question: 'What are the best project management practices?',
            maxResults: 5,
            includeReferences: true
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('answer');
        expect(response.body.data).toHaveProperty('sources');
        expect(response.body.data).toHaveProperty('confidence');
      });

      it('should validate question parameter', async () => {
        const response = await request(app)
          .post('/api/v1/rag/ask')
          .set('Authorization', `Bearer ${validJWT}`)
          .send({
            question: '', // Empty question
            maxResults: 5
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('POST /api/v1/rag/context', () => {
      it('should return relevant context', async () => {
        const response = await request(app)
          .post('/api/v1/rag/context')
          .set('Authorization', `Bearer ${validJWT}`)
          .send({
            query: 'project management tools',
            maxResults: 3
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('context');
        expect(response.body.data).toHaveProperty('sources');
      });
    });

    describe('GET /api/v1/rag/status', () => {
      it('should return RAG service status', async () => {
        const response = await request(app)
          .get('/api/v1/rag/status')
          .set('Authorization', `Bearer ${validJWT}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('status');
      });
    });
  });

  describe('Chat Endpoints', () => {
    describe('POST /api/v1/chat/message', () => {
      it('should process chat messages', async () => {
        const response = await request(app)
          .post('/api/v1/chat/message')
          .set('Authorization', `Bearer ${validJWT}`)
          .send({
            message: 'How can I improve my project management skills?',
            context: 'professional development'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('response');
      });
    });

    describe('POST /api/v1/chat/conversation', () => {
      it('should start new conversation', async () => {
        const response = await request(app)
          .post('/api/v1/chat/conversation')
          .set('Authorization', `Bearer ${validJWT}`)
          .send({
            topic: 'project management',
            userId: 'test-user'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('conversationId');
      });
    });

    describe('GET /api/v1/chat/history', () => {
      it('should retrieve chat history', async () => {
        const response = await request(app)
          .get('/api/v1/chat/history')
          .set('Authorization', `Bearer ${validJWT}`)
          .query({
            userId: 'test-user',
            limit: 10
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('messages');
      });
    });
  });

  describe('Health Endpoints', () => {
    describe('GET /api/v1/health', () => {
      it('should return service health status', async () => {
        const response = await request(app)
          .get('/api/v1/health')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('status');
        expect(response.body.data).toHaveProperty('timestamp');
      });
    });

    describe('GET /api/v1/health/status', () => {
      it('should return detailed health status', async () => {
        const response = await request(app)
          .get('/api/v1/health/status')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('services');
      });
    });

    describe('GET /api/v1/health/metrics', () => {
      it('should return service metrics', async () => {
        const response = await request(app)
          .get('/api/v1/health/metrics')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('metrics');
      });
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown endpoints', async () => {
      const response = await request(app)
        .get('/api/v1/unknown')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/v1/auth/token')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle rate limiting', async () => {
      // Make multiple rapid requests
      const requests = Array(10).fill(0).map(() => 
        request(app)
          .get('/api/v1/auth/info')
      );

      const responses = await Promise.all(requests);
      
      // Should eventually hit rate limit
      expect(responses.some(r => r.status === 429)).toBe(true);
    });
  });
});