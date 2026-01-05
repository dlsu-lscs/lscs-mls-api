import { Router } from "express";
import * as CourseController from 'controllers/course.controller.js';

const router = Router();

// Routes for the /courses endpoint
router.post('/', CourseController.fetchCourses);
router.get('/', CourseController.getAllCoursesByCourseName);

// Routes for the /courses/:id endpoint
router.get('/:id', CourseController.getCourseById);


export default router;