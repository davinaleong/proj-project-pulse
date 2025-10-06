# Folder Structure

```
project-pulse-api/
├── prisma/
│   ├── schema.prisma           # Prisma schema (models + relations)
│   ├── migrations/             # Auto-created by Prisma migrate
│   └── seed.ts                 # Optional: seed demo data
│
├── src/
│   ├── app.ts                  # Express app config
│   ├── server.ts               # Server bootstrap (entry point)
│   │
│   ├── config/                 # Environment & database setup
│   │   ├── db.ts               # Prisma client instance
│   │   └── env.ts              # Env variables validation (dotenv + Zod)
│   │
│   ├── middlewares/            # Global middlewares
│   │   ├── auth.ts             # JWT verification, role-based guards
│   │   ├── errorHandler.ts     # Centralized error handling
│   │   ├── rateLimiter.ts      # API rate limiting
│   │   └── activityLogger.ts   # Logs user actions into Activities module
│   │
│   ├── utils/                  # Reusable helpers
│   │   ├── response.ts         # Unified API response structure
│   │   ├── logger.ts           # Winston/Pino logger
│   │   ├── validator.ts        # Zod validation wrapper
│   │   ├── jwt.ts              # JWT issue/verify helpers
│   │   └── crypto.ts           # bcrypt hashing, token generation, etc.
│   │
│   ├── modules/                # Versioned API modules
│   │   └── v1/
│   │       ├── index.ts        # Aggregates and mounts all v1 routers
│   │       │
│   │       ├── auth/           # Authentication & security endpoints
│   │       │   ├── auth.controller.ts
│   │       │   ├── auth.routes.ts
│   │       │   ├── auth.service.ts
│   │       │   └── auth.types.ts
│   │       │
│   │       ├── users/
│   │       │   ├── user.model.ts
│   │       │   ├── user.controller.ts
│   │       │   ├── user.service.ts
│   │       │   └── user.routes.ts
│   │       │
│   │       ├── profiles/
│   │       │   ├── profile.model.ts
│   │       │   ├── profile.controller.ts
│   │       │   ├── profile.service.ts
│   │       │   └── profile.routes.ts
│   │       │
│   │       ├── projects/
│   │       │   ├── project.model.ts
│   │       │   ├── project.controller.ts
│   │       │   ├── project.service.ts
│   │       │   └── project.routes.ts
│   │       │
│   │       ├── tasks/
│   │       │   ├── task.model.ts
│   │       │   ├── task.controller.ts
│   │       │   ├── task.service.ts
│   │       │   └── task.routes.ts
│   │       │
│   │       ├── notes/
│   │       │   ├── note.model.ts
│   │       │   ├── note.controller.ts
│   │       │   ├── note.service.ts
│   │       │   └── note.routes.ts
│   │       │
│   │       ├── activities/
│   │       │   ├── activity.model.ts
│   │       │   ├── activity.controller.ts
│   │       │   ├── activity.service.ts
│   │       │   └── activity.routes.ts
│   │       │
│   │       ├── sessions/
│   │       │   ├── session.model.ts
│   │       │   ├── session.controller.ts
│   │       │   ├── session.service.ts
│   │       │   └── session.routes.ts
│   │       │
│   │       ├── settings/
│   │       │   ├── setting.model.ts
│   │       │   ├── setting.controller.ts
│   │       │   ├── setting.service.ts
│   │       │   └── setting.routes.ts
│   │       │
│   │       └── password-resets/
│   │           ├── passwordReset.model.ts
│   │           ├── passwordReset.controller.ts
│   │           ├── passwordReset.service.ts
│   │           └── passwordReset.routes.ts
│   │
│   ├── types/                   # Global types and interfaces
│   │   ├── express.d.ts         # Express Request/Response typing extensions
│   │   └── index.d.ts
│   │
│   └── tests/                   # ✅ Test directory colocated in src for simplicity
│       ├── setup.ts             # Global Jest setup (DB connect/cleanup)
│       ├── utils/
│       │   └── testHelpers.ts   # Seed/test helper functions
│       ├── modules/
│       │   ├── users.test.ts
│       │   ├── auth.test.ts
│       │   ├── projects.test.ts
│       │   └── tasks.test.ts
│       ├── integration/
│       │   └── flow.test.ts     # E2E test (register → login → CRUD)
│       └── e2e/
│           └── api.test.ts
│
├── .env                         # Dev environment
├── .env.test                    # Isolated testing environment
├── jest.config.js               # Jest + ts-jest config
├── tsconfig.json                # TypeScript config
├── nodemon.json                 # Hot-reload config for dev
├── package.json
├── README.md
└── coverage/                    # Jest code coverage output

```
