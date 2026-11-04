# Documentation: test-course-list.ts

## Purpose
Validates the `getCourseList()` service method, which retrieves all distinct course names alphabetically sorted. This test is self-checking (returns PASS/FAIL status) for use in CI builds and ad-hoc verification.

## Test Logic Breakdown

### 1. Fetch Course List
```ts
const courseNames = await getCourseList();
```
- **Mechanism**: `db.select({ courseName: courses.courseName })` with `.distinct()`.
- **Ordering**: The service implementation must apply ` orderBy({ courseName: 'asc' })` before calling `.execute()`.

### 2. Duplicate Detection
```ts
const hasDuplicates = courseNames.length !== new Set(courseNames).size;
```
- **Rationale**: If the query does not use `.distinct()`, the same course name may appear multiple times (once per section). These tests pass only when all courses have unique titles regardless of section.

### 3. Invalid Value Detection
```ts
const hasInvalidNames = courseNames.some(
  (name) => name === "" || name == null
);
```
- **Rationale**: Ensures no programmatic null strings, empty placeholders, or NULL database values leak into the output.

### 4. Alphabetical Ordering Check
```ts
const isSorted = courseNames.every(
  (name, index) => index === 0 || courseNames[index - 1] <= name
);
```
- **Dimension**: Tests sorting stability.
- **Edge Case**: Returns false if two courses have identical names (inequality `>` would fail, but `<=` allows equal names as valid).

### 5. Test Result Exit Code
```ts
const passed = !hasDuplicates && !hasInvalidNames && isSorted;
if (!passed) {
  process.exitCode = 1;
}
```
- **Ensures**: The test fails the CI pipeline only when logical correctness is violated. It does NOT exit on non-standard DB errors (throws in catch block).

## Technicality
- **Select vs Join**: If `getCourseList` joins with `selected-courses` or other tables, an extra `.distinct()` on the join column is needed. If only `courses` is queried, `.distinct()` on `courseName` is sufficient.
- **Type Safety**: `courseNames` is inferred as `string[]`. If the service returns an array with non-string values, `hasInvalidNames` catches it.

## Troubleshooting
- **Passes locally but fails in CI**:
  - CI DB may not have the same data or seeding scripts not run.
  - Check that `getCourseList` actually selects from the production schema (`courses.courseName`), not a dev-specific alias.
- **Fails with "column does not exist"**:
  - Verify that `courses.courseName` column exists and is not renamed (e.g., to `title`).
- **Fails with "non-null constraint violation"**:
  - Verify that the database schema enforces `NOT NULL` on `course_name`. If records with NULL exist, `.distinct()` may be filtering them incorrectly.

## Additional Checks
The test does NOT verify:
- Whether the returned list matches API expectations (e.g., pagination, filtering).
- Whether the courses are temporally sorted by term (only alphabetical by name).
- Whether instructor and room data is included (list endpoint vs enriched endpoint).

This is a **pure data shape test**, not a business rule test.