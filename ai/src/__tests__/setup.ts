// Jest setup file
import { jest } from '@jest/globals';

// Mock environment variables for testing
process.env.AZURE_SEARCH_ENDPOINT = 'https://test-search.search.windows.net';
process.env.AZURE_SEARCH_API_KEY = 'test-key';
process.env.AZURE_SEARCH_INDEX_NAME = 'test-index';
process.env.AZURE_SEMANTIC_CONFIG_NAME = 'test-config';
process.env.AZURE_OPENAI_ENDPOINT = 'https://test-openai.openai.azure.com/';
process.env.AZURE_OPENAI_API_KEY = 'test-openai-key';
process.env.AZURE_OPENAI_MODEL = 'gpt-4o-mini';
process.env.NODE_ENV = 'test';

// Mock Azure Search SDK
jest.mock('@azure/search-documents', () => ({
  SearchClient: jest.fn(),
  AzureKeyCredential: jest.fn(),
}));

// Mock OpenAI SDK
jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Global test timeout
jest.setTimeout(30000);