import type { FastifyReply, FastifyRequest } from "fastify";
import * as UserService from "../services/user.service.js";

export async function createUser(
  req: FastifyRequest<{ Body: import("../dtos/user.dto.js").CreateUser }>,
  reply: FastifyReply,
) {
  try {
    const user = await UserService.createUser(req.body);
    if (!user) {
      return reply.code(409).send({ message: "User already exists." });
    }
    return reply.code(201).send(user);
  } catch (error) {
    reply.log.error(error);
    return reply.code(500).send({
      message: "Internal server error.",
    });
  }
}

export async function getAllUsers(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const users = await UserService.getAllUsers();
    return reply.code(200).send(users);
  } catch (error) {
    reply.log.error(error);
    return reply.code(500).send({
      message: "Internal server error.",
    });
  }
}

export async function getUserById(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return reply.code(400).send({ message: "Invalid user ID." });
    }

    const user = await UserService.getUserById(id);

    if (!user) {
      return reply.code(404).send({ message: "User not found." });
    }
    return reply.code(200).send(user);
  } catch (error) {
    reply.log.error(error);
    return reply.code(500).send({
      message: "Internal server error.",
    });
  }
}

export async function updateUser(
  req: FastifyRequest<{ Params: { id: string }; Body: import("../dtos/user.dto.js").UpdateUser }>,
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

    const user = await UserService.updateUser(id, req.body);

    if (!user) {
      return reply.code(404).send({ message: "User not found." });
    }
    return reply.code(200).send(user);
  } catch (error) {
    reply.log.error(error);
    return reply.code(500).send({
      message: "Internal server error.",
    });
  }
}

export async function deleteUser(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return reply.code(400).send({ message: "Invalid user ID." });
    }

    const success = await UserService.deleteUser(id);

    if (!success) {
      return reply.code(404).send({ message: "User not found." });
    }
    return reply.code(200).send({ message: "User deleted successfully." });
  } catch (error) {
    reply.log.error(error);
    return reply.code(500).send({
      message: "Internal server error.",
    });
  }
}