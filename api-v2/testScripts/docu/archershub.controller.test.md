# Documentation: archershub.controller.test.ts

## Purpose
Validates the HTTP layer for the ArchersHub module, which provides root-level quick-access endpoints. Tests data integrity (uniqueness, sorting) and HTTP response correctness.

## Test Architecture

### Test Data Setup
Creates isolated test data:
1. Test user (for completeness, though courses don't require user FK)
2. Two test courses with **different** `campus` and `term` values to verify distinct filtering:
   - Course 1: `campus: "Main Campus"`, `term: "Spring 2024"`
   - Course 2: `campus: "Satellite Campus"`, `term: "Fall 2024"`

### Fastify Injection
Uses `app.inject()` for in-memory HTTP simulation:
```ts
const app = Fastify({ logger: false });
await app.register(cors);
await app.register(archershubRoutes);
await app.ready();
```

## Test Cases

### 1. **GET /campuses - Returns Unique Campuses (200)**
```ts
const res = await app.inject({ method: "GET", url: "/campuses" });
const campuses = JSON.parse(res.body);
// Verifies:
// - Array response
// - Contains "Main Campus"
// - Contains "Satellite Campus"
// - Implicitly tests DISTINCT and NOT NULL filtering in course.service.getUniqueCampuses
```

### 2. **GET /terms - Returns Unique Terms (200)**
```ts
const res = await app.inject({ method: "GET", url: "/terms" });
const terms = JSON.parse(res.body);
// Verifies:
// - Array response
// - Contains "Spring 2024"
// - Contains "Fall 2024"
// - Implicitly tests DISTINCT, NOT NULL, and empty string filtering
```

### 3. **GET /courses-list - Returns Sorted Course Names (200)**
```ts
const res = await app.inject({ method: "GET", url: "/courses-list" });
const courses = JSON.parse(res.body);
// Verifies:
// - Array response
// - Contains both test course names
// - **Alphabetical ordering**: `courses.every((c, i) => i === 0 || courses[i - 1] <= c)`
// - Implicitly tests DISTINCT, NOT NULL, and ORDER BY ASC
```

## Troubleshooting
- **Empty Array**: If the DB has no courses matching the test prefixes, all three endpoints return `[]`. Ensure `setupTestData()` runs and commits before tests.
- **Missing Values**: If `campuses` doesn't include "Main Campus", check that `course.service.getUniqueCampuses` uses:
  ```ts
  .where(and(isNotNull(courses.campus), ne(courses.campus, "")))
  ```
  The test data uses exact strings — no trimming is applied in the service.
- **Sorting Failures**: The alphabetical sort check is case-sensitive. If the DB collation affects ordering, the test may fail. The service uses `.orderBy(asc(courses.courseName))` which delegates to Postgres default collation.
- **Pool Closed**: Test cleans up in `finally` block. No `pool.end()` called — aggregator handles it.

## Service Delegation Pattern
The ArchersHub service is intentionally thin:
```ts
export async function getCampuses(): Promise<string[]> {
  return getUniqueCampuses(); // delegates to course.service
}
```
Tests verify the **integration** (route → controller → service → course.service → DB) works end-to-end, not the underlying course service logic (which has its own test suite).