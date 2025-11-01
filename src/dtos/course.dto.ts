export interface Course {
    id: number,
    classNumber: number,
    courseName: string,
    section: string,
    remarks?: string
}

export interface CreateCourse {
    classNumber: number,
    courseName: string,
    section: string,
    remarks?: string
}