interface EnvConfig {
  // Azure Search
  AZURE_SEARCH_ENDPOINT: string;
  AZURE_SEARCH_API_KEY: string;
  AZURE_SEARCH_INDEX_NAME: string;
  AZURE_SEMANTIC_CONFIG_NAME: string;
  
  // Azure OpenAI
  AZURE_OPENAI_ENDPOINT: string;
  AZURE_OPENAI_API_KEY: string;
  AZURE_OPENAI_MODEL: string;
  
  // Application
  NODE_ENV: string;
}

function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name];
  if (!value && !defaultValue) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value || defaultValue!;
}

function loadEnvConfig(): EnvConfig {
  return {
    // Azure Search
    AZURE_SEARCH_ENDPOINT: getEnvVar('AZURE_SEARCH_ENDPOINT'),
    AZURE_SEARCH_API_KEY: getEnvVar('AZURE_SEARCH_API_KEY'),
    AZURE_SEARCH_INDEX_NAME: getEnvVar('AZURE_SEARCH_INDEX_NAME', 'index-project-pulse'),
    AZURE_SEMANTIC_CONFIG_NAME: getEnvVar('AZURE_SEMANTIC_CONFIG_NAME', 'default'),
    
    // Azure OpenAI
    AZURE_OPENAI_ENDPOINT: getEnvVar('AZURE_OPENAI_ENDPOINT'),
    AZURE_OPENAI_API_KEY: getEnvVar('AZURE_OPENAI_API_KEY'),
    AZURE_OPENAI_MODEL: getEnvVar('AZURE_OPENAI_MODEL', 'gpt-4o-mini'),
    
    // Application
    NODE_ENV: getEnvVar('NODE_ENV', 'development'),
  };
}

export const env = loadEnvConfig();
export default env;