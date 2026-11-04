import { getAllCoursesByCourseName } from "../src/services/course.service.ts";

async function testSearchCourses() {
  const testCases = [
    {
      label: "Partial course name",
      search: "Introduction to Programming",
    },
    {
      label: "Full course name",
      search: "TEST - Introduction to Programming",
    },
  ];

  for (const testCase of testCases) {
    console.log(`\n=== ${testCase.label} ===`);
    console.log(`Search query: "${testCase.search}"`);

    try {
      const results = await getAllCoursesByCourseName(testCase.search);

      console.log(`Results found: ${results.length}`);
      console.dir(results, { depth: null });
    } catch (error) {
      console.error(`Search failed for "${testCase.search}":`, error);
    }
  }

  process.exit(0);
}

testSearchCourses();
