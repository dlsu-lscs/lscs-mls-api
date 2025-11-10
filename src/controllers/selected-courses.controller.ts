import { Request, Response } from "express";
import * as SelectedCourseService from 'services/selected-course.service.js';

export async function createSelectedCourse(req: Request, res: Response) {
    try {
        const course = await SelectedCourseService.createSelectedCourse(req.body);
        res.status(201).json(course);
    } catch (err: any) {
        console.log(err);
        if (err.message === "Selected course doesn't exist.") {
            res.status(404).json({ message: err.message });
        } else if (err.message.includes(" course ")) {
            res.status(409).json({ message: err.message });
        } else {
            res.status(500).json({ message: 'Error creating user-selected course.', error: err });
        }
    }
}

export async function getAllUserSelectedCourse(req: Request, res: Response) {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: 'Invalid user ID.' });
        }

        const user = await SelectedCourseService.getAllUserSelectedCourse(id);

        if (user.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json(user);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Error fetching user.', error: err });
    }
}

export async function deleteSelectedCourse(req: Request, res: Response) {
    try {
        const userId = Number(req.params.userId);
        const courseId = Number(req.params.courseId);
        if (isNaN(userId) || isNaN(courseId)) {
            return res.status(400).json({ message: 'Invalid user/course ID.' });
        }

        const success = await SelectedCourseService.deleteSelectedCourse(userId, courseId);

        if (!success) {
            return res.status(404).json({ message: 'Course not found.' });
        }
        res.status(200).json({ message: 'Course deleted successfully.' })
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Error deleting course.', error: err });
    }
}