#!/bin/bash

# Test setup script for Docker
set -e

echo "🐳 Starting Docker test environment..."

# Function to wait for database
wait_for_db() {
    echo "⏳ Waiting for test database to be ready..."
    until docker compose exec db_test pg_isready -U postgres > /dev/null 2>&1; do
        echo "Database is unavailable - sleeping..."
        sleep 2
    done
    echo "✅ Test database is ready!"
}

# Function to setup database schema
setup_schema() {
    echo "🔧 Setting up database schema..."
    DATABASE_URL="postgresql://postgres:postgres@localhost:5433/project_pulse_test" npx prisma migrate deploy
    echo "✅ Database schema ready!"
}

# Function to run tests
run_tests() {
    echo "🧪 Running tests..."
    npm run test
}

# Function to cleanup
cleanup() {
    echo "🧹 Cleaning up..."
    docker compose down db_test
}

# Main execution
case "$1" in
    "start")
        echo "🚀 Starting test database..."
        docker compose up db_test -d
        wait_for_db
        ;;
    "setup")
        setup_schema
        ;;
    "test")
        run_tests
        ;;
    "stop")
        cleanup
        ;;
    "reset")
        echo "🔄 Resetting test environment..."
        docker compose down db_test -v
        docker compose up db_test -d
        wait_for_db
        setup_schema
        ;;
    "full")
        echo "🎯 Running full test cycle..."
        docker compose up db_test -d
        wait_for_db
        setup_schema
        run_tests
        cleanup
        ;;
    *)
        echo "Usage: $0 {start|setup|test|stop|reset|full}"
        echo ""
        echo "Commands:"
        echo "  start  - Start test database"
        echo "  setup  - Setup database schema"
        echo "  test   - Run tests"
        echo "  stop   - Stop test database"
        echo "  reset  - Reset test environment"
        echo "  full   - Complete test cycle"
        exit 1
        ;;
esac

echo "✨ Done!"