export interface Courses {
    id: number,
    classNumber: number,
    courseName: string,
    section: string,
    remarks?: string
}

export interface CourseEnrollments {
    id: number,
    enrollCap?: number,
    enrolled?: number,
    status?: string,
    courseId: number
}

export interface CourseTimeslots {
    id: number,
    day: string,
    time: string,
    room?: string,
    instructor?: string,
    courseId: number
}

export interface Users {
    id: number,
    idNumber: number,
    email: string,
    givenName: string,
    familyName: string,
    userId: string
    pictureUrl: string
}

export interface SelectedCourses {
    id: number,
    courseId: number,
    userId: number
}