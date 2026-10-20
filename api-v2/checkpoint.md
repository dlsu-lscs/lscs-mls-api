# Tech Migration Checkpoint - api-v2
**Updated**: 2026-10-19  
**Branch**: `feature/42-tech-migration`  
**Status**: ACTIVE — Auth, User & Course Modules Fully Migrated (~85% Complete)

---

## 📋 Executive Summary

The migration from Express/MySQL (v1, `src/`) to Fastify/PostgreSQL with Drizzle ORM (v2, `api-v2/`) has successfully cleared its three largest and most complex domains: **Auth**, **Users**, and **Courses**. All three have their full vertical stack (schema, DTOs, services, controllers, and routes) implemented, integrated into `index.ts`, and the User/Course modules are backed by comprehensive automated test suites.

---

## ✅ Completed Modules

### 1. Database Layer (100%)
*   **Engine**: PostgreSQL via `pg.Pool` + Drizzle ORM
*   **Schemas** (`src/db/schema/`):
    *   `users.ts` — User identity, unique constraints, identity column primary keys
    *   `courses.ts` — Course metadata (name, section, term, campus, modality)
    *   `course_enrollments.ts` — Capacity and enrolled counts, cascading foreign keys to `courses.cid`
    *   `course_timeslots.ts` — Room, day, time, instructor schedules linked to `courses.cid`
    *   `selected-courses.ts` — Pivot table tracking user saved courses with cascade deletes

### 2. User Module (100%)
*   **Service** (`src/services/user.service.ts`):
    *   `createUser` (with unique `userId` conflict check)
    *   `getAllUsers`
    *   `getUserById`
    *   `getUserByUserId`
    *   `updateUser` (partial updates preserving untouched fields)
    *   `deleteUser` (returning deletion boolean based on `rowCount`)
*   **Controller** (`src/controller/user.controller.ts`): Fastify async reply handlers with defensive validation (invalid IDs, empty payloads, duplicate handling).
*   **Routes** (`src/routes/user.routes.ts`): Registered under `/users` in `index.ts`.
*   **DTOs** (`src/dtos/user.dto.ts`): `mapToUserDTO` handles both Drizzle camelCase properties and legacy raw SQL snake_case fallbacks.
*   **Testing**: Automated suite in `testScripts/run-user-tests.ts` validating service logic and controller HTTP injection.

### 3. Auth Module (100%)
*   **Service** (`src/services/auth.service.ts`): `googleAuth2` — Google userinfo exchange via native `fetch` (replacing `axios`), user upsert through `user.service.ts`, and JWT signing (`14d` expiry) matching v1 payload.
*   **Controller** (`src/controller/auth.controller.ts`): Fastify handlers for `POST /auth/google` and `GET /auth/google/callback`, with the OAuth code→token exchange also migrated to native `fetch`.
*   **Routes** (`src/routes/auth.routes.ts`): Registered under `/auth` in `index.ts`.
*   **Middleware** (`src/middlewares/auth.middleware.ts`): Fastify pre-handler that inspects `Authorization: Bearer <jwt>`, verifies against `JWT_SECRET`, and attaches decoded claims to `request.user` (declared via Fastify module augmentation). Returns 401 on missing/invalid token.

### 4. Course Module (100%)
*   **Service** (`src/services/course.service.ts`):
    *   `createCourse` — Transactional insert across courses, enrollments, and timeslots
    *   `updateCourse` — Full reconciliation diffing existing vs incoming timeslots (insert/update/delete)
    *   `getCourseById` — Relational joins returning nested `CourseInformation`
    *   `getAllCoursesByCourseName` — Pattern matching via Drizzle `like()`
    *   `getInstructorsByCourseName` — Distinct instructor lookups
    *   `getUniqueTerms` & `getUniqueCampuses` — Distinct non-empty filtering
    *   `getCourseList` — Alphabetically sorted distinct course titles
    *   `deleteCourse` & `deleteCourseByCourseName` — Cascading deletes
    *   `fetchCourses` — Integration with scraper utilities using dynamic imports
*   **Controller** (`src/controller/course.controller.ts`): Fastify endpoints with error mapping for scraper exceptions (`Parsing error`, `Login`, etc.).
*   **Routes** (`src/routes/course.routes.ts`): Registered under `/courses` in `index.ts`:
    *   `POST /courses/fetch`
    *   `GET /courses/search/:courseName`
    *   `GET /courses/id/:id`
    *   `GET /courses/terms`
    *   `GET /courses/list`
    *   `GET /courses/campuses`
*   **Testing**: Full database lifecycle test in `testScripts/run-course-tests.ts`.

### 5. Test Infrastructure
*   Consolidated test runner configured in `package.json` (`npm test`) executing:
    *   `testScripts/run-user-tests.ts`
    *   `testScripts/run-course-tests.ts`
*   Guaranteed automated table teardown and setup before and after execution to prevent dirty test data.

---

## ❌ Remaining Work (Priority Order)

### 1. Selected Courses Module
*   **Files to Create**:
    *   `api-v2/src/services/selected-course.service.ts`
    *   `api-v2/src/controller/selected-courses.controller.ts`
    *   `api-v2/src/routes/selected-courses.routes.ts`
*   **Scope**:
    *   `POST /users/courses` — Complex scheduling conflict detection across day and time overlaps
    *   `GET /users/:id/courses` — Retrieve joined course, timeslot, and enrollment details
    *   `DELETE /users/:userId/courses/:courseId` — Remove saved course relations
    *   Register under `/users` prefix or separate `/selected-courses` route

### 2. ArchersHub Module
*   **Files to Create**:
    *   `api-v2/src/services/archershub.service.ts`
    *   `api-v2/src/controller/archershub.controller.ts`
    *   `api-v2/src/routes/archershub.routes.ts`
*   **Scope**:
    *   Expose root-level quick access routes: `GET /campuses`, `GET /terms`, `GET /courses/list`
    *   Reuse or bridge existing course service operations

### 3. Middleware & Infrastructure
*   **Error Middleware** (`src/middlewares/error.middleware.ts`): Centralized Fastify error handler for consistent status codes and payload envelopes.
*   **DTO Audit**: Update remaining DTO files (`course.dto.ts`, `course-enrollment.dto.ts`, `course-timeslot.dto.ts`) in `api-v2/src/dtos/` to explicitly type infer from Drizzle schemas where beneficial.

---

## 📊 Detailed Progress Matrix

| Module / Component | Service | Controller | Routes | Tests | Overall Status |
|--------------------|:-------:|:----------:|:------:|:-----:|:--------------:|
| **Database Schemas** | — | — | — | ✅ | 100% |
| **User Module** | ✅ | ✅ | ✅ | ✅ | 100% |
| **Course Module** | ✅ | ✅ | ✅ | ✅ | 100% |
| **Auth Module** | ✅ | ✅ | ✅ | ❌ | 100% |
| **Selected Courses** | ❌ | ❌ | ❌ | ❌ | 0% |
| **ArchersHub** | ❌ | ❌ | ❌ | ❌ | 0% |
| **Middleware** | — | — | ✅ | ❌ | ~50% |
| **TOTAL COMPLETION** | | | | | **~85%** |

---

## 🚀 Recommended Immediate Next Step

Begin **Selected Courses Module Migration**:
1. Port `src/services/selected-course.service.ts` to `api-v2/src/services/selected-course.service.ts`, including the scheduling conflict detection across day/time overlaps.
2. Port `src/controllers/selected-courses.controller.ts` to Fastify conventions.
3. Expose routes in `api-v2/src/routes/selected-courses.routes.ts` and register in `index.ts`.
