# Project Pulse - AI Backend Services

## Overview

This directory contains the comprehensive AI backend services for Project Pulse, implementing enterprise-grade Azure AI Search and Azure OpenAI integration with TypeScript. The services follow Microsoft Azure best practices and provide intelligent search, chat completions, RAG (Retrieval Augmented Generation), and advanced analytics capabilities.

## 🏗️ Architecture

```
ai/backend/
├── api/                        # Express API layer
│   ├── app.ts                  # Main Express application
│   ├── server.ts               # Server startup and configuration
│   ├── routes/                 # API route handlers
│   │   ├── search.ts           # Search endpoint implementations
│   │   ├── rag.ts              # RAG endpoint implementations
│   │   ├── chat.ts             # Chat endpoint implementations
│   │   ├── health.ts           # Health check endpoints
│   │   └── simple-auth.ts      # Authentication endpoints
│   ├── middleware/             # Express middleware
│   │   ├── auth.ts             # JWT & shared secret authentication
│   │   ├── errorHandler.ts     # Global error handling
│   │   ├── requestLogger.ts    # Request logging middleware
│   │   └── validation.ts       # Request validation middleware
│   ├── types/                  # TypeScript type definitions
│   │   └── api.ts              # API request/response types
│   └── utils/                  # API utility functions
│       └── asyncHandler.ts     # Async error handling wrapper
├── config/
│   └── environment.ts          # Azure configuration with security best practices
├── services/
│   ├── searchService.ts        # Azure AI Search integration
│   ├── openaiService.ts        # Azure OpenAI service
│   ├── ragService.ts           # Intelligent RAG implementation
│   └── analyticsService.ts     # Advanced analytics and insights
├── orchestrator/
│   └── aiOrchestrator.ts       # Central AI service orchestrator
├── tests/                      # Comprehensive test suite (97 tests)
│   ├── README.md               # Testing documentation
│   ├── integration/            # End-to-end API tests (22 tests)
│   ├── unit/                   # Isolated component tests (75 tests)
│   └── utils/                  # Test utilities and mocks
└── README.md                   # This file
```

## 🔧 Services

### 1. Environment Configuration (`config/environment.ts`)
- **Purpose**: Centralized configuration with API key authentication
- **Features**:
  - Direct API key authentication to Azure services
  - Environment variable validation and type safety
  - Comprehensive server, security, and CORS configuration
  - Rate limiting and JWT security settings
- **Security**: Uses API keys for Azure services, JWT tokens for API authentication

### 2. Azure AI Search Service (`services/searchService.ts`)
- **Purpose**: Comprehensive Azure AI Search integration
- **Features**:
  - Semantic search with AI-powered relevance
  - Vector search with embeddings support
  - Hybrid search combining multiple techniques
  - Performance monitoring and retry logic
  - Health checks and error handling
- **Authentication**: Uses API key authentication with AzureKeyCredential

### 3. Azure OpenAI Service (`services/openaiService.ts`)
- **Purpose**: Azure OpenAI integration for chat completions
- **Features**:
  - Chat completions with streaming support
  - Content filtering and safety measures
  - Token usage tracking and optimization
  - RAG-enabled chat with data sources
  - Comprehensive error handling
- **Authentication**: Uses API key authentication for simplified setup

### 4. Intelligent RAG Service (`services/ragService.ts`)
- **Purpose**: Advanced RAG implementation combining search and generation
- **Features**:
  - Context-aware question answering
  - Multiple search strategies (semantic, vector, hybrid)
  - Conversational context preservation
  - Source citation and reference tracking
  - Performance optimization and caching
- **Intelligence**: Enhances queries with conversation context, provides grounded responses

### 5. Advanced Analytics Service (`services/analyticsService.ts`)
- **Purpose**: AI-powered project analytics and insights
- **Features**:
  - Project performance analysis
  - Predictive project outcomes
  - Natural language analytics queries
  - Automated report generation
  - Team productivity insights
- **Analytics**: Uses AI to identify trends, predict risks, and provide actionable recommendations

### 6. AI Service Orchestrator (`orchestrator/aiOrchestrator.ts`)
- **Purpose**: Central coordinator for all AI services
- **Features**:
  - Unified API interface
  - Load balancing and failover
  - Health monitoring and metrics
  - Request routing and optimization
  - Comprehensive error handling
- **Management**: Provides single entry point for all AI operations with monitoring

## 🚀 Quick Start

### Prerequisites
```bash
# Required Azure services
- Azure AI Search instance with API key
- Azure OpenAI instance with deployed models and API key
- No special Azure permissions required (uses API keys)

# Required Node.js packages (already included in package.json)
npm install @azure/search-documents openai
```

### Environment Variables
Create a `.env` file in the ai/backend directory based on `.env.example`:

```env
# ============================================
# Server Configuration
# ============================================
NODE_ENV=development
PORT=3001
HOST=0.0.0.0

# ============================================
# Security Configuration
# ============================================
JWT_SECRET=your-super-secret-jwt-key-change-in-production
VALID_API_KEYS=dev-key-123,test-key-456

# Note: Use these API keys to get JWT tokens:
# - dev-key-123 (for development)
# - test-key-456 (for testing)

# ============================================
# Azure Configuration (API Key Authentication)
# ============================================
# Azure AI Search
AZURE_SEARCH_ENDPOINT=https://your-search-service.search.windows.net
AZURE_SEARCH_INDEX_NAME=your-index-name
AZURE_SEARCH_API_KEY=your-search-admin-key

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://your-openai-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment-name
AZURE_OPENAI_API_VERSION=2024-02-01
AZURE_OPENAI_API_KEY=your-azure-openai-key

# ============================================
# Optional Configuration
# ============================================
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Starting the Server

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Server runs on http://0.0.0.0:3001 (accessible from any interface)
```

### Basic Usage Examples

#### Using cURL (Command Line)
```bash
# 1. Get JWT token using API key
curl -X POST http://localhost:3001/api/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "dev-key-123",
    "clientId": "my-app",
    "scopes": ["read", "search", "chat"]
  }'

# 2. Test server health (no authentication required)
curl http://localhost:3001/api/v1/health

# 3. Search for information (requires JWT token from step 1)
curl -X POST http://localhost:3001/api/v1/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt-token-from-step-1>" \
  -d '{"query": "project management best practices", "maxResults": 5}'

# 4. Ask a RAG question (requires JWT token)
curl -X POST http://localhost:3001/api/v1/rag/ask \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt-token-from-step-1>" \
  -d '{"question": "How can I improve team productivity?", "maxSearchResults": 5}'
```

#### Using JavaScript/TypeScript
```typescript
// Direct service usage (internal)
import { aiServiceOrchestrator } from './orchestrator/aiOrchestrator';

// Search for information
const searchResponse = await aiServiceOrchestrator.search("project management best practices");

// Ask a question using RAG
const ragResponse = await aiServiceOrchestrator.askQuestion({
  question: "How can I improve my team's productivity?",
  maxSearchResults: 5,
  temperature: 0.7
});

// Chat completion
const chatResponse = await aiServiceOrchestrator.createChatCompletion([
  { role: 'user', content: 'Help me plan my project timeline' }
]);
```

#### Using Fetch API (Client-side)
```javascript
// 1. Get JWT token first
const tokenResponse = await fetch('http://localhost:3001/api/v1/auth/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    apiKey: 'dev-key-123',
    clientId: 'my-web-app',
    scopes: ['read', 'search', 'chat', 'rag']
  })
});
const tokenData = await tokenResponse.json();
const jwtToken = tokenData.data.access_token;

// 2. Search example with JWT token
const searchResponse = await fetch('http://localhost:3001/api/v1/search', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${jwtToken}`
  },
  body: JSON.stringify({
    query: 'project management best practices',
    maxResults: 5,
    searchType: 'semantic'
  })
});
const searchData = await searchResponse.json();

// 3. RAG example with JWT token
const ragResponse = await fetch('http://localhost:3001/api/v1/rag/ask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${jwtToken}`
  },
  body: JSON.stringify({
    question: 'How can I improve team productivity?',
    maxSearchResults: 5,
    temperature: 0.7
  })
});
const ragData = await ragResponse.json();
```

## 🔒 Security Best Practices

### Authentication
- **API Keys**: Uses direct API key authentication for Azure services
- **JWT Tokens**: Secures API endpoints with JWT authentication
- **Environment Variables**: All sensitive data stored in .env files
- **Never**: Hard-code API keys or secrets in source code
- **Always**: Use strong JWT secrets and rotate API keys regularly

### Authorization
- Implement proper RBAC for Azure resources
- Use least-privilege access principles
- Monitor and log all AI service usage
- Implement rate limiting and throttling

### Data Protection
- All data in transit is encrypted (HTTPS/TLS)
- Sensitive data is not logged or cached
- Implement proper data retention policies
- Follow GDPR/compliance requirements

## 📊 Monitoring and Observability

### Health Checks
```typescript
// Check overall service health
const healthStatus = await aiServiceOrchestrator.getServiceHealth();

// Get detailed metrics
const metrics = aiServiceOrchestrator.getServiceMetrics();
```

### Key Metrics
- **Request Success Rate**: Percentage of successful requests
- **Response Time**: Average response times per service
- **Error Rate**: Number of failed requests and error types
- **Service Uptime**: Availability of individual services
- **Token Usage**: OpenAI token consumption tracking

### Logging
- Structured logging with correlation IDs
- Error tracking with stack traces
- Performance metrics for optimization
- Security audit trails

## 🧪 Testing

The AI backend has a comprehensive test suite with **97 tests** covering all functionality:

### Test Structure
```
tests/
├── README.md                    # Comprehensive testing documentation
├── integration/                 # End-to-end API tests (22 tests)
│   └── api.test.ts             # Full API workflow tests
├── unit/                       # Isolated component tests (75 tests)
│   ├── auth.middleware.test.ts  # Authentication middleware tests
│   ├── loggerUtils.test.ts     # Logging utility tests
│   ├── openaiService.test.ts   # Azure OpenAI service tests
│   ├── ragService.test.ts      # RAG service tests
│   ├── responseUtils.test.ts   # Response formatting tests
│   └── searchService.test.ts   # Azure Search service tests
└── utils/
    └── testUtils.ts            # Mock factories and test helpers
```

### Running Tests
```bash
# Run all tests
npm test

# Run only unit tests
npm test tests/unit

# Run only integration tests
npm test tests/integration

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### Current Test Status
- ✅ **97 tests passing** (75 unit + 22 integration)
- ✅ **0 tests failing**
- ✅ **0 tests skipped**
- ✅ **Complete API coverage**

### Test Environment Behavior
Integration tests expect 500 errors from Azure-dependent endpoints in test environment - this is **normal behavior** indicating:
- ✅ Routes are accessible and properly configured
- ✅ Authentication middleware works correctly  
- ✅ Request validation functions properly
- ✅ Error handling behaves as expected
- ❌ Azure services aren't available (expected in test environment)

### Unit Tests
Test individual services in isolation with mocked dependencies:
- **Authentication**: JWT validation, shared secret auth, public routes
- **Services**: Azure Search, OpenAI, RAG functionality with mocked Azure clients
- **Utilities**: Logging, response formatting, error handling

### Integration Tests  
Test complete API workflows using the actual Express application:
- **Authentication Endpoints**: Token generation, verification, info
- **Search Endpoints**: POST/GET search, semantic search, health metrics
- **RAG Endpoints**: Question answering, validation, error handling
- **Chat Endpoints**: Message processing, simple conversations
- **Health Endpoints**: Service status, metrics, ping/ready/live checks
- **Error Handling**: 404 responses, malformed JSON, rate limiting

For detailed testing documentation, see [`tests/README.md`](tests/README.md).

## 🔧 Configuration

### Service Configuration
```typescript
// Custom orchestrator configuration
const customOrchestrator = new AIServiceOrchestrator({
  enableLoadBalancing: true,
  enableAutoFailover: true,
  healthCheckInterval: 180000,  // 3 minutes
  maxRetries: 5,
  enableMetrics: true
});
```

### Azure AI Search Index Schema
```json
{
  "name": "project-pulse-index",
  "fields": [
    {"name": "id", "type": "Edm.String", "key": true},
    {"name": "title", "type": "Edm.String", "searchable": true},
    {"name": "content", "type": "Edm.String", "searchable": true},
    {"name": "description", "type": "Edm.String", "searchable": true},
    {"name": "category", "type": "Edm.String", "filterable": true},
    {"name": "tags", "type": "Collection(Edm.String)", "searchable": true},
    {"name": "projectId", "type": "Edm.String", "filterable": true},
    {"name": "createdAt", "type": "Edm.DateTimeOffset", "sortable": true},
    {"name": "updatedAt", "type": "Edm.DateTimeOffset", "sortable": true}
  ]
}
```

## 🚀 Deployment

### Azure Resources Required
1. **Azure AI Search**: Standard tier or higher for semantic search
2. **Azure OpenAI**: GPT-4 or GPT-3.5-turbo deployment
3. **Azure App Service**: For hosting the backend services
4. **Azure Key Vault**: For secure credential management
5. **Application Insights**: For monitoring and observability

### Deployment Steps
```bash
# 1. Deploy Azure resources
# Create Azure AI Search service and get API key
# Create Azure OpenAI service and get API key

# 2. Configure environment variables in your hosting service
# Set all required environment variables from .env.example

# 3. Build and deploy application
npm run build
# Deploy dist folder to your hosting service

# 4. Verify deployment
curl https://your-domain.com/api/v1/health
```

### Production Checklist
- [ ] Strong JWT secret configured (not default)
- [ ] Azure API keys securely stored and rotated
- [ ] Environment variables properly configured
- [ ] CORS origins restricted to your domains
- [ ] Rate limiting configured appropriately
- [ ] Health check endpoints working
- [ ] HTTPS enforced for all endpoints
- [ ] Monitoring and logging enabled
- [ ] API keys not exposed in logs or errors

## 📚 API Documentation

### Base URL
**All endpoints**: `http://localhost:3001/api/v1`

### Authentication Workflow
1. **Get JWT Token**: Use API key to get JWT token from `/auth/token`
2. **Use JWT Token**: Include `Authorization: Bearer <jwt-token>` header for protected endpoints
3. **No Auth Required**: Health check and auth info endpoints

### 🔐 Authentication Endpoints (No Auth Required)

#### Get JWT Token
```bash
# POST /api/v1/auth/token
curl -X POST http://localhost:3001/api/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "dev-key-123",
    "clientId": "my-application",
    "scopes": ["read", "search", "chat", "rag"],
    "expiresIn": "1h"
  }'
```

#### Verify JWT Token
```bash
# POST /api/v1/auth/verify
curl -X POST http://localhost:3001/api/v1/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

#### Authentication Info
```bash
# GET /api/v1/auth/info
curl http://localhost:3001/api/v1/auth/info
```

**Response Format (Token)**:
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "issued_at": "2024-12-04T10:30:00.000Z",
    "scope": ["read", "search", "chat", "rag"]
  }
}
```

### 🔍 Search Endpoints

#### Main Search
```bash
# POST /api/v1/search (requires JWT token)
curl -X POST http://localhost:3001/api/v1/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt-token-from-auth-endpoint>" \
  -d '{
    "query": "project management best practices",
    "maxResults": 10,
    "searchType": "semantic",
    "filters": "category eq '\''productivity'\''" 
  }'
```

#### Search with Query Parameters
```bash
# GET /api/v1/search?q=project%20management&max=5&type=semantic
curl "http://localhost:3001/api/v1/search?q=project%20management&max=5&type=semantic" \
  -H "Authorization: Bearer <jwt-token-from-auth-endpoint>"
```

#### Semantic Search
```bash
# POST /api/v1/search/semantic
curl -X POST http://localhost:3001/api/v1/search/semantic \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "query": "How to improve team collaboration?",
    "maxResults": 5
  }'
```

#### Search Suggestions
```bash
# GET /api/v1/search/suggestions?q=proj
curl "http://localhost:3001/api/v1/search/suggestions?q=proj" \
  -H "Authorization: Bearer <your-token>"
```

### 🤖 RAG (Retrieval Augmented Generation) Endpoints

#### Ask Questions
```bash
# POST /api/v1/rag/ask
curl -X POST http://localhost:3001/api/v1/rag/ask \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "question": "How can I improve my team productivity?",
    "maxSearchResults": 5,
    "temperature": 0.7,
    "includeSearchResults": true
  }'
```

#### Conversational RAG
```bash
# POST /api/v1/rag/conversational
curl -X POST http://localhost:3001/api/v1/rag/conversational \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "question": "What about remote teams specifically?",
    "conversationHistory": [
      {"role": "user", "content": "How can I improve team productivity?"},
      {"role": "assistant", "content": "Here are some strategies..."}
    ],
    "maxSearchResults": 3
  }'
```

#### Batch RAG Processing
```bash
# POST /api/v1/rag/batch
curl -X POST http://localhost:3001/api/v1/rag/batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "questions": [
      "What are agile methodologies?",
      "How to implement scrum?",
      "Best practices for sprint planning?"
    ],
    "maxSearchResults": 3
  }'
```

### 💬 Chat Endpoints

#### Chat Completions
```bash
# POST /api/v1/chat/completions
curl -X POST http://localhost:3001/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "messages": [
      {"role": "user", "content": "Help me create a project timeline"}
    ],
    "temperature": 0.7,
    "maxTokens": 500
  }'
```

#### Simple Chat
```bash
# POST /api/v1/chat/simple
curl -X POST http://localhost:3001/api/v1/chat/simple \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "prompt": "Explain the benefits of agile project management",
    "temperature": 0.5,
    "maxTokens": 300
  }'
```

#### Streaming Chat
```bash
# POST /api/v1/chat/stream
curl -X POST http://localhost:3001/api/v1/chat/stream \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "messages": [
      {"role": "user", "content": "Provide a detailed project plan"}
    ],
    "stream": true
  }'
```

#### Chat Analysis
```bash
# POST /api/v1/chat/analyze
curl -X POST http://localhost:3001/api/v1/chat/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "messages": [
      {"role": "user", "content": "Our team is struggling with deadlines"}
    ],
    "analysisType": "sentiment"
  }'
```

### 🏥 Health Check Endpoints (No Auth Required)

#### Overall Health
```bash
# GET /api/v1/health
curl http://localhost:3001/api/v1/health

# Detailed health check
curl "http://localhost:3001/api/v1/health?detailed=true"

# Specific service health
curl "http://localhost:3001/api/v1/health?service=search"
```

#### Ping Check
```bash
# GET /api/v1/health/ping
curl http://localhost:3001/api/v1/health/ping
```

#### Readiness Check
```bash
# GET /api/v1/health/ready
curl http://localhost:3001/api/v1/health/ready
```

#### Liveness Check
```bash
# GET /api/v1/health/live
curl http://localhost:3001/api/v1/health/live
```

#### Service Metrics
```bash
# GET /api/v1/health/metrics
curl http://localhost:3001/api/v1/health/metrics
```

#### Reset Metrics
```bash
# POST /api/v1/health/reset-metrics
curl -X POST http://localhost:3001/api/v1/health/reset-metrics \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 📖 API Information
```bash
# GET /api/v1 - API documentation and available endpoints
curl http://localhost:3001/api/v1

# GET /api/v1/auth/info - Authentication configuration
curl http://localhost:3001/api/v1/auth/info
```

### ⚠️ Temporarily Disabled
**Analytics Endpoints** (`/api/v1/analytics/*`) - Currently disabled due to TypeScript compilation issues. Will be restored after fixing:
- `POST /api/v1/analytics/projects`
- `POST /api/v1/analytics/insights` 
- `POST /api/v1/analytics/predictions`
- `POST /api/v1/analytics/recommendations`

## 🤝 Contributing

1. Follow TypeScript best practices and coding standards
2. Implement comprehensive error handling and logging
3. Add unit tests for all new functionality
4. Update documentation for API changes
5. Test with actual Azure services before submitting PRs
6. Follow security best practices and never commit secrets

## 📄 License

This project is part of Project Pulse and follows the same licensing terms.

---

## 🆘 Support

For issues and questions:
1. Check the health check endpoints for service status
2. Review Application Insights logs for detailed error information
3. Validate Azure service configurations and permissions
4. Ensure all required environment variables are set correctly

**Built with ❤️ using Azure AI Services and TypeScript**