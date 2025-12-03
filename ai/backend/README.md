# Project Pulse - AI Backend Services

## Overview

This directory contains the comprehensive AI backend services for Project Pulse, implementing enterprise-grade Azure AI Search and Azure OpenAI integration with TypeScript. The services follow Microsoft Azure best practices and provide intelligent search, chat completions, RAG (Retrieval Augmented Generation), and advanced analytics capabilities.

## 🏗️ Architecture

```
ai/backend/
├── config/
│   └── environment.ts          # Azure configuration with security best practices
├── services/
│   ├── searchService.ts        # Azure AI Search integration
│   ├── openaiService.ts        # Azure OpenAI service
│   ├── ragService.ts           # Intelligent RAG implementation
│   └── analyticsService.ts     # Advanced analytics and insights
├── orchestrator/
│   └── aiOrchestrator.ts       # Central AI service orchestrator
└── README.md                   # This file
```

## 🔧 Services

### 1. Environment Configuration (`config/environment.ts`)
- **Purpose**: Centralized Azure configuration with security-first approach
- **Features**:
  - DefaultAzureCredential with managed identity support
  - Environment variable validation and type safety
  - Credential chaining for development and production
  - Comprehensive error handling and logging
- **Security**: Uses managed identity for production, Azure CLI for development

### 2. Azure AI Search Service (`services/searchService.ts`)
- **Purpose**: Comprehensive Azure AI Search integration
- **Features**:
  - Semantic search with AI-powered relevance
  - Vector search with embeddings support
  - Hybrid search combining multiple techniques
  - Performance monitoring and retry logic
  - Health checks and error handling
- **Best Practices**: Follows Azure SDK patterns, implements exponential backoff

### 3. Azure OpenAI Service (`services/openaiService.ts`)
- **Purpose**: Azure OpenAI integration for chat completions
- **Features**:
  - Chat completions with streaming support
  - Content filtering and safety measures
  - Token usage tracking and optimization
  - RAG-enabled chat with data sources
  - Comprehensive error handling
- **Best Practices**: Uses getBearerTokenProvider for authentication, implements proper streaming

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
- Azure AI Search instance
- Azure OpenAI instance with deployed models
- Azure subscription with appropriate permissions

# Required Node.js packages
npm install @azure/search-documents @azure/identity openai
```

### Environment Variables
Create a `.env` file in your project root:

```env
# Azure AI Search Configuration
AZURE_SEARCH_ENDPOINT=https://your-search-service.search.windows.net
AZURE_SEARCH_ADMIN_KEY=your-search-admin-key  # Optional: prefer managed identity
AZURE_SEARCH_INDEX_NAME=project-pulse-index

# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://your-openai-service.openai.azure.com
AZURE_OPENAI_API_KEY=your-openai-api-key  # Optional: prefer managed identity
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
AZURE_OPENAI_API_VERSION=2024-02-15-preview

# Optional: Specify Azure credentials (for development)
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
AZURE_TENANT_ID=your-tenant-id
```

### Basic Usage

```typescript
import { aiServiceOrchestrator } from './ai/backend/orchestrator/aiOrchestrator';

// Search for information
const searchResponse = await aiServiceOrchestrator.search("project management best practices");

// Ask a question using RAG
const ragResponse = await aiServiceOrchestrator.askQuestion({
  question: "How can I improve my team's productivity?",
  maxSearchResults: 5,
  temperature: 0.7
});

// Generate analytics insights
const analyticsResponse = await aiServiceOrchestrator.analyzeProjects({
  question: "What are the risk factors for my current projects?",
  analysisType: "prediction"
});

// Chat completion
const chatResponse = await aiServiceOrchestrator.createChatCompletion([
  { role: 'user', content: 'Help me plan my project timeline' }
]);
```

## 🔒 Security Best Practices

### Authentication
- **Production**: Uses DefaultAzureCredential with managed identity
- **Development**: Falls back to Azure CLI credentials
- **Never**: Hard-code API keys in source code
- **Always**: Use environment variables or Azure Key Vault

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

### Unit Tests
```typescript
// Test individual services
import { azureSearchService } from './services/searchService';
import { azureOpenAIService } from './services/openaiService';

// Mock Azure services for testing
jest.mock('@azure/search-documents');
jest.mock('openai');
```

### Integration Tests
```typescript
// Test full AI workflows
const testQuery = "test project management question";
const response = await aiServiceOrchestrator.askQuestion({
  question: testQuery,
  maxSearchResults: 3
});

expect(response.success).toBe(true);
expect(response.data?.answer).toBeDefined();
```

### Load Testing
- Use Azure Load Testing for performance validation
- Test concurrent request handling
- Validate rate limiting and throttling
- Monitor resource consumption under load

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
# 1. Deploy Azure resources using ARM/Bicep templates
az deployment group create --resource-group rg-project-pulse --template-file deploy/azure-resources.bicep

# 2. Configure managed identity
az webapp identity assign --name project-pulse-api --resource-group rg-project-pulse

# 3. Grant permissions to Azure AI services
az role assignment create --assignee <managed-identity-principal-id> --role "Search Service Contributor"
az role assignment create --assignee <managed-identity-principal-id> --role "Cognitive Services OpenAI User"

# 4. Deploy application code
az webapp deploy --resource-group rg-project-pulse --name project-pulse-api --src-path ./dist
```

### Production Checklist
- [ ] Managed identity configured and permissions assigned
- [ ] Environment variables set in App Service configuration
- [ ] Health check endpoints configured
- [ ] Application Insights monitoring enabled
- [ ] Rate limiting and throttling configured
- [ ] Security headers and CORS policies set
- [ ] Backup and disaster recovery plan implemented

## 📚 API Documentation

### Search Endpoints
```typescript
// GET /api/ai/search
POST /api/ai/search
{
  "query": "project management",
  "maxResults": 10,
  "enableSemanticSearch": true
}
```

### RAG Endpoints
```typescript
// POST /api/ai/ask
POST /api/ai/ask
{
  "question": "How do I improve team productivity?",
  "context": "We're a remote team working on software development",
  "maxSearchResults": 5,
  "temperature": 0.7
}
```

### Analytics Endpoints
```typescript
// POST /api/ai/analytics
POST /api/ai/analytics
{
  "question": "What are the risk factors for my projects?",
  "projectIds": ["proj-123", "proj-456"],
  "analysisType": "risk"
}
```

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