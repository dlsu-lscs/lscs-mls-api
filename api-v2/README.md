# MLS API v2 — Fastify + PostgreSQL + Drizzle ORM

Migration from Express/MySQL (v1) to Fastify/PostgreSQL with Drizzle ORM.

---

## Quick Start

```bash
cd api-v2
npm install
npm run dev        # Hot-reload development server
npm test           # Run all test suites
npm run build      # TypeScript compilation
npm start          # Production server
```

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `HOST` | Server host | `localhost` |
| `DB_URL` | PostgreSQL connection string | `postgresql://user@localhost:5432/mls_api_v2` |
| `JWT_SECRET` | JWT signing secret | `your-secret-key` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | — |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | — |
| `GOOGLE_REDIRECT_URI` | OAuth redirect URI | `http://localhost:3000/auth/google/callback` |

---

## API Routes

### Health
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check (DB connectivity) |

### Auth (`/auth`)
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/auth/google` | Exchange Google access token for JWT | No |
| GET | `/auth/google/callback` | OAuth code → token exchange | No |

### Users (`/users`)
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/users` | Create user | No |
| GET | `/users` | List all users | No |
| GET | `/users/:id` | Get user by ID | No |
| PUT | `/users/:id` | Update user | No |
| DELETE | `/users/:id` | Delete user | No |

### Courses (`/courses`)
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/courses/fetch` | Scrape & sync courses | No |
| GET | `/courses/search/:courseName` | Search courses by name | No |
| GET | `/courses/id/:id` | Get course with enrollment & timeslots | No |
| GET | `/courses/terms` | List unique terms | No |
| GET | `/courses/list` | List unique course names (alphabetical) | No |
| GET | `/courses/campuses` | List unique campuses | No |

### Selected Courses (`/users/:id/courses`)
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/users/:id/courses` | Save course (conflict detection) | **Yes** |
| GET | `/users/:id/courses` | List saved courses | **Yes** |
| DELETE | `/users/:userId/courses/:courseId` | Remove saved course | **Yes** |

### ArchersHub (Root Level)
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/campuses` | Unique campuses | No |
| GET | `/terms` | Unique terms | No |
| GET | `/courses-list` | Unique course names (alphabetical) | No |

---

## Test Suite

```bash
npm test                      # All tests (62 tests)
npm run test:user             # User module (21 tests)
npm run test:course           # Course module (7 groups)
npm run test:auth             # Auth module (7 tests)
npm run test:selected-courses # Selected Courses (24 tests)
npm run test:archershub       # ArchersHub (3 tests)
```

### Test Structure
```
testScripts/
├── run-user-tests.ts              # Aggregator
├── run-course-tests.ts            # Aggregator
├── run-auth-tests.ts              # Aggregator
├── run-selected-courses-tests.ts  # Aggregator
├── archershub.controller.test.ts  # Standalone
├── user.service.test.ts
├── user.controller.test.ts
├── auth.service.test.ts
├── auth.controller.test.ts
├── selected-course.service.test.ts
├── selected-courses.controller.test.ts
└── docu/                          # Technical documentation per test file
```

---

## Architecture

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 20+ (ESM) |
| Framework | Fastify 5 |
| Database | PostgreSQL |
| ORM | Drizzle ORM |
| Auth | JWT (jsonwebtoken) + Google OAuth 2.0 |
| Validation | Native Fastify schema / manual checks |
| Testing | Fastify `inject()` + tsx |

---

## Key Migration Notes

- **Express → Fastify**: All controllers use `FastifyRequest`/`FastifyReply`
- **axios → native `fetch`**: Google OAuth calls use standard Web API
- **MySQL → PostgreSQL**: Schema uses `pg.Pool` + Drizzle
- **Auth Middleware**: `Authorization: Bearer <jwt>` → attaches `req.user`
- **Conflict Detection**: Selected Courses checks day/time overlaps before saving

---

## Project Structure

```
api-v2/
├── src/
│   ├── index.ts                    # App entry point
│   ├── db/
│   │   ├── index.ts                # Drizzle + pg.Pool
│   │   └── schema/                 # Table definitions
│   ├── services/                   # Business logic
│   │   ├── user.service.ts
│   │   ├── auth.service.ts
│   │   ├── course.service.ts
│   │   ├── selected-course.service.ts
│   │   └── archershub.service.ts
│   ├── controller/                 # HTTP handlers
│   ├── routes/                     # Route registration
│   ├── middlewares/
│   │   └── auth.middleware.ts
│   └── dtos/                       # Data transfer objects
├── testScripts/                    # Automated tests
└── package.json
```

---

## Development

```bash
# Watch mode (hot reload)
npm run dev

# Type checking
npx tsc --noEmit

# Database schema changes
npx drizzle-kit generate
npx drizzle-kit migrate
```

---

## Status

**100% Complete** — Migration complete with all modules, error handling, and full test coverage.

| Module | Status |
|--------|--------|
| Database Schemas | ✅ 100% |
| User Module | ✅ 100% |
| Auth Module | ✅ 100% |
| Course Module | ✅ 100% |
| Selected Courses | ✅ 100% |
| ArchersHub | ✅ 100% |
| Auth Middleware | ✅ 100% |
| Error Middleware | ✅ 100% |
| DTO Audit | ✅ 100% |

See `CHECKLIST.md` for detailed task tracking.
