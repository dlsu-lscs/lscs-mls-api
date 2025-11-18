import { ResultSetHeader, RowDataPacket } from 'mysql2';
import pool from 'config/db.js';
import { Course, CreateCourse } from 'dtos/course.dto.js';
import { CourseEnrollment, CreateCourseEnrollment } from 'dtos/course-enrollment.dto.js';
import { CourseTimeslot, CreateCourseTimeslot } from 'dtos/course-timeslot.dto.js';

// MIGHT REFACTOR
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
        status
    } = enrollmentData;

    const [resultEnrollment] = await pool.query<ResultSetHeader>(
        `INSERT INTO course_enrollments (enroll_cap, enrolled, status, course_id)
        VALUES (?, ?, ?, ?)`, [
            enrollCap,
            enrolled,
            status,
            courseId
        ]
    );

    const resultTimeslots = [];

    for (const t of timeslotData) {
        let {
            day,
            time,
            room,
            instructor
        } = t;

        resultTimeslots.push(await pool.query<ResultSetHeader>(
            `INSERT INTO course_timeslots (day, time, room, instructor, course_id)
            VALUES (?, ?, ?, ?, ?)`, [
                day,
                time,
                room,
                instructor,
                courseId
            ]
        ));
    }

    return getCourseById(courseId);
}

export async function getCourseById(id: number): Promise<any[] | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM courses c
        LEFT JOIN course_enrollments ce ON c.id = cd.course_id
        LEFT JOIN course_timeslots ct ON c.id = ct.course_id
        WHERE id = ?`,
        [id]
    );

    return rows as any[] | null;
}

export async function getAllCoursesByCourseName(name: string, params?: object): Promise<any[]> {
    // ADD FILTERS AND SORT(?)

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