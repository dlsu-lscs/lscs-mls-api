# Documentation: test-get-course.ts

## Purpose
Unit-level test for `getCourseById(cid)`, the atomic lookup of a single course by its identity column. It focuses on correctness of Row-to-DTO mapping and null handling.

## Test Flow
```ts
const course = await getCourseById(1);
if (!course) {
  console.log("No course found for that ID.");
  return;
}
```
- **Scenario 1 (Success)**: Database row exists, service returns a non-null DTO.
- **Scenario 2 (Not Found)**: Identity column has no matching row, service returns `null`.

## Technicality Breakdown

### 1. JSON Output (`console.dir(course, { depth: null })`)
- **Purpose**: Humans inspect the DTO shape to verify all expected fields are present.
- **Hidden Behavior**: If `mapToCourseDTO` returns `undefined` for a field or omits it, it will not appear in `console.dir`.

### 2. No Explicit Assertions
- **Contrast**: Unlike `test-user.ts`, this file emits human-readable logs instead of `console.assert`.
- **Thesis**: This supports debugging more than CI enforcement. If you want strict assertions, use the aggregated test suite (`run-course-tests.ts`).

## Specific Points of Failure

### 1. Drizzle Join Logic
If `getCourseById` returns additional nested fields (instructors, enrollments), verify:
- The join fields do not return `null` on optional related rows (this may be fine).
- The nesting depth does not exceed the DTO shape (e.g., indexing an array when DTO expects a single object).

### 2. Identity Column Mismatch
- The test queries by integer `1`. If the service expects a UUID string (`courses.cid`), it will fail.
- Verify `courses.cid` exists and is the correct PK (primary key) for this table.

### 3. Type Transformation
- Drizzle's `.select()` returns raw DB rows with snake_case keys (e.g., `course_time_slots`).
- `mapToCourseDTO` must transform these to camelCase (`courseTimeSlots`).
- If `mapToCourseDTO` uses property spreading incorrectly (e.g., `...drizzleRow`), snake_case values bypass the mapping.

## Troubleshooting
- **"courseList is not a function"**: The service is exporting `getCourses` or `getCourse` instead of `getCourseById`. Fix the import.
- **"Cannot read property 'id' of null"**: If `mapToCourseDTO` is missing the `if (!dbRow) return null` guard, it may throw on undefined rows.
- **Schema undefined error**: Drizzle generics may not be inferred correctly if table columns have mixed types. Import typed rows from the schema explicitly:
  ```ts
  import type { courses } from "./schema/courses.ts";
  const row: typeof courses.$inferSelect = await db.select().from(courses).where(eq(courses.cid, 1));
  ```

## Side Effects
- **Output Pollution**: The `console.dir` output prints to `stderr` or `stdout` depending on terminal. In CI, this may be ignored, so rely on return codes (not printed success messages) or redirect output to logs.

## Uses Guardrails
If you convert this to an automated assertion test, add:
```ts
console.assert(course !== null, "getCourseById should return null for non-existent ID");
console.assert(typeof course?.courseName === "string", "courseName should be a string");
console.assert(typeof course?.cid === "number", "cid should be numeric ID");
```
The current file is intentionally loose for manual verification.