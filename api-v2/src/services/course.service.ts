import { db } from "../db/index.js";
import { and, asc, isNotNull, ne, eq, like } from "drizzle-orm";

import { courses } from "../db/schema/courses.schema.js";
import { courseEnrollments } from "../db/schema/course_enrollments.schema.js";
import { courseTimeslots } from "../db/schema/course_timeslots.schema.js";
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
    .innerJoin(courses, eq(courses.cid, courseTimeslots.courseId))
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

    const courseUpdates = { courseName, section, remarks, modality, term, campus };
    const definedCourseUpdates = Object.fromEntries(
      Object.entries(courseUpdates).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(definedCourseUpdates).length > 0) {
      await tx
        .update(courses)
        .set(definedCourseUpdates)
        .where(eq(courses.cid, courseId));
    }

    const { enrollCap, enrolled } = newEnrollmentData;
    const enrollmentUpdates = { enrollCap, enrolled };
    const definedEnrollmentUpdates = Object.fromEntries(
      Object.entries(enrollmentUpdates).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(definedEnrollmentUpdates).length > 0) {
      await tx
        .update(courseEnrollments)
        .set(definedEnrollmentUpdates)
        .where(eq(courseEnrollments.courseId, courseId));
    }

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
  });
}

export async function fetchCourses(
  campus: number = 0,
  part: number = 0,
  term: number = 0,
  course: string = ''
): Promise<void> {
  // @ts-ignore
  const { isValidSession, login } = await import("../scripts/login.js");
  // @ts-ignore
  const { fetch } = await import("../scripts/fetch.js");

  let loginAttempts = 0;
  while (!await isValidSession()) {
    if (loginAttempts++ >= 3) throw new Error('Login');
    try {
      await login();
    } catch (e: any) {
      console.error('Login attempt failed:', e);
      throw new Error('Login');
    }
  }

  const classes = await fetch(campus, part, term, course);
  if (!classes) {
    throw new Error('Parsing error.');
  }

  const [coursesList, timeslots, enrollments] = classes;
  console.log(`Courses: ${coursesList.length} | Timeslots: ${timeslots.length} | Enrollments: ${enrollments.length}`);

  const uniqueCourseNames = Array.from(new Set(coursesList.map((c: any) => c['courseName'])));

  let existingCourses: CourseInformation[] = [];
  for (const name of uniqueCourseNames as string[]) {
    const fetchedCourses = await getAllCoursesByCourseName(name);
    if (fetchedCourses) {
      existingCourses.push(...fetchedCourses);
    }
  }

  const processedClasses = new Set<string>();
  const newlyCreatedTracker = new Set<string>();

  const updatePromises = coursesList.map(async (curr: any) => {
    const courseName = curr['courseName'];
    const section = curr['section'];
    const classKey = `${courseName}|${section}`;

    processedClasses.add(classKey);

    const existingSimilarCourse = existingCourses.find((c: CourseInformation) =>
      c.courseName === courseName && c.section === section
    );

    const currentEnrollment = enrollments.find((e: any) => e['courseId'] === curr['courseId']);
    const currentTimeslots = timeslots.filter((t: any) => t['courseId'] === curr['courseId']);

    if (existingSimilarCourse) {
      await updateCourse(
        existingSimilarCourse.cid,
        curr,
        currentEnrollment,
        currentTimeslots
      );
    } else {
      if (!newlyCreatedTracker.has(classKey)) {
        newlyCreatedTracker.add(classKey);
        await createCourse(
          curr,
          currentEnrollment,
          currentTimeslots
        );
      }
    }
  });

  await Promise.all(updatePromises);

  const coursesToDelete = existingCourses.filter((c: CourseInformation) =>
    !processedClasses.has(`${c.courseName}|${c.section}`)
  );

  for (const curr of coursesToDelete) {
    await deleteCourse(curr.cid);
  }

  console.log(`Courses fetched.`);
}

export async function getCourseById(
  id: number
): Promise<CourseInformation | null> {
  const rows = await db
    .select()
    .from(courses)
    .leftJoin(courseEnrollments, eq(courses.cid, courseEnrollments.courseId))
    .leftJoin(courseTimeslots, eq(courses.cid, courseTimeslots.courseId))
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
    .leftJoin(
      courseEnrollments,
      eq(courses.cid, courseEnrollments.courseId)
    )
    .leftJoin(
      courseTimeslots,
      eq(courses.cid, courseTimeslots.courseId)
    )
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

export async function deleteCourse(id: number): Promise<boolean> {
  const result = await db.delete(courses).where(eq(courses.cid, id));
  return (result.rowCount ?? 0) > 0;
}

export async function deleteCourseByCourseName(name: string): Promise<boolean> {
  const result = await db.delete(courses).where(like(courses.courseName, `%${name}%`));
  return (result.rowCount ?? 0) > 0;
}