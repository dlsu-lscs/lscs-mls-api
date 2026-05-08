import { Course, mapToCourseDTO } from "./course.dto.js";
import { CourseEnrollment, mapToCourseEnrollmentDTO } from "./course-enrollment.dto.js";
import { CourseTimeslot, mapToCourseTimeslotDTO } from "./course-timeslot.dto.js";

export interface CourseInformation extends Course {
    status: Omit<CourseEnrollment, 'courseId'>;
    timeslots: Omit<CourseTimeslot, 'courseId'>[]
}

export function mapToCourseInformationDTO(dbRows: any[]): CourseInformation[] {
    const coursesMap = new Map();

    for (const row of dbRows) {
        if (!coursesMap.has(row.cid)) {
            let course = mapToCourseDTO(row);
            let courseEnrollment = mapToCourseEnrollmentDTO(row);

            coursesMap.set(row.cid, {
                ...course,
                status: courseEnrollment
            });
        }

        let courseTimeslot = mapToCourseTimeslotDTO(row);
        coursesMap.get(row.cid).timeslots.push(courseTimeslot);
    }

    return Array.from(coursesMap.values()) as CourseInformation[];
}