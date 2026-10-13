import { db } from "../db/index.js";
import { and, asc, isNotNull, ne, eq } from "drizzle-orm";


import { courses } from "../db/schema/courses.js";
import { courseEnrollments } from "../db/schema/course_enrollments.js";
import { courseTimeslots } from "../db/schema/course_timeslots.js";
import { mapToCourseInformationDTO } from "../dtos/course-information.dto.js";


import type { CreateCourse } from "../dtos/course.dto.js";
import type { CreateCourseEnrollment } from "../dtos/course-enrollment.dto.js";
import type { CreateCourseTimeslot } from "../dtos/course-timeslot.dto.js";
import type { CourseInformation } from "../dtos/course-information.dto.js";






export async function createCourse(
  courseData: CreateCourse,
  enrollmentData: CreateCourseEnrollment,
  timeslotData: CreateCourseTimeslot[],
): Promise<void> {
  await db.transaction(async (tx) => {

    const [createdCourse] = await tx
      .insert(courses)
      .values({
        courseName: courseData.courseName,
        section: courseData.section,
        remarks: courseData.remarks,
        modality: courseData.modality,
        term: courseData.term,
        campus: courseData.campus,
      })
      .returning({ id: courses.cid });

    const courseId = createdCourse.id;
    await tx.insert(courseEnrollments).values({
      enrollCap: enrollmentData.enrollCap,
      enrolled: enrollmentData.enrolled,
      courseId,
    });

    for (const timeslot of timeslotData) {
      await tx.insert(courseTimeslots).values({
        day: timeslot.day,
        time: timeslot.time,
        room: timeslot.room,
        instructor: timeslot.instructor,
        courseId,
      });
    }

  });
}

export async function getCourseById(
  id: number
): Promise<CourseInformation | null> {
  const rows = await db
    .select()
    .from(courses)
    .leftJoin(courseEnrollments, eq(courses.cid, courseEnrollments.eid))
    .leftJoin(courseTimeslots, eq(courses.cid, courseTimeslots.tid))
    .where(eq(courses.cid, id));


  const results = mapToCourseInformationDTO(rows);

  return results[0] ?? null;
}








export async function getUniqueCampuses(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ campus: courses.campus })
    .from(courses)
    .where(
      and(
        isNotNull(courses.campus),
        ne(courses.campus, ""),
      ),
    )
    .orderBy(asc(courses.campus));

  return rows.map(row => row.campus!);
}



