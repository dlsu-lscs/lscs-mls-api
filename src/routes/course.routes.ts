import { Router } from "express";
import * as CourseController from 'controllers/course.controller.js';

const router = Router();

// Routes for the /courses/fetch endpoint
router.post('/fetch', CourseController.fetchCourses);

// Routes for the /courses/search/:courseName endpoint
router.get('/search/:courseName', CourseController.getAllCoursesByCourseName);

// Routes for the /courses/id/:id endpoint
router.get('/id/:id', CourseController.getCourseById);


export default router;