# Migration Checklist - api-v2

## Overview
- **Source**: `src/` (Express/MySQL)
- **Target**: `api-v2/src/` (Fastify/PostgreSQL + Drizzle ORM)
- **Status**: Partial migration in progress

---

## 1️⃣ ROUTES TO MIGRATE

### User Routes (`api-v2/src/routes/user.routes.ts`)
- [ ] Create route file
  - `POST /users` → createUser
  - `GET /users` → getAllUsers
  - `GET /users/:id` → getUserById
  - `PUT /users/:id` → updateUser
  - `DELETE /users/:id` → deleteUser

### Course Routes (`api-v2/src/routes/course.routes.ts`)
- [ ] Expand existing routes file (currently only `/campuses`)
  - `POST /courses/fetch` → fetchCourses
  - `GET /courses/search/:courseName` → getAllCoursesByCourseName
  - `GET /courses/id/:id` → getCourseById
  - `GET /courses/terms` → getTerms
  - `GET /courses/list` → getCourseList

### Auth Routes (`api-v2/src/routes/auth.routes.ts`)
- [ ] Create route file
  - `POST /auth/google` → handleAuthentication
  - `GET /auth/google/callback` → handleCallback

### ArchersHub Routes (`api-v2/src/routes/archershub.routes.ts`)
- [ ] Create route file
  - `GET /campuses` → getCampuses (Fastify style)
  - `GET /terms` → getTerms
  - `GET /courses/list` → getCourseList

### Selected Courses Routes (`api-v2/src/routes/selected-courses.routes.ts`)
- [ ] Create route file (currently in user.routes.ts)
  - `POST /users/courses` → createSelectedCourse
  - `GET /users/:id/courses` → getAllUserSelectedCourse
  - `DELETE /users/:userId/courses/:courseId` → deleteSelectedCourse

---

## 2️⃣ CONTROLLERS TO MIGRATE

### User Controller (`api-v2/src/controller/user.controller.ts`)
- [ ] Migrate functions from `controllers/user.controller.ts`
  - `createUser`
  - `getUserById`
  - `deleteUser`
  - `getAllUsers`
  - `updateUser`

### Selected Courses Controller (`api-v2/src/controller/selected-courses.controller.ts`)
- [ ] Migrate functions from `controllers/selected-courses.controller.ts`
  - `createSelectedCourse`
  - `getAllUserSelectedCourse`
  - `deleteSelectedCourse`

### Course Controller (`api-v2/src/controller/course.controller.ts`)
- [ ] Migrate functions from `controllers/course.controller.ts`
  - `fetchCourses`
  - `getCourseById`
  - `getAllCoursesByCourseName`
  - `getCampuses`
  - `getTerms`
  - `getCourseList`

### Auth Controller (`api-v2/src/controller/auth.controller.ts`)
- [ ] Migrate functions from `controllers/auth.controller.ts`
  - `handleAuthentication`
  - `handleCallback`

---

## 3️⃣ SERVICES TO MIGRATE

### User Service (`api-v2/src/service/user.service.ts`)
- [ ] Migrate functions from `services/user.service.ts`
  - [ ] `getUserByUserId` (helper)
  - [ ] `createUser`
  - [ ] `getAllUsers`
  - [ ] `getUserById`
  - [ ] `updateUser`
  - [ ] `deleteUser`
- [ ] Update database connectivity from MySQL to PostgreSQL/Drizzle
- [ ] Fix DTO mapping (uid → uid, use Drizzle ORM)

### Selected Course Service (`api-v2/src/service/selected-course.service.ts`)
- [ ] Migrate functions from `services/selected-course.service.ts`
  - `getAllUserSelectedCourse`
  - `deleteSelectedCourse`
- [ ] Keep `createSelectedCourse` (complex logic - check scheduling conflicts)
- [ ] Update database connectivity from MySQL to PostgreSQL/Drizzle
- [ ] Update imports for dependencies

### Course Service (`api-v2/src/service/course.service.ts`)
- [ ] Migrate functions from `services/course.service.ts`
  - [ ] `updateCourse`
  - [ ] `deleteCourse`
  - [ ] `deleteCourseByCourseName`
  - [ ] `getInstructorsByCourseName`
  - [x] ~~`getUniqueCampuses`~~ `commit #20ff2122`
  - [x] ~~`getUniqueTerms`~~ `commit #730e6666`
  - [x] ~~`getCourseList`~~ `commit #6a29423f`
- [ ] Keep `fetchCourses`, 
- [x] ~~`createCourse`~~,  `commit #55a33ce7`
- [x] ~~`getCourseById`~~, `commit #cc4301bf` -> latest refactoring change 
- [x] ~~`getAllCoursesByCourseName`~~ `commit #25fc523e`


### Auth Service (`api-v2/src/service/auth.service.ts`)
- [ ] Migrate functions from `services/auth.service.ts`
  - `googleAuth2`
- [ ] Check axios usage (vs fetch API for v2)
- [ ] Update JWT token handling (ensure consistent with v1)

---

## 4️⃣ DTOs TO MIGRATE

### User DTO (`api-v2/src/dto/user.dto.ts`)
- [ ] Migrate from `dtos/user.dto.ts`
  - `User` interface
  - `CreateUser` interface
  - `UpdateUser` interface
  - `mapToUserDTO` function

### Course DTO (`api-v2/src/dto/course.dto.ts`)
- [ ] Migrate from `dtos/course.dto.ts`
  - `Course` interface
  - `CreateCourse` interface
  - `UpdateCourse` interface
  - `mapToCourseDTO` function

### Selected Course DTO (`api-v2/src/dto/selected-course.dto.ts`)
- [ ] Migrate from `dtos/selected-course.dto.ts`
  - `SelectedCourse` interface
  - `CreateSelectedCourse` interface
  - `mapToSelectedCourseDTO` function

### Course Enrollment DTO (`api-v2/src/dto/course-enrollment.dto.ts`)
- [ ] Check if it exists in api-v2/src/dto/
  - Migrate from `dtos/course-enrollment.dto.ts`
  - Verify mapping names match DB columns

### Course Timeslot DTO (`api-v2/src/dto/course-timeslot.dto.ts`)
- [ ] Check if it exists in api-v2/src/dto/
  - Migrate from `dtos/course-timeslot.dto.ts`
  - Verify mapping names match DB columns

### Course Information DTO (`api-v2/src/dto/course-information.dto.ts`)
- [ ] Migrate from `dtos/course-information.dto.ts`
  - `CourseInformation` interface
  - `mapToCourseInformationDTO` function
  - Depends on other DTOs - check order of imports

---

## 5️⃣ ROUTER REGISTRATION (`api-v2/src/index.ts`)

- [ ] Add dependent route imports at top
- [ ] Register all routes with appropriate prefixes
  ```typescript
  import userRoutes from "./routes/user.routes.js";
  import courseRoutes from "./routes/course.routes.js";
  import authRoutes from "./routes/auth.routes.js";
  import archershubRoutes from "./routes/archershub.routes.js";
  import selectedCoursesRoutes from "./routes/selected-courses.routes.js";

  app.register(userRoutes, { prefix: "/users" });
  app.register(courseRoutes, { prefix: "/courses" });
  app.register(authRoutes, { prefix: "/auth" });
  app.register(archershubRoutes, { prefix: "/" });
  app.register(selectedCoursesRoutes, { prefix: "/users" });
  ```

---

## 6️⃣ MIDDLEWARE

### Error Middleware (`api-v2/src/middlewares/error.middleware.ts`)
- [ ] Create directory and file
- [ ] Migrate from `src/middlewares/error.middleware.ts`
  - Global error handling
  - Error response formatting

### Auth Middleware (`api-v2/src/middlewares/auth.middleware.ts`)
- [ ] Create directory and file
- [ ] Migrate from `src/middlewares/auth.middleware.ts`
  - JWT verification
  - Protect route helpers

---

## 7️⃣ CONFIGURATION & UTILS

### Database Config (`api-v2/src/config/db-source.ts`)
- [ ] Already exists as `api-v2/src/db/index.ts` (Check)
- [ ] Verify PostgreSQL connection pool configuration
- [ ] Update connection string format (if needed)

### Logger (`api-v2/src/utils/logger.ts`)
- [ ] Check if exists in api-v2/src/utils/
- [ ] Migrate if missing
  - Use Fastify's logger which is built-in

### Dotenv `.env`
- [ ] Verify environment variables are in api-v2/.env
  - DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
  - JWT_SECRET
  - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI
  - PORT, HOST

---

## 8️⃣ SCRIPTS (EXTERNAL DEPENDENCIES)

### Scripts (NO MIGRATION NEEDED)
Scripts in `src/scripts/` are external APIs/Web scraping and are already used by api-v2:
- [x] `src/scripts/fetch.js` - Already imported by course.service.ts
- [x] `src/scripts/login.js` - Already imported by course.service.ts
- [x] `src/scripts/otp.ts` - Already imported by course.service.ts
- [x] `src/scripts/archershub.ts` - Already imported by archershub.service.ts

**Note**: These scripts are NOT part of the migration - they're external utilities. If you need to refactor them, that's a separate task.

---

## 9️⃣ TESTING & VERIFICATION

### Backend Testing
- [ ] Test all routes individually
- [ ] Test authentication flow (Google OAuth)
- [ ] Test course fetching (scraper compatibility)
- [ ] Test DB connection and CRUD operations
- [ ] Test scheduling conflict detection (selected courses)
- [ ] Test error handling

### Frontend Integration
- [ ] Update frontend API endpoints to use api-v2 base URL
- [ ] Verify frontend authentication works with new JWT handling
- [ ] Test all frontend pages against migrated endpoints

---

## 🗺️ DATABASE SCHEMA VERIFICATION

### Existing in api-v2 (Good!)
- [x] `src/db/schema/users.ts` - ✅ Migrates src/models/User.ts (fields + structure)
- [x] `src/db/schema/courses.ts` - ✅ Migrates courses table
- [x] `src/db/schema/course_enrollments.ts` - ✅ Migrates course_enrollments table
- [x] `src/db/schema/selected-courses.ts` - ✅ Migrates selected_courses table
- [x] `src/db/schema/course_timeslots.ts` - ✅ Migrates courses_timeslots table

### Scripts
- [x] `src/db/PostgreSQL-Translated.sql` - Schema blueprint via SQL scripts

---

## ⚠️ SPECIAL CONSIDERATIONS

### Complex Services
- **Course Service - `fetchCourses()`**: Complex scraper orchestration, keeps login/session logic
- **Selected Course Service - `createSelectedCourse()`**: Has scheduling conflict detection logic - preserve carefully

### DTO Mapping Mismatches to Fix
- `uid` (v1) → `uid` (v2 - same name, but use Drizzle-implicitly)
- `cid` (v1) → `cid` (v2 - same name)
- MySQL join syntax → PostgreSQL join syntax
- MySQL `LIMIT`, `LIKE` wildcards → PostgreSQL equivalents (may already work)

### Third-Party Dependencies
- axios (for Auth and ArchersHub) - may want to switch to fetch API
- mysql2 → migrated to PostgreSQL/Drizzle
- dotenv, cors remain the same

---

## 💡 MIGRATION STRATEGY RECOMMENDATIONS

1. **Phase 1 - Core API**: Migrate Users, Auth, Selected Courses first (simple CRUD)
2. **Phase 2 - Fully Migrate**: Course routes and services
3. **Phase 3 - External Integration**: ArchersHub routes (uses scraper)
4. **Phase 4 - Testing**: Integration tests, frontend updates

---

## REPORTED BY
- Src route inspection: `src/routes/*.routes.ts`
- Src controller inspection: `src/controllers/*.controller.ts`
- Src service inspection: `src/services/*.service.ts`
- Src DTO inspection: `src/dtos/*.dto.ts`
- API v2 schema inspection: `api-v2/src/db/schema/*.ts`
- Base controller inspection: `api-v2/src/controller/*.controller.ts`

Generated on: 2026-10-13
