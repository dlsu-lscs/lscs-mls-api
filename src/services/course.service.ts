import { ResultSetHeader, RowDataPacket } from 'mysql2';
import pool from 'config/db.js';
import { spawnSync } from 'child_process';
import { Course, CreateCourse, UpdateCourse } from 'dtos/course.dto.js';
import { CourseEnrollment, CreateCourseEnrollment, UpdateCourseEnrollment } from 'dtos/course-enrollment.dto.js';
import { CourseTimeslot, CreateCourseTimeslot, UpdateCourseTimeslot } from 'dtos/course-timeslot.dto.js';

export async function createCourse(
    courseData: CreateCourse,
    enrollmentData: CreateCourseEnrollment,
    timeslotData: CreateCourseTimeslot[]
): Promise<any | null> {
    const {
        classNumber,
        courseName,
        section,
        remarks
    } = courseData;

    const [resultCourse] = await pool.query<ResultSetHeader>(
        `INSERT INTO courses (class_number, course_name, section, remarks)
        VALUES (?, ?, ?, ?)`, [
            classNumber,
            courseName,
            section,
            remarks
        ]
    );

    if (resultCourse.affectedRows === 0) {
        return null;
    }

    const courseId = resultCourse.insertId;

    const {
        enrollCap,
        enrolled,
    } = enrollmentData;

    const [resultEnrollment] = await pool.query<ResultSetHeader>(
        `INSERT INTO course_enrollments (enroll_cap, enrolled, course_id)
        VALUES (?, ?, ?)`, [
            enrollCap,
            enrolled,
            courseId
        ]
    );

    timeslotData.forEach(async (curr: CreateCourseTimeslot) => {
        let {
            day,
            time,
            room,
            instructor
        } = curr;

        await pool.query<ResultSetHeader>(
            `INSERT INTO course_timeslots (day, time, room, instructor, course_id)
            VALUES (?, ?, ?, ?, ?)`, [
                day,
                time,
                room,
                instructor,
                courseId
            ]
        );
    })

    return getCourseById(courseId);
}

async function updateCourse(
    newCourseData: UpdateCourse,
    newEnrollmentData: UpdateCourseEnrollment,
    newTimeslotData: UpdateCourseTimeslot[]
): Promise<any | null> {
    const {
        classNumber,
        courseName,
        section,
        remarks
    } = newCourseData;

    const [resultCourse] = await pool.query<ResultSetHeader>(
        `UPDATE courses
        SET class_number = ?, course_name = ?, section = ?, remarks = ?
        WHERE id = ?`, [
            classNumber,
            courseName,
            section,
            remarks
        ]
    );

    if (resultCourse.affectedRows === 0) {
        return null;
    }

    const courseId = resultCourse.insertId;

    const {
        enrollCap,
        enrolled,
    } = newEnrollmentData;

    const [resultEnrollment] = await pool.query<ResultSetHeader>(
        `UPDATE course_enrollments
        SET enroll_cap = ?, enrolled = ?
        WHERE course_id = ?`, [
            enrollCap,
            enrolled,
            courseId
        ]
    );

    newTimeslotData.forEach(async (curr: UpdateCourseTimeslot) => {
        let {
            day, 
            time,
            room,
            instructor,
        } = curr;

        await pool.query<ResultSetHeader>(
            `UPDATE course_timeslots
            SET room = ?, instructor = ?
            WHERE course_id = ? AND day = ? AND time = ?`, [
                room,
                instructor,
                courseId,
                day,
                time
            ]
        );
    })

    return getCourseById(courseId);
}

// WILL ADD SCRAPING HERE
export async function fetchCourses(id: string, course: string): Promise<any[]> {
    let info;

    const process = spawnSync('python3', ['../scripts/scraper.py', id, course], { encoding: 'utf-8' });

    if (process.error) {
        throw new Error('Error parsing: ' + process.error.message);
    }

    let [courses, timeslots, enrollments] = JSON.parse(process.stdout.trim());
    const currCourses = await getAllCoursesByCourseName(course);
    const updatedCourses: any[] = []

    courses.forEach(async (curr: any) => {
        const index = courses['course_id'];
        
        if (!currCourses.some(c => c.class_number === curr['classNumber'])) {
            updatedCourses.push(
                await createCourse(
                    courses[index], 
                    enrollments[index], 
                    timeslots.filter((ts: any) => ts['course_id'] === courses[index]['course_id'])
                )
            );
        } else {
            updatedCourses.push(
                await updateCourse(
                    courses[index], 
                    enrollments[index], 
                    timeslots.filter((ts: any) => ts['course_id'] === courses[index]['course_id'])
                )
            );
        }
    })
    
    return updatedCourses.filter(c => c !== null);

    // FIX REDUNDANCY???
    // check if course exists in the db
        // if yes, create for each
        // else, check each class if exists in db
            // if yes, update (CREATE updateCourse)
            // else, create

}

export async function getCourseById(id: number): Promise<any[] | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM courses c
        LEFT JOIN course_enrollments ce ON c.id = ce.course_id
        LEFT JOIN course_timeslots ct ON c.id = ct.course_id
        WHERE c.id = ?`,
        [id]
    );

    return rows as any[] | null;
}

export async function getAllCoursesByCourseName(name: string, params?: object): Promise<any[]> {
    // ADD FILTERS AND SORT IN THE FUTURE

    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM courses c
        LEFT JOIN course_enrollments ce ON c.id = cd.course_id
        LEFT JOIN course_timeslots ct ON c.id = ct.course_id
        WHERE course_name = ?`,
        [name]
    );

    return rows as any[];
}

export async function getInstructorsByCourseName(name: string): Promise<any[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT DISTINCT instructor FROM course_timeslots ct
        JOIN courses c ON ct.course_id = c.id
        WHERE course_name = ?`,
        [name]
    );

    return rows as any[];
}

export async function deleteCourse(id: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
        `DELETE FROM courses
        WHERE id = ?`,
        [id]
    );

    return result.affectedRows > 0;
}

// IDK BOUT THIS
export async function deleteCourseByCourseName(name: string): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
        `DELETE FROM courses
        WHERE course_name = ?`,
        [name]
    );

    return result.affectedRows > 0;
}