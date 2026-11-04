import {
  createUser,
  getAllUsers,
  getUserById,
  getUserByUserId,
  updateUser,
  deleteUser,
} from "../src/services/user.service.js";

async function testUserService() {
  try {
    // 1. getUserByUserId should return null for a non-existent user
    const missing = await getUserByUserId("nonexistent-user-xyz");
    console.assert(missing === null, "Expected null for missing user");
    console.log("getUserByUserId (missing) -> null: OK");

    // 2. createUser
    const created = await createUser({
      email: "test.user@example.com",
      givenName: "Test",
      familyName: "User",
      userId: "test-user-001",
      pictureUrl: "https://example.com/pic.png",
    });
    if (!created) {
      throw new Error("createUser returned null (user may already exist)");
    }
    console.log("createUser ->", created);

    // 3. createUser duplicate should return null
    const dup = await createUser({
      email: "test.user@example.com",
      givenName: "Test",
      familyName: "User",
      userId: "test-user-001",
      pictureUrl: "https://example.com/pic.png",
    });
    console.assert(dup === null, "Expected null for duplicate user");
    console.log("createUser (duplicate) -> null: OK");

    // 4. getUserByUserId
    const foundByUserId = await getUserByUserId("test-user-001");
    if (!foundByUserId) throw new Error("getUserByUserId failed");
    console.assert(foundByUserId.userId === "test-user-001");
    console.log("getUserByUserId ->", foundByUserId);

    // 5. getUserById
    const foundById = await getUserById(created.id);
    if (!foundById) throw new Error("getUserById failed");
    console.assert(foundById.id === created.id);
    console.log("getUserById ->", foundById);

    // 6. getAllUsers
    const all = await getAllUsers();
    console.assert(all.some((u) => u.id === created.id), "Expected created user in list");
    console.log("getAllUsers count ->", all.length);

    // 7. updateUser
    const updated = await updateUser(created.id, {
      givenName: "Updated",
      pictureUrl: "https://example.com/new.png",
    });
    if (!updated) throw new Error("updateUser failed");
    console.assert(updated.givenName === "Updated");
    console.assert(updated.pictureUrl === "https://example.com/new.png");
    console.assert(updated.familyName === "User", "familyName should be unchanged");
    console.log("updateUser ->", updated);

    // 8. updateUser on non-existent id
    const notFound = await updateUser(99999999, { givenName: "Nope" });
    console.assert(notFound === null, "Expected null for update on missing user");
    console.log("updateUser (missing) -> null: OK");

    // 9. deleteUser
    const deleted = await deleteUser(created.id);
    console.assert(deleted === true, "Expected deleteUser to return true");
    console.log("deleteUser -> true: OK");

    // 10. deleteUser on non-existent id
    const deletedAgain = await deleteUser(created.id);
    console.assert(deletedAgain === false, "Expected deleteUser to return false");
    console.log("deleteUser (missing) -> false: OK");

    // 11. user should be gone
    const gone = await getUserById(created.id);
    console.assert(gone === null, "Expected null after delete");
    console.log("getUserById (after delete) -> null: OK");

    console.log("\nALL USER SERVICE TESTS PASSED!");
  } catch (error) {
    console.error("USER SERVICE TEST FAILED:", error);
    process.exit(1);
  }
}

testUserService();