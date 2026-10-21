import { getCourseById } from "../src/services/course.service.js";

async function testGetCourseById() {
  try {
    const course = await getCourseById(1);

    if (!course) {
      console.log("No course found for that ID.");
      return;
    }

    console.log("Course lookup passed!");
    console.dir(course, { depth: null });
  } catch (error) {
    console.error("Course lookup failed: check if the database is empty", error);
  }
}

testGetCourseById();
