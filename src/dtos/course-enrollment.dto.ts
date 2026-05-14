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

export function mapToCourseEnrollmentDTO(dbRow: any): CourseEnrollment | null {
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