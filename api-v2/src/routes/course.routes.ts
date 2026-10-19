import type { FastifyPluginAsync } from "fastify";
import * as CourseController from "../controller/course.controller.js";

const courseRoutes: FastifyPluginAsync = async (app) => {
  // POST /courses/fetch → fetchCourses
  app.post("/fetch", CourseController.fetchCourses);

  // GET /courses/search/:courseName → getAllCoursesByCourseName
  app.get("/search/:courseName", CourseController.getAllCoursesByCourseName);

  // GET /courses/id/:id → getCourseById
  app.get("/id/:id", CourseController.getCourseById);

  // GET /courses/terms → getTerms (v2: getTerms corresponds to v1 getUniqueTerms)
  app.get("/terms", CourseController.getTerms);

  // GET /courses/list → getCourseList
  app.get("/list", CourseController.getCourseList);

  // GET /courses/campuses → getCampuses (already existed, keep)
  app.get("/campuses", CourseController.getCampuses);
};

export default courseRoutes;