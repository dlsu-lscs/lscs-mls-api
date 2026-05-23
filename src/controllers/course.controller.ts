import { Request, Response } from "express";
import * as CourseService from 'services/course.service.js';

export async function fetchCourses(req: Request, res: Response) {
    try {
        let part = Number(req.body.part);
        let term = Number(req.body.term);

        const courses = await CourseService.fetchCourses(part, term);
        return res.status(200).json({ message: 'Courses fetched successfully.' });
    } catch (err: any) {
        if (["Parsing error", "OTP", "Fetch", "Login"].includes(err.message)) {
            res.status(400).json({ message: err.message });
        } else {
            res.status(500).json({ message: 'Internal server error.' });
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