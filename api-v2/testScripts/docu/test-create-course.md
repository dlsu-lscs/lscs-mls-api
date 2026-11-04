# Documentation: test-create-course.ts

## Purpose
Validates the atomic creation of a Course record, including its associated `course_enrollments`, `course_timeslots`, and pivot table (`selected-courses`) relations. This is a **state-cleaning test**: it creates a persistent record for downstream tests but does NOT clean it up (cleanup happens in the aggregated test suite).

## Test Flow
1. **Service Call**: `createCourse(courseData, enrollmentData, timeslots)`
   - `courseData`: `{ courseName, section, remarks, modality, term, campus }`
   - `enrollmentData`: `{ enrollCap, enrolled }`
   - `timeslots`: `[{ day, time, room, instructor }, ...]`

2. **Expected Database State**:
   - **`courses` table**: Single row with the supplied name, section, campus, etc.
   - **`course_enrollments` table**: A row keyed by `courses.cid`.
   - **`course_timeslots` table**: Multiple rows, one per time slot.

3. **Validation**:
   - No explicit assertions. The test passes if `createCourse` completes without throwing.
   - The downstream test `test-update-course-list.ts` depends on this record existing.

## Technicality
- **Transactional Integrity**: If `createCourse` succeeds, it implies the service wrapper uses Drizzle's transaction (or Postgres-level transaction) to ensure atomicity. If the enrollment/timeslot phase fails, the entire insert should roll back, leaving no orphaned rows.
- **Foreign Key Handling**: The test relies on `courses.cid` being the auto-increment primary key. Code upstream must use `.returning()` and receive the generated ID before proceeding.

## Troubleshooting
- **Test fails with "foreign_key_violation"**:
  - Verify that `course_enrollments` and `course_timeslots` have correct foreign keys referencing `courses.cid`.
  - Ensure no pre-existing test records block insertion (unique constraint on `courseName`+`section` may apply).
- **Database returns orphaned rows**:
  - If the test succeeds but downstream tests fail, `createCourse` may not be using a transaction.
  - Check `course.service.ts` for explicit transaction calls (e.g., `db.transaction(...)` or `await db.batch([...])`).

## Side Effects
- **Persistence**: The created test course is never deleted in this file. It must be removed manually or via the aggregated test suite. Do not rely on `test-create-course.ts` for isolation in a CI pipeline without cleanup.