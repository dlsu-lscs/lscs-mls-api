# Documentation: auth.service.test.ts

## Purpose
Validates the Google OAuth 2.0 flow, including data transformation and JWT token generation. Because the test suite must be deterministic (no network calls, no real Google credentials), it mocks the global `fetch` API to simulate Google's `userinfo` and `token` endpoints.

## Technical Breakdown
The tests rely on three critical mocking strategies, each simulating a distinct failure pathway:

### 1. Mock Implementation (`withMockedFetch`)
```ts
function withMockedFetch(
  userinfoOk: boolean,
  tokenOk: boolean
): typeof globalThis.fetch
```
- **Mechanism**: Overwrites the global `fetch` promise in the test file's closure.
- **Behavior**: 
  - If URL includes `oauth2/v3/userinfo`: Returns a Promise that resolves to a mock response with `ok` matching `userinfoOk`.
  - If URL includes `oauth2.googleapis.com/token`: Returns a mock token exchange response.
  - Otherwise: Delegates to the original `fetch` (useful for future expansions, though not exercised currently).
- **Restoration**: The function returns the original `fetch`, which is restored in a `finally` block to prevent cross-test leakage.

### 2. New User Creation Path
- **Code Flow**: 
  - `globalThis.fetch` returns a synthetic Google `userinfo` object: `{ email, given_name, family_name, sub: TEST_USER_ID, picture }`.
  - `auth.service.googleAuth2` extracts these properties into its own `userInfo` shape (camelCase conversion: `given_name` → `givenName`).
  - Calls `getUserByUserId(TEST_USER_ID)`. Returns `null` (row doesn't exist yet).
  - Calls `createUser(userInfo)`. Service upserts via `db.insert(users).values()`.
  - Generates JWT by calling `jwt.sign(userInfo, process.env.JWT_SECRET, { expiresIn: '14d' })`.
- **Validation**:
  - Checks that `result.jwtString` is truthy.
  - Checks that `result.user.userId === TEST_USER_ID`.
  - Verifies that `result.user.email` matches the mock payload.

### 3. Existing User Update Path
- **Code Flow**:
  - Mock returns a `given_name` updated to "AuthUpdated".
  - `googleAuth2` Retrieves existing user via `getUserByUserId`.
  - Calls `updateUser` with partial payload `{ givenName: "AuthUpdated" }`. 
  - Service reads existing record, spreads defaults, and updates only the provided fields.
  - Generates new JWT (payload reflects the new `givenName`).
- **Validation**:
  - Verifies that `givenName` changed to "AuthUpdated".
  - Ensures `userId` remains unchanged.

### 4. Network Failure Path
- **Mechanism**: `withMockedFetch(false, false)` (both userinfo and token exchanges return `ok: false`).
- **Flow**:
  - First call: `fetch('userinfo')` returns `ok: false` → `googleAuth2` throws "Error on authentication".
  - Second call: `fetch('token')` returns `ok: false` → controller handler catches it, returns 403.
- **Validation**: Ensures the service and controller properly propagate network-level errors as auth errors.

## Troubleshooting Note
- **JWT_SECRET required**: The `jwt.sign()` call requires `JWT_SECRET` to be present in Env. If `JWT_SECRET` is undefined, `jwt.sign()` raises. This is not caught by the mock because the ratification occurs before the mock is active (the tests verify the successful path first). The error will surface in the validation block.
- **Token expiration**: The tests verify a fresh JWT is created, not its expiration logic. If you adjust `expiresIn` in `auth.service.ts`, the tests won't detect token lifetime changes immediately (only that the string is generated).
- **Payload shape**: `googleAuth2` expects `sub` as the `userId`. If Google's schema changes to `id` or `subject`, the mapping breaks. Ensure you keep the service's property mapping aligned with actual Google responses.