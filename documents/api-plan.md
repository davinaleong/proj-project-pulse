# ✅ Project Pulse API — TODO Plan

> This document outlines the complete development and testing plan for the **API portion** of Project Pulse.  
> The API serves as the backend foundation for managing projects, tasks, notes, activities, authentication, and future AI integrations.

---

## 🏁 Phase 1: Setup & Configuration

- [ ] Initialize Node.js + TypeScript project
  - [ ] `npm init -y`
  - [ ] Add `tsconfig.json`, `nodemon.json`
- [ ] Install dependencies:
  - Runtime: `express`, `dotenv`, `zod`, `cors`, `bcrypt`, `jsonwebtoken`
  - ORM: `@prisma/client`
  - Dev: `typescript`, `ts-node`, `eslint`, `prettier`, `jest`, `ts-jest`, `supertest`, `prisma`
- [ ] Setup environment files:
  - [ ] `.env` (development)
  - [ ] `.env.test` (testing)
- [ ] Configure project structure (`src/`, `prisma/`, `tests/`)
- [ ] Create:
  - [ ] `src/app.ts` — Express configuration
  - [ ] `src/server.ts` — Server bootstrap
  - [ ] `src/config/env.ts` — Env validation via Zod
  - [ ] `src/config/db.ts` — Prisma client initialization
- [ ] Add middlewares:
  - [ ] CORS
  - [ ] JSON parsing
  - [ ] Error handler
  - [ ] Rate limiter
  - [ ] Activity logger
- [ ] Setup logging (`utils/logger.ts`)
- [ ] Add unified response helper (`utils/response.ts`)

🧪 **Testing Tasks**

- [ ] Configure Jest + ts-jest (`jest.config.js`)
- [ ] Create `src/tests/setup.ts` for DB connection cleanup
- [ ] Add sample test to confirm Jest works

---

## 🧱 Phase 2: Database & ORM Setup

- [ ] Define models in `prisma/schema.prisma`:
  - [ ] Projects
  - [ ] Tasks
  - [ ] Notes
  - [ ] Users
  - [ ] Profiles
  - [ ] Activities
  - [ ] Sessions
  - [ ] Settings
  - [ ] Password Reset Tokens
- [ ] Use UUIDs as primary keys
- [ ] Add relations between projects ↔ tasks ↔ notes ↔ users
- [ ] Run:
  - [ ] `npx prisma migrate dev`
  - [ ] `npx prisma generate`
- [ ] Create `prisma/seed.ts` for demo/test data

🧪 **Testing Tasks**

- [ ] Write model-level unit tests (Prisma CRUD mocks)
- [ ] Validate schema relationships in tests
- [ ] Test unique constraints and soft delete flags

---

## 🔐 Phase 3: Authentication & User Management

- [ ] Implement `/src/modules/v1/auth/`:
  - [ ] `auth.controller.ts` — login/register/logout/refresh
  - [ ] `auth.service.ts` — JWT + bcrypt
  - [ ] `auth.routes.ts` — endpoints
- [ ] Implement lockout logic (failed login attempts)
- [ ] Add 2FA support (`TwoFactorEnabled`, `TwoFactorSecret`)
- [ ] Implement `/src/modules/v1/users/`:
  - [ ] CRUD operations
  - [ ] Role-based permissions
  - [ ] Status flags (active, inactive, banned)
- [ ] Implement `/src/modules/v1/profiles/`:
  - [ ] Avatar + cover upload
  - [ ] Timezone, language, theme, visibility

🧪 **Testing Tasks**

- [ ] Write `auth.test.ts` — register, login, token refresh
- [ ] Write `users.test.ts` — create/update/delete
- [ ] Mock JWT verification and bcrypt hashing
- [ ] Add tests for role-based access (admin vs user)
- [ ] Add 2FA unit test (enable/disable flow)

---

## 🧩 Phase 4: Core Modules (CRUD)

### Projects

- [ ] Implement `project.model.ts`, `controller`, `service`, `routes`
- [ ] Add CRUD endpoints
- [ ] Include stage enum (Planning → Maintenance)
- [ ] Calculate total cost (sum of task costs)

### Tasks

- [ ] Implement `task.model.ts`, `controller`, `service`, `routes`
- [ ] CRUD + filter by project_id
- [ ] Status: Backlog → TODO → WIP → Done
- [ ] Calculate time spent and cost = duration × rate

### Notes

- [ ] Implement `note.model.ts`, `controller`, `service`, `routes`
- [ ] Link to projects/tasks
- [ ] Add status (Draft, Published, Private, Public)

### Activities

- [ ] Auto-log all CRUD + login/logout events
- [ ] Capture IP and user agent

### Sessions

- [ ] Track login sessions (IP, token, UA)
- [ ] Add token revocation endpoints

### Settings

- [ ] Implement key-value storage with visibility flags

### Password Reset Tokens

- [ ] Implement issuance, expiry, and one-time use validation

🧪 **Testing Tasks**

- [ ] Unit tests: models and services for each module
- [ ] Integration tests:
  - Project → Task link
  - Task → Cost aggregation
  - Notes → Visibility logic
- [ ] Edge cases: invalid UUIDs, missing fields, soft deletes
- [ ] Add mock auth middleware for testing protected routes

---

## 🧰 Phase 5: Utilities & Middleware

- [ ] Add utilities:
  - [ ] `jwt.ts` — issue/verify tokens
  - [ ] `crypto.ts` — password hashing + random strings
  - [ ] `validator.ts` — schema validation
  - [ ] `logger.ts` — logging wrapper
- [ ] Add middlewares:
  - [ ] `auth.ts` — JWT + RBAC
  - [ ] `rateLimiter.ts` — brute-force guard
  - [ ] `activityLogger.ts` — log context actions
  - [ ] `errorHandler.ts` — global error response

🧪 **Testing Tasks**

- [ ] Middleware unit tests (mock request/response)
- [ ] Test invalid tokens, expired tokens, unauthorized access
- [ ] Test rate limit triggers

---

## 📊 Phase 6: Integration Points (API Only)

> Frontend UI (Next.js) will connect here later.  
> For now, focus on complete and stable API endpoints.

- [ ] Verify RESTful routes:
  - `/api/v1/projects`
  - `/api/v1/tasks`
  - `/api/v1/notes`
  - `/api/v1/users`
  - `/api/v1/settings`
- [ ] Add versioned routing via `/src/modules/v1/index.ts`
- [ ] Add pagination, sorting, and filtering
- [ ] Create OpenAPI (Swagger) auto-docs

🧪 **Testing Tasks**

- [ ] Integration tests for API endpoints
- [ ] Mock authenticated vs unauthenticated requests
- [ ] Snapshot response validation (status, schema, payload)

---

## 🤖 Phase 7: AI & Analytics (Future API Extensions)

- [ ] Create endpoint for exporting project/task data (JSON/CSV)
- [ ] Develop Python-based ML pipeline (external)
  - Predict trends, overruns, and anomalies
- [ ] Build `/api/v1/ai/` routes for chatbot queries
- [ ] Integrate LangChain or LlamaIndex
- [ ] Use OpenAI GPT-4o-mini or Mistral with vector storage (Supabase Vector / SQLite)

🧪 **Testing Tasks**

- [ ] Mock AI responses for reproducibility
- [ ] Validate SQL-like queries generated by chatbot
- [ ] Unit test embedding and retrieval pipeline

---

## 🧪 Phase 8: Testing Framework (Comprehensive)

- [ ] Configure Jest global setup (`tests/setup.ts`)
- [ ] Folder structure:

```

src/tests/
├── setup.ts
├── utils/testHelpers.ts
├── modules/
│   ├── auth.test.ts
│   ├── users.test.ts
│   ├── projects.test.ts
│   ├── tasks.test.ts
│   ├── notes.test.ts
│   ├── settings.test.ts
├── integration/flow.test.ts
└── e2e/api.test.ts

```

- [ ] Test strategy:
- Unit → individual functions/services
- Integration → modules interaction
- E2E → API flow (register → login → CRUD → logout)
- [ ] Run all with coverage: `npm run test -- --coverage`
- [ ] Add GitHub Actions CI for automated tests
- [ ] Generate coverage badge for README

---

## 🚀 Phase 9: Deployment

- [ ] Containerize API with Docker
- [ ] Add `docker-compose.yml` for local Postgres
- [ ] Deploy to Render / Railway / Vercel
- [ ] Configure Supabase for Auth & Vector Search (optional)
- [ ] Add CI/CD pipeline (GitHub Actions)
- [ ] Configure monitoring (Logflare / Grafana)

🧪 **Testing Tasks**

- [ ] Run smoke tests post-deployment
- [ ] Verify `.env` configuration in production
- [ ] Add API uptime checks in CI

---

## 📘 Phase 10: Documentation

- [ ] Update `README.md` (setup, usage, endpoints)
- [ ] Add OpenAPI (Swagger) documentation
- [ ] Create `CONTRIBUTING.md` + coding style
- [ ] Maintain `TODO.md` per sprint iteration
- [ ] Add `CHANGELOG.md` for version tracking

---

### 🧩 References

- **Modules** → [modules.md](modules.md)
- **Tech Stack** → [tech-stack.md](tech-stack.md)
- **Folder Structure** → [folder-structure.md](folder-structure.md)
