# Documentation: test-findByname.ts

## Purpose
Tests `getAllCoursesByCourseName(courseName)` with two search strategies:
1. **Partial name search** (e.g., `"Introduction to Programming"`)
2. **Full exact-name search** (e.g., `"TEST - Introduction to Programming"`)

The goal is to validate pattern matching via Drizzle, not to test HTTP routing.

## Pattern Matching Technicality

### 1. Supported Operators
The service likely implements a Drizzle query such as:
```ts
db
  .select({ ... })
  .from(courses)
  .where(like(courses.courseName, `%${searchTerm}%`));
```
- **Usage**: `%` is a wildcard matching any sequence.
- **Case Sensitivity**: Pattern `LIKE` is case-sensitive on Postgres. If you need case-insensitive search, wrap the query in `ILIKE`.
- **Literal Escaping**: Search terms containing `%` or `_` should be escaped before interpolation (not exercised here).

### 2. Test Execution
```ts
const testCases = [
  { label: "Partial course name", search: "Introduction to Programming" },
  { label: "Full course name", search: "TEST - Introduction to Programming" },
];
```
- **Loop**: Executes both searches in sequence and logs each result group.
- **Console Output**: Each batch contains:
  - Number of results returned
  - Full `console.dir` of each course object (useful for comparing shape differences).

## Null Safety
- **Error Handling**: The catch block logs errors to `stderr` and exits gracefully:
  ```ts
  console.error(`Search failed for "${testCase.search}":`, error);
  ```
- **Safe for CI**: The script does NOT set `process.exitCode = 1` on errors; it continues to the next test case and exits with `0`.

## Validation Opportunities
The script is human-readable inspection, not automated validation. Consider adding assertions if you need programmatic checks:
```ts
const results = await getAllCoursesByCourseName(searchTerm);
console.assert(
  Array.isArray(results),
  "getAllCoursesByCourseName should return an array"
);
results.forEach(course => {
  console.assert(
    typeof course.courseName === "string",
    "Each result must have a non-null courseName"
  );
});
```

## Troubleshooting by Error Type

### 1. "column.courseName does not exist"
- **Cause**: Schema name mismatch. The code uses `courses.courseName`, but the table is defined with `course_name` or a custom alias.
- **Fix**: Verify `courses.ts` schema export and use the correct column name.

### 2. "relation 'courses' does not exist"
- **Cause**: Import error in `course.service.ts`. It likely imports `courses` from a local path that does not exist in the test environment.
- **Fix**: Check `import { courses } from "../src/db/schema/courses.schema"` vs. `import { courses } from "..."`.

### 3. Results do not include the expected course
- **Possible Issue**: The wildcard prefix/suffix usage. If `courseName` is stored with extra whitespace or trimming, `%toMatch%` may fail.
- **Investigation**: Print the raw row values before DTO mapping:
  ```ts
  const rawRows = await db.select().from(courses).where(like(courses.courseName, `%${searchTerm}%`));
  console.log("Raw results:", rawRows);
  ```
- **Fix**: Add `.trim()` to database queries or search logic.

## Non-Tested Areas
- Pagination: If the service supports limit/offset, this test does not verify it.
- Case Insensitivity: The test uses exact casing. If the product spec requires case-insensitive search, test with mixed-case queries.
- SQL Injection: The search term is interpolated directly. Sanitize inputs in the real endpoint, but for test files, raw strings are acceptable as end-to-end tests should catch injection patterns.