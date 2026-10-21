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
): CourseInformation[] {
  const coursesMap = new Map<number, CourseInformation>();

  for (const row of dbRows) {
    const course = row.courses;
    const enrollment = row.course_enrollments;
    const timeslot = row.course_timeslots;

    if (!coursesMap.has(course.cid)) {
      coursesMap.set(course.cid, {
        cid: course.cid,
        courseName: course.courseName,
        section: course.section,
        remarks: course.remarks ?? null,
        modality: course.modality ?? null,
        term: course.term ?? null,
        campus: course.campus ?? null,

        status: enrollment
          ? {
            eid: enrollment.eid,
            enrollCap: enrollment.enrollCap ?? null,
            enrolled: enrollment.enrolled ?? null,
          }
          : null,

        timeslots: [],
      });
    }

    const courseInfo = coursesMap.get(course.cid)!;

    if (
      timeslot &&
      !courseInfo.timeslots.some(
        (existing) => existing.tid === timeslot.tid
      )
    ) {
      courseInfo.timeslots.push({
        tid: timeslot.tid,
        day: timeslot.day,
        time: timeslot.time,
        room: timeslot.room ?? null,
        instructor: timeslot.instructor ?? null,
      });
    }
  }

  return Array.from(coursesMap.values());
}
