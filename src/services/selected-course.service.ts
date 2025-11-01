import { ResultSetHeader, RowDataPacket } from 'mysql2';
import pool from 'config/db.js';
import { SelectedCourse, CreateSelectedCourse } from 'dtos/selected-course.dto.js';

export async function createSelectedCourse(data: CreateSelectedCourse): Promise<SelectedCourse | null> {
    const {
        courseId,
        userId
    } = data;

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

export async function getAllUserSelectedCourse(id: number): Promise<SelectedCourse[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM selected_courses
        WHERE id = ?`,
        [id]
    );

    return rows as SelectedCourse[];
}

export async function deleteSelectedCourse(id: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
        `DELETE FROM selected_courses
        WHERE id = ?`,
        [id]
    );

    return result.affectedRows > 0;
}