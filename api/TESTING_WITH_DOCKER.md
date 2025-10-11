# Testing with Docker Guide

## 🚀 Quick Start

### 1. Start the Test Database

```bash
# Start only the test database
docker compose up db_test -d

# Or start both dev and test databases
docker compose up db db_test -d
```

### 2. Run Tests

```bash
# Run tests locally against Docker test DB
npm run test

# Or run tests inside a Docker container
docker compose run --rm test
```

## 🐳 Docker Testing Setup

### Current Configuration

You have a great Docker setup already:

- **Development DB**: PostgreSQL on port 5432
- **Test DB**: PostgreSQL on port 5433
- **API Container**: Node.js application

### Test Database Connection

Your test database is configured to run on `localhost:5433`. Update your test environment:

```bash
# .env.test
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/project_pulse_test"
```

## 🔧 Enhanced Docker Commands

### Start Test Environment

```bash
# Start test database only
docker compose up db_test -d

# Check if test DB is ready
docker compose exec db_test pg_isready -U postgres

# View test database logs
docker compose logs db_test
```

### Run Database Migrations for Tests

```bash
# Generate Prisma client
npx prisma generate

# Push schema to test database
npx prisma db push --force-reset
# OR run migrations
npx prisma migrate deploy
```

### Run Tests

```bash
# Run all tests
npm run test

# Run only users module tests
npm run test -- --testPathPattern=users.test.ts

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Clean Up

```bash
# Stop test database
docker compose down db_test

# Remove test database and volumes
docker compose down db_test -v

# Clean up everything
docker compose down -v
```

## 🔨 Test Workflow

### 1. Database Setup

```bash
# Start test database
docker compose up db_test -d

# Wait for database to be ready
until docker compose exec db_test pg_isready -U postgres; do
  echo "Waiting for test database..."
  sleep 2
done
```

### 2. Schema Setup

```bash
# Apply migrations to test database
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/project_pulse_test" npx prisma migrate deploy

# Or force reset and push schema
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/project_pulse_test" npx prisma db push --force-reset
```

### 3. Run Tests

```bash
# Run tests with proper environment
NODE_ENV=test npm run test
```

## 🛠 Advanced Testing

### Run Tests in Docker Container

```yaml
# Add this service to docker-compose.yml
test:
  build: .
  container_name: pulse_test
  environment:
    NODE_ENV: test
    DATABASE_URL: postgresql://postgres:postgres@db_test:5432/project_pulse_test
    JWT_SECRET: test-jwt-secret-key-for-testing-only
  depends_on:
    - db_test
  volumes:
    - .:/app
    - /app/node_modules
  command: sh -c "npx prisma migrate deploy && npm run test"
```

Then run:

```bash
docker compose run --rm test
```

### CI/CD Pipeline Testing

```bash
# One-liner for CI
docker compose up db_test -d && \
sleep 5 && \
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/project_pulse_test" npx prisma migrate deploy && \
npm run test && \
docker compose down
```

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check if test database is running
docker compose ps db_test

# Test database connection
docker compose exec db_test psql -U postgres -d project_pulse_test -c "SELECT 1;"

# Check database logs
docker compose logs db_test
```

### Port Conflicts

```bash
# Check what's running on port 5433
netstat -an | findstr 5433
# or on macOS/Linux: lsof -i :5433

# Kill process if needed
# Windows: taskkill /F /PID <pid>
# macOS/Linux: kill -9 <pid>
```

### Test Data Cleanup

```bash
# Reset test database completely
docker compose down db_test -v
docker compose up db_test -d
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/project_pulse_test" npx prisma migrate deploy
```

## 📊 Test Scripts

Add these to your `package.json`:

```json
{
  "scripts": {
    "test:docker:start": "docker compose up db_test -d",
    "test:docker:stop": "docker compose down db_test",
    "test:docker:reset": "docker compose down db_test -v && docker compose up db_test -d",
    "test:setup": "DATABASE_URL=\"postgresql://postgres:postgres@localhost:5433/project_pulse_test\" npx prisma migrate deploy",
    "test:docker": "npm run test:docker:start && npm run test:setup && npm run test && npm run test:docker:stop",
    "test:ci": "docker compose up db_test -d && sleep 5 && npm run test:setup && npm run test"
  }
}
```

## 🎯 Best Practices

1. **Isolated Test Database**: Always use a separate database for tests
2. **Clean State**: Reset database before each test run
3. **Environment Variables**: Use proper test environment configuration
4. **Parallel Tests**: Be careful with database state when running tests in parallel
5. **CI/CD Ready**: Scripts should work in automated environments

## 🔄 Complete Test Workflow

```bash
# 1. Start test environment
npm run test:docker:start

# 2. Setup database schema
npm run test:setup

# 3. Run tests
npm run test

# 4. Cleanup (optional)
npm run test:docker:stop
```
