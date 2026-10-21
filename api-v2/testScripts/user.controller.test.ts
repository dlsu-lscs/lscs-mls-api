import Fastify from "fastify";
import cors from "@fastify/cors";
import userRoutes from "../src/routes/user.routes.js";

export async function runUserControllerTests() {
  console.log("=========================================");
  console.log("  RUNNING USER CONTROLLER / ROUTE TESTS");
  console.log("=========================================\n");

  // Build isolated Fastify instance using app.inject() (no open ports needed)
  const app = Fastify({ logger: false });
  await app.register(cors);
  await app.register(userRoutes, { prefix: "/users" });
  await app.ready();

  try {
    // 1. GET /users (initially empty or existing list)
    const resGetInitial = await app.inject({
      method: "GET",
      url: "/users",
    });
    if (resGetInitial.statusCode !== 200) {
      throw new Error(`GET /users failed with status ${resGetInitial.statusCode}`);
    }
    console.log("✓ GET /users -> 200 OK");

    // 2. POST /users (Create User)
    const newUser = {
      email: "ctrl.test@example.com",
      givenName: "CtrlTest",
      familyName: "User",
      userId: "ctrl-user-001",
      pictureUrl: "https://example.com/ctrl.png",
    };

    const resPost = await app.inject({
      method: "POST",
      url: "/users",
      payload: newUser,
    });
    if (resPost.statusCode !== 201) {
      throw new Error(`POST /users failed: ${resPost.body}`);
    }
    const createdUser = JSON.parse(resPost.body);
    if (!createdUser.id || createdUser.userId !== newUser.userId) {
      throw new Error("POST /users returned unexpected response payload");
    }
    console.log("✓ POST /users -> 201 Created (ID:", createdUser.id, ")");

    // 3. POST /users duplicate (Conflict check)
    const resPostDup = await app.inject({
      method: "POST",
      url: "/users",
      payload: newUser,
    });
    if (resPostDup.statusCode !== 409) {
      throw new Error(`Expected 409 Conflict for duplicate user, got ${resPostDup.statusCode}`);
    }
    console.log("✓ POST /users (duplicate) -> 409 Conflict");

    // 4. GET /users/:id (Found)
    const resGetById = await app.inject({
      method: "GET",
      url: `/users/${createdUser.id}`,
    });
    if (resGetById.statusCode !== 200) {
      throw new Error(`GET /users/:id failed with status ${resGetById.statusCode}`);
    }
    console.log("✓ GET /users/:id -> 200 OK");

    // 5. GET /users/:id (Invalid ID format)
    const resGetInvalidId = await app.inject({
      method: "GET",
      url: "/users/abc-not-a-number",
    });
    if (resGetInvalidId.statusCode !== 400) {
      throw new Error(`Expected 400 Bad Request for non-numeric ID, got ${resGetInvalidId.statusCode}`);
    }
    console.log("✓ GET /users/abc -> 400 Bad Request");

    // 6. GET /users/:id (Not Found)
    const resGetNotFound = await app.inject({
      method: "GET",
      url: "/users/999999",
    });
    if (resGetNotFound.statusCode !== 404) {
      throw new Error(`Expected 404 Not Found, got ${resGetNotFound.statusCode}`);
    }
    console.log("✓ GET /users/999999 -> 404 Not Found");

    // 7. PUT /users/:id (Update User)
    const resPut = await app.inject({
      method: "PUT",
      url: `/users/${createdUser.id}`,
      payload: { givenName: "UpdatedCtrlName" },
    });
    if (resPut.statusCode !== 200) {
      throw new Error(`PUT /users/:id failed: ${resPut.body}`);
    }
    const updatedUser = JSON.parse(resPut.body);
    if (updatedUser.givenName !== "UpdatedCtrlName") {
      throw new Error("PUT /users/:id failed to update givenName");
    }
    console.log("✓ PUT /users/:id -> 200 OK (updated givenName)");

    // 8. PUT /users/:id with empty payload (Validation check)
    const resPutEmpty = await app.inject({
      method: "PUT",
      url: `/users/${createdUser.id}`,
      payload: {},
    });
    if (resPutEmpty.statusCode !== 400) {
      throw new Error(`Expected 400 Bad Request for empty update payload, got ${resPutEmpty.statusCode}`);
    }
    console.log("✓ PUT /users/:id (empty body) -> 400 Bad Request");

    // 9. DELETE /users/:id (Success)
    const resDelete = await app.inject({
      method: "DELETE",
      url: `/users/${createdUser.id}`,
    });
    if (resDelete.statusCode !== 200) {
      throw new Error(`DELETE /users/:id failed with status ${resDelete.statusCode}`);
    }
    console.log("✓ DELETE /users/:id -> 200 OK");

    // 10. DELETE /users/:id (Not Found / Already Deleted)
    const resDeleteNotFound = await app.inject({
      method: "DELETE",
      url: `/users/${createdUser.id}`,
    });
    if (resDeleteNotFound.statusCode !== 404) {
      throw new Error(`Expected 404 Not Found on second delete, got ${resDeleteNotFound.statusCode}`);
    }
    console.log("✓ DELETE /users/:id (already deleted) -> 404 Not Found");

    await app.close();
    console.log("\n✅ ALL USER CONTROLLER TESTS PASSED!\n");
  } catch (error) {
    await app.close();
    console.error("\n❌ USER CONTROLLER TEST FAILED:", error);
    throw error;
  }
}

// Standalone execution support
if (process.argv[1]?.endsWith("user.controller.test.ts") || process.argv[1]?.endsWith("user.controller.test.js")) {
  runUserControllerTests().catch(() => process.exit(1));
}