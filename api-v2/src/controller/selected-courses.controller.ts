import type { FastifyReply, FastifyRequest } from "fastify";
import * as SelectedCourseService from "../services/selected-course.service.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";


export async function addSelectedCourse(
  req: FastifyRequest<{
    Params: { id: string };
    Body: { courseId: number };
  }>,
  reply: FastifyReply,
) {
  try {
    const userId = Number(req.params.id);
    if (isNaN(userId)) {
      return reply.code(400).send({ message: "Invalid user ID." });
    }

    const { courseId } = req.body;
    if (!courseId || isNaN(courseId)) {
      return reply.code(400).send({ message: "Valid courseId is required." });
    }


    //The verification needed here has become a hook found in routes and as a middleware "requierSelf.ts"

    const result = await SelectedCourseService.addSelectedCourse(userId, courseId);

    if (!result.success) {
      const statusCode = result.message.includes("not found") ? 404 : 409;
      return reply.code(statusCode).send({ message: result.message });
    }

    return reply.code(201).send({ message: result.message });
  } catch (error) {
    reply.log.error(error);
    return reply.code(500).send({ message: "Internal server error." });
  }
}

export async function getUserSelectedCourses(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  try {
    const userId = Number(req.params.id);
    if (isNaN(userId)) {
      return reply.code(400).send({ message: "Invalid user ID." });
    }

    const courses = await SelectedCourseService.getUserSelectedCourses(userId);
    return reply.code(200).send(courses);
  } catch (error) {
    reply.log.error(error);
    return reply.code(500).send({ message: "Internal server error." });
  }
}

export async function removeSelectedCourse(
  req: FastifyRequest<{
    Params: { userId: string; courseId: string };
  }>,
  reply: FastifyReply,
) {
  try {
    const userId = Number(req.params.userId);
    const courseId = Number(req.params.courseId);

    if (isNaN(userId) || isNaN(courseId)) {
      return reply.code(400).send({ message: "Invalid user ID or course ID." });
    }

    const result = await SelectedCourseService.removeSelectedCourse(
      userId,
      courseId,
    );

    if (!result.success) {
      return reply.code(404).send({ message: result.message });
    }

    return reply.code(200).send({ message: result.message });
  } catch (error) {
    reply.log.error(error);
    return reply.code(500).send({ message: "Internal server error." });
  }
}
