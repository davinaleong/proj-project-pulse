import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Simple unit test for environment configuration
describe('Environment Configuration', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('should load environment variables correctly', () => {
    // Test that environment variables are available
    expect(process.env.AZURE_SEARCH_ENDPOINT).toBe('https://test-search.search.windows.net');
    expect(process.env.AZURE_SEARCH_API_KEY).toBe('test-key');
    expect(process.env.AZURE_OPENAI_ENDPOINT).toBe('https://test-openai.openai.azure.com/');
    expect(process.env.AZURE_OPENAI_API_KEY).toBe('test-openai-key');
    expect(process.env.NODE_ENV).toBe('test');
  });

  it('should validate required environment variables', () => {
    const requiredVars = [
      'AZURE_SEARCH_ENDPOINT',
      'AZURE_SEARCH_API_KEY',
      'AZURE_OPENAI_ENDPOINT', 
      'AZURE_OPENAI_API_KEY'
    ];

    requiredVars.forEach(varName => {
      expect(process.env[varName]).toBeTruthy();
      expect(process.env[varName]?.length).toBeGreaterThan(0);
    });
  });

  it('should have valid URL formats for endpoints', () => {
    expect(process.env.AZURE_SEARCH_ENDPOINT).toMatch(/^https?:\/\/.+/);
    expect(process.env.AZURE_OPENAI_ENDPOINT).toMatch(/^https?:\/\/.+/);
  });
});