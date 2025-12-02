// Frontend-only configuration - no environment variables needed
interface AppConfig {
  // Application settings
  NODE_ENV: string;
  APP_NAME: string;
  VERSION: string;
  
  // Mock AI settings
  MOCK_AI_ENABLED: boolean;
  RESPONSE_DELAY_MS: number;
  MAX_RESPONSE_LENGTH: number;
}

// Static configuration for frontend-only app
function loadAppConfig(): AppConfig {
  return {
    // Application
    NODE_ENV: 'production', // Always production for static export
    APP_NAME: 'Project Pulse AI',
    VERSION: '1.0.0',
    
    // Mock AI configuration
    MOCK_AI_ENABLED: true,
    RESPONSE_DELAY_MS: 1500, // Simulate API response time
    MAX_RESPONSE_LENGTH: 500, // Limit response length
  };
}

export const config = loadAppConfig();
export default config;