import { Router } from "express";
import * as CourseController from 'controllers/course.controller.js';

const router = Router();

// Routes for the /courses endpoint
router.post('/', CourseController.createCourse);

// Routes for the /courses/:id endpoint
router.get('/:id', CourseController.getCourseById);
router.delete('/:id', CourseController.deleteCourse);

// Routes for the /courses/search endpoint (search by course name)
router.get('/search', CourseController.getAllCoursesByCourseName);
router.delete('/search', CourseController.deleteCourseByCourseName);

export default router;