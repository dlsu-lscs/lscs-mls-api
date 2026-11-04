# Documentation: auth.controller.test.ts

## Purpose
Validates the HTTP request handling and error response mapping for the Auth module. It tests both the `/auth/google` endpoint (direct token exchange) and `/auth/google/callback` (OAuth code flow). Like the User controller tests, it uses `Fastify.inject()` to simulate API calls without opening TCP ports.

## Test Suite Structure
The tests use a **closed-world global fetch mock** to ensure determinism:

```ts
function withMockedFetch(
  userinfoOk: boolean,
  tokenOk: boolean
): typeof globalThis.fetch
```
- **Endpoints mocked**:
  - `https://www.googleapis.com/oauth2/v3/userinfo` (`userinfoOk`).
  - `https://oauth2.googleapis.com/token` (`tokenOk`).
- **Behavior**: Returns a controlled mock response that either succeeds or fails (simulating Google API responses).
- **Always enclosed**: The mock is invoked in a `try { ... } finally { restore }` pattern to guarantee the original `fetch` is restored between test cases.

## Detailed Test Cases

### 1. `POST /auth/google - No Token Payload`
- **Requirement**: The controller asserts the body contains `{ token }`. If `token` is empty or missing, it returns 400 Bad Request.
- **Flow**:
  - Make `POST /auth/google` with empty Payload: `app.inject({ payload: {} })`.
  - Controller calls `error.message.includes("Error on authentication")`.
- **Validation**: Ensures input validation is enforced at the controller level.

### 2. `GET /auth/google/callback - No Code Query Parameter`
- **Requirement**: The endpoint expects `code` in query string (`req.query.code`). If empty, returns 400.
- **Flow**:
  - Call `GET /auth/google/callback` (no `?code=...`).
  - Controller returns 400.
- **Importance**: Prevents attempting to exchange an empty or missing authorization code against Google's token endpoint (a potential DoS vector for your server).

### 3. `POST /auth/google - Invalid Bearer Token`
- **Requirement**: Simulates a scenario where the provided token is not a valid Google Access Token.
- **Mechanism**: The tests configure the global `fetch` mock to return `userinfoOk = false` and `tokenOk = false`.
- **Flow**:
  - Call `POST /auth/google` with payload `{ token: "invalid-token" }`.
  - Controller calls `AuthService.googleAuth2(accessToken)`.
  - Inside `googleAuth2`, `response.ok === false` triggers the catch block, which throws `Error('Error on authentication.')`.
  - Controller catches the error, checks if it includes `Error on authentication`, and returns 403.
- **Validation**: Ensures auth failures result in the correct status code (403 instead of 500).

### 4. `GET /auth/google/callback - Invalid Authorization Code**
- **Requirement**: Simulates the token exchange failing because the authorization code is expired, malformed, or already used.
- **Mechanism**: Same global mock as above (`userinfoOk = false`, `tokenOk = false`).
- **Flow**:
  - Call `GET /auth/google/callback?code=invalid-code`.
  - Controller sends `id_token` to `googleAuth2` (the token endpoint's `id_token` validation).
  - The mock returns `ok: false`, causing the service to throw.
  - Controller returns 403.
- **Validation**: Checks that the code flow doesn't silently fall through and that expired/invalid codes are rejected uniformly.

### 5. `GET /auth/google/callback - Empty ID Token`
- **Mechanism**: The mock's ток exchange endpoint returns `{ id_token: "fake-id-token" }` (only when `tokenOk === true`). If `tokenOk === false`, it returns `{}`.
- **Gap**: Currently, the test suite does NOT explicitly test the case where `tokenOk === true` but `id_token` is missing. In a future iteration, add a test:
  ```ts
  const mock = withMockedFetch(true, true); // but token endpoint returns {} (no id_token)
  const res = await app.inject({ url: "/auth/google/callback?code=bad-code" });
  assert.strictEqual(res.statusCode, 403);
  ```

## Troubleshooting
- **Mock leakage across tests**: The `withMockedFetch` returns the original `fetch` in the `finally` block. If you do not call `restore` in a `finally`, subsequent tests may pick up a partially mocked environment.
- **Wrong status code**: If you see 500 instead of 403 for invalid tokens, check the controller's error handling. The controller explicitly checks `if (error.message.includes("Error on authentication"))` to map auth failures to 403. If you return a generic "Internal server error", the controller defaults to 500.
- **Query string parsing**: `app.inject()` parses query strings from the URL segment. Do not pass query values in the `payload` object. Use `url: '/auth/google/callback?code=xyz'` (not `payload: { code: 'xyz' }`).
- **No network error propagation**: Because the mock replaces `fetch`, you cannot test actual network timeouts, slow responses, or DNS failures with these tests alone. The tests only validate that the controller and service handle failure responses at the API level, not a real network.