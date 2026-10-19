import { pool } from "../src/db/index.js";
import { runUserServiceTests } from "./user.service.test.js";
import { runUserControllerTests } from "./user.controller.test.js";

async function cleanTestUsers() {
  await pool.query(
    "DELETE FROM users WHERE user_id LIKE 'svc-%' OR user_id LIKE 'ctrl-%' OR user_id LIKE 'test-%'"
  );
}

async function runAllTests() {
  console.log("\n🚀 STARTING USER TEST AGGREGATOR (SERVICE + CONTROLLER)\n");
  const startTime = Date.now();

  try {
    // 1. Initial cleanup
    await cleanTestUsers();

    // 2. Run service layer tests
    await runUserServiceTests();

    // 3. Intermediate cleanup
    await cleanTestUsers();

    // 4. Run controller/route layer tests
    await runUserControllerTests();

    // 5. Final cleanup
    await cleanTestUsers();

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log("=========================================");
    console.log(`🎉 ALL USER TESTS PASSED SUCCESSFULLY in ${elapsed}s`);
    console.log("=========================================\n");
  } catch (error) {
    console.error("\n💥 AGGREGATOR SUITE FAILED:", error);
    try {
      await cleanTestUsers();
    } catch {
      // Ignore cleanup error
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runAllTests();