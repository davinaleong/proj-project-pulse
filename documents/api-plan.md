# ✅ Project Pulse API — TODO Plan

> This document outlines the complete development and testing plan for the **API portion** of Project Pulse.  
> The API serves as the backend foundation for managing projects, tasks, notes, activities, authentication, and future AI integrations.

---

## 🏁 Phase 1: Setup & Configuration

- [x] Initialize Node.js + TypeScript project
  - [x] `npm init -y`
  - [x] Add `tsconfig.json`, `nodemon.json`
- [x] Install dependencies:
  - Runtime: `express`, `dotenv`, `zod`, `cors`, `bcrypt`, `jsonwebtoken`
  - ORM: `@prisma/client`
  - Dev: `typescript`, `ts-node`, `eslint`, `prettier`, `jest`, `ts-jest`, `supertest`, `prisma`
- [x] Setup environment files:
  - [x] `.env` (development)
  - [x] `.env.test` (testing)
- [x] Configure project structure (`src/`, `prisma/`, `tests/`)
- [x] Create:
  - [x] `src/app.ts` — Express configuration
  - [x] `src/server.ts` — Server bootstrap
  - [x] `src/config/env.ts` — Env validation via Zod
  - [x] `src/config/db.ts` — Prisma client initialization
- [x] Add middlewares:
  - [x] CORS
  - [x] JSON parsing
  - [x] Error handler
  - [x] Rate limiter
  - [x] Activity logger
- [x] Setup logging (`utils/logger.ts`) — **Basic structure exists**
- [x] Add unified response helper (`utils/response.ts`)

🧪 **Testing Tasks**

- [x] Configure Jest + ts-jest (`jest.config.js`)
- [x] Create `src/tests/setup.ts` for DB connection cleanup
- [x] Add sample test to confirm Jest works

---

## 🧱 Phase 2: Database & ORM Setup

- [x] Define models in `prisma/schema.prisma`:
  - [x] Projects
  - [x] Tasks
  - [x] Notes
  - [x] Users
  - [x] Profiles
  - [x] Activities
  - [x] Sessions
  - [x] Settings
  - [x] Password Reset Tokens
- [x] Use UUIDs as primary keys
- [x] Add relations between projects ↔ tasks ↔ notes ↔ users
- [x] Run:
  - [x] `npx prisma migrate dev`
  - [x] `npx prisma generate`
- [x] Create `prisma/seed.ts` for demo/test data

🧪 **Testing Tasks**

- [x] Write model-level unit tests (Prisma CRUD mocks) — **Sessions complete**
- [x] Validate schema relationships in tests
- [x] Test unique constraints and soft delete flags

---

## 🔐 Phase 3: Authentication & User Management

- [x] Implement `/src/modules/v1/auth/`:
  - [x] `auth.controller.ts` — login/register/logout/refresh
  - [x] `auth.service.ts` — JWT + bcrypt
  - [x] `auth.routes.ts` — endpoints
- [ ] Implement lockout logic (failed login attempts)
- [ ] Add 2FA support (`TwoFactorEnabled`, `TwoFactorSecret`)
- [x] Implement `/src/modules/v1/users/`:
  - [x] CRUD operations
  - [x] Role-based permissions
  - [x] Status flags (active, inactive, banned)
- [x] Implement `/src/modules/v1/profiles/`:
  - [x] Avatar + cover upload
  - [x] Timezone, language, theme, visibility

🧪 **Testing Tasks**

- [x] Write `auth.test.ts` — register, login, token refresh
- [x] Write `users.test.ts` — create/update/delete
- [ ] Mock JWT verification and bcrypt hashing
- [x] Add tests for role-based access (admin vs user)
- [ ] Add 2FA unit test (enable/disable flow)

---

## 🧩 Phase 4: Core Modules (CRUD)

### Projects

- [x] Implement `project.model.ts`, `controller`, `service`, `routes`
- [x] Add CRUD endpoints
- [x] Include stage enum (Planning → Maintenance)
- [ ] Calculate total cost (sum of task costs)

### Tasks

- [x] Implement `task.model.ts`, `controller`, `service`, `routes`
- [x] CRUD + filter by project_id
- [x] Status: Backlog → TODO → WIP → Done
- [ ] Calculate time spent and cost = duration × rate

### Notes

- [x] Implement `note.model.ts`, `controller`, `service`, `routes`
- [x] Link to projects/tasks
- [x] Add status (Draft, Published, Private, Public)

### Activities

- [x] Auto-log all CRUD + login/logout events
- [x] Capture IP and user agent

### Sessions

- [x] Track login sessions (IP, token, UA)
- [x] Add token revocation endpoints

### Settings

- [x] Implement key-value storage with visibility flags

### Password Reset Tokens

- [x] Implement issuance, expiry, and one-time use validation

🧪 **Testing Tasks**

- [x] Unit tests: models and services for each module — **Sessions complete, Notes complete**
- [x] Integration tests:
  - [x] Project → Task link
  - [ ] Task → Cost aggregation
  - [x] Notes → Visibility logic
- [ ] Edge cases: invalid UUIDs, missing fields, soft deletes
- [x] Add mock auth middleware for testing protected routes

---

## 🧰 Phase 5: Utilities & Middleware

- [ ] Add utilities:
  - [ ] `jwt.ts` — issue/verify tokens — **Basic structure exists**
  - [ ] `crypto.ts` — password hashing + random strings — **Placeholder only**
  - [ ] `validator.ts` — schema validation — **Placeholder only**
  - [ ] `logger.ts` — logging wrapper — **Placeholder only**
- [x] Add middlewares:
  - [x] `auth.ts` — JWT + RBAC
  - [x] `rateLimiter.ts` — brute-force guard
  - [x] `activityLogger.ts` — log context actions
  - [x] `errorHandler.ts` — global error response

🧪 **Testing Tasks**

- [ ] Middleware unit tests (mock request/response)
- [ ] Test invalid tokens, expired tokens, unauthorized access
- [ ] Test rate limit triggers

---

## 📊 Phase 6: Integration Points (API Only)

> Frontend UI (Next.js) will connect here later.  
> For now, focus on complete and stable API endpoints.

- [x] Verify RESTful routes:
  - [x] `/api/v1/projects`
  - [x] `/api/v1/tasks`
  - [x] `/api/v1/notes`
  - [x] `/api/v1/users`
  - [x] `/api/v1/settings`
  - [x] `/api/v1/sessions`
  - [x] `/api/v1/auth`
  - [x] `/api/v1/profiles`
  - [x] `/api/v1/activities`
  - [x] `/api/v1/password-resets`
- [x] Add versioned routing via `/src/modules/v1/index.ts`
- [x] Add pagination, sorting, and filtering
- [ ] Create OpenAPI (Swagger) auto-docs

🧪 **Testing Tasks**

- [x] Integration tests for API endpoints — **Sessions, Notes complete**
- [x] Mock authenticated vs unauthenticated requests
- [x] Snapshot response validation (status, schema, payload)

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

- [x] Configure Jest global setup (`tests/setup.ts`)
- [x] Folder structure:

```
tests/
├── setup.ts
├── v1/
│   ├── modules/
│   │   ├── auth.test.ts
│   │   ├── users.test.ts
│   │   ├── projects.test.ts — **Placeholder**
│   │   ├── tasks.test.ts — **Placeholder**
│   │   ├── notes.test.ts — **Complete**
│   │   ├── sessions.*.test.ts — **Complete**
│   │   └── settings.test.ts — **Placeholder**
│   ├── integration/
│   │   ├── flow.test.ts — **Placeholder**
│   │   ├── notes.test.ts — **Complete**
│   │   └── sessions.test.ts — **Complete**
│   └── e2e/
│       ├── api.test.ts — **Placeholder**
│       └── notes.test.ts — **Complete**
```

- [x] Test strategy:
- [x] Unit → individual functions/services
- [x] Integration → modules interaction
- [x] E2E → API flow (register → login → CRUD → logout)
- [x] Run all with coverage: `npm run test -- --coverage`
- [x] Add GitHub Actions CI for automated tests
- [ ] Generate coverage badge for README

---

## 🚀 Phase 9: Deployment

- [x] Containerize API with Docker
- [x] Add `docker-compose.yml` for local Postgres
- [ ] Deploy to Render / Railway / Vercel
- [ ] Configure Supabase for Auth & Vector Search (optional)
- [ ] Add CI/CD pipeline (GitHub Actions)
- [ ] Configure monitoring (Logflare / Grafana)

🧪 **Testing Tasks**

- [x] Run smoke tests post-deployment — **Docker setup complete**
- [x] Verify `.env` configuration in production
- [ ] Add API uptime checks in CI

---

## 📘 Phase 10: Documentation

- [x] Update `README.md` (setup, usage, endpoints)
- [ ] Add OpenAPI (Swagger) documentation
- [ ] Create `CONTRIBUTING.md` + coding style
- [x] Maintain `TODO.md` per sprint iteration
- [ ] Add `CHANGELOG.md` for version tracking

---

### 🧩 References

- **Modules** → [modules.md](modules.md)
- **Tech Stack** → [tech-stack.md](tech-stack.md)
- **Folder Structure** → [folder-structure.md](folder-structure.md)
