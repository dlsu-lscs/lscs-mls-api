import { courseTimeslots } from "../db/schema/course_timeslots.js";

export type CourseTimeslot = typeof courseTimeslots.$inferSelect;
export type CreateCourseTimeslot = typeof courseTimeslots.$inferInsert;

export interface UpdateCourseTimeslot {
  day?: string;
  time?: string;
  room?: string;
  instructor?: string;
}

export function mapToCourseTimeslotDTO(dbRow: CourseTimeslot): CourseTimeslot {
  return {
    tid: dbRow.tid,
    day: dbRow.day,
    time: dbRow.time,
    room: dbRow.room ?? "",
    instructor: dbRow.instructor ?? "",
    courseId: dbRow.courseId,
  };
}

// For backward compatibility
export interface CourseTimeslotLegacy {
  id: number;
  day: string;
  time: string;
  room?: string;
  instructor?: string;
  courseId: number;
}

export function mapToCourseTimeslotLegacyDTO(dbRow: CourseTimeslot): CourseTimeslotLegacy {
  return {
    id: dbRow.tid,
    day: dbRow.day,
    time: dbRow.time,
    room: dbRow.room ?? undefined,
    instructor: dbRow.instructor ?? undefined,
    courseId: dbRow.courseId,
  };
}