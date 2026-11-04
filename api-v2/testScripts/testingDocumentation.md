# Testing Documentation

This directory contains the automated test suites for the `api-v2` module. All tests are designed to be deterministic and self-contained, utilizing `Fastify.inject()` for controller tests and direct service calls for business logic.

---

## 1. `user.service.test.ts`
**Purpose**: Validates business logic and database interactions for user management.
- **Scope**:
    - `createUser`: Checks unique constraints on `userId`.
    - `getAllUsers`: Verifies data retrieval.
    - `getUserById` / `getUserByUserId`: Validates specific lookups.
    - `updateUser`: Partial update functionality.
    - `deleteUser`: Verifies record removal and return boolean.
- **Mechanism**: Connects directly to the DB pool. Ensures setup/teardown by cleaning up test records prefixed with `svc-`.

---

## 2. `user.controller.test.ts`
**Purpose**: Tests the HTTP integration and request validation for User endpoints.
- **Scope**:
    - `POST /users`: Success creation, duplicate conflict (409).
    - `GET /users`: List users.
    - `GET /users/:id`: Validation for non-numeric IDs, 404 for missing users.
    - `PUT /users/:id`: Updates fields, validates against empty bodies.
    - `DELETE /users/:id`: Success deletion, 404 if record doesn't exist.
- **Mechanism**: Builds an isolated `Fastify` instance, registers `user.routes.ts`, and uses `app.inject()` to simulate HTTP requests without opening network ports.

---

## 3. `auth.service.test.ts`
**Purpose**: Validates authentication logic, specifically the Google OAuth flow.
- **Scope**:
    - `googleAuth2` (New User): Mocks Google `userinfo` response, verifies user creation and JWT return.
    - `googleAuth2` (Existing User): Mocks updated userinfo, verifies record update and JWT return.
    - `googleAuth2` (Failure): Mocks network error, verifies exception throwing.
- **Mechanism**: Mocks the global `fetch` API to simulate Google API responses, allowing deterministic tests without network access or real credentials.

---

## 4. `auth.controller.test.ts`
**Purpose**: Tests HTTP validation and error mapping for Auth endpoints.
- **Scope**:
    - `POST /auth/google`: 400 for missing body, 403 for failed auth service integration.
    - `GET /auth/google/callback`: 400 for missing code, 403 for invalid/failed exchange.
- **Mechanism**: Uses `app.inject()` on an isolated Fastify instance. Mocks global `fetch` to simulate both Google Userinfo and Token exchange responses.

---

## 5. `test-course-list.ts`, `test-create-course.ts`, etc.
**Purpose**: Granular feature-specific tests for the Course Module.
- **Scope**: These individual files isolate complex Course operations (like list retrieval, creation, and name-based searches) into specific lifecycle tests.
- **Mechanism**: Each file runs database operations via service calls and verifies state. These form the building blocks for the Course test suite.
