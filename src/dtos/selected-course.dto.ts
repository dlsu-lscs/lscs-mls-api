export interface SelectedCourse {
    id: number,
    courseId: number,
    userId: number
}

export interface CreateSelectedCourse {
    courseId: number,
    userId: number
}

export function mapToSelectedCourseDTO(dbRow: any): SelectedCourse | null {
    if (!dbRow) {
        return null;
    }
    
    return {
        id: dbRow.sid,
        courseId: dbRow.course_id,
        userId: dbRow.user_id
    };
}