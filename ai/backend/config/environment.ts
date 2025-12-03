/**
 * Environment Configuration for Azure Services
 * 
 * Following Azure security best practices:
 * - Uses DefaultAzureCredential for keyless authentication
 * - Implements proper error handling and validation
 * - Supports multiple authentication methods
 * - Includes comprehensive logging
 */

import { DefaultAzureCredential, ChainedTokenCredential, AzureCliCredential, ManagedIdentityCredential } from '@azure/identity';

export interface AzureConfig {
  // Azure AI Search Configuration
  search: {
    endpoint: string;
    indexName: string;
    semanticConfigName: string;
    apiVersion: string;
  };
  
  // Azure OpenAI Configuration
  openai: {
    endpoint: string;
    deploymentName: string;
    apiVersion: string;
  };
  
  // Application Configuration
  app: {
    environment: string;
    logLevel: string;
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
 * Creates Azure credential chain following best practices:
 * 1. Managed Identity (for Azure-hosted services)
 * 2. Azure CLI (for local development)
 * 3. DefaultAzureCredential (fallback)
 */
export function createAzureCredential() {
  try {
    // Create a credential chain for different environments
    return new ChainedTokenCredential(
      new ManagedIdentityCredential(), // For Azure-hosted services
      new AzureCliCredential(),       // For local development
      new DefaultAzureCredential()    // Fallback
    );
  } catch (error) {
    console.error('Failed to create Azure credential:', error);
    // Fallback to DefaultAzureCredential
    return new DefaultAzureCredential();
  }
}

/**
 * Loads and validates Azure configuration from environment variables
 * @returns Validated Azure configuration object
 */
export function loadAzureConfig(): AzureConfig {
  try {
    const config: AzureConfig = {
      search: {
        endpoint: getRequiredEnvVar('AZURE_SEARCH_ENDPOINT'),
        indexName: getRequiredEnvVar('AZURE_SEARCH_INDEX_NAME', 'project-pulse-index'),
        semanticConfigName: getRequiredEnvVar('AZURE_SEMANTIC_CONFIG_NAME', 'default'),
        apiVersion: getRequiredEnvVar('AZURE_SEARCH_API_VERSION', '2024-07-01')
      },
      
      openai: {
        endpoint: getRequiredEnvVar('AZURE_OPENAI_ENDPOINT'),
        deploymentName: getRequiredEnvVar('AZURE_OPENAI_DEPLOYMENT_NAME', 'gpt-4o-mini'),
        apiVersion: getRequiredEnvVar('AZURE_OPENAI_API_VERSION', '2024-08-01-preview')
      },
      
      app: {
        environment: process.env.NODE_ENV || 'development',
        logLevel: process.env.LOG_LEVEL || 'info',
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

    console.log('✅ Azure configuration loaded successfully');
    console.log(`📍 Search Endpoint: ${config.search.endpoint}`);
    console.log(`📍 OpenAI Endpoint: ${config.openai.endpoint}`);
    console.log(`🏷️ Environment: ${config.app.environment}`);

    return config;
    
  } catch (error) {
    console.error('❌ Failed to load Azure configuration:', error);
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
export const azureCredential = createAzureCredential();

export default azureConfig;