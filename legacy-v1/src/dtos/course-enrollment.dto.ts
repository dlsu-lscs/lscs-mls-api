export interface DatabaseRow { eid: number; enroll_cap?: number; enrolled?: number; course_id: number }

export interface CourseEnrollment {
    id: number,
    enrollCap?: number,
    enrolled?: number,
    courseId: number
}

export interface CreateCourseEnrollment {
    enrollCap?: number,
    enrolled?: number,
}

export interface UpdateCourseEnrollment {
    enrollCap?: number,
    enrolled?: number,
}

export function mapToCourseEnrollmentDTO(dbRow: DatabaseRow | null | undefined): CourseEnrollment | null {
    if (!dbRow) {
        return null;
    }
    
    return {
        id: dbRow.eid,
        enrollCap: dbRow.enroll_cap,
        enrolled: dbRow.enrolled,
        courseId: dbRow.course_id
    };
}