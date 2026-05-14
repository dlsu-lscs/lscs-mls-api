import { ResultSetHeader, RowDataPacket } from 'mysql2';
import pool from 'config/db.js';
import { SelectedCourse, CreateSelectedCourse } from 'dtos/selected-course.dto.js';
import { CourseInformation, mapToCourseInformationDTO } from 'dtos/course-information.dto.js';
import { getCourseById } from 'services/course.service.js';

export async function createSelectedCourse(data: CreateSelectedCourse): Promise<SelectedCourse | null> {
    const {
        courseId,
        userId
    } = data;

    const course = await getCourseById(courseId);
    
    if (course === null) {
        throw new Error("Selected course doesn't exist.");
    }
    
    const userCourses = await getAllUserSelectedCourse(userId);

    const isAlreadyEnrolled = userCourses.some(uc => uc.courseName === course.courseName);
    if (isAlreadyEnrolled) {
        throw new Error(`Conflict: a different class of chosen course is already chosen.`);
    }

    for (const sc of course.timeslots) {
        const [scStart, scEnd] = sc.time.split("-");

        for (const uc of userCourses) {
            for (const usc of uc.timeslots) {
                if (sc.day !== usc.day) {
                    continue; 
                }

                const [ucStart, ucEnd] = usc.time.split("-");

                if ((scStart < ucEnd && scEnd > ucStart)) {
                    throw new Error(`Conflict: selected course conflicts with classes in schedule.`);
                }
            } 
        }
    }

    const [result] = await pool.query<ResultSetHeader>(
        `INSERT INTO selected_courses (course_id, user_id)
        VALUES (?, ?)`, [
            courseId,
            userId
        ]
    );

    return { 
        id: result.insertId, 
        courseId: courseId, 
        userId: userId 
    };
}

export async function getAllUserSelectedCourse(id: number): Promise<CourseInformation[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM selected_courses sc
        JOIN courses c ON sc.course_id = c.cid
        LEFT JOIN course_timeslots ct ON c.cid = ct.course_id 
        LEFT JOIN course_enrollments ce on c.cid = ce.course_id
        WHERE user_id = ?`,
        [id]
    );

    const courses = mapToCourseInformationDTO(rows);
    return courses;
}

export async function deleteSelectedCourse(userId: number, courseId: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
        `DELETE FROM selected_courses
        WHERE user_id = ?
        AND course_id = ?`,
        [userId, courseId]
    );

    return result.affectedRows > 0;
}