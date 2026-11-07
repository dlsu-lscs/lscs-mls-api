import type { RowDataPacket } from 'mysql2';
import { Course, mapToCourseDTO } from "./course.dto.js";
import { CourseEnrollment, mapToCourseEnrollmentDTO } from "./course-enrollment.dto.js";
import { CourseTimeslot, mapToCourseTimeslotDTO } from "./course-timeslot.dto.js";

export interface CourseInformation extends Course {
    status: Omit<CourseEnrollment, 'courseId'>;
    timeslots: Omit<CourseTimeslot, 'courseId'>[];
}

export function mapToCourseInformationDTO(dbRows: RowDataPacket[]): CourseInformation[] {
    const coursesMap = new Map();

    for (const row of dbRows) {
        if (!coursesMap.has(row.cid)) {
            const course = mapToCourseDTO(row as import("./course.dto.js").DatabaseRow);
            const courseEnrollment = mapToCourseEnrollmentDTO(row as import("./course-enrollment.dto.js").DatabaseRow);

            coursesMap.set(row.cid, {
                ...course,
                status: courseEnrollment,
                timeslots: []
            });
        }

        const courseTimeslot = mapToCourseTimeslotDTO(row as import("./course-timeslot.dto.js").DatabaseRow);
        coursesMap.get(row.cid).timeslots.push(courseTimeslot);
    }

    return Array.from(coursesMap.values()) as CourseInformation[];
}