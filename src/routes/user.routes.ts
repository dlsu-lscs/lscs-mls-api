import { Router } from "express";
import * as UserController from 'controllers/user.controller.js';
import * as SelectedCourseService from 'controllers/selected-courses.controller.js'

const router = Router();

// Routes for the /users endpoint
router.post('/', UserController.createUser);
router.get('/', UserController.getAllUsers);

// Routes for the /users/:id endpoint
router.get('/:id', UserController.getUserById);
router.put('/:id', UserController.updateUser);
router.delete('/:id', UserController.deleteUser);

// Other routes involving user id
router.post('/:id/courses', SelectedCourseService.createSelectedCourse);
router.get('/:id/courses', SelectedCourseService.getAllUserSelectedCourse);
router.put('/:id/id-number', UserController.updateUserIdNumber);
router.delete('/:userId/courses/:courseId', SelectedCourseService.deleteSelectedCourse);

export default router;