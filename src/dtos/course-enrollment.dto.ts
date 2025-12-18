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