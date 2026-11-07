export interface CampusOption { CAMPUSNAME: string; CAMPUSNO: string | number }
export interface SessionOption { ACADEMIC_SESSION_NAME: string; ACADEMIC_SESSION_ID: string | number; IS_CURRENT_SESSION: boolean }
export interface CourseOption { COURSE_CREATION_ID: string | number; COURSE_NAME?: string; SUBJECT_CODE?: string; SUBJECT_NAME?: string }
export interface Dropdowns { CampusDrp: CampusOption[]; SessionDrp: SessionOption[] }
export interface ScrapedCourse { courseId: number; courseName: string; section: string; remarks?: string; modality?: string; term?: string; campus?: string }
export interface ScrapedTimeslot { courseId: number; day: string; time: string; room?: string; instructor?: string }
export interface ScrapedEnrollment { courseId: number; enrollCap?: number; enrolled?: number }
export type ScrapedClasses = [ScrapedCourse[], ScrapedTimeslot[], ScrapedEnrollment[]];
