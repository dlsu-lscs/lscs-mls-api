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
    instructor?: string
}

export interface UpdateCourseTimeslot {
    day?: string,
    time?: string,
    room?: string,
    instructor?: string
}

export function mapToCourseTimeslotDTO(dbRow: any): CourseTimeslot | null {
    if (!dbRow) {
        return null;
    }
    
    return {
        id: dbRow.tid,
        day: dbRow.day,
        time: dbRow.time,
        room: dbRow.room,
        instructor: dbRow.instructor,
        courseId: dbRow.course_id
    };
}