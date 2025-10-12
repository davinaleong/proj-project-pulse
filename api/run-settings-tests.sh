#!/bin/bash

# Settings Module Test Runner
# This script runs all tests for the settings module

echo "🧪 Running Settings Module Tests..."
echo "=================================="

# Set test environment
export NODE_ENV=test

# Run specific test suites
echo "📋 Running CRUD Tests..."
npm test -- tests/v1/modules/settings/settings.crud.test.ts

echo ""
echo "🔐 Running Security Tests..."
npm test -- tests/v1/modules/settings/settings.security.test.ts

echo ""
echo "⚠️  Running Edge Cases Tests..."
npm test -- tests/v1/modules/settings/settings.edge-cases.test.ts

echo ""
echo "👥 Running Management Tests..."
npm test -- tests/v1/modules/settings/settings.management.test.ts

echo ""
echo "🔍 Running Search Tests..."
npm test -- tests/v1/modules/settings/settings.search.test.ts

echo ""
echo "🔗 Running Integration Tests..."
npm test -- tests/v1/integration/settings.test.ts

echo ""
echo "✅ All Settings Tests Complete!"