import { ResultSetHeader, RowDataPacket } from 'mysql2';
import pool from 'config/db.js';
import { fetch } from 'scripts/fetch.js';
import { login, isValidSession } from 'scripts/login.js';
import { CreateCourse, UpdateCourse } from 'dtos/course.dto.js';
import { CreateCourseEnrollment, UpdateCourseEnrollment } from 'dtos/course-enrollment.dto.js';
import { CreateCourseTimeslot, UpdateCourseTimeslot } from 'dtos/course-timeslot.dto.js';
import { CourseInformation, mapToCourseInformationDTO } from 'dtos/course-information.dto.js';

export async function createCourse(
    courseData: CreateCourse,
    enrollmentData: CreateCourseEnrollment,
    timeslotData: CreateCourseTimeslot[]
): Promise<void> {
    const {
        courseName,
        section,
        modality,
        term,
        campus
    } = courseData;

    const [resultCourse] = await pool.query<ResultSetHeader>(
        `INSERT INTO courses (course_name, section, modality, term, campus)
        VALUES (?, ?, ?, ?, ?)`, [
            courseName,
            section,
            modality,
            term,
            campus
        ]
    );

    const courseId = resultCourse.insertId;

    const {
        enrollCap,
        enrolled,
    } = enrollmentData;

    await pool.query<ResultSetHeader>(
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
}

export async function updateCourse(
    courseId: number,
    newCourseData: UpdateCourse,
    newEnrollmentData: UpdateCourseEnrollment,
    newTimeslotData: UpdateCourseTimeslot[]
): Promise<void> {
    const {
        courseName,
        section,
        modality,
        term,
        campus
    } = newCourseData;

    await pool.query<ResultSetHeader>(
        `UPDATE courses
        SET course_name = ?, section = ?, modality = ?, term = ?, campus = ?
        WHERE cid = ?`, [
            courseName,
            section,
            modality,
            term,
            campus,
            courseId
        ]
    );

    const {
        enrollCap,
        enrolled,
    } = newEnrollmentData;

    await pool.query<ResultSetHeader>(
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
}

export async function fetchCourses(
  campus: number = 0,
  part: number = 0, 
  term: number = 0
): Promise<void> {
    // Runs the python script
    let loginAttempts = 0;
    while (!await isValidSession()) {
        if (loginAttempts++ >= 3) throw new Error('Login');
        try {
            await login();
        } catch (e: any) {
            console.error('Login attempt failed:', e);
            throw new Error('Login');
        }
    }

    const classes = await fetch(campus, part, term);

    if (!classes) {
        throw new Error('Parsing error.');
    }

    // Parses the output from the script
    const [courses, timeslots, enrollments] = classes;
    
    console.log(`Courses: ${courses.length} | Timeslots: ${timeslots.length} | ${enrollments.length}`)

    let existingCourses: CourseInformation[] = [];
    let fetchedCourseNames: string[] = [];
    let currentCourseName: string;
    const processedClasses = new Set<string>();

    // Main iteration for adding/updating courses
    const updatePromises = courses.map(async (curr: any, index: number) => {
        let currClass = {
            courseName: curr['courseName'],
            section: curr['section']
        };

        processedClasses.add(`${currClass['courseName']}|${currClass['section']}`);

        if (currClass['courseName'] !== currentCourseName) {
            currentCourseName = currClass['courseName'];
            if (!fetchedCourseNames.includes(currentCourseName)) {
              let fetchedCourses = await getAllCoursesByCourseName(currentCourseName);
              if (fetchedCourses) existingCourses.push(...fetchedCourses);
              fetchedCourseNames.push(currentCourseName);
            }
        }

        // Checks if this class exists in our DB fetch
        const existingSimilarCourse = existingCourses.find((c: CourseInformation) =>
            c['courseName'] === currClass['courseName']
            && c['section'] === currClass['section']
        );

        const currentEnrollment = enrollments.find((e: any) => e['courseId'] === curr['courseId']);
        const currentTimeslots = timeslots.filter((t: any) => t['courseId'] === curr['courseId']);

        let courseId;

        if (existingSimilarCourse) {
            courseId = existingSimilarCourse['id'];

            await updateCourse(
                courseId,
                curr,
                currentEnrollment, 
                currentTimeslots
            );
        } else {
            courseId = await createCourse(
                curr, 
                currentEnrollment, 
                currentTimeslots
            ); 
        }
    });

    // Waits for all updates/creates to finish in parallel
    await Promise.all(updatePromises);

    // Filters out courses that were not processed (i.e., removed courses)
    const coursesToDelete = existingCourses.filter((c: any) =>
        !processedClasses.has(`${c['courseName']}|${c['section']}`)
    );

    // Deletes courses that were not present in the latest fetch
    for (const curr of coursesToDelete) {
        await deleteCourse(curr['id']);
    }
    
    console.log(`Courses fetched.`);
}

export async function getCourseById(id: number): Promise<CourseInformation> {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM courses c
        LEFT JOIN course_enrollments ce ON c.cid = ce.course_id
        LEFT JOIN course_timeslots ct ON c.cid = ct.course_id
        WHERE c.cid = ?`,
        [id]
    );

    const course = mapToCourseInformationDTO(rows)[0];
    return course;
}

export async function getAllCoursesByCourseName(name: string): Promise<CourseInformation[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM courses c
        LEFT JOIN course_enrollments ce ON c.cid = ce.course_id
        LEFT JOIN course_timeslots ct ON c.cid = ct.course_id
        WHERE course_name LIKE ?`,
        [`%${name}%`]
    );

    const courses = mapToCourseInformationDTO(rows);
    return courses;
}

export async function getInstructorsByCourseName(name: string): Promise<any[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT DISTINCT instructor FROM course_timeslots ct
        JOIN courses c ON ct.course_id = c.cid
        WHERE course_name LIKE ?`,
        [`%${name}%`]
    );

    return rows as any[];
}

export async function deleteCourse(id: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
        `DELETE FROM courses
        WHERE cid = ?`,
        [id]
    ); 

    return result.affectedRows > 0;
}

export async function deleteCourseByCourseName(name: string): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
        `DELETE FROM courses
        WHERE course_name = ?`,
        [name]
    );

    return result.affectedRows > 0;
}