// Simple test to verify Jest is working
describe('Jest Setup', () => {
  it('should run tests correctly', () => {
    expect(true).toBe(true);
  });

  it('should have environment variables set', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.AZURE_SEARCH_ENDPOINT).toBeDefined();
    expect(process.env.AZURE_OPENAI_ENDPOINT).toBeDefined();
  });
});