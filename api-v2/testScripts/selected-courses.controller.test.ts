import Fastify from "fastify";
import cors from "@fastify/cors";
import selectedCoursesRoutes from "../src/routes/selected-courses.routes.js";
import jwt from "jsonwebtoken";
import { pool } from "../src/db/index.js";
import { createCourse } from "../src/services/course.service.js";
import { createUser } from "../src/services/user.service.js";

let TEST_USER_UID: number;
let TEST_COURSE_ID_1: number;
let TEST_COURSE_ID_2: number;

function generateTestToken(userId: number): string {
  return jwt.sign(
    { userId: `test-sub-${userId}`, email: "test@example.com", uid: userId },
    process.env.JWT_SECRET as string,
    { expiresIn: "1h" }
  );
}

async function setupTestData() {
  // Create test user
  const user = await createUser({
    email: "test.controller@example.com",
    givenName: "Test",
    familyName: "Controller",
    userId: "test-controller-user-001",
    pictureUrl: "https://example.com/test.png",
  });
  if (!user) {
    throw new Error("Failed to create test user");
  }
  TEST_USER_UID = user.id;

  // Create two test courses with overlapping timeslots
  await createCourse(
    {
      courseName: "TEST - Controller Course One",
      section: "TST-101",
      remarks: "Test course for controller tests",
      modality: "Face-to-face",
      term: "Test Term",
      campus: "Test Campus",
    },
    {
      enrollCap: 40,
      enrolled: 25,
    },
    [
      {
        day: "MON",
        time: "08:00-10:00",
        room: "LAB-1",
        instructor: "Test Instructor",
      },
    ]
  );

  await createCourse(
    {
      courseName: "TEST - Controller Course Two",
      section: "TST-102",
      remarks: "Test course for controller tests",
      modality: "Face-to-face",
      term: "Test Term",
      campus: "Test Campus",
    },
    {
      enrollCap: 30,
      enrolled: 15,
    },
    [
      {
        day: "MON",
        time: "09:00-11:00",  // Overlaps with Course 1 on MON
        room: "LAB-2",
        instructor: "Test Instructor 2",
      },
    ]
  );

  // Get the created course IDs
  const result = await pool.query(
    "SELECT cid FROM courses WHERE course_name LIKE 'TEST - Controller Course%' ORDER BY cid"
  );

  if (result.rows.length >= 2) {
    TEST_COURSE_ID_1 = result.rows[0].cid;
    TEST_COURSE_ID_2 = result.rows[1].cid;
    console.log(`Created controller test courses: ${TEST_COURSE_ID_1}, ${TEST_COURSE_ID_2}`);
  } else {
    throw new Error("Failed to create test courses for controller");
  }
}

async function cleanupTestData() {
  await pool.query("DELETE FROM selected_courses WHERE user_id = $1", [TEST_USER_UID]);
  await pool.query("DELETE FROM courses WHERE cid IN ($1, $2)", [TEST_COURSE_ID_1, TEST_COURSE_ID_2]);
  await pool.query("DELETE FROM users WHERE uid = $1", [TEST_USER_UID]);
}

export async function runSelectedCourseControllerTests() {
  console.log("=========================================");
  console.log("  RUNNING SELECTED COURSE CONTROLLER TESTS");
  console.log("=========================================\n");

  await setupTestData();

  const app = Fastify({ logger: false });
  await app.register(cors);
  await app.register(selectedCoursesRoutes);
  await app.ready();

  const testToken = generateTestToken(TEST_USER_UID);

  try {
    // 1. POST /users/:id/courses - No auth header
    {
      const res = await app.inject({
        method: "POST",
        url: `/users/${TEST_USER_UID}/courses`,
        payload: { courseId: TEST_COURSE_ID_1 },
      });
      if (res.statusCode !== 401) {
        throw new Error(`Expected 401 without auth, got ${res.statusCode}`);
      }
      console.log("✓ POST /users/:id/courses (no auth) -> 401 Unauthorized");
    }

    // 2. POST /users/:id/courses - With auth but invalid courseId
    {
      const res = await app.inject({
        method: "POST",
        url: `/users/${TEST_USER_UID}/courses`,
        payload: { courseId: "invalid" },
        headers: { authorization: `Bearer ${testToken}` },
      });
      if (res.statusCode !== 400) {
        throw new Error(`Expected 400 for invalid courseId, got ${res.statusCode}: ${res.body}`);
      }
      console.log("✓ POST /users/:id/courses (invalid courseId) -> 400 Bad Request");
    }

    // 3. POST /users/:id/courses - With auth, course not found
    {
      const res = await app.inject({
        method: "POST",
        url: `/users/${TEST_USER_UID}/courses`,
        payload: { courseId: 999999 },
        headers: { authorization: `Bearer ${testToken}` },
      });
      if (res.statusCode !== 404) {
        throw new Error(`Expected 404 for non-existent course, got ${res.statusCode}: ${res.body}`);
      }
      console.log("✓ POST /users/:id/courses (course not found) -> 404 Not Found");
    }

    // 4. POST /users/:id/courses - With auth, success
    {
      const res = await app.inject({
        method: "POST",
        url: `/users/${TEST_USER_UID}/courses`,
        payload: { courseId: TEST_COURSE_ID_1 },
        headers: { authorization: `Bearer ${testToken}` },
      });
      if (res.statusCode !== 201) {
        throw new Error(`Expected 201, got ${res.statusCode}: ${res.body}`);
      }
      console.log("✓ POST /users/:id/courses (with auth) -> 201 Created");
    }

    // 5. POST /users/:id/courses - Duplicate (should return 409)
    {
      const res = await app.inject({
        method: "POST",
        url: `/users/${TEST_USER_UID}/courses`,
        payload: { courseId: TEST_COURSE_ID_1 },
        headers: { authorization: `Bearer ${testToken}` },
      });
      if (res.statusCode !== 409) {
        throw new Error(`Expected 409 for duplicate, got ${res.statusCode}: ${res.body}`);
      }
      console.log("✓ POST /users/:id/courses (duplicate) -> 409 Conflict");
    }

    // 6. POST /users/:id/courses - Conflict with existing (Course 2 overlaps with Course 1)
    {
      const res = await app.inject({
        method: "POST",
        url: `/users/${TEST_USER_UID}/courses`,
        payload: { courseId: TEST_COURSE_ID_2 },
        headers: { authorization: `Bearer ${testToken}` },
      });
      if (res.statusCode !== 409) {
        throw new Error(`Expected 409 for conflict, got ${res.statusCode}: ${res.body}`);
      }
      console.log("✓ POST /users/:id/courses (schedule conflict) -> 409 Conflict");
    }

    // 7. GET /users/:id/courses - No auth
    {
      const res = await app.inject({
        method: "GET",
        url: `/users/${TEST_USER_UID}/courses`,
      });
      if (res.statusCode !== 401) {
        throw new Error(`Expected 401 without auth, got ${res.statusCode}`);
      }
      console.log("✓ GET /users/:id/courses (no auth) -> 401 Unauthorized");
    }

    // 8. GET /users/:id/courses - With auth
    {
      const res = await app.inject({
        method: "GET",
        url: `/users/${TEST_USER_UID}/courses`,
        headers: { authorization: `Bearer ${testToken}` },
      });
      if (res.statusCode !== 200) {
        throw new Error(`Expected 200, got ${res.statusCode}: ${res.body}`);
      }
      const courses = JSON.parse(res.body);
      if (!Array.isArray(courses)) {
        throw new Error("Expected array response");
      }
      if (courses.length !== 1) {
        throw new Error(`Expected 1 course, got ${courses.length}`);
      }
      console.log("✓ GET /users/:id/courses (with auth) -> 200 OK with saved courses");
    }

    // 9. DELETE /users/:userId/courses/:courseId - No auth
    {
      const res = await app.inject({
        method: "DELETE",
        url: `/users/${TEST_USER_UID}/courses/${TEST_COURSE_ID_1}`,
      });
      if (res.statusCode !== 401) {
        throw new Error(`Expected 401 without auth, got ${res.statusCode}`);
      }
      console.log("✓ DELETE /users/:userId/courses/:courseId (no auth) -> 401 Unauthorized");
    }

    // 10. DELETE /users/:userId/courses/:courseId - With auth, success
    {
      const res = await app.inject({
        method: "DELETE",
        url: `/users/${TEST_USER_UID}/courses/${TEST_COURSE_ID_1}`,
        headers: { authorization: `Bearer ${testToken}` },
      });
      if (res.statusCode !== 200) {
        throw new Error(`Expected 200, got ${res.statusCode}: ${res.body}`);
      }
      console.log("✓ DELETE /users/:userId/courses/:courseId (with auth) -> 200 OK");
    }

    // 11. DELETE /users/:userId/courses/:courseId - Not found (already deleted)
    {
      const res = await app.inject({
        method: "DELETE",
        url: `/users/${TEST_USER_UID}/courses/${TEST_COURSE_ID_1}`,
        headers: { authorization: `Bearer ${testToken}` },
      });
      if (res.statusCode !== 404) {
        throw new Error(`Expected 404 for already deleted, got ${res.statusCode}: ${res.body}`);
      }
      console.log("✓ DELETE /users/:userId/courses/:courseId (already deleted) -> 404 Not Found");
    }

    await app.close();
    await cleanupTestData();
    console.log("\n✅ ALL SELECTED COURSE CONTROLLER TESTS PASSED!\n");
  } catch (error) {
    await app.close();
    await cleanupTestData();
    console.error("\n❌ SELECTED COURSE CONTROLLER TEST FAILED:", error);
    throw error;
  }
}

// Standalone execution support
if (
  process.argv[1]?.endsWith("selected-courses.controller.test.ts") ||
  process.argv[1]?.endsWith("selected-courses.controller.test.js")
) {
  runSelectedCourseControllerTests().catch(() => process.exit(1));
}