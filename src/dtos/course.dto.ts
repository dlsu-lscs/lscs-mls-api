export interface Course {
    id: number,
    courseName: string,
    section: string,
    remarks?: string,
    modality?: string,
    term?: string,
    campus?: string
}

export interface CreateCourse {
    courseName: string,
    section: string,
    remarks?: string,
    modality?: string,
    term?: string,
    campus?: string
}

export interface UpdateCourse {
    courseId: number,
    courseName?: string,
    section?: string,
    remarks?: string,
    modality?: string,
    term?: string,
    campus?: string
}

export function mapToCourseDTO(dbRow: any): Course | null {
    if (!dbRow) {
        return null;
    }
    
    return {
        id: dbRow.cid,
        courseName: dbRow.course_name,
        section: dbRow.section,
        remarks: dbRow.remarks,
        modality: dbRow.modality,
        term: dbRow.term,
        campus: dbRow.campus
    };
}