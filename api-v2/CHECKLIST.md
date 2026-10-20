# API v2 Migration Checklist

**Branch**: `feature/42-tech-migration`  
**Status**: **~95% Complete** — All Major Modules Migrated  
**Last Updated**: 2026-10-21

---

## ✅ COMPLETED MODULES

### 1. Database Layer (100%)
- [x] PostgreSQL + Drizzle ORM setup
- [x] Schema: `users.ts`
- [x] Schema: `courses.ts`
- [x] Schema: `course_enrollments.ts`
- [x] Schema: `course_timeslots.ts`
- [x] Schema: `selected-courses.ts`

### 2. User Module (100%)
- [x] Service: `user.service.ts` (CRUD + conflict checks)
- [x] Controller: `user.controller.ts` (Fastify handlers)
- [x] Routes: `user.routes.ts` (`/users`)
- [x] DTO: `user.dto.ts` (camelCase + snake_case fallback)
- [x] Tests: `run-user-tests.ts` (21 tests passing)

### 3. Auth Module (100%)
- [x] Service: `auth.service.ts` (Google OAuth + native `fetch`)
- [x] Controller: `auth.controller.ts` (2 endpoints)
- [x] Routes: `auth.routes.ts` (`/auth`)
- [x] Middleware: `auth.middleware.ts` (Bearer JWT validation)
- [x] Tests: `run-auth-tests.ts` (7 tests passing)

### 4. Course Module (100%)
- [x] Service: `course.service.ts` (8 methods incl. transactional create/update)
- [x] Controller: `course.controller.ts` (6 endpoints)
- [x] Routes: `course.routes.ts` (`/courses`)
- [x] Tests: `run-course-tests.ts` (7 test groups passing)

### 5. Selected Courses Module (100%)
- [x] Service: `selected-course.service.ts` (CRUD + **conflict detection**)
- [x] Controller: `selected-courses.controller.ts` (3 endpoints)
- [x] Routes: `selected-courses.routes.ts` (`/users/:id/courses`)
- [x] Tests: `run-selected-courses-tests.ts` (24 tests passing)

### 6. ArchersHub Module (100%)
- [x] Service: `archershub.service.ts` (bridges course service)
- [x] Controller: `archershub.controller.ts` (3 endpoints)
- [x] Routes: `archershub.routes.ts` (root level)
- [x] Tests: `archershub.controller.test.ts` (3 tests passing)

### 7. Test Infrastructure (100%)
- [x] `run-user-tests.ts`
- [x] `run-course-tests.ts`
- [x] `run-auth-tests.ts`
- [x] `run-selected-courses-tests.ts`
- [x] Documentation: `testScripts/docu/*.md`

---

## ⏳ REMAINING WORK (~5%)

### Priority 1: Error Middleware
- [ ] Create `api-v2/src/middlewares/error.middleware.ts`
  - [ ] Centralized Fastify error handler
  - [ ] Consistent status codes & payload envelopes
  - [ ] Map known errors (validation, not found, conflict) to proper HTTP codes

### Priority 2: DTO Audit & Refinement
- [ ] `course.dto.ts` — Add explicit Drizzle schema type inference
- [ ] `course-enrollment.dto.ts` — Add explicit Drizzle schema type inference
- [ ] `course-timeslot.dto.ts` — Add explicit Drizzle schema type inference
- [ ] `selected-course.dto.ts` — Verify completeness

### Priority 3: Route Protection (Optional)
- [ ] Apply `authMiddleware` to Course routes where appropriate
- [ ] Apply `authMiddleware` to User routes where appropriate

### Priority 4: Package.json Test Script
- [ ] Add `run-selected-courses-tests.ts` to `npm test` script
- [ ] Add `archershub.controller.test.ts` to `npm test` script

---

## 📊 QUICK STATUS

| Area | Status |
|------|--------|
| Database Schemas | ✅ 100% |
| User Module | ✅ 100% |
| Auth Module | ✅ 100% |
| Course Module | ✅ 100% |
| Selected Courses | ✅ 100% |
| ArchersHub | ✅ 100% |
| Auth Middleware | ✅ 100% |
| Error Middleware | ⏳ 0% |
| DTO Audit | ⏳ 0% |
| Test Coverage | ✅ All modules covered |
| **TOTAL** | **~95%** |

---

## 🚀 NEXT ACTIONS

1. **Create `error.middleware.ts`** — Highest impact for production readiness
2. **Refine DTOs** — Type safety improvement
3. **Update `npm test`** — Include all test suites
4. **Optional: Protect Course/User routes** — Security hardening