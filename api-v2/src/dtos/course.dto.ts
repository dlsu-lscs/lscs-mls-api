import { courses } from "../db/schema/courses.schema.js";

export type Course = typeof courses.$inferSelect;
export type CreateCourse = typeof courses.$inferInsert;

export interface UpdateCourse {
  courseId: number;
  courseName?: string;
  section?: string;
  remarks?: string;
  modality?: string;
  term?: string;
  campus?: string;
}

export function mapToCourseDTO(dbRow: Course): Course {
  return {
    cid: dbRow.cid,
    courseName: dbRow.courseName,
    section: dbRow.section,
    remarks: dbRow.remarks ?? "",
    modality: dbRow.modality ?? "",
    term: dbRow.term ?? "",
    campus: dbRow.campus ?? "",
  };
}

// For backward compatibility with existing code expecting the old shape
export interface CourseLegacy {
  id: number;
  courseName: string;
  section: string;
  remarks?: string;
  modality?: string;
  term?: string;
  campus?: string;
}

export function mapToCourseLegacyDTO(dbRow: Course): CourseLegacy {
  return {
    id: dbRow.cid,
    courseName: dbRow.courseName,
    section: dbRow.section,
    remarks: dbRow.remarks ?? undefined,
    modality: dbRow.modality ?? undefined,
    term: dbRow.term ?? undefined,
    campus: dbRow.campus ?? undefined,
  };
}