import {
  createUser,
  getAllUsers,
  getUserById,
  getUserByUserId,
  updateUser,
  deleteUser,
} from "../src/services/user.service.js";

export async function runUserServiceTests() {
  console.log("=========================================");
  console.log("  RUNNING USER SERVICE TESTS");
  console.log("=========================================\n");

  try {
    // 1. getUserByUserId should return null for non-existent user
    const missing = await getUserByUserId("nonexistent-user-xyz");
    if (missing !== null) throw new Error("Expected null for missing user");
    console.log("✓ getUserByUserId (missing) -> null");

    // 2. createUser
    const created = await createUser({
      email: "service.test@example.com",
      givenName: "Service",
      familyName: "TestUser",
      userId: "svc-user-001",
      pictureUrl: "https://example.com/pic.png",
    });
    if (!created) throw new Error("createUser returned null");
    console.log("✓ createUser -> ID:", created.id);

    // 3. Duplicate createUser should fail
    const dup = await createUser({
      email: "service.test@example.com",
      givenName: "Service",
      familyName: "TestUser",
      userId: "svc-user-001",
      pictureUrl: "https://example.com/pic.png",
    });
    if (dup !== null) throw new Error("Expected null for duplicate user");
    console.log("✓ createUser (duplicate) -> null (409 conflict scenario)");

    // 4. getUserByUserId
    const foundByUserId = await getUserByUserId("svc-user-001");
    if (!foundByUserId || foundByUserId.userId !== "svc-user-001") {
      throw new Error("getUserByUserId verification failed");
    }
    console.log("✓ getUserByUserId -> found:", foundByUserId.userId);

    // 5. getUserById
    const foundById = await getUserById(created.id);
    if (!foundById || foundById.id !== created.id) {
      throw new Error("getUserById verification failed");
    }
    console.log("✓ getUserById -> found ID:", foundById.id);

    // 6. getAllUsers
    const all = await getAllUsers();
    if (!all.some((u) => u.id === created.id)) {
      throw new Error("Created user missing from getAllUsers");
    }
    console.log("✓ getAllUsers -> total users count:", all.length);

    // 7. updateUser
    const updated = await updateUser(created.id, {
      givenName: "UpdatedService",
      pictureUrl: "https://example.com/new-pic.png",
    });
    if (!updated || updated.givenName !== "UpdatedService" || updated.familyName !== "TestUser") {
      throw new Error("updateUser failed or distorted existing fields");
    }
    console.log("✓ updateUser -> updated givenName:", updated.givenName);

    // 8. updateUser non-existent ID
    const notFound = await updateUser(999999, { givenName: "Ghost" });
    if (notFound !== null) throw new Error("Expected null for missing user update");
    console.log("✓ updateUser (missing ID) -> null");

    // 9. deleteUser
    const deleted = await deleteUser(created.id);
    if (!deleted) throw new Error("deleteUser returned false");
    console.log("✓ deleteUser -> true");

    // 10. deleteUser again (idempotency check)
    const deletedAgain = await deleteUser(created.id);
    if (deletedAgain !== false) throw new Error("Expected false on second delete");
    console.log("✓ deleteUser (already deleted) -> false");

    // 11. Verify user is gone
    const gone = await getUserById(created.id);
    if (gone !== null) throw new Error("User still exists after deletion");
    console.log("✓ getUserById (after delete) -> null");

    console.log("\n✅ ALL USER SERVICE TESTS PASSED!\n");
  } catch (error) {
    console.error("\n❌ USER SERVICE TEST FAILED:", error);
    throw error;
  }
}

// Standalone execution support
if (process.argv[1]?.endsWith("user.service.test.ts") || process.argv[1]?.endsWith("user.service.test.js")) {
  runUserServiceTests().catch(() => process.exit(1));
}