import { Router } from "express";
import * as CourseController from 'controllers/course.controller.js';

const router = Router();

// Routes for the /courses/fetch endpoint
router.post('/fetch', CourseController.fetchCourses);

// Routes for the /courses/search/:courseName endpoint
router.get('/search/:courseName', CourseController.getAllCoursesByCourseName);

// Routes for the /courses/id/:id endpoint
router.get('/id/:id', CourseController.getCourseById);

// Routes for the /courses/campuses endpoint
router.get('/campuses', CourseController.getCampuses);

// Routes for the /courses/terms endpoint
router.get('/terms', CourseController.getTerms);

// Routes for the /courses/list endpoint
router.get('/list', CourseController.getCourseList);


export default router;