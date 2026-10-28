import { getCourseList } from "../src/services/course.service.js";

async function testGetCourseList() {
  try {
    const courseNames = await getCourseList();

    console.log("=== Test: Get Course List ===");
    console.log(`Course names found: ${courseNames.length}`);
    console.dir(courseNames, { depth: null });

    // Check for duplicates.
    const hasDuplicates =
      courseNames.length !== new Set(courseNames).size;

    console.log(`Has duplicates: ${hasDuplicates}`);

    // Check for empty or null-equivalent names.
    const hasInvalidNames = courseNames.some(
      (name) => name === "" || name == null
    );

    console.log(`Has invalid names: ${hasInvalidNames}`);

    // Check alphabetical ordering.
    const isSorted = courseNames.every(
      (name, index) =>
        index === 0 || courseNames[index - 1] <= name
    );

    console.log(`Sorted alphabetically: ${isSorted}`);

    // Report test results.
    const passed =
      !hasDuplicates && !hasInvalidNames && isSorted;

    console.log(`\nOverall result: ${passed ? "PASS" : "FAIL"}`);

    if (!passed) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error("Failed to retrieve course list:", error);
    process.exitCode = 1;
  }
}

testGetCourseList();
