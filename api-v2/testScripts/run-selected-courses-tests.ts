import { pool } from "../src/db/index.js";
import { runSelectedCourseServiceTests } from "./selected-course.service.test.js";
import { runSelectedCourseControllerTests } from "./selected-courses.controller.test.js";

async function runAllTests() {
  console.log("\n🚀 STARTING SELECTED COURSES TEST AGGREGATOR (SERVICE + CONTROLLER)\n");
  const startTime = Date.now();

  try {
    await runSelectedCourseServiceTests();

    await runSelectedCourseControllerTests();

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log("=========================================");
    console.log(`🎉 ALL SELECTED COURSES TESTS PASSED SUCCESSFULLY in ${elapsed}s`);
    console.log("=========================================\n");
  } catch (error) {
    console.error("\n💥 AGGREGATOR SUITE FAILED:", error);
    try {
      await pool.query("DELETE FROM selected_courses WHERE user_id = 99999");
    } catch {
      // Ignore cleanup error
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runAllTests();