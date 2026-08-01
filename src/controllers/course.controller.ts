import { Request, Response } from "express";
import * as CourseService from 'services/course.service.js';

export async function fetchCourses(req: Request, res: Response) {
    try {
        let campus = Number(req.body.campus);
        let part = Number(req.body.part);
        let term = Number(req.body.term);

        if (!campus) campus = 0; 
        if (!part) part = 0; 
        if (!term) term = 0; 

        await CourseService.fetchCourses(campus, part, term);
        return res.status(200).json({ message: 'Courses fetched successfully.' });
    } catch (err: any) {
        console.error('fetchCourses error:', err);
        if (["Parsing error", "OTP", "Fetch", "Login"].includes(err.message)) {
            res.status(400).json({ message: err });
        } else {
            res.status(500).json({ message: 'Internal server error.', err });
        }
    }
}

export async function getCourseById(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: 'Invalid user ID.' });
        }

        const course = await CourseService.getCourseById(id);

        if (!course) {
            return res.status(404).json({ message: 'Course not found.' });
        }
        res.status(200).json(course);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error.' });
    }
}

export async function getAllCoursesByCourseName(req: Request, res: Response) {
    try {
        const name = req.params.courseName as string;

        if (!name) {
            return res.status(400).json({ message: "No course name was given." })
        }

        const course = await CourseService.getAllCoursesByCourseName(name);

        if (!course) {
            return res.status(404).json({ message: 'Course/s not found.' });
        }
        res.status(200).json(course);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error.' });
    }
}

export async function getCampuses(req: Request, res: Response) {
    try {
        const campuses = await CourseService.getUniqueCampuses();
        res.status(200).json(campuses);
    } catch (err) {
        console.error('getCampuses error:', err);
        res.status(500).json({ message: 'Internal server error.' });
    }
}

export async function getTerms(req: Request, res: Response) {
    try {
        const terms = await CourseService.getUniqueTerms();
        res.status(200).json(terms);
    } catch (err) {
        console.error('getTerms error:', err);
        res.status(500).json({ message: 'Internal server error.' });
    }
}

export async function getCourseList(req: Request, res: Response) {
    try {
        const courses = await CourseService.getCourseList();
        res.status(200).json(courses);
    } catch (err) {
        console.error('getCourseList error:', err);
        res.status(500).json({ message: 'Internal server error.' });
    }
}