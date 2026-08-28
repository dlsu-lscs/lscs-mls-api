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
        remarks,
        modality,
        term,
        campus
    } = courseData;

    const [resultCourse] = await pool.query<ResultSetHeader>(
        `INSERT INTO courses (course_name, section, remarks, modality, term, campus)
        VALUES (?, ?, ?, ?, ?, ?)`, [
            courseName,
            section,
            remarks,
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
        remarks,
        modality,
        term,
        campus
    } = newCourseData;

    await pool.query<ResultSetHeader>(
        `UPDATE courses
        SET course_name = ?, section = ?, remarks = ?, modality = ?, term = ?, campus = ?
        WHERE cid = ?`, [
            courseName,
            section,
            remarks,
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

    const [existingRows] = await pool.query<RowDataPacket[]>(
        `SELECT tid, day, time, room, instructor FROM course_timeslots WHERE course_id = ?`, 
        [courseId]
    );

    const existingMap = new Map(existingRows.map(row => [`${row.day}|${row.time}`, row]));
    const incomingMap = new Map(newTimeslotData.map(ts => [`${ts.day}|${ts.time}`, ts]));

    const queries: Promise<any>[] = [];

    for (const [key, incoming] of incomingMap.entries()) {
        if (existingMap.has(key)) {
            queries.push(pool.query(
                `UPDATE course_timeslots SET room = ?, instructor = ? WHERE course_id = ? AND day = ? AND time = ?`,
                [incoming.room, incoming.instructor, courseId, incoming.day, incoming.time]
            ));
        } else {
            queries.push(pool.query(
                `INSERT INTO course_timeslots (course_id, day, time, room, instructor) VALUES (?, ?, ?, ?, ?)`,
                [courseId, incoming.day, incoming.time, incoming.room, incoming.instructor]
            ));
        }
    }

    for (const [key, existing] of existingMap.entries()) {
        if (!incomingMap.has(key)) {
            queries.push(pool.query(
                `DELETE FROM course_timeslots WHERE tid = ?`, 
                [existing.id] 
            ));
        }
    }

    await Promise.all(queries);
}

export async function fetchCourses(
  campus: number = 0,
  part: number = 0, 
  term: number = 0,
  course: string = ''
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

    const classes = await fetch(campus, part, term, course);

    if (!classes) {
        throw new Error('Parsing error.');
    }

    // Parses the output from the script
    const [courses, timeslots, enrollments] = classes;
    
    console.log(`Courses: ${courses.length} | Timeslots: ${timeslots.length} | Enrollments: ${enrollments.length}`)

    const uniqueCourseNames = Array.from(new Set(courses.map((c: any) => c['courseName'])));

    let existingCourses: CourseInformation[] = [];
    for (const name of uniqueCourseNames as string[]) {
        const fetchedCourses = await getAllCoursesByCourseName(name);
        if (fetchedCourses) {
            existingCourses.push(...fetchedCourses);
        }
    }

    const processedClasses = new Set<string>();
    const newlyCreatedTracker = new Set<string>();

    // Main iteration for adding/updating courses
    const updatePromises = courses.map(async (curr: any) => {
        const courseName = curr['courseName'];
        const section = curr['section'];
        const classKey = `${courseName}|${section}`;

        processedClasses.add(classKey);

        const existingSimilarCourse = existingCourses.find((c: CourseInformation) =>
            c['courseName'] === courseName && c['section'] === section
        );

        const currentEnrollment = enrollments.find((e: any) => e['courseId'] === curr['courseId']);
        const currentTimeslots = timeslots.filter((t: any) => t['courseId'] === curr['courseId']);

        if (existingSimilarCourse) {
            await updateCourse(
                existingSimilarCourse['id'],
                curr,
                currentEnrollment, 
                currentTimeslots
            );
        } else {
            // Check if another parallel iteration JUST created this class from a duplicate payload
            if (!newlyCreatedTracker.has(classKey)) {
                newlyCreatedTracker.add(classKey);
                await createCourse(
                    curr, 
                    currentEnrollment, 
                    currentTimeslots
                ); 
            }
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

export async function getUniqueCampuses(): Promise<string[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT DISTINCT campus FROM courses
        WHERE campus IS NOT NULL AND campus != ''
        ORDER BY campus`
    );

    return rows.map((row) => row.campus);
}

export async function getUniqueTerms(): Promise<string[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT DISTINCT term FROM courses
        WHERE term IS NOT NULL AND term != ''
        ORDER BY term`
    );

    return rows.map((row) => row.term);
}

export async function getCourseList(): Promise<string[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT DISTINCT course_name FROM courses
        WHERE course_name IS NOT NULL AND course_name != ''
        ORDER BY course_name`
    );

    return rows.map((row) => row.course_name);
}
