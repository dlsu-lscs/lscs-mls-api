# Documentation: user.controller.test.ts

## Purpose
Validates the Fastify route layer for Users. It tests HTTP request/response handling, input validation, and status code correctness. It uses `Fastify.inject()` (not a real server) to simulate API calls without opening network ports.

## Key Test Cases
1. **`POST /users - Empty Body`**:
   - **Technicality**: Tests `FastifyRequest.Body` type enforcement. Fastify's route handlers expect the body to match the `CreateUser` DTO. If the body is neglected or malformed, Fastify either:
     - Rejects the request at route resolution (schema validation).
     - Deploys to handler with an empty/skipped body.
   - **Expected**: 400 Bad Request (if schema enforced) or handler asserts `Object.keys(req.body).length === 0` and returns 400.
2. **`POST /users - Duplicate Insertion`**:
   - **Technicality**: Tests the service's `createUser` conflict handling. The controller forwards duplicate payloads (same `userId`). Service returns `null` (conflict). Controller then returns 409 with a predictable message.
3. **`GET /users/:id - Non-Numeric ID`**:
   - **Technicality**: Fastify does not automatically coerce `string` params to numeric types. The handler explicitly calls `Number(req.params.id)` and checks `isNaN()`. This catches malformed requests early and avoids Drizzle `WHERE uid = ...` errors due to type mismatches.
4. **`PUT /users/:id - Empty Update Payload`**:
   - **Technicality**: Controller-side validation. It prevents forwarding empty update objects to `updateUser` service (which would cause undefined overwrites). If `Object.keys(req.body).length === 0`, the response is 400.

## Troubleshooting
- **PASSED but logic seems wrong**: If tests pass but runtime behavior feels different, check how Fastify's type constraints propagate. For example, if `req.body` is inferred but missing, Fastify may map it to `{}`. Ensure the controller checks `Object.keys(req.body).length > 0` before proceeding.
- **409 not thrown for duplicates**: The controller expects `createUser` to return `null` for duplicates. If the service always returns a `new User` object, the controller will return 201 instead of 409. Verify service logic.
- **NaN check error**: If you remove `isNaN()` in the controller, Drizzle will attempt to execute `WHERE uid = "abc"`, resulting in type coercion or an error. The controller validation prevents this.