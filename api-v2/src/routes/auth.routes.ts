import type { FastifyPluginAsync } from "fastify";
import * as AuthController from "../controller/auth.controller.js";

const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/google", AuthController.handleAuthentication);
  app.get("/google/callback", AuthController.handleCallback);
};

export default authRoutes;