import type { FastifyPluginAsync } from "fastify";
import * as ArchersHubController from "../controller/archershub.controller.js";

const archershubRoutes: FastifyPluginAsync = async (app) => {
  app.get("/campuses", ArchersHubController.getCampuses);
  app.get("/terms", ArchersHubController.getTerms);
  app.get("/courses-list", ArchersHubController.getCoursesList);
};

export default archershubRoutes;