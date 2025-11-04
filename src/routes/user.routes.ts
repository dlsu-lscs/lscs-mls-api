import { Router } from "express";
import * as UserController from 'controllers/user.controller.js';
import * as SelectedCourseService from 'controllers/selected-courses.controller.js'

const router = Router();

// user routes
router.post('/', UserController.createUser);
router.get('/', UserController.getAllUsers);
router.get('/:id', UserController.getUserById);
router.put('/:id', UserController.updateUser);
router.delete('/:id', UserController.updateUser);

// STILL NEED TO ADD
// GETUSERBYUSERID
// UPDATEUSERIDNUMBER

router.post('/:id/courses', SelectedCourseService.createSelectedCourse);
router.get('/:id/courses', SelectedCourseService.getAllUserSelectedCourse);
// FIX BELOW
router.delete('/:userId/courses/:courseId', SelectedCourseService.deleteSelectedCourse);

export default router;