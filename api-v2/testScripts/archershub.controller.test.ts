import Fastify from "fastify";
import cors from "@fastify/cors";
import archershubRoutes from "../src/routes/archershub.routes.js";
import { pool } from "../src/db/index.js";
import { createCourse } from "../src/services/course.service.js";
import { createUser } from "../src/services/user.service.js";

let TEST_COURSE_ID_1: number;
let TEST_COURSE_ID_2: number;

async function setupTestData() {
  // Create test user (needed for course FK if any, though courses don't require user)
  const user = await createUser({
    email: "test.archershub@example.com",
    givenName: "Test",
    familyName: "ArchersHub",
    userId: "test-archershub-user-001",
    pictureUrl: "https://example.com/test.png",
  });

  // Create test courses with different campuses/terms
  await createCourse(
    {
      courseName: "TEST - ArchersHub Course One",
      section: "AH-101",
      remarks: "Test course for archershub",
      modality: "Face-to-face",
      term: "Spring 2024",
      campus: "Main Campus",
    },
    { enrollCap: 40, enrolled: 25 },
    [
      { day: "MON", time: "08:00-10:00", room: "LAB-1", instructor: "Instructor A" },
    ]
  );

  await createCourse(
    {
      courseName: "TEST - ArchersHub Course Two",
      section: "AH-102",
      remarks: "Test course for archershub",
      modality: "Online",
      term: "Fall 2024",
      campus: "Satellite Campus",
    },
    { enrollCap: 30, enrolled: 15 },
    [
      { day: "TUE", time: "10:00-12:00", room: "LAB-2", instructor: "Instructor B" },
    ]
  );

  const result = await pool.query(
    "SELECT cid FROM courses WHERE course_name LIKE 'TEST - ArchersHub Course%' ORDER BY cid"
  );

  if (result.rows.length >= 2) {
    TEST_COURSE_ID_1 = result.rows[0].cid;
    TEST_COURSE_ID_2 = result.rows[1].cid;
    console.log(`Created archershub test courses: ${TEST_COURSE_ID_1}, ${TEST_COURSE_ID_2}`);
  } else {
    throw new Error("Failed to create test courses for archershub");
  }
}

async function cleanupTestData() {
  await pool.query("DELETE FROM courses WHERE cid IN ($1, $2)", [TEST_COURSE_ID_1, TEST_COURSE_ID_2]);
  await pool.query("DELETE FROM users WHERE user_id = $1", ["test-archershub-user-001"]);
}

export async function runArchersHubControllerTests() {
  console.log("=========================================");
  console.log("  RUNNING ARCHERSHUB CONTROLLER TESTS");
  console.log("=========================================\n");

  await setupTestData();

  const app = Fastify({ logger: false });
  await app.register(cors);
  await app.register(archershubRoutes);
  await app.ready();

  try {
    // 1. GET /campuses - Returns unique campuses
    {
      const res = await app.inject({ method: "GET", url: "/campuses" });
      if (res.statusCode !== 200) {
        throw new Error(`Expected 200, got ${res.statusCode}: ${res.body}`);
      }
      const campuses = JSON.parse(res.body);
      if (!Array.isArray(campuses)) {
        throw new Error("Expected array response");
      }
      if (!campuses.includes("Main Campus")) {
        throw new Error("Expected 'Main Campus' in results");
      }
      if (!campuses.includes("Satellite Campus")) {
        throw new Error("Expected 'Satellite Campus' in results");
      }
      console.log("✓ GET /campuses -> 200 OK with unique campuses");
    }

    // 2. GET /terms - Returns unique terms
    {
      const res = await app.inject({ method: "GET", url: "/terms" });
      if (res.statusCode !== 200) {
        throw new Error(`Expected 200, got ${res.statusCode}: ${res.body}`);
      }
      const terms = JSON.parse(res.body);
      if (!Array.isArray(terms)) {
        throw new Error("Expected array response");
      }
      if (!terms.includes("Spring 2024")) {
        throw new Error("Expected 'Spring 2024' in results");
      }
      if (!terms.includes("Fall 2024")) {
        throw new Error("Expected 'Fall 2024' in results");
      }
      console.log("✓ GET /terms -> 200 OK with unique terms");
    }

    // 3. GET /courses-list - Returns sorted course names
    {
      const res = await app.inject({ method: "GET", url: "/courses-list" });
      if (res.statusCode !== 200) {
        throw new Error(`Expected 200, got ${res.statusCode}: ${res.body}`);
      }
      const courses = JSON.parse(res.body);
      if (!Array.isArray(courses)) {
        throw new Error("Expected array response");
      }
      if (!courses.includes("TEST - ArchersHub Course One")) {
        throw new Error("Expected Course One in results");
      }
      if (!courses.includes("TEST - ArchersHub Course Two")) {
        throw new Error("Expected Course Two in results");
      }
      // Check alphabetical ordering
      const isSorted = courses.every((c, i) => i === 0 || courses[i - 1] <= c);
      if (!isSorted) {
        throw new Error("Courses list not sorted alphabetically");
      }
      console.log("✓ GET /courses-list -> 200 OK with sorted course names");
    }

    await app.close();
    await cleanupTestData();
    console.log("\n✅ ALL ARCHERSHUB CONTROLLER TESTS PASSED!\n");
  } catch (error) {
    await app.close();
    await cleanupTestData();
    console.error("\n❌ ARCHERSHUB CONTROLLER TEST FAILED:", error);
    throw error;
  }
}

// Standalone execution support
if (
  process.argv[1]?.endsWith("archershub.controller.test.ts") ||
  process.argv[1]?.endsWith("archershub.controller.test.js")
) {
  runArchersHubControllerTests().catch(() => process.exit(1));
}