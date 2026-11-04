import { createCourse } from "../src/services/course.service.ts";

async function testCreateCourse() {
  try {
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

    console.log("createCourse test passed!");
  } catch (error) {
    console.error("createCourse test failed:", error);
  }
}

testCreateCourse();
