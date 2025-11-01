export interface CourseEnrollment {
    id: number,
    enrollCap?: number,
    enrolled?: number,
    status?: string,
    courseId: number
}

export interface CreateCourseEnrollment {
    enrollCap?: number,
    enrolled?: number,
    status?: string,
    courseId: number
}