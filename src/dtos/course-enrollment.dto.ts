export interface CourseEnrollment {
    id: number,
    enrollCap?: number,
    enrolled?: number,
    status?: 'closed' | 'open',
    courseId: number
}

export interface CreateCourseEnrollment {
    enrollCap?: number,
    enrolled?: number,
    status?: 'closed' | 'open', 
    courseId: number
}