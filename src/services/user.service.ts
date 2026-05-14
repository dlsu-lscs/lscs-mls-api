import { ResultSetHeader, RowDataPacket } from 'mysql2';
import pool from 'config/db.js';
import { User, CreateUser, UpdateUser, mapToUserDTO } from 'dtos/user.dto.js';

export async function createUser(data: CreateUser): Promise<User | null> {
    const {
        email,
        givenName,
        familyName,
        userId,
        pictureUrl
    } = data;

    const existingUser = await getUserByUserId(userId);

    if (existingUser) {
        return null;
    }
    
    const [result] = await pool.query<ResultSetHeader>(
        `INSERT INTO users (email, given_name, family_name, user_id, picture_url)
        VALUES (?, ?, ?, ?, ?)`, [
            email,
            givenName,
            familyName,
            userId,
            pictureUrl
        ]
    );

    return getUserById(result.insertId);
}

export async function getAllUsers(): Promise<User[]> {
    const [rows] = await pool.query<RowDataPacket[]>(`SELECT * FROM users`);
    const users = rows.map(row => mapToUserDTO(row))
    return users as User[];
}

export async function getUserById(id: number): Promise<User | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM users
        WHERE uid = ?`, 
        [id]
    );
    
    return mapToUserDTO(rows[0]) as User | null;
}

export async function getUserByUserId(userId: string): Promise<User | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM users
        WHERE user_id = ?`, 
        [userId]
    );
    
    return mapToUserDTO(rows[0]) as User | null;
}

export async function updateUser(id: number, data: UpdateUser): Promise<User | null> {
    const existingUser = await getUserById(id);
    if (!existingUser) {
        return null;
    }

    const {
        givenName = existingUser.givenName,
        familyName = existingUser.familyName,
        pictureUrl = existingUser.pictureUrl
    } = data;

    const [result] = await pool.query<ResultSetHeader>(
        `UPDATE users
        SET given_name = ?, family_name = ?, picture_url = ?
        WHERE uid = ?`, [
            givenName,
            familyName,
            pictureUrl, 
            id
        ]
    );

    if (result.affectedRows === 0) {
        return null;
    }
    return getUserById(id);
}

export async function deleteUser(id: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
        `DELETE FROM users
        WHERE uid = ?`,
        [id]
    );

    return result.affectedRows > 0;
}