export interface Course {
    id: number,
    courseName: string,
    section: string,
    modality?: string
    term?: string
}

export interface CreateCourse {
    classNumber: number,
    courseName: string,
    section: string,
    modality?: string
    term?: string
}

export interface UpdateCourse {
    courseId: number,
    classNumber?: number,
    courseName?: string,
    section?: string,
    modality?: string
    term?: string
}

export function mapToCourseDTO(dbRow: any): Course | null {
    if (!dbRow) {
        return null;
    }
    
    return {
        id: dbRow.cid,
        courseName: dbRow.course_name,
        section: dbRow.section,
        modality: dbRow.modality,
        term: dbRow.term
    };
}