import { Request, Response } from "express";
import * as CourseService from 'services/course.service.js';

export async function createCourse(req: Request, res: Response) {
    // STAY TUNED
}

export async function getCourseById(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: 'Invalid user ID.' });
        }

        const course = await CourseService.getCourseById(id);

        if (course === null) {
            return res.status(404).json({ message: 'Course/s not found.' });
        }
        res.status(200).json(course);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Error fetching courses.', error: err });
    }
}

export async function getAllCoursesByCourseName(req: Request, res: Response) {
    try {
        const name = req.query.q as string;

        if (!name) {
            return res.status(400).json({ message: "Search query is empty" })
        }

        const course = await CourseService.getAllCoursesByCourseName(name);

        if (course === null) {
            return res.status(404).json({ message: 'Course/s not found.' });
        }
        res.status(200).json(course);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Error fetching courses.', error: err });
    }
}

export async function deleteCourse(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: 'Invalid user ID.' });
        }

        const success = await CourseService.deleteCourse(id);

        if (!success) {
            return res.status(404).json({ message: 'Course not found.' });
        }
        res.status(200).json({ message: 'Course deleted successfully.' })
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Error deleting course.', error: err });
    }
}

export async function deleteCourseByCourseName(req: Request, res: Response) {
    try {
        const name = req.query.q as string;

        if (!name) {
            return res.status(400).json({ message: "Search query is empty" })
        }

        const success = await CourseService.deleteCourseByCourseName(name);

        if (!success) {
            return res.status(404).json({ message: 'Course/s not found.' });
        }
        res.status(200).json({ message: 'Course deleted successfully.' })
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Error deleting course.', error: err });
    }
}