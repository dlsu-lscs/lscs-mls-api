import type { Course } from "./course.dto.js";
import type { CourseEnrollment } from "./course-enrollment.dto.js";
import type { CourseTimeslot } from "./course-timeslot.dto.js";

import { courses } from "../db/schema/courses.js";
import { courseEnrollments } from "../db/schema/course_enrollments.js";
import { courseTimeslots } from "../db/schema/course_timeslots.js";

export interface CourseInformation extends Course {
  status: Omit<CourseEnrollment, "courseId"> | null;
  timeslots: Omit<CourseTimeslot, "courseId">[];
}

type CourseInformationRow = {
  courses: typeof courses.$inferSelect;
  course_enrollments: typeof courseEnrollments.$inferSelect | null;
  course_timeslots: typeof courseTimeslots.$inferSelect | null;
};

export function mapToCourseInformationDTO(
  dbRows: CourseInformationRow[]
): CourseInformation | null {
  if (dbRows.length === 0) {
    return null;
  }

  const course = dbRows[0].courses;
  const enrollment = dbRows[0].course_enrollments;

  const timeslots = new Map<
    number,
    Omit<CourseTimeslot, "courseId">
  >();

  for (const row of dbRows) {
    const timeslot = row.course_timeslots;

    if (timeslot && !timeslots.has(timeslot.tid)) {
      timeslots.set(timeslot.tid, {
        id: timeslot.tid,
        day: timeslot.day,
        time: timeslot.time,
        room: timeslot.room ?? undefined,
        instructor: timeslot.instructor ?? undefined,
      });
    }
  }

  return {
    id: course.cid,
    courseName: course.courseName,
    section: course.section,
    remarks: course.remarks ?? undefined,
    modality: course.modality ?? undefined,
    term: course.term ?? undefined,
    campus: course.campus ?? undefined,

    status: enrollment
      ? {
        id: enrollment.eid,
        enrollCap: enrollment.enrollCap ?? undefined,
        enrolled: enrollment.enrolled ?? undefined,
      }
      : null,

    timeslots: Array.from(timeslots.values()),
  };
}
