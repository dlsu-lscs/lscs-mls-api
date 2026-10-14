import { getInstructorsByCourseName } from "../src/services/course.service.js";

async function testGetInstructorsByCourseName() {
  const searchName = "TEST - Introduction to Programming";

  try {
    const instructors =
      await getInstructorsByCourseName(searchName);

    console.log("=== Test: Get Instructors By Course Name ===");
    console.log(`Search: "${searchName}"`);
    console.log(`Instructors found: ${instructors.length}`);
    console.dir(instructors, { depth: null });

    // Verify that the returned values are distinct.
    const hasDuplicates =
      instructors.length !== new Set(instructors).size;

    console.log(`Has duplicates: ${hasDuplicates}`);

    // Verify that every result is a string or null.
    const hasInvalidValues = instructors.some(
      (instructor) =>
        instructor !== null && typeof instructor !== "string"
    );

    console.log(`Has invalid values: ${hasInvalidValues}`);

    const passed = !hasDuplicates && !hasInvalidValues;

    console.log(`\nOverall result: ${passed ? "PASS" : "FAIL"}`);

    if (!passed) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error("Failed to retrieve instructors:", error);
    process.exitCode = 1;
  }
}

testGetInstructorsByCourseName();
