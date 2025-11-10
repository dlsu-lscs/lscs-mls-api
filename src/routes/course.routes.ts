import { Router } from "express";
import * as CourseController from 'controllers/course.controller.js';

const router = Router();

router.post('/', CourseController.createCourse);

router.get('/:id', CourseController.getCourseById);
router.delete('/:id', CourseController.deleteCourse);

router.get('/search', CourseController.getAllCoursesByCourseName);
router.delete('/search', CourseController.deleteCourseByCourseName);

export default router;