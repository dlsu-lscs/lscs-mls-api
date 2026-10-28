import { pool } from "../src/db/index.js";
import { addSelectedCourse, getUserSelectedCourses, removeSelectedCourse } from "../src/services/selected-course.service.js";
import { createCourse } from "../src/services/course.service.js";
import { createUser } from "../src/services/user.service.js";

const TEST_USER_ID = 99999;
let TEST_USER_UID: number;
let TEST_COURSE_ID_1: number;
let TEST_COURSE_ID_2: number;

async function cleanTestData() {
  await pool.query("DELETE FROM selected_courses WHERE user_id = $1", [TEST_USER_UID]);
  await pool.query("DELETE FROM courses WHERE cid IN ($1, $2)", [TEST_COURSE_ID_1, TEST_COURSE_ID_2]);
  await pool.query("DELETE FROM users WHERE uid = $1", [TEST_USER_UID]);
}

async function setupTestUser() {
  const user = await createUser({
    email: "test.selected@example.com",
    givenName: "Test",
    familyName: "Selected",
    userId: "test-selected-user-001",
    pictureUrl: "https://example.com/test.png",
  });
  if (!user) {
    throw new Error("Failed to create test user");
  }
  TEST_USER_UID = user.id;
  console.log(`Created test user: ${TEST_USER_UID}`);
}

async function setupTestCourses() {
  // Create two test courses with overlapping timeslots to test conflict detection
  await createCourse(
    {
      courseName: "TEST - Course One",
      section: "TEST-101",
      remarks: "Test course for selected courses",
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
      {
        day: "WED",
        time: "08:00-10:00",
        room: "LAB-1",
        instructor: "Test Instructor",
      },
    ]
  );

  await createCourse(
    {
      courseName: "TEST - Course Two",
      section: "TEST-102",
      remarks: "Test course for selected courses",
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
      {
        day: "FRI",
        time: "10:00-12:00",
        room: "LAB-3",
        instructor: "Test Instructor 2",
      },
    ]
  );

  // Get the created course IDs
  const result = await pool.query(
    "SELECT cid FROM courses WHERE course_name LIKE 'TEST - Course%' ORDER BY cid"
  );

  if (result.rows.length >= 2) {
    TEST_COURSE_ID_1 = result.rows[0].cid;
    TEST_COURSE_ID_2 = result.rows[1].cid;
    console.log(`Created test courses: ${TEST_COURSE_ID_1}, ${TEST_COURSE_ID_2}`);
  } else {
    throw new Error("Failed to create test courses");
  }
}

export async function runSelectedCourseServiceTests() {
  console.log("=========================================");
  console.log("  RUNNING SELECTED COURSE SERVICE TESTS");
  console.log("=========================================\n");

  try {
    await cleanTestData();
    await setupTestUser();
    await setupTestCourses();

    // 1. addSelectedCourse - Course not found
    {
      const result = await addSelectedCourse(TEST_USER_UID, 999999);
      if (result.success !== false || !result.message.includes("not found")) {
        throw new Error(`Expected course not found error, got: ${JSON.stringify(result)}`);
      }
      console.log("✓ addSelectedCourse (non-existent course) -> 404 not found");
    }

    // 2. addSelectedCourse - Success (first save)
    {
      const result = await addSelectedCourse(TEST_USER_UID, TEST_COURSE_ID_1);
      if (!result.success) {
        throw new Error(`Expected success, got: ${result.message}`);
      }
      console.log("✓ addSelectedCourse (first save) -> success");
    }

    // 3. addSelectedCourse - Duplicate save
    {
      const result = await addSelectedCourse(TEST_USER_UID, TEST_COURSE_ID_1);
      if (result.success !== false || !result.message.includes("already saved")) {
        throw new Error(`Expected duplicate error, got: ${JSON.stringify(result)}`);
      }
      console.log("✓ addSelectedCourse (duplicate) -> 409 conflict");
    }

    // 4. addSelectedCourse - Conflict detection (Course 2 overlaps with Course 1 on MON)
    {
      const result = await addSelectedCourse(TEST_USER_UID, TEST_COURSE_ID_2);
      if (result.success !== false || !result.message.includes("Schedule conflict")) {
        throw new Error(`Expected schedule conflict error, got: ${JSON.stringify(result)}`);
      }
      console.log("✓ addSelectedCourse (conflict with existing) -> 409 conflict");
    }

    // 5. getUserSelectedCourses - Returns saved courses
    {
      const courses = await getUserSelectedCourses(TEST_USER_UID);
      if (!Array.isArray(courses)) {
        throw new Error("Expected array of courses");
      }
      if (courses.length === 0) {
        throw new Error("Expected at least one saved course");
      }
      if (courses[0].cid !== TEST_COURSE_ID_1) {
        throw new Error(`Expected saved course ID ${TEST_COURSE_ID_1}, got ${courses[0].cid}`);
      }
      console.log("✓ getUserSelectedCourses -> returns saved courses");
    }

    // 6. removeSelectedCourse - Success
    {
      const result = await removeSelectedCourse(TEST_USER_UID, TEST_COURSE_ID_1);
      if (!result.success) {
        throw new Error(`Expected success on remove, got: ${result.message}`);
      }
      console.log("✓ removeSelectedCourse -> success");
    }

    // 7. addSelectedCourse - After removal, can add again
    {
      const result = await addSelectedCourse(TEST_USER_UID, TEST_COURSE_ID_1);
      if (!result.success) {
        throw new Error(`Expected success after re-add, got: ${result.message}`);
      }
      console.log("✓ addSelectedCourse (re-add after removal) -> success");
    }

    // 8. removeSelectedCourse - Remove Course 1 again to test Course 2 without conflict
    {
      await removeSelectedCourse(TEST_USER_UID, TEST_COURSE_ID_1);
      console.log("✓ removeSelectedCourse -> Course 1 removed again");
    }

    // 9. addSelectedCourse - Now Course 2 should work (no conflicts)
    {
      const result = await addSelectedCourse(TEST_USER_UID, TEST_COURSE_ID_2);
      if (!result.success) {
        throw new Error(`Expected success adding Course 2 with no conflicts, got: ${result.message}`);
      }
      console.log("✓ addSelectedCourse (Course 2 with no conflicts) -> success");
    }

    // 10. getUserSelectedCourses - Only Course 2 saved
    {
      const courses = await getUserSelectedCourses(TEST_USER_UID);
      if (courses.length !== 1) {
        throw new Error(`Expected 1 course, got ${courses.length}`);
      }
      if (courses[0].cid !== TEST_COURSE_ID_2) {
        throw new Error(`Expected Course 2 (${TEST_COURSE_ID_2}), got ${courses[0].cid}`);
      }
      console.log("✓ getUserSelectedCourses -> returns Course 2 only");
    }

    // 11. addSelectedCourse - Add Course 1 back (should fail due to conflict with Course 2)
    {
      const result = await addSelectedCourse(TEST_USER_UID, TEST_COURSE_ID_1);
      if (result.success !== false || !result.message.includes("Schedule conflict")) {
        throw new Error(`Expected schedule conflict error adding Course 1, got: ${JSON.stringify(result)}`);
      }
      console.log("✓ addSelectedCourse (Course 1 conflicts with Course 2) -> 409 conflict");
    }

    // 12. removeSelectedCourse - Remove both
    {
      await removeSelectedCourse(TEST_USER_UID, TEST_COURSE_ID_1);
      await removeSelectedCourse(TEST_USER_UID, TEST_COURSE_ID_2);
      console.log("✓ removeSelectedCourse -> both removed");
    }

    // 11. getUserSelectedCourses - Empty after removal
    {
      const courses = await getUserSelectedCourses(TEST_USER_UID);
      if (courses.length !== 0) {
        throw new Error("Expected empty array after removal");
      }
      console.log("✓ getUserSelectedCourses (after removal) -> empty array");
    }

    await cleanTestData();
    console.log("\n✅ ALL SELECTED COURSE SERVICE TESTS PASSED!\n");
  } catch (error) {
    await cleanTestData();
    console.error("\n❌ SELECTED COURSE SERVICE TEST FAILED:", error);
    throw error;
  }
  // Note: pool.end() is handled by the aggregator
}

// Standalone execution support
if (
  process.argv[1]?.endsWith("selected-course.service.test.ts") ||
  process.argv[1]?.endsWith("selected-course.service.test.js")
) {
  runSelectedCourseServiceTests().catch(() => process.exit(1));
}