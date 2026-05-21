import { Request, Response } from "express";
import * as SelectedCourseService from 'services/selected-course.service.js';

export async function createSelectedCourse(req: Request, res: Response) {
    try {
        const course = await SelectedCourseService.createSelectedCourse(req.body);
        res.status(201).json(course);
    } catch (err: any) {
        if (err.message.includes("Selected course doesn't exist")) {
            res.status(404).json({ message: err.message });
        } else if (err.message.includes("Conflict")) {
            res.status(409).json({ message: err.message });
        } else {
            res.status(500).json({ message: 'Internal server error.' });
        }
    }
}

export async function getAllUserSelectedCourse(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: 'Invalid user ID.' });
        }

        const courses = await SelectedCourseService.getAllUserSelectedCourse(id);

        if (courses.length === 0) {
            return res.status(404).json({ message: 'No courses found for user.' });
        }
        res.status(200).json(courses);
    } catch (err) {
        res.status(500).json({ message: 'Internal server error.' });
    }
}

export async function deleteSelectedCourse(req: Request, res: Response) {
    try {
        const userId = Number(req.params.userId);
        const courseId = Number(req.params.courseId);
        if (isNaN(userId)) {
            return res.status(400).json({ message: 'Invalid user ID.' });
        }
        if (isNaN(courseId)) {
            return res.status(400).json({ message: 'Invalid course ID.' });
        }

        const success = await SelectedCourseService.deleteSelectedCourse(userId, courseId);

        if (!success) {
            return res.status(404).json({ message: 'Course not found.' });
        }
        res.status(200).json({ message: 'Course deleted successfully.' })
    } catch (err) {
        res.status(500).json({ message: 'Internal server error.' });
    }
}