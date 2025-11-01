export interface CourseTimeslot {
    id: number,
    day: string,
    time: string,
    room?: string,
    instructor?: string,
    courseId: number
}

export interface CreateCourseTimeslot {
    day: string,
    time: string,
    room?: string,
    instructor?: string,
    courseId: number
}