import { db } from "../db/index.js";
import { and, asc, isNotNull, ne, eq, like } from "drizzle-orm";


import { courses } from "../db/schema/courses.js";
import { courseEnrollments } from "../db/schema/course_enrollments.js";
import { courseTimeslots } from "../db/schema/course_timeslots.js";
import { mapToCourseInformationDTO } from "../dtos/course-information.dto.js";


import type { CreateCourse } from "../dtos/course.dto.js";
import type { CreateCourseEnrollment } from "../dtos/course-enrollment.dto.js";
import type { CreateCourseTimeslot } from "../dtos/course-timeslot.dto.js";
import type { CourseInformation } from "../dtos/course-information.dto.js";

import type { UpdateCourse } from "../dtos/course.dto.js";
import type { UpdateCourseEnrollment } from "../dtos/course-enrollment.dto.js";
import type { UpdateCourseTimeslot } from "../dtos/course-timeslot.dto.js";

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


export async function getInstructorsByCourseName(name: string): Promise<(string | null)[]> {

  const rows = await db
    .selectDistinct({ instructor: courseTimeslots.instructor })
    .from(courseTimeslots)
    .innerJoin(courses, eq(courses.cid, courseTimeslots.tid))
    .where(like(courses.courseName, `${name}`));

  return rows.map((row) => row.instructor);

}


export async function updateCourse(
  courseId: number,
  newCourseData: UpdateCourse,
  newEnrollmentData: UpdateCourseEnrollment,
  newTimeslotData: UpdateCourseTimeslot[]
): Promise<void> {
  await db.transaction(async (tx) => {
    const {
      courseName,
      section,
      remarks,
      modality,
      term,
      campus,
    } = newCourseData;


    // ---- course udpate -----
    const courseUpdates = { courseName, section, remarks, modality, term, campus };

    const definedCourseUpdates = Object.fromEntries(
      Object.entries(courseUpdates).filter(([_, value]) => value !== undefined));



    if (Object.keys(definedCourseUpdates).length > 0) {
      await tx
        .update(courses)
        .set(definedCourseUpdates)
        .where(eq(courses.cid, courseId))
    }

    // ---- enrollment data -----

    const { enrollCap, enrolled } = newEnrollmentData;

    const enrollmentUpdates = {
      enrollCap,
      enrolled,
    }

    const definedEnrollmentUpdates = Object.fromEntries(
      Object.entries(enrollmentUpdates).filter(([_, value]) => value !== undefined));


    if (Object.keys(definedEnrollmentUpdates).length > 0) {
      await tx
        .update(courseEnrollments)
        .set(definedEnrollmentUpdates)
        .where(eq(courseEnrollments.courseId, courseId));
    }


    // time table

    const existingRows = await tx
      .select({ tid: courseTimeslots.tid, day: courseTimeslots.day, time: courseTimeslots.time })
      .from(courseTimeslots)
      .where(eq(courseTimeslots.courseId, courseId));


    const existingMap = new Map(
      existingRows.map((row) => [`${row.day}|${row.time}`, row])
    );

    const incomingMap = new Map(
      newTimeslotData.map((timeslot) => [`${timeslot.day}|${timeslot.time}`, timeslot])
    );

    for (const [key, incoming] of incomingMap.entries()) {
      if (existingMap.has(key)) {
        await tx
          .update(courseTimeslots)
          .set({
            room: incoming.room,
            instructor: incoming.instructor
          })
          .where(
            and(
              eq(courseTimeslots.courseId, courseId),
              eq(courseTimeslots.day, incoming.day!),
              eq(courseTimeslots.time, incoming.time!)
            )
          );
      } else {
        await tx.insert(courseTimeslots).values({
          courseId,
          day: incoming.day!,
          time: incoming.time!,
          room: incoming.room,
          instructor: incoming.instructor
        });
      }
    }

    for (const [key, existing] of existingMap.entries()) {
      if (!incomingMap.has(key)) {
        await tx
          .delete(courseTimeslots)
          .where(eq(courseTimeslots.tid, existing.tid));
      }
    }

  })

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

export async function getAllCoursesByCourseName(
  name: string
): Promise<CourseInformation[]> {
  const rows = await db
    .select()
    .from(courses)
    .leftJoin(courseEnrollments, eq(courses.cid, courseEnrollments.eid))
    .leftJoin(courseTimeslots, eq(courses.cid, courseTimeslots.tid))
    .where(like(courses.courseName, `%${name}%`));

  return mapToCourseInformationDTO(rows);
}








export async function getUniqueTerms(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ term: courses.term })
    .from(courses)
    .where(
      and(
        isNotNull(courses.term),
        ne(courses.term, "")
      )
    )
    .orderBy(asc(courses.term));

  return rows.map(row => row.term!);
}

export async function getCourseList(): Promise<string[]> {

  const rows = await db
    .selectDistinct({ courseName: courses.courseName })
    .from(courses)
    .where(
      and(
        isNotNull(courses.courseName),
        ne(courses.courseName, "")
      )
    )
    .orderBy(asc(courses.courseName));

  return rows.map((row) => row.courseName);
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



