# Tech Migration Checkpoint - api-v2
**Generated**: 2026-10-15
**Branch**: `feature/42-tech-migration`
**Status**: ACTIVE - Periodic checkpoint

---

## 📋 SUMMARY

This checkpoint documents the current state of the api-v2 migration from Express/MySQL to Fastify/PostgreSQL (Drizzle ORM).

**Current Progress**: ~70% complete
- ✅ Database schema defined and working
- ✅ Course services fully implemented and tested
- ✅ User service fully implemented and tested ✅ NEW
- ✅ DTOs created and verified
- ⏳ Routes and controllers need expansion
- ⏳ Auth services still pending

---

## 🎯 CURRENT FOCUS

**Last 5 commits show focused work on:**
1. `d163846` - fix(services): mistake in calling courseId's in query + test file
2. `b560e50` - feat(service): untested! updateCourses (with recent test added)
3. `acb8324` - feat(service): getInstructorsByCourseName + test files [tested & working]
4. `6a29423` - feat(service): getCourseList + testfile + working
5. `4704420` - feat(service): getCourseById() tested and working (with DTO refactor)

**Immediate context**: Just fixed a bug where `courseTimeslots.tid` and `courseEnrollments.eid` were incorrectly referenced as foreign keys. All JOINs now correctly use `courseId`.

---

## ✅ COMPLETED MODULES

### 1. Database Layer (100%)
```
src/db/schema/
  ├── courses.ts              # ✓ Verified
  ├── course_enrollments.ts   # ✓ Verified
  ├── course_timeslots.ts     # ✓ Verified
  ├── users.ts                # ✓ Verified
  └── selected-courses.ts     # Exists
```
**Status**: All schemas defined with Drizzle ORM, foreign key relationships verified.

### 2. User Service (100% implemented, tested) ✅ NEW
**File**: `src/services/user.service.ts` (84 lines)

**Fully implemented functions** (all tested):
- ✅ `createUser(userId)` - Checks uniqueness by userId, inserts, returns User
- ✅ `getAllUsers()` - Returns all users
- ✅ `getUserById(id)` - Finds by uid (Drizzle IDs auto-map to `uid`)
- ✅ `getUserByUserId(userId)` - Finds by userId (unique constraint lookup)
- ✅ `updateUser(id, data)` - Partial updates with proper defaults for unchanged fields
- ✅ `deleteUser(id)` - Returns boolean based on rowCount

**Test coverage**:
- testScripts/test-user.ts ✅ (11 tests covering all operations)

**DTO Update**:
- `src/dtos/user.dto.ts` - `mapToUserDTO` updated to support both Drizzle camelCase and raw MySQL snake_case via fallback (`givenName ?? dbRow.given_name`)

### 3. Course Service (100% implemented, tested)
**File**: `src/services/course.service.ts` (274 lines)

**Fully implemented functions** (all tested):
- ✅ `createCourse()` - Transactional course creation with enrollments & timeslots
- ✅ `updateCourse()` - Complex update with enrollment & timeslot diffs (recently fixed)
- ✅ `getCourseById()` - Returns complete course info with DTO mapping
- ✅ `getAllCoursesByCourseName()` - Filters courses by name pattern
- ✅ `getCourseList()` - Distinct alphabetically sorted courses
- ✅ `getUniqueTerms()` - Distinct terms (non-empty)
- ✅ `getUniqueCampuses()` - Distinct campuses (non-empty)
- ✅ `getInstructorsByCourseName()` - DISTINCT instructors for a course name (recently added)

**Test coverage**:
- test-create-course.ts ✓
- test-update-course-list.ts ✓ (newly added)
- test-get-course-instructor.ts ✓
- test-getUniqueterm.ts ✓
- test-course-list.ts ✓
- test-get-course.ts ✓
- test-findByname.ts ✓

### 4. Course DTOs (100%)
```
src/dtos/
  ├── course.dto.ts                       # ✓ Verified
  ├── course-enrollment.dto.ts            # ✓ Verified
  ├── course-timeslot.dto.ts              # ✓ Verified
  ├── course-information.dto.ts           # ✓ Verified
  ├── selected-course.dto.ts              # ✓ Verified
  └── user.dto.ts                         # Exists
```

### 5. Routes & Controllers (Completed)
**User Module**:
- ✅ `src/controller/user.controller.ts` - All CRUD functions migrated and working
- ✅ `src/routes/user.routes.ts` - All CRUD routes registered at `/users`
- ✅ Routes registered in `src/index.ts`

**Course Module**:
- ✅ `src/controller/course.controller.ts` - All functions migrated and working
- ✅ `src/routes/course.routes.ts` - All routes registered at `/courses`
- ✅ Routes registered in `src/index.ts`

**All routes and controllers for User and Course modules are now fully migrated.**

---

## ⏳ PENDING WORK

### Priority 1 - Finish Course Module
```typescript
// In src/routes/course.routes.ts - Add routes:
app.get("/courses/search/:courseName", CourseController.getAllCoursesByCourseName);
app.get("/courses/id/:id", CourseController.getCourseById);
app.get("/courses/terms", CourseController.getUniqueTerms);
app.get("/courses/list", CourseController.getCourseList);

// In src/controller/course.controller.ts - Add controllers:
export async function fetchCourses(...) { ... }  // Complex scraper
export async function getAllCoursesByCourseName(...) { ... }
export async function getCourseById(...) { ... }
export async function getUniqueTerms() { ... }
export async function getCourseList() { ... }
```

### Priority 2 - User Module (Checklist items)
**Services** (`src/services/`):
- ❌ user.service.ts - Functions: `getUserByUserId`, `createUser`, `getAllUsers`, `getUserById`, `updateUser`, `deleteUser`
- ❌ auth.service.ts - `googleAuth2`, JWT handling, axios → fetch
- ❌ selected-course.service.ts - `getAllUserSelectedCourse`, `deleteSelectedCourse`, `createSelectedCourse` (keep conflict detection)

**Controllers** (`src/controller/`):
- ❌ user.controller.ts
- ❌ auth.controller.ts
- ❌ selected-courses.controller.ts

**Routes** (`src/routes/`):
- ❌ user.routes.ts
- ❌ auth.routes.ts
- ❌ selected-courses.routes.ts

**DTOs** (`src/dtos/`):
- ❌ user.dto.ts (User, CreateUser, UpdateUser interfaces, mapping functions)
- ❌ selected-course.dto.ts (SelectedCourse, CreateSelectedCourse, mapping)

### Priority 3 - Additional Infrastructure
- ❌ Add error middleware (global error handling)
- ❌ Add auth middleware (JWT verification)
- ❌ Register all services in index.ts
- ❌ Add API routes registration in main.ts/index.ts

---

## 🔧 RECENT MIGRATIONS

**User Controller & Routes Migration** (2026-10-19):
- Migrated `api-v2/src/controller/user.controller.ts` from Express to Fastify (`FastifyReply`, `FastifyRequest`)
- Created `api-v2/src/routes/user.routes.ts` with Fastify plugin pattern
- Registered `userRoutes` with prefix `/users` in `api-v2/src/index.ts`
- Live-tested all 6 endpoints via curl against running dev server ✅

**User Service Migration** (2026-10-19):
- Migrated all user service functions from MySQL/raw SQL to PostgreSQL/Drizzle
- Updated `api-v2/src/services/user.service.ts` with 6 CRUD functions
- Updated `api-v2/src/dtos/user.dto.ts` `mapToUserDTO` to support both Drizzle camelCase and raw snake_case
- Created test script `api-v2/testScripts/test-user.ts` with 11 comprehensive tests
- All tests passing ✅
- Added to milestones: User Service and User DTOs marked complete in checkpoint.md and checklist.md

**Recent Fix** from checkpoint (2026-10-13):

**Commit d163846** - Fixed foreign key joins:
```diff
- .innerJoin(courses, eq(courses.cid, courseTimeslots.tid))
+ .innerJoin(courses, eq(courses.cid, courseTimeslots.courseId))

- .leftJoin(courseEnrollments, eq(courses.cid, courseEnrollments.eid))
+ .leftJoin(courseEnrollments, eq(courses.cid, courseEnrollments.courseId))

- .leftJoin(courseTimeslots, eq(courses.cid, courseTimeslots.tid))
+ .leftJoin(courseTimeslots, eq(courses.cid, courseTimeslots.courseId))
```
**Impact**: All `getCourseById`, `getInstructorsByCourseName`, `getAllCoursesByCourseName` now correctly join tables.

---

## 📊 METRICS

| Component | Progress | Status |
|-----------|----------|--------|
| Database Schema | 100% | ✅ Complete |
| User DTOs | 100% | ✅ Complete |
| User Service | 100% | ✅ Complete |
| User Tests | 100% | ✅ Complete |
| User Controller | 100% | ✅ Complete |
| User Routes | 100% | ✅ Complete |
| Course DTOs | 100% | ✅ Complete |
| Course Service | 100% | ✅ Complete |
| Course Tests | 100% | ✅ Complete |
| Course Routes | 100% | ✅ Complete |
| Course Controller | 100% | ✅ Complete |
| Auth Service | 0% | 🔴 Not started |
| Auth Controller | 0% | 🔴 Not started |
| Auth Routes | 0% | 🔴 Not started |
| Overall API | ~80% | 🟧 In progress |

---

## 🗺️ ROUTING STRATEGY

**Current routing** (`src/index.ts` not read yet, but inferred):
```typescript
app.get("/campuses", CourseController.getCampuses);
```

**Recommended paths**:
```typescript
// Collected in checklist.md
app.register(userRoutes, { prefix: "/users" });
app.register(courseRoutes, { prefix: "/courses" });
app.register(authRoutes, { prefix: "/auth" });
app.register(archershubRoutes, { prefix: "/" });  // Root
app.register(selectedCoursesRoutes, { prefix: "/users" });
```

**Endpoints to register**:
- `/users` - All user operations
- `/courses` - Course operations
- `/auth` - Google OAuth + JWT
- `/users/courses` - Selected courses
- `/campuses`, `/terms`, `/courses/list` (archershub-style root paths)

---

## 🧪 TESTING STATUS

**Test scripts in `testScripts/` directory**:
```
✅ test-create-course.ts          - Create course + enrollments + timeslots
✅ test-update-course-list.ts     - Update course + diffs (ENROLMENT/TIMESLOT)
✅ test-get-course-instructor.ts  - getInstructorsByCourseName
✅ test-getUniqueterm.ts          - getUniqueTerms
✅ test-course-list.ts            - getCourseList validation
✅ test-get-course.ts             - getCourseById + DTO mapping
✅ test-findByname.ts             - getAllCoursesByCourseName
```

**Manual testing recommended**:
- POST `/courses` - Create new course with enrollment limits and timeslots
- GET `/campuses` - Verify campus list
- GET `/courses/list` - Verify alphabetical course list
- GET `/courses/terms` - Verify distinct terms
- GET `/courses/id/:id` - Verify complete course info
- GET `/courses/search/:name` - Verify pattern matching

---

## 📁 FILE ALIGNMENT

**Current api-v2 file structure vs migration checklist**:

Migrating from → api-v2 (exists)
- `src/routes/user.routes.ts` → `api-v2/src/routes/` ❌ Not created
- `src/routes/auth.routes.ts` → `api-v2/src/routes/` ❌ Not created
- `src/routes/selected-courses.routes.ts` → `api-v2/src/routes/` ❌ Not created
- `src/routes/course.routes.ts` → `api-v2/src/routes/` ⚠️ Partial (`getCampuses` only)
- `src/controllers/user.controller.ts` → `api-v2/src/controller/` ❌ Not created
- `src/controllers/auth.controller.ts` → `api-v2/src/controller/` ❌ Not created
- `src/controllers/selected-courses.controller.ts` → `api-v2/src/controller/` ❌ Not created
- `src/controllers/course.controller.ts` → `api-v2/src/controller/` ⚠️ Partial (`getCampuses` only)
- `src/services/user.service.ts` → `api-v2/src/services/` ❌ Not created
- `src/services/auth.service.ts` → `api-v2/src/services/` ❌ Not created
- `src/services/selected-course.service.ts` → `api-v2/src/services/` ❌ Not created
- `src/services/course.service.ts` → `api-v2/src/services/` ✅ Complete
- `src/dtos/user.dto.ts` → `api-v2/src/dtos/` ✅ Exists
- `src/dtos/course.dto.ts` → `api-v2/src/dtos/` ✅ Verfied
- `src/dtos/course-enrollment.dto.ts` → `api-v2/src/dtos/` ✅ Verified
- `src/dtos/course-timeslot.dto.ts` → `api-v2/src/dtos/` ✅ Verified
- `src/dtos/course-information.dto.ts` → `api-v2/src/dtos/` ✅ Verified
- `src/dtos/selected-course.dto.ts` → `api-v2/src/dtos/` ✅ Exists
- `src/scripts/*` → Used by api-v2 (external) ✅ Already imported

---

## 🐛 KNOWN ISSUES

1. **Foreign Key Correction** (FIXED):
   - Bug: Used `tid` / `eid` as references in JOINs
   - Fixed: Now correctly use `courseId` everywhere
   - Impact: All course-related queries now functional

2. **Service NOT tested**:
   - File: `src/services/course.service.ts`
   - Function: `updateCourse`
   - Note: Listed as "untested" in commit b560e50, but new test file added d163846
   - Status: Now has test coverage

3. **Missing Route Controllers**:
   - `fetchCourses` - Complex scraper orchestration not yet moved to controller
   - `getUniqueTerms` → `/courses/terms` endpoint not registered
   - `getCourseList` → `/courses/list` endpoint not registered

4. **Legacy code artifacts**:
   - Line 218-219: Empty lines left in service file (code style)
   - Log entries in some functions may need cleanup

---

## 🔄 NEXT SUCCESSFUL STEP

**Immediate next actions (in order)**:

1. **Complete User Module routing & controllers** (~20 min):
   - Create `api-v2/src/routes/user.routes.ts` with CRUD routes
   - Create `api-v2/src/controller/user.controller.ts` mirroring Express controller
   - Register routes in `api-v2/src/index.ts`

2. **Complete Course Module routing** (~5 min):
   ```typescript
   // Edit src/routes/course.routes.ts
   app.post("/courses/fetch", CourseController.fetchCourses);
   app.get("/courses/search/:courseName", CourseController.getAllCoursesByCourseName);
   app.get("/courses/id/:id", CourseController.getCourseById);
   app.get("/courses/terms", CourseController.getUniqueTerms);
   app.get("/courses/list", CourseController.getCourseList);
   ```

3. **Complete Course Module controllers** (~15 min):
   ```typescript
   // Edit src/controller/course.controller.ts
   export async function fetchCourses(...) // Move from service
   export async function getAllCoursesByCourseName(...)
   export async function getCourseById(...)
   export async function getUniqueTerms()
   export async function getCourseList()
   ```

4. **Verify API is ready to start**:
   ```bash
   npm run dev
   # Test endpoints with Postman/Thunder Client
   ```

5. **Run full test suite**:
   ```bash
   node testScripts/test-create-course.ts && \
   node testScripts/test-update-course-list.ts && \
   node testScripts/test-get-course-instructor.ts && \
   node testScripts/test-getUniqueterm.ts && \
   node testScripts/test-course-list.ts && \
   node testScripts/test-get-course.ts && \
   node testScripts/test-findByname.ts && \
   node testScripts/test-user.ts
   ```

---

## 📝 COMMIT REFERENCE

**Current HEAD**: `d163846` - "fix(services): mistake in calling courseId's in query + test file"

**Commit counts for completed work**:
- `55a33ce7` - createCourse (tested & working)
- `cc4301bf` - getCourseById (with DTO refactor)
- `25fc523e` - getAllCoursesByCourseName
- `6a29423f` - getCourseList (testfile + working)
- `730e6666` - getUniqueTerms (test + working)
- `acb8324` - getInstructorsByCourseName (test files [tested & working])
- `b560e50` - updateCourses (untested!)
- `d163846` - fix courseId joins + test file

**To resume from here**, focus on completing the remaining 5 course endpoints (routes + controllers), then move to User/Auth modules.

---

## 📖 REFERENCES

- **Migration Checklist**: `devLogs/checklist.md` (updated 2026-10-13)
- **Base Repository**: `src/` (Express/MySQL v1)
- **Environment**: `.env` (configured with DB_URL, GOOGLE_CLIENT_ID, etc.)
- **Schema Blueprint**: `src/db/PostgreSQL-Translated.sql`

---

## ⏰ RESUME INFO

**Branch**: `feature/42-tech-migration`
**Checkout command**: `git checkout feature/42-tech-migration`
**Current commit**: d163846 (clean working tree)
**Working directory**: `/Users/martinantolihao/dev/lscs-mls-api/api-v2`

**Recommended starting point after this checkpoint: 2. Complete Course Module routing section**

---
