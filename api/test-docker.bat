@echo off
setlocal

rem Test setup script for Docker (Windows)

echo 🐳 Docker Test Environment Manager

if "%1"=="start" goto start
if "%1"=="setup" goto setup
if "%1"=="test" goto test
if "%1"=="stop" goto stop
if "%1"=="reset" goto reset
if "%1"=="full" goto full
goto usage

:start
echo 🚀 Starting test database...
docker compose up db_test -d
call :wait_for_db
goto end

:setup
echo 🔧 Setting up database schema...
set DATABASE_URL=postgresql://postgres:postgres@localhost:5433/project_pulse_test
npx prisma migrate deploy
echo ✅ Database schema ready!
goto end

:test
echo 🧪 Running tests...
npm run test
goto end

:stop
echo 🧹 Stopping test database...
docker compose down db_test
goto end

:reset
echo 🔄 Resetting test environment...
docker compose down db_test -v
docker compose up db_test -d
call :wait_for_db
call :setup
goto end

:full
echo 🎯 Running full test cycle...
docker compose up db_test -d
call :wait_for_db
call :setup
call :test
call :stop
goto end

:wait_for_db
echo ⏳ Waiting for test database to be ready...
:wait_loop
docker compose exec db_test pg_isready -U postgres >nul 2>&1
if errorlevel 1 (
    echo Database is unavailable - sleeping...
    timeout /t 2 /nobreak >nul
    goto wait_loop
)
echo ✅ Test database is ready!
goto :eof

:usage
echo Usage: %0 {start^|setup^|test^|stop^|reset^|full}
echo.
echo Commands:
echo   start  - Start test database
echo   setup  - Setup database schema
echo   test   - Run tests
echo   stop   - Stop test database
echo   reset  - Reset test environment
echo   full   - Complete test cycle
exit /b 1

:end
echo ✨ Done!