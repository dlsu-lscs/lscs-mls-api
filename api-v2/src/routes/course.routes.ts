import type { FastifyPluginAsync } from "fastify";
import * as CourseController from "../controller/course.controller.js";

const courseRoutes: FastifyPluginAsync = async (app) => {
  app.get("/campuses", CourseController.getCampuses);
}

export default courseRoutes;
