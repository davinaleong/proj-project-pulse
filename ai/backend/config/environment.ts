/**
 * Environment Configuration for Azure Services
 * 
 * Using API key authentication for simplicity:
 * - Direct API key authentication to Azure services
 * - Comprehensive error handling and validation
 * - Environment variable configuration
 * - Development-focused setup
 */

// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

export interface AzureConfig {
  // Azure AI Search Configuration
  search: {
    endpoint: string;
    indexName: string;
    apiKey: string;
    apiVersion: string;
    semanticConfigName: string;
  };
  
  // Azure OpenAI Configuration
  openai: {
    endpoint: string;
    deploymentName: string;
    apiKey: string;
    apiVersion: string;
  };
  
  // Server Configuration
  server: {
    port: number;
    host: string;
    environment: string;
    corsOrigins: string[];
  };
  
  // Security Configuration
  security: {
    jwtSecret: string;
    sharedSecret: string;  // For Next.js same-repo authentication
    validApiKeys: string[];
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
  };
  
  // Application Configuration
  app: {
    logLevel: string;
    requestTimeout: number;
    healthCheckTimeout: number;
    retryOptions: {
      maxRetries: number;
      retryDelayMs: number;
      maxRetryDelayMs: number;
    };
  };
}

/**
 * Validates required environment variables
 * @param varName Environment variable name
 * @param defaultValue Optional default value
 * @returns The environment variable value
 * @throws Error if required variable is missing
 */
function getRequiredEnvVar(varName: string, defaultValue?: string): string {
  const value = process.env[varName] || defaultValue;
  
  if (!value) {
    throw new Error(
      `Required environment variable ${varName} is not set. ` +
      `Please configure this in your environment or Azure Key Vault.`
    );
  }
  
  return value;
}

/**
 * Loads and validates configuration from environment variables
 * @returns Validated configuration object
 */
export function loadAzureConfig(): AzureConfig {
  try {
    const config: AzureConfig = {
      search: {
        endpoint: getRequiredEnvVar('AZURE_SEARCH_ENDPOINT'),
        indexName: getRequiredEnvVar('AZURE_SEARCH_INDEX_NAME', 'project-pulse-index'),
        apiKey: getRequiredEnvVar('AZURE_SEARCH_API_KEY'),
        apiVersion: getRequiredEnvVar('AZURE_SEARCH_API_VERSION', '2024-07-01'),
        semanticConfigName: getRequiredEnvVar('AZURE_SEMANTIC_CONFIG_NAME', 'default')
      },
      
      openai: {
        endpoint: getRequiredEnvVar('AZURE_OPENAI_ENDPOINT'),
        deploymentName: getRequiredEnvVar('AZURE_OPENAI_DEPLOYMENT_NAME'),
        apiKey: getRequiredEnvVar('AZURE_OPENAI_API_KEY'),
        apiVersion: getRequiredEnvVar('AZURE_OPENAI_API_VERSION', '2024-02-01')
      },
      
      server: {
        port: parseInt(process.env.PORT || '3001'),
        host: process.env.HOST || '0.0.0.0',
        environment: process.env.NODE_ENV || 'development',
        corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173').split(',')
      },
      
      security: {
        jwtSecret: getRequiredEnvVar('JWT_SECRET'),
        sharedSecret: getRequiredEnvVar('SHARED_SECRET'),  // For Next.js integration
        validApiKeys: (process.env.VALID_API_KEYS || '').split(',').filter(key => key.trim()),
        rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
        rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
      },
      
      app: {
        logLevel: process.env.LOG_LEVEL || 'info',
        requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '30000'),
        healthCheckTimeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT || '5000'),
        retryOptions: {
          maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
          retryDelayMs: parseInt(process.env.RETRY_DELAY_MS || '1000'),
          maxRetryDelayMs: parseInt(process.env.MAX_RETRY_DELAY_MS || '10000')
        }
      }
    };

    // Validate endpoint URLs
    validateEndpoint(config.search.endpoint, 'Azure Search');
    validateEndpoint(config.openai.endpoint, 'Azure OpenAI');

    // Validate API keys are provided
    if (!config.search.apiKey) {
      throw new Error('Azure Search API key is required');
    }
    if (!config.openai.apiKey) {
      throw new Error('Azure OpenAI API key is required');
    }
    if (config.security.validApiKeys.length === 0) {
      console.warn('⚠️ No valid API keys configured - API will be open');
    }

    console.log('✅ Configuration loaded successfully');
    console.log(`📍 Search Endpoint: ${config.search.endpoint}`);
    console.log(`📍 OpenAI Endpoint: ${config.openai.endpoint}`);
    console.log(`🏷️ Environment: ${config.server.environment}`);
    console.log(`🚪 Server: ${config.server.host}:${config.server.port}`);

    return config;
    
  } catch (error) {
    console.error('❌ Failed to load configuration:', error);
    throw new Error(`Configuration Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validates Azure service endpoint URLs
 * @param endpoint The endpoint URL to validate
 * @param serviceName The service name for error messages
 */
function validateEndpoint(endpoint: string, serviceName: string): void {
  try {
    const url = new URL(endpoint);
    
    if (!url.protocol.startsWith('https')) {
      throw new Error(`${serviceName} endpoint must use HTTPS`);
    }
    
    if (serviceName === 'Azure Search' && !url.hostname.includes('.search.windows.net')) {
      console.warn(`⚠️ ${serviceName} endpoint doesn't match expected pattern`);
    }
    
    if (serviceName === 'Azure OpenAI' && !url.hostname.includes('.openai.azure.com')) {
      console.warn(`⚠️ ${serviceName} endpoint doesn't match expected pattern`);
    }
    
  } catch (error) {
    throw new Error(`Invalid ${serviceName} endpoint URL: ${endpoint}`);
  }
}

// Export singleton instance
export const azureConfig = loadAzureConfig();

export default azureConfig;