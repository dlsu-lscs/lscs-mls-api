import { courseEnrollments } from "../db/schema/course_enrollments.js";

export type CourseEnrollment = typeof courseEnrollments.$inferSelect;
export type CreateCourseEnrollment = typeof courseEnrollments.$inferInsert;

export interface UpdateCourseEnrollment {
  enrollCap?: number;
  enrolled?: number;
}

export function mapToCourseEnrollmentDTO(dbRow: CourseEnrollment): CourseEnrollment {
  return {
    eid: dbRow.eid,
    enrollCap: dbRow.enrollCap ?? 0,
    enrolled: dbRow.enrolled ?? 0,
    courseId: dbRow.courseId,
  };
}

// For backward compatibility
export interface CourseEnrollmentLegacy {
  id: number;
  enrollCap?: number;
  enrolled?: number;
  courseId: number;
}

export function mapToCourseEnrollmentLegacyDTO(dbRow: CourseEnrollment): CourseEnrollmentLegacy {
  return {
    id: dbRow.eid,
    enrollCap: dbRow.enrollCap ?? undefined,
    enrolled: dbRow.enrolled ?? undefined,
    courseId: dbRow.courseId,
  };
}