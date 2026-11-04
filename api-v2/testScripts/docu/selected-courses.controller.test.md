# Documentation: selected-courses.controller.test.ts

## Purpose
Validates the HTTP layer for the Selected Courses module. Tests all three endpoints with and without authentication, covering status codes, validation, and error mapping.

## Test Architecture

### Test Data Setup
Creates isolated test data per test run:
1. Test user via `user.service.createUser()`
2. Two test courses with overlapping timeslots (same as service test but different names to avoid collision)
3. Cleanup in `finally` block.

### Fastify Injection
Uses `app.inject()` for in-memory HTTP simulation (no open ports):
```ts
const app = Fastify({ logger: false });
await app.register(cors);
await app.register(selectedCoursesRoutes);
await app.ready();
```

### JWT Token Generation
Generates a test token matching the `authMiddleware` expectations:
```ts
function generateTestToken(userId: number): string {
  return jwt.sign(
    { userId: `test-sub-${userId}`, email: "test@example.com", uid: userId },
    process.env.JWT_SECRET as string,
    { expiresIn: "1h" }
  );
}
```
The token includes:
- `userId`: The Google `sub` claim (string)
- `uid`: The internal `users.uid` (number) - used by the middleware to attach `req.user`

## Test Cases

### 1. **POST /users/:id/courses - No Auth (401)**
```ts
await app.inject({
  method: "POST",
  url: `/users/${TEST_USER_UID}/courses`,
  payload: { courseId: TEST_COURSE_ID_1 },
});
// Expect: 401
```
Verifies `authMiddleware` rejects requests without `Authorization` header.

### 2. **POST /users/:id/courses - Invalid courseId (400)**
```ts
payload: { courseId: "invalid" },
// Expect: 400 "Valid courseId is required."
```
Verifies controller-level input validation before calling service.

### 3. **POST /users/:id/courses - Course Not Found (404)**
```ts
payload: { courseId: 999999 },
// Expect: 404 "Course not found."
```
Maps service error message to 404.

### 4. **POST /users/:id/courses - Success (201)**
```ts
payload: { courseId: TEST_COURSE_ID_1 },
headers: { authorization: `Bearer ${testToken}` },
// Expect: 201 "Course saved successfully."
```
Full happy path with valid auth, valid course, no conflicts.

### 5. **POST /users/:id/courses - Duplicate (409)**
```ts
// Save same course again
payload: { courseId: TEST_COURSE_ID_1 },
// Expect: 409 "Course already saved."
```
Maps service duplicate error to 409.

### 6. **POST /users/:id/courses - Schedule Conflict (409)**
```ts
// Course 2 overlaps with Course 1 (already saved)
payload: { courseId: TEST_COURSE_ID_2 },
// Expect: 409 "Schedule conflict on MON 09:00-11:00..."
```
Verifies conflict detection works through the HTTP layer.

### 7. **GET /users/:id/courses - No Auth (401)**
```ts
method: "GET",
url: `/users/${TEST_USER_UID}/courses`,
// Expect: 401
```

### 8. **GET /users/:id/courses - With Auth (200)**
```ts
headers: { authorization: `Bearer ${testToken}` },
// Expect: 200 + array with 1 saved course
```
Verifies response shape is `CourseInformation[]` (joined data).

### 9. **DELETE /users/:userId/courses/:courseId - No Auth (401)**

### 10. **DELETE /users/:userId/courses/:courseId - Success (200)**

### 11. **DELETE /users/:userId/courses/:courseId - Not Found (404)**
Second delete on same course returns 404.

## Troubleshooting
- **500 on "Course not found"**: The controller checks `result.message.includes("not found")` to decide between 404 and 409. If the service message changes, the mapping breaks.
- **Pool Closed**: The service test must NOT call `pool.end()`. The aggregator calls it in the `finally` block after both test suites complete.
- **Auth Middleware Mismatch**: The `generateTestToken` must match the claims expected by `authMiddleware.ts`. Currently it expects `userId` (Google sub) and attaches it to `req.user`. The controller doesn't yet use `req.user` for authorization (it trusts the URL param `userId`), but future tests should verify user can only access their own courses.
- **Test Data Collision**: Uses unique prefixes (`TEST - Controller Course%`) to avoid clashing with service test data.