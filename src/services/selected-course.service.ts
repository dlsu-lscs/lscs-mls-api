import { ResultSetHeader, RowDataPacket } from 'mysql2';
import pool from 'config/db.js';
import { SelectedCourse, CreateSelectedCourse } from 'dtos/selected-course.dto.js';
import { getCourseById } from 'services/course.service.js'
import { error } from 'console';

export async function createSelectedCourse(data: CreateSelectedCourse): Promise<SelectedCourse | null> {
    // ADD VALIDATOR IF COURSE ALREADY EXISTS AMONG USER SELECTIONS

    const {
        courseId,
        userId
    } = data;

    const course = await getCourseById(courseId);
    
    if (course === null) {
        // PROB REPLACE ALL ERRORS
        throw error("Course doesn't exist.");
    }
    
    const userCourses = await getAllUserSelectedCourse(userId);

    for (const sc of course) {
        const [scStart, scEnd] = sc.courseName.split("-");

        for (const uc of userCourses) {
            if (uc.courseName === sc.courseName) {
                throw error(`A class of course ${uc.courseName} is already selected.`);
            }
            
            const [ucStart, ucEnd] = uc.courseName.split("-");

            if (scStart < ucEnd || ucStart < scEnd) {
                throw error(`Selected course conflicts with classes in schedule.`);
            }
        }
    }

    const [result] = await pool.query<ResultSetHeader>(
        `INSERT INTO selected_courses (course_id, user_id)
        VALUES (? ?)`, [
            courseId,
            userId
        ]
    );

    if (result.affectedRows === 0) {
        return null;
    }
    return { id: result.insertId, courseId, userId };
}

export async function getAllUserSelectedCourse(id: number): Promise<any[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM selected_courses sc
        JOIN courses c ON sc.course_id = c.id
        JOIN course_timeslots ct ON c.id = ct.course_id 
        WHERE id = ?`,
        [id]
    );

    return rows as any[];
}

export async function deleteSelectedCourse(id: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
        `DELETE FROM selected_courses
        WHERE id = ?`,
        [id]
    );

    return result.affectedRows > 0;
}