import type { FastifyPluginAsync } from "fastify";
import * as UserController from "../controller/user.controller.js";
import userPreferenceRoutes from "./user.preferences.routes.js";


const userRoutes: FastifyPluginAsync = async (app) => {
  // Routes for the /users endpoint
  app.post("/", UserController.createUser);
  app.get("/", UserController.getAllUsers);

  // Routes for the /users/:id endpoint
  app.get("/:id", UserController.getUserById);
  app.put("/:id", UserController.updateUser);
  app.delete("/:id", UserController.deleteUser);

  //Routes for user preferences 
  app.register(userPreferenceRoutes, { prefix: "/preferences" });

};




export default userRoutes;
