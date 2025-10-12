@echo off
REM Settings Module Test Runner for Windows
REM This script runs all tests for the settings module

echo 🧪 Running Settings Module Tests...
echo ==================================

REM Set test environment
set NODE_ENV=test

REM Run specific test suites
echo 📋 Running CRUD Tests...
call npm test -- tests/v1/modules/settings/settings.crud.test.ts

echo.
echo 🔐 Running Security Tests...
call npm test -- tests/v1/modules/settings/settings.security.test.ts

echo.
echo ⚠️  Running Edge Cases Tests...
call npm test -- tests/v1/modules/settings/settings.edge-cases.test.ts

echo.
echo 👥 Running Management Tests...
call npm test -- tests/v1/modules/settings/settings.management.test.ts

echo.
echo 🔍 Running Search Tests...
call npm test -- tests/v1/modules/settings/settings.search.test.ts

echo.
echo 🔗 Running Integration Tests...
call npm test -- tests/v1/integration/settings.test.ts

echo.
echo ✅ All Settings Tests Complete!
pause