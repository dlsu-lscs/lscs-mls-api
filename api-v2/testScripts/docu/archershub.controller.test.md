# Documentation: archershub.controller.test.md

## Purpose
Validates the HTTP layer for the ArchersHub module, which provides root-level quick-access endpoints for campus, term, and course dropdowns used by the scraper UI. Tests data integrity and HTTP response correctness with mocked external API calls.

## Test Architecture

### Mock Strategy
Because the ArchersHub service calls external APIs (`scripts/archershub.ts` → `https://archershub.dlsu.edu.ph/CourseFinder`) requiring active session cookies, the test uses **inline mock implementations** in a test-specific routes file (`archershub-test-routes.ts`) rather than patching the production service.

**Test Routes File**: `testScripts/archershub-test-routes.ts`
- Contains complete controller handlers with hardcoded mock data
- Mirrors the exact transformation logic from the production service
- No external dependencies, no authentication needed

### Fastify Injection
Uses `app.inject()` for in-memory HTTP simulation:
```ts
const app = Fastify({ logger: false });
await app.register(cors);
await app.register(archershubTestRoutes);  // Test routes with inline mocks
await app.ready();
```

## Test Cases

### 1. **GET /campuses - Returns Unique Campuses (200)**
```ts
const res = await app.inject({ method: "GET", url: "/campuses" });
const campuses = JSON.parse(res.body);
// Verifies:
// - Array response
// - Each object has { name, campusNo }
// - Contains "Main Campus" and "Satellite Campus"
// - Mirrors production: data.CampusDrp.map(item => ({ name, campusNo }))
```

### 2. **GET /terms - Returns Unique Terms (200)**
```ts
const res = await app.inject({ method: "GET", url: "/terms" });
const terms = JSON.parse(res.body);
// Verifies:
// - Array response with { name, sessionId, isCurrent }
// - Contains "AY 2023-2024" (current) and "AY 2022-2023" (historical)
// - Current session (IS_CURRENT_SESSION: true) appears first
// - Historical sessions sorted descending by name
// - Mirrors production: SessionDrp filtering + sorting logic
```

### 3. **GET /courses/list - Returns Course List (200)**
```ts
const res = await app.inject({ 
  method: "GET", 
  url: "/courses/list?campusNo=1&sessionId=1" 
});
const courses = JSON.parse(res.body);
// Verifies:
// - Requires both query params (campusNo, sessionId)
// - Returns array of { courseId, name }
// - Name falls back: COURSE_NAME → SUBJECT_CODE → SUBJECT_NAME
// - Mirrors production: fetchCourseDropdown + mapping logic
```

### 4. **GET /courses/list - Missing Params (400)**
```ts
const res = await app.inject({ method: "GET", url: "/courses/list" });
// Verifies:
// - Returns 400 when campusNo or sessionId missing
// - Matches production validation
```

## Troubleshooting
- **401 "No active session"**: The test imports `archershub-test-routes.ts` (not production routes), so it should never hit external APIs. If you see this error, the wrong routes file was imported.
- **Module Cache Issues**: The test file is completely self-contained — no monkey-patching, no import-order dependencies. It defines mocks, controllers, and routes in a single test-specific file.
- **Mock Data Changes**: If production scraper response format changes, update the mock data in `archershub-test-routes.ts` to match.
- **Route Path Conflicts**: Test uses `/courses/list` (not `/courses-list`) to match production route. Ensure no route collision with Course module's `/courses/list` (they're in different plugin contexts).

## Production Service Integration Note
The test validates the **controller transformation logic** (snake_case → camelCase, filtering, sorting) but does NOT test the external API integration. The production `archershub.service.ts` calls:
- `fetchDropdowns()` → `POST /GetAllDropDownList` (requires cookie auth)
- `fetchCourseDropdown(campusNo, sessionId)` → `POST /GetCourseList/` (requires cookie auth)

For end-to-end testing of the scraper integration, a separate integration test with real credentials would be needed.