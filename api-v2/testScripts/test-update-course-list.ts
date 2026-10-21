import { eq } from "drizzle-orm";

import { updateCourse } from "../src/services/course.service.ts";
import { db } from "../src/db/index.ts";
import { courses } from "../src/db/schema/courses.ts";

async function testUpdateCourse() {
  try {
    // 1. Find the existing test course.
    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.courseName, "TEST - Introduction to Programming"))
      .limit(1);

    if (!course) {
      throw new Error(
        'Test course not found. Run test-create-course.ts first.'
      );
    }

    console.log(`Found test course with ID: ${course.cid}`);

    // 2. Update the course details, enrollment, and timeslots.
    await updateCourse(
      course.cid,
      {
        courseId: course.cid,
        remarks: "Updated temporary test record",
        modality: "Online",
      },
      {
        enrollCap: 35,
        enrolled: 20,
      },
      [
        {
          day: "MON",
          time: "08:00-10:00",
          room: "LAB-2",
          instructor: "Updated Test Instructor",
        },
        {
          day: "FRI",
          time: "10:00-12:00",
          room: "LAB-3",
          instructor: "Another Test Instructor",
        },
      ]
    );

    console.log("updateCourse test passed!");
    console.log("Course details, enrollment, and timeslots were updated.");
  } catch (error) {
    console.error("updateCourse test failed:", error);
    process.exitCode = 1;
  } finally {
    await db.$client.end();
  }
}

testUpdateCourse();
