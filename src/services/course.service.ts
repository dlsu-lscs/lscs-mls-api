import { ResultSetHeader, RowDataPacket } from 'mysql2';
import pool from 'config/db.js';
import { fetch } from 'scripts/fetch.js';
import { login, isValidSession } from 'scripts/login.js';
import { Course, CreateCourse, UpdateCourse } from 'dtos/course.dto.js';
import { CourseEnrollment, CreateCourseEnrollment, UpdateCourseEnrollment } from 'dtos/course-enrollment.dto.js';
import { CourseTimeslot, CreateCourseTimeslot, UpdateCourseTimeslot } from 'dtos/course-timeslot.dto.js';

export async function createCourse(
    courseData: CreateCourse,
    enrollmentData: CreateCourseEnrollment,
    timeslotData: CreateCourseTimeslot[]
): Promise<void> {
    const {
        courseName,
        section,
        modality,
        term
    } = courseData;

    const [resultCourse] = await pool.query<ResultSetHeader>(
        `INSERT INTO courses (course_name, section, modality, term)
        VALUES (?, ?, ?, ?)`, [
            courseName,
            section,
            modality,
            term
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

async function updateCourse(
    courseId: number,
    newCourseData: UpdateCourse,
    newEnrollmentData: UpdateCourseEnrollment,
    newTimeslotData: UpdateCourseTimeslot[]
): Promise<void> {
    const {
        courseName,
        section,
        modality,
        term
    } = newCourseData;

    const [resultCourse] = await pool.query<ResultSetHeader>(
        `UPDATE courses
        SET course_name = ?, section = ?, modality = ?, term = ?
        WHERE cid = ?`, [
            courseName,
            section,
            modality,
            term,
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

export async function fetchCourses(): Promise<any[]> {
    // Runs the python script
    while (!isValidSession()) {
        await login();
    }
    
    const classes = await fetch();

    if (!classes) {
        throw new Error('Error parsing.');
    }

    // Parses the output from the script
    let [courses, timeslots, enrollments] = classes;

    // Fetches existing courses from DB (for comparison)
    const existingCourses = await getAllCoursesByCourseName(course);

    await console.log("Fetched courses from DB");

    // Set to track processed class numbers
    const processedClassNumbers = new Set<number>();

    // Main iteration for adding/updating courses
    const updatePromises = courses.map(async (curr: any, index: number) => {
        console.log(curr);

        let classNumber = Number(curr['classNumber']);
        processedClassNumbers.add(classNumber);
        
        // Checks if this class number exists in our DB fetch
        const existingClassNumberCourses = existingCourses.filter((c: any) => c['class_number'] === classNumber);

        const currentEnrollment = enrollments[index];
        const currentTimeslots = timeslots.filter((ts: any) => ts['course_id'] === curr['course_id']);

        let courseId;

        if (existingClassNumberCourses.length > 0) {
            courseId = existingClassNumberCourses[0]['course_id'];

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

        console.log(courseId)

        const fetchedCourse = {
            class_number: courseId,
            enrollment: currentEnrollment,
            timeslots: currentTimeslots
        }

        // NOTE: For now, ignore the course_id found in the enrollment and timeslots of fetchedCourse
        return fetchedCourse;
    });

    // Waits for all updates/creates to finish in parallel
    let newCourses = await Promise.all(updatePromises);

    // Filters out courses that were not processed (i.e., removed courses)
    const coursesToDelete = existingCourses.filter((c: any) => !processedClassNumbers.has(c['class_number']));

    // Deletes courses that were not present in the latest fetch
    for (const curr of coursesToDelete) {
        console.log(curr)
        await deleteCourse(curr['id']);
        console.log(`Course with class number ${curr['class_number']} has been removed.`);
    }
    
    await console.log(`Courses fetched for course name: ${course}`);

    return newCourses;
}

// FIX RETURN
// REMOVE RETURN IN FETCHCOURSES
export async function getCourseById(id: number): Promise<any[] | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM courses c
        LEFT JOIN course_enrollments ce ON c.cid = ce.course_id
        LEFT JOIN course_timeslots ct ON c.cid = ct.course_id
        WHERE c.cid = ?`,
        [id]
    );

    return rows as any | null;
}

export async function getAllCoursesByCourseName(name: string): Promise<any[]> {
    // ADD FILTERS AND SORT IN THE FUTURE

    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM courses c
        LEFT JOIN course_enrollments ce ON c.cid = ce.course_id
        LEFT JOIN course_timeslots ct ON c.cid = ct.course_id
        WHERE course_name = ?`,
        [name]
    );

    await console.log("ROWS fetched");

    return rows as any[];
}

export async function getInstructorsByCourseName(name: string): Promise<any[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT DISTINCT instructor FROM course_timeslots ct
        JOIN courses c ON ct.course_id = c.cid
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

export async function deleteCourseByCourseName(name: string): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
        `DELETE FROM courses
        WHERE course_name = ?`,
        [name]
    );

    return result.affectedRows > 0;
}