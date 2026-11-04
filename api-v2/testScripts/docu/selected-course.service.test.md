# Documentation: selected-course.service.test.ts

## Purpose
Comprehensive test suite for the Selected Courses service layer. Tests the full CRUD lifecycle plus the **scheduling conflict detection** algorithm, which is the core business logic of this module.

## Test Architecture

### Test Data Setup
The test is self-contained:
1. Creates a real test user via `user.service.createUser()`
2. Creates two test courses via `course.service.createCourse()` with **intentionally overlapping timeslots**:
   - **Course 1**: MON 08:00-10:00
   - **Course 2**: MON 09:00-11:00 (overlaps with Course 1 on MON)
3. All test data is cleaned up in `cleanTestData()` via explicit SQL deletes.

### Core Test Cases

#### 1. **Non-existent Course** (404)
```ts
await addSelectedCourse(TEST_USER_UID, 999999);
// Expect: { success: false, message: "Course not found." }
```
Verifies the service checks course existence before proceeding.

#### 2. **First Save Success** (201)
```ts
await addSelectedCourse(TEST_USER_UID, TEST_COURSE_ID_1);
// Expect: { success: true }
```
Verifies the happy path: valid user, valid course, no conflicts.

#### 3. **Duplicate Save** (409)
```ts
await addSelectedCourse(TEST_USER_UID, TEST_COURSE_ID_1);
// Expect: { success: false, message: "Course already saved." }
```
Verifies the `selected_courses` unique constraint enforcement at the service level.

#### 4. **Schedule Conflict Detection** (409) - **KEY TEST**
```ts
// Course 1 is saved. Now try to save Course 2 (overlaps on MON)
await addSelectedCourse(TEST_USER_UID, TEST_COURSE_ID_2);
// Expect: { success: false, message: "Schedule conflict on MON 09:00-11:00..." }
```
**Algorithm Under Test**:
1. Fetch timeslots of the **new** course (`newCourseTimeslots`)
2. Fetch all `selected_courses` for the user → get their `courseId`s
3. Fetch all timeslots for those saved courses in **one query** using `inArray()`
4. For each new timeslot, filter saved timeslots to the **same day**
5. For each same-day saved timeslot, call `timesOverlap(newTs.time, savedTs.time)`

**Time Parsing Logic** (`parseTimeRange`):
- Input: `"HH:MM-HH:MM"` or `"H:MM-H:MM"`
- Regex: `/^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/`
- Output: `[startMinutes, endMinutes]` (total minutes since midnight)
- Overlap check: `start1 < end2 && start2 < end1`

**Edge Cases Covered**:
- Overlapping start: `08:00-10:00` vs `09:00-11:00` → **conflict**
- Adjacent (no overlap): `08:00-10:00` vs `10:00-12:00` → **no conflict** (`start2 = end1`)
- Contained: `08:00-12:00` vs `09:00-10:00` → **conflict**
- Unparseable time string → returns `false` (fails safe, assumes no conflict)

#### 5. **getUserSelectedCourses**
Verifies the join chain: `selected_courses` → `courses` → `course_enrollments` + `course_timeslots` via the existing `getCourseById` service.

#### 6. **Remove & Re-add Cycle**
Tests that removing a course resolves conflicts, allowing previously conflicting courses to be added.

#### 7. **Conflict Persists After Re-add**
Re-adding Course 1 while Course 2 is saved should fail again (conflict is symmetric).

## Troubleshooting
- **Foreign Key Error on Insert**: The test user must exist in `users` table. `cleanTestData()` deletes the user last to avoid FK violations during the test.
- **Pool Closed Error**: The test does NOT call `pool.end()` — the aggregator handles that.
- **Course ID Resolution**: The test queries `courses` by `course_name LIKE 'TEST - Course%'` to get the auto-generated `cid` values. If the prefix changes, the test breaks.
- **Time Format Mismatch**: If the DB stores times as `"8:00-10:00"` (no leading zero) or `"08:00:00-10:00:00"` (seconds), the regex in `parseTimeRange` will fail and return `no conflict`. Ensure the test data matches the expected format exactly.