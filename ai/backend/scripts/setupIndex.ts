#!/usr/bin/env node

/**
 * Azure AI Search Index Setup CLI
 * 
 * Command-line interface for setting up Azure AI Search indexes
 * and uploading the Project Pulse dataset.
 */

import { SearchIndexManager } from '../services/indexManager';
import { resolve } from 'path';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(text: string, color: keyof typeof colors): string {
  return `${colors[color]}${text}${colors.reset}`;
}

function printBanner(): void {
  console.log(colorize('\n🔍 Azure AI Search Index Manager', 'cyan'));
  console.log(colorize('=====================================', 'cyan'));
  console.log('Project Pulse Dataset Setup Tool\n');
}

function printUsage(): void {
  console.log(colorize('Usage:', 'yellow'));
  console.log('  npm run setup-index [options]');
  console.log('  node scripts/setupIndex.js [options]\n');
  
  console.log(colorize('Options:', 'yellow'));
  console.log('  --csv-path <path>     Path to the CSV dataset file');
  console.log('                        Default: ./data/project-pulse-extended-metadata.csv');
  console.log('  --use-indexer         Use Azure indexer (requires blob storage)');
  console.log('  --direct-upload       Upload data directly to search index (default)');
  console.log('  --delete-index        Delete existing index before creating');
  console.log('  --help, -h            Show this help message');
  console.log('  --verbose, -v         Enable verbose logging\n');
  
  console.log(colorize('Examples:', 'yellow'));
  console.log('  # Setup with direct upload (recommended)');
  console.log('  npm run setup-index');
  console.log('');
  console.log('  # Setup with custom CSV path');
  console.log('  npm run setup-index --csv-path ./my-data.csv');
  console.log('');
  console.log('  # Setup using Azure indexer (requires AZURE_STORAGE_CONNECTION_STRING)');
  console.log('  npm run setup-index --use-indexer');
  console.log('');
  console.log('  # Delete and recreate index');
  console.log('  npm run setup-index --delete-index\n');
}

function printEnvironmentCheck(): void {
  console.log(colorize('Environment Variables Check:', 'blue'));
  
  const requiredVars = [
    'AZURE_SEARCH_ENDPOINT',
    'AZURE_SEARCH_API_KEY',
    'AZURE_SEARCH_INDEX_NAME'
  ];
  
  const optionalVars = [
    'AZURE_STORAGE_CONNECTION_STRING',
    'AZURE_SEARCH_API_VERSION',
    'AZURE_SEMANTIC_CONFIG_NAME'
  ];
  
  let allRequired = true;
  
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`  ✅ ${varName}: ${colorize('Set', 'green')}`);
    } else {
      console.log(`  ❌ ${varName}: ${colorize('Missing', 'red')}`);
      allRequired = false;
    }
  });
  
  optionalVars.forEach(varName => {
    const value = process.env[varName];
    const status = value ? 'Set' : 'Not set';
    const color = value ? 'green' : 'yellow';
    console.log(`  ℹ️  ${varName}: ${colorize(status, color)}`);
  });
  
  console.log('');
  
  if (!allRequired) {
    console.error(colorize('❌ Missing required environment variables. Please check your .env file.', 'red'));
    process.exit(1);
  }
}

interface CLIOptions {
  csvPath: string;
  useIndexer: boolean;
  deleteIndex: boolean;
  verbose: boolean;
  help: boolean;
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = {
    csvPath: './data/project-pulse-extended-metadata.csv',
    useIndexer: false,
    deleteIndex: false,
    verbose: false,
    help: false
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--csv-path':
        options.csvPath = args[++i];
        break;
      case '--use-indexer':
        options.useIndexer = true;
        break;
      case '--direct-upload':
        options.useIndexer = false;
        break;
      case '--delete-index':
        options.deleteIndex = true;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        console.warn(colorize(`Unknown option: ${arg}`, 'yellow'));
        break;
    }
  }
  
  return options;
}

async function validateCsvFile(csvPath: string): Promise<string> {
  const fs = await import('fs');
  
  // Resolve to absolute path
  const absolutePath = resolve(csvPath);
  
  try {
    const stats = fs.statSync(absolutePath);
    if (!stats.isFile()) {
      throw new Error(`Path is not a file: ${absolutePath}`);
    }
    
    console.log(colorize(`📄 CSV file found: ${absolutePath}`, 'green'));
    console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    
    return absolutePath;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.error(colorize(`❌ CSV file not found: ${absolutePath}`, 'red'));
      console.log('\nPlease ensure the CSV file exists or specify the correct path with --csv-path');
    } else {
      console.error(colorize(`❌ Error accessing CSV file: ${error.message}`, 'red'));
    }
    process.exit(1);
  }
}

async function main(): Promise<void> {
  printBanner();
  
  const options = parseArgs();
  
  if (options.help) {
    printUsage();
    return;
  }
  
  // Check environment variables
  printEnvironmentCheck();
  
  // Validate CSV file
  const csvPath = await validateCsvFile(options.csvPath);
  
  // Initialize the search index manager
  console.log(colorize('🔧 Initializing Azure AI Search client...', 'blue'));
  
  try {
    const indexManager = new SearchIndexManager();
    
    console.log(colorize('✅ Azure AI Search client initialized', 'green'));
    
    // Delete existing index if requested
    if (options.deleteIndex) {
      console.log(colorize('\n🗑️  Deleting existing index...', 'yellow'));
      try {
        await indexManager.deleteIndex();
      } catch (error: any) {
        if (error.statusCode === 404) {
          console.log(colorize('ℹ️  No existing index to delete', 'yellow'));
        } else {
          throw error;
        }
      }
    }
    
    // Run the setup process
    console.log(colorize('\n🚀 Starting index setup...', 'blue'));
    console.log(`Upload method: ${options.useIndexer ? 'Azure Indexer' : 'Direct Upload'}`);
    console.log(`CSV file: ${csvPath}\n`);
    
    const startTime = Date.now();
    
    await indexManager.setupComplete(csvPath, options.useIndexer);
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(colorize(`\n🎉 Setup completed in ${duration} seconds!`, 'green'));
    console.log(colorize('\nNext steps:', 'cyan'));
    console.log('  • Test the search functionality using the API endpoints');
    console.log('  • Configure semantic search if needed');
    console.log('  • Set up monitoring and alerting');
    console.log('  • Consider implementing incremental data updates\n');
    
  } catch (error: any) {
    console.error(colorize('\n💥 Setup failed:', 'red'));
    
    if (options.verbose) {
      console.error(error);
    } else {
      console.error(error.message);
      console.log('\nRun with --verbose for detailed error information');
    }
    
    // Provide helpful error-specific guidance
    if (error.message?.includes('401') || error.message?.includes('authentication')) {
      console.log(colorize('\n💡 Authentication Error:', 'yellow'));
      console.log('  • Check your AZURE_SEARCH_API_KEY');
      console.log('  • Verify the search service endpoint');
      console.log('  • Ensure the API key has sufficient permissions');
    }
    
    if (error.message?.includes('404')) {
      console.log(colorize('\n💡 Resource Not Found:', 'yellow'));
      console.log('  • Verify the AZURE_SEARCH_ENDPOINT is correct');
      console.log('  • Check if the search service exists');
      console.log('  • Ensure the service is in the correct region');
    }
    
    if (error.message?.includes('storage') || error.message?.includes('blob')) {
      console.log(colorize('\n💡 Storage Error:', 'yellow'));
      console.log('  • Check your AZURE_STORAGE_CONNECTION_STRING');
      console.log('  • Ensure the storage account exists');
      console.log('  • Try using --direct-upload instead of --use-indexer');
    }
    
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error(colorize('\n💥 Unhandled Promise Rejection:', 'red'));
  console.error(reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error(colorize('\n💥 Uncaught Exception:', 'red'));
  console.error(error);
  process.exit(1);
});

// Run the main function
if (require.main === module) {
  main().catch((error) => {
    console.error(colorize('\n💥 Fatal error:', 'red'));
    console.error(error);
    process.exit(1);
  });
}

export { main, parseArgs, validateCsvFile };