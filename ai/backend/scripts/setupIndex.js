#!/usr/bin/env node

/**
 * Simple Node.js script to run the Azure AI Search setup
 * This compiles and runs the TypeScript setup script
 */

const { spawn } = require('child_process');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

console.log(colorize('\n🔍 Azure AI Search Setup Runner', 'cyan'));
console.log('Compiling and running TypeScript setup...\n');

// Run the TypeScript compilation and execution
const tsNode = spawn('npx', [
  'ts-node', 
  '--project', 'tsconfig.json',
  path.join(__dirname, 'setupIndex.ts'),
  ...process.argv.slice(2)
], {
  stdio: 'inherit',
  shell: true
});

tsNode.on('close', (code) => {
  if (code === 0) {
    console.log(colorize('\n✅ Setup completed successfully!', 'green'));
  } else {
    console.error(colorize(`\n❌ Setup failed with exit code ${code}`, 'red'));
    process.exit(code);
  }
});

tsNode.on('error', (error) => {
  console.error(colorize('\n💥 Failed to start setup process:', 'red'));
  console.error(error.message);
  
  if (error.message.includes('ts-node')) {
    console.log(colorize('\n💡 Try installing ts-node:', 'yellow'));
    console.log('npm install -g ts-node');
    console.log('or');
    console.log('npm install --save-dev ts-node');
  }
  
  process.exit(1);
});