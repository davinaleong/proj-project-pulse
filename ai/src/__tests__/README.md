# Testing Documentation

## Overview

This test suite provides comprehensive testing for the Azure AI Search and OpenAI integration scripts.

## Test Structure

### Test Files

1. **`setup.test.ts`** - Basic Jest configuration validation
2. **`environment.test.ts`** - Environment variable validation 
3. **`scripts-config.test.ts`** - Configuration structure and parameter validation

### Test Categories

#### Environment Tests
- Validates all required environment variables are present
- Checks URL format for Azure endpoints
- Verifies test-specific environment values

#### Configuration Tests  
- Tests Azure Search configuration structure
- Tests Azure OpenAI configuration structure
- Validates search parameters format
- Validates AI message structure

#### Error Handling Tests
- Tests graceful handling of missing environment variables
- Validates data type checking
- Tests configuration validation logic

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- setup.test.ts
npm test -- environment.test.ts  
npm test -- scripts-config.test.ts

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Test Environment Setup

The tests use mock environment variables defined in `setup.ts`:

- `AZURE_SEARCH_ENDPOINT=https://test-search.search.windows.net`
- `AZURE_SEARCH_API_KEY=test-key`
- `AZURE_SEARCH_INDEX_NAME=test-index`
- `AZURE_SEMANTIC_CONFIG_NAME=test-config`
- `AZURE_OPENAI_ENDPOINT=https://test-openai.openai.azure.com/`
- `AZURE_OPENAI_API_KEY=test-openai-key`
- `AZURE_OPENAI_MODEL=gpt-4o-mini`
- `NODE_ENV=test`

## Test Coverage

The current test suite covers:
- ✅ Environment variable validation
- ✅ Configuration structure validation  
- ✅ Parameter format validation
- ✅ Error handling scenarios
- ✅ Data type validation

## Future Enhancements

For integration testing with actual Azure services, consider:
- Mock Azure SDK responses
- Test actual API call structures
- Test error scenarios from Azure services
- Performance testing
- Load testing

## Dependencies

- `jest` - Testing framework
- `@types/jest` - TypeScript definitions
- `ts-jest` - TypeScript preset for Jest
- `@jest/globals` - Jest global functions