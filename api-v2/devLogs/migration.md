# Migration Plan - Stage-by-Stage Execution

**Base state** (`api-v2/src/`):
- ✅ DB config (`db/index.ts`) - PostgreSQL + Drizzle ORM
- ✅ Schemas - 5/5 tables defined (users, courses, course_enrollments, selected_courses, course_timeslots)
- ❌ Controllers - 1/5 created (course only)
- ❌ Routes - 1/6 defined (course only)
- ❌ Services - 1/5 created (course only)
- ❌ DTOs - 0/6 created
- ❌ ArchersHub routes in index.ts: NOT REGISTERED

---

## 🎯 PHASE 1: FOUNDATION (Core Infrastructure)

**Goal**: Get minimal working API structure in api-v2

### Step 1.1: Create DTOs (Smallest Units)
📦 Create `api-v2/src/dto/user.dto.ts`
- Copy from `src/dtos/user.dto.ts`
- Should compile successfully

📦 Create `api-v2/src/dto/course.dto.ts`
- Copy from `src/dtos/course.dto.ts`
- Should compile

📦 Create `api-v2/src/dto/selected-course.dto.ts`
- Copy from `src/dtos/selected-course.dto.ts`
- Should compile

### Step 1.2: Create Services (DB I/O)
📦 Create `api-v2/src/service/user.service.ts`
- Reference: `src/services/user.service.ts`
- **Key changes**:
  - Replace `pool.query()` → `db.select()` from drizzle
  - Replace `ResultSetHeader`, `RowDataPacket` with drizzle types
  - Fix column names: `uid` stays `uid`, no auto-mapping needed
  - Return values: update return types for Drizzle

📦 Create `api-v2/src/service/selected-course.service.ts`
- Reference: `src/services/selected-course.service.ts`
- **Complex logic to preserve**:
  - `createSelectedCourse()` - scheduling conflict detection (CRITICAL)
  - Keep all business logic from v1, just replace DB calls
- Update `getAllUserSelectedCourse()` for Drizzle
- Update `deleteSelectedCourse()` for Drizzle

### Step 1.3: Create Controllers
📦 Create `api-v2/src/controller/user.controller.ts`
- Reference: `src/controllers/user.controller.ts`
- Change Express types → Fastify types (`Request` → `FastifyRequest`, `Response` → `FastifyReply`)
- Use `reply.code()` instead of `res.status()`
- Import from `api-v2/src/service/user.service.ts`

### Step 1.4: Create Routes
📦 Create `api-v2/src/routes/user.routes.ts`
- Copy from `src/routes/user.routes.ts`
- No type changes needed (Router is compatible)

### Step 1.5: Register Users Module (Verify)
Update `api-v2/src/index.ts`:
```typescript
import userRoutes from "./routes/user.routes.js";
import * as UserController from "../controller/user.controller.js";

const userRoutes: FastifyPluginAsync = async (app) => {
  app.post("/", UserController.createUser);
  app.get("/", UserController.getAllUsers);
  app.get("/:id", UserController.getUserById);
  app.put("/:id", UserController.updateUser);
  app.delete("/:id", UserController.deleteUser);
  app.post("/courses", UserController.createSelectedCourse); // from selected controller
  app.get("/:id/courses", UserController.getAllUserSelectedCourse);
  app.delete("/:userId/courses/:courseId", UserController.deleteSelectedCourse);
};
app.register(userRoutes, { prefix: "/users" });
```

Test: `curl http://localhost:3001/users` → should work

---

## 🎯 PHASE 2: AUTHENTICATION

### Step 2.1: Create Auth DTOs
📦 Create `api-v2/src/dto/auth.dto.ts`
- Add JWT-related types (if needed)

### Step 2.2: Create Auth Service
📦 Create `api-v2/src/service/auth.service.ts`
- Reference: `src/services/auth.service.ts`
- **Changes needed**:
  - Replace `mysql2` imports → Nothing, keep as-is (axios, jwt still work)
  - Keep `googleAuth2()` - logic unchanged
  - Update User DTO import to use `api-v2/src/dto/user.dto.ts`

### Step 2.3: Create Auth Controller
📦 Create `api-v2/src/controller/auth.controller.ts`
- Reference: `src/controllers/auth.controller.ts`
- Change Express → Fastify types
- Keep axios calls (same API)

### Step 2.4: Create Auth Routes
📦 Create `api-v2/src/routes/auth.routes.ts`
- Copy from `src/routes/auth.routes.ts`
- No type changes

### Step 2.5: Register Auth Module
Update `api-v2/src/index.ts`:
```typescript
import authRoutes from "./routes/auth.routes.js";
app.register(authRoutes, { prefix: "/auth" });
```

Test: Contact `/auth/google` - should return JWT

---

## 🎯 PHASE 3: COURSE CORE (Complex, Test First)

### Step 3.1: Create Remaining Course DTOs
📦 Create `api-v2/src/dto/course-enrollment.dto.ts`
- Reference: `src/dtos/course-enrollment.dto.ts`
- Map fields: `courseId` matches DB column

📦 Create `api-v2/src/dto/course-timeslot.dto.ts`
- Reference: `src/dtos/course-timeslot.dto.ts`
- Map fields carefully

📦 Create `api-v2/src/dto/course-information.dto.ts`
- Reference: `src/dtos/course-information.dto.ts`
- **CRITICAL**: Update imports to point to api-v2 DTO paths

### Step 3.2: Update Course Service (Partial)
📦 Edit `api-v2/src/service/course.service.ts`
- Add remaining functions:
  - `getUniqueTerms()` - done, verify
  - `getCourseList()` - from v1
- Keep existing functions (`getUniqueCampuses`) unchanged

### Step 3.3: Create Course Controller
📦 Create `api-v2/src/controller/course.controller.ts` (extend existing)
Add functions from v1:
- `fetchCourses()` - keep as-is (external scraper), just wrap with Fastify types
- `getCourseById()`
- `getAllCoursesByCourseName()`
- `getTerms()`
- `getCourseList()`

### Step 3.4: Extend Course Routes
📦 Edit `api-v2/src/routes/course.routes.ts`
Add endpoints:
```typescript
app.post("/fetch", CourseController.fetchCourses);
app.get("/search/:courseName", CourseController.getAllCoursesByCourseName);
app.get("/id/:id", CourseController.getCourseById);
app.get("/terms", CourseController.getTerms);
app.get("/list", CourseController.getCourseList);
```

### Step 3.5: Extend Course Service (Critical - Testing)
**WARNING**: `fetchCourses()` runs external scraper - test in isolation

Test in development:
```bash
curl -X POST http://localhost:3001/courses/fetch \
  -H "Content-Type: application/json" \
  -d '{"campus":0, "part":0, "term":0, "course":""}'
```

### Step 3.6: Verify Database Schema
Run migration script (`src/db/PostgreSQL-Translated.sql`):
```bash
psql -U postgres -d mls_db -f src/db/PostgreSQL-Translated.sql
```

Test endpoints against real DB:
- GET `/courses/list`
- GET `/courses/terms`
- GET `/courses/campuses`
- GET `/courses/search/COMP`

---

## 🎯 PHASE 4: ARCHERSHUB INTEGRATION

### Step 4.1: Create ArchersHub DTOs
📦 Create `api-v2/src/dto/archershub.dto.ts`
- Add types for dropdown data if needed

### Step 4.2: Create ArchersHub Service
📦 Create `api-v2/src/service/archershub.service.ts`
- Copy from `src/services/archershub.service.ts`
- **No DB changes needed** - uses external API
- Check imports from `src/scripts/archershub.ts`

### Step 4.3: Create ArchersHub Controller
📦 Create `api-v2/src/controller/archershub.controller.ts`
- Copy from `src/controllers/archershub.controller.ts`
- Change Express → Fastify types
- Keep error handling logic

### Step 4.4: Create ArchersHub Routes
📦 Create `api-v2/src/routes/archershub.routes.ts`
- Copy from `src/routes/archershub.routes.ts`
- Paths stay same

### Step 4.5: Register ArchersHub Module
Update `api-v2/src/index.ts`:
```typescript
import archershubRoutes from "./routes/archershub.routes.js";
app.register(archershubRoutes, { prefix: "/" });
```

---

## 🎯 PHASE 5: FINALIZATIONS & MIDDLEWARE

### Step 5.1: Create Middleware Directory
📦 Create `api-v2/src/middlewares/` directory

### Step 5.2: Create Error Middleware
📦 Create `api-v2/src/middlewares/error.middleware.ts`
- Reference: `src/middlewares/error.middleware.ts`
- Adapt for Fastify
- Register in `api-v2/src/index.ts`
```typescript
app.setErrorHandler(errorHandler);
```

### Step 5.3: Create Auth Middleware (Optional)
📦 Create `api-v2/src/middlewares/auth.middleware.ts`
- Reference: `src/middlewares/auth.middleware.ts`
- Verify JWT verification for protected routes

### Step 5.4: Compile Check
```bash
cd api-v2 && npm run build
```
Fix all TypeScript errors before next phase

---

## 🎯 PHASE 6: TESTING PARALLELISM (Run After MVP Works)

### 6.1: Unit Tests for Each Service
Run each service in isolation:
```typescript
// Test user services
await UserStorage.testCreateUser();
await UserStorage.testUpdateUser();
```

### 6.2: Integration Tests
Postman/Swagger collection file
- Create tests for each route group
- Verify error responses (400, 401, 404, 500)

### 6.3: Frontend Integration
This is a separate task, but test assumptions:
- Frontend expects base URL: `http://localhost:3001/api`?
- JWT expiration: 14 days (from v1)?
- CORS: should now work (api-v2 has CORS pre-configured)

---

## 🔄 STEPS TO START MIGRATION

### Preparation
1. **Backup DB**: `pg_dump -U postgres mls_db > backup.sql`
2. **Create test env**: Copy `.env.example` → `.env`, fill in PostgreSQL credentials
3. **Verify DB connection**: `cd api-v2 && psql -U postgres -d mls_db -c "SELECT 1"`

### Day 1-2: Phase 1 (Users)
- [ ] Create DTOs (3 files)
- [ ] Create user service (from v1)
- [ ] Create user controller
- [ ] Create user routes
- [ ] Register in index.ts
- [ ] Test `/users` endpoints

### Day 3: Phase 2 (Auth)  
- [ ] Create auth DTOs + service + controller + routes
- [ ] Register in index.ts
- [ ] Test `/auth/google`

### Day 4-5: Phase 3 (Courses)
- [ ] Create remaining DTOs
- [ ] Extend course service (getTerms, getCourseList)
- [ ] Extend course controller (all except fetchCourses)
- [ ] Extend course routes
- [ ] Test fetchCourses separately (scraper test)
- [ ] Test other endpoints against DB

### Day 6: Phase 4 (ArchersHub)
- [ ] Create archershub service + controller + routes
- [ ] Register in index.ts
- [ ] Test archershub endpoints with live session

### Day 7: Finalize
- [ ] Create middleware
- [ ] Register in index.ts
- [ ] Full build check (`npm run build`)
- [ ] Integration tests

---

## 🚨 ROADBLOCKS & RESOLUTION

### Issue 1: Database Column Names
**Symptom**: TypeScript errors `Property 'uid' does not exist on type...`
**Resolution**:
- Check Drizzle schema (`uid` exists in `users` table)
- vs. DTO: `id: number, userId: string`
- **Fix**: Update DTOs to match DB column names (v1 has `id`, v2 should keep `uid`)

### Issue 2: Complex Service Orchestration
**Task**: `course.service.ts.fetchCourses()` runs scraper, parses, updates DB
**Resolution**:
- Keep v1 logic intact - it's production code
- Only replace `pool.query()` → `db.select()`/`insert()`/`update()`
- Test scraping separately before full integration

### Issue 3: External Script Compatibility
**Files**: `src/scripts/*` (fetch.ts, login.js, archershub.ts)
**Resolution**:
- These are NOT part of migration - they're external utility scripts
- Keep using them as-is from api-v2/src/services/**
- If they fail, debug in isolation (separate task)

### Issue 4: DTO Imports Circular Dependencies
**Symptom**: `CourseInformationDTO` imports from CourseDTO, CourseDTO imports from EnrollmentDTO
**Resolution**:
- Reorder imports appropriately
- Or use forward declarations if critical

---

## 📊 PROGRESS TRACKING

| Component | Status | Files | Lines | Notes |
|-----------|--------|-------|-------|-------|
| Schemas | ✅ Done | 5 | ~150 | Complete |
| DTOs | 🔄 In Progress | 1/6 | ~60 | 3 needed/Phase 1 |
| Services | 🔄 In Progress | 1/5 | ~150 | 4 needed/Phase 2-4 |
| Controllers | 🔄 In Progress | 1/5 | ~120 | 4 needed/Phase 1-3 |
| Routes | 🔄 In Progress | 1/6 | ~50 | 5 needed/Phase 1-4 |
| Middleware | ⏳ Pending | 0/2 | ~40 | 2 needed/Phase 5 |
| Index.ts | 🔄 Updated | 1 | ~65 | Add import/register calls |
| **Total** | **21%** | **9/21** | **~525** | 12 files remaining |

---

## 🔍 VERIFY CHECKLIST SUMMARY

**Before moving to next phase**:
- [ ] Code compiles (`cd api-v2 && npm run build`)
- [ ] Endpoints respond with HTTP 200
- [ ] Database queries return correct results
- [ ] Error handling works (try-catch response objects)
- [ ] No TypeScript runtime errors
- [ ] Logs visible in API console (Fastify logger)

**After full migration**:
- [ ] All 21 files created
- [ ] All routes registered in `api/v2/src/index.ts`
- [ ] `/health` endpoint reports "ok"
- [ ] Frontend no longer calls v1 endpoints
- [ ] All integration tests pass

---

## 📝 NOTES FOR FUTURE REFACTORING

### Optimization Opportunities
1. **Database Queries**: Replace this:
   ```typescript
   pool.query("SELECT * FROM users WHERE user_id = ?", [userId])
   ```
   With this (Drizzle):
   ```typescript
   db.select().from(users).where(eq(users.userId, userId))
   ```

2. **Axios vs Fetch**: Auth and ArchersHub currently use axios
   - Can switch to Fetch API for simplicity
   - Same functionality, no external dependency needed

3. **Error Handling**: 
   - Move error formatting to middleware
   - Use Fastify's built-in `reply.send({ error: ... })` standard

4. **DTO Collections**:
   - Export DTO interfaces from shared location
   - Avoid duplication between v1 DTOs and v2 DTOs

---

Generated: 2026-10-13
Based on: checklist.md + api-v2/src inspection