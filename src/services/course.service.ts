import { ResultSetHeader, RowDataPacket } from 'mysql2';
import pool from 'config/db.js';
import { spawnSync } from 'child_process';
import { Course, CreateCourse, UpdateCourse } from 'dtos/course.dto.js';
import { CourseEnrollment, CreateCourseEnrollment, UpdateCourseEnrollment } from 'dtos/course-enrollment.dto.js';
import { CourseTimeslot, CreateCourseTimeslot, UpdateCourseTimeslot } from 'dtos/course-timeslot.dto.js';
import { get } from 'http';
import { exists } from 'fs';

export async function createCourse(
    courseData: CreateCourse,
    enrollmentData: CreateCourseEnrollment,
    timeslotData: CreateCourseTimeslot[]
): Promise<number | null> {
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

    await console.log("C1st " + resultCourse.affectedRows)

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

    await console.log("C2nd")

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

    await console.log("C3rd")

    return courseId
}

async function updateCourse(
    courseId: number,
    newCourseData: UpdateCourse,
    newEnrollmentData: UpdateCourseEnrollment,
    newTimeslotData: UpdateCourseTimeslot[]
): Promise<void> {
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
            remarks,
            courseId
        ]
    );

    await console.log("U1st " + resultCourse.affectedRows)

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

    await console.log("U2nd")

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

    await console.log("U3rd");
}

// WILL ADD SCRAPING HERE
export async function fetchCourses(id: string, course: string): Promise<any[]> {
    // Runs the python script
    const process = spawnSync('python3', ['../lscs-mls-api/src/scripts/scraper.py', id, course], { encoding: 'utf-8' });
    
    if (process.error) {
        throw new Error('Error parsing: ' + process.error.message);
    }

    // Parses the output from the script
    let [courses, timeslots, enrollments] = JSON.parse(process.stdout.trim());

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

// FIX?
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

export async function getAllCoursesByCourseName(name: string): Promise<any[]> {
    // ADD FILTERS AND SORT IN THE FUTURE

    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM courses c
        LEFT JOIN course_enrollments ce ON c.id = ce.course_id
        LEFT JOIN course_timeslots ct ON c.id = ct.course_id
        WHERE course_name = ?`,
        [name]
    );

    await console.log("ROWS fetched");

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