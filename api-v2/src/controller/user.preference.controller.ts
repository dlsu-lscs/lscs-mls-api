import type { FastifyReply, FastifyRequest } from "fastify";
import * as UserPreferencesService from "../services/user_preferences.service.js";

export async function createUserPreferences(
  req: FastifyRequest<{ Body: import("../dtos/user_preferences.dto.js").CreateUserPreferences }>,
  reply: FastifyReply,
) {
  try {
    const preferences = await UserPreferencesService.createUserPreferences(req.body);
    if (!preferences) {
      return reply.code(409).send({ message: "User not found or preferences already exist." });
    }
    return reply.code(201).send(preferences);
  } catch (error) {
    reply.log.error(error);
    return reply.code(500).send({
      message: "Internal server error.",
    });
  }
}

export async function getUserPreferences(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return reply.code(400).send({ message: "Invalid user ID." });
    }

    const preferences = await UserPreferencesService.getUserPreferencesById(id);

    if (!preferences) {
      return reply.code(404).send({ message: "User preferences not found." });
    }
    return reply.code(200).send(preferences);
  } catch (error) {
    reply.log.error(error);
    return reply.code(500).send({
      message: "Internal server error.",
    });
  }
}

export async function updateUserPreferences(
  req: FastifyRequest<{ Params: { id: string }; Body: import("../dtos/user_preferences.dto.js").UpdateUserPreferences }>,
  reply: FastifyReply,
) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return reply.code(400).send({ message: "Invalid user ID." });
    }

    // Prevent updating with an empty object
    if (Object.keys(req.body).length === 0) {
      return reply.code(400).send({ message: "No update fields provided." });
    }

    const preferences = await UserPreferencesService.updateUserPreferences(id, req.body);

    if (!preferences) {
      return reply.code(404).send({ message: "User preferences not found." });
    }
    return reply.code(200).send(preferences);
  } catch (error) {
    reply.log.error(error);
    return reply.code(500).send({
      message: "Internal server error.",
    });
  }
}

export async function deleteUserPreferences(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return reply.code(400).send({ message: "Invalid user ID." });
    }

    const success = await UserPreferencesService.deleteUserPreferences(id);

    if (!success) {
      return reply.code(404).send({ message: "User preferences not found." });
    }
    return reply.code(200).send({ message: "User preferences deleted successfully." });
  } catch (error) {
    reply.log.error(error);
    return reply.code(500).send({
      message: "Internal server error.",
    });
  }
}