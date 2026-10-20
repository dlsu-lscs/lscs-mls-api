import { pool } from "../src/db/index.js";
import { runAuthServiceTests } from "./auth.service.test.js";
import { runAuthControllerTests } from "./auth.controller.test.js";

async function runAllTests() {
  const startTime = Date.now();
  try {
    await runAuthServiceTests();
    await runAuthControllerTests();
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log("=========================================");
    console.log(`🎉 ALL AUTH TESTS PASSED SUCCESSFULLY in ${elapsed}s`);
    console.log("=========================================\n");
  } catch (error) {
    console.error("\n💥 AGGREGATOR SUITE FAILED:", error);
    try {
      await pool.query("DELETE FROM users WHERE user_id LIKE 'auth-svc-%'");
    } catch {
      // Ignore cleanup error
    }
    process.exit(1);
  }
  // pool.end() is already called by runAuthServiceTests
}

runAllTests();
