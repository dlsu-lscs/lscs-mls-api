import { pool } from "../src/db/index.js";
import { createCourse, getCourseById, getAllCoursesByCourseName, getInstructorsByCourseName, getUniqueTerms, getCourseList, getUniqueCampuses, updateCourse, deleteCourseByCourseName } from "../src/services/course.service.js";

async function cleanTestCourses() {
  await pool.query(
    "DELETE FROM courses WHERE course_name LIKE '%TEST%' OR course_name LIKE '%Introduction to Programming%'"
  );
}

async function runCourseTests() {
  console.log("=========================================");
  console.log("  RUNNING COURSE SERVICE TESTS");
  console.log("=========================================\n");

  try {
    // 1. Cleanup
    await cleanTestCourses();

    // 2. Test createCourse
    console.log("Testing createCourse...");
    await createCourse(
      {
        courseName: "TEST - Introduction to Programming",
        section: "TEST-101",
        remarks: "Temporary test record",
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
    console.log("✓ createCourse passed");

    // 3. Test getAllCoursesByCourseName
    console.log("Testing getAllCoursesByCourseName...");
    const foundCourses = await getAllCoursesByCourseName("TEST - Introduction");
    if (foundCourses.length === 0) throw new Error("getAllCoursesByCourseName failed");
    const testCourseId = foundCourses[0].cid;
    console.log(`✓ getAllCoursesByCourseName passed (ID: ${testCourseId})`);

    // 4. Test getCourseById
    console.log("Testing getCourseById...");
    const courseById = await getCourseById(testCourseId);
    if (!courseById || courseById.courseName !== "TEST - Introduction to Programming") {
      throw new Error("getCourseById failed");
    }
    console.log("✓ getCourseById passed");

    // 5. Test getInstructorsByCourseName
    console.log("Testing getInstructorsByCourseName...");
    const instructors = await getInstructorsByCourseName("TEST - Introduction to Programming");
    if (!instructors.includes("Test Instructor")) {
      throw new Error("getInstructorsByCourseName failed");
    }
    console.log("✓ getInstructorsByCourseName passed");

    // 6. Test getUniqueTerms & getUniqueCampuses & getCourseList
    console.log("Testing unique lists (Campuses, Terms, CourseList)...");
    const terms = await getUniqueTerms();
    const campuses = await getUniqueCampuses();
    const courseList = await getCourseList();
    if (!terms.includes("Test Term") || !campuses.includes("Test Campus") || !courseList.includes("TEST - Introduction to Programming")) {
      throw new Error("Unique lookups or course list failed");
    }
    console.log("✓ Unique lookups & course list passed");

    // 7. Test updateCourse
    console.log("Testing updateCourse...");
    await updateCourse(
      testCourseId,
      { remarks: "Updated remarks" },
      { enrolled: 30 },
      [
        {
          day: "MON",
          time: "08:00-10:00",
          room: "LAB-2",
          instructor: "New Instructor",
        }
      ]
    );
    const updated = await getCourseById(testCourseId);
    if (updated?.remarks !== "Updated remarks" || updated.status?.enrolled !== 30) {
      throw new Error("updateCourse failed");
    }
    console.log("✓ updateCourse passed");

    // 8. Cleanup test data
    await cleanTestCourses();
    console.log("\n✅ ALL COURSE SERVICE TESTS PASSED!\n");
  } catch (error) {
    console.error("\n❌ COURSE SERVICE TEST FAILED:", error);
    await cleanTestCourses();
    throw error;
  } finally {
    await pool.end();
  }
}

runCourseTests();