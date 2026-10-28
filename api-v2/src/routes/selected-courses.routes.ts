import type { FastifyPluginAsync } from "fastify";
import * as SelectedCourseController from "../controller/selected-courses.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireSelf } from "../middlewares/requireSelf.js";


const selectedCoursesRoutes: FastifyPluginAsync = async (app) => {
  // All routes require authentication
  app.addHook("preHandler", authMiddleware);

  // POST /users/:id/courses - Add a course to user's saved courses
  app.post("/users/:id/courses", { preHandler: requireSelf }, SelectedCourseController.addSelectedCourse);

  // GET /users/:id/courses - Get all saved courses for a user
  app.get("/users/:id/courses", { preHandler: requireSelf }, SelectedCourseController.getUserSelectedCourses);

  // DELETE /users/:userId/courses/:courseId - Remove a saved course
  app.delete(
    "/users/:userId/courses/:courseId",
    SelectedCourseController.removeSelectedCourse,
  );
};

export default selectedCoursesRoutes;
