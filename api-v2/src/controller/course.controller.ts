import type { FastifyReply, FastifyRequest } from "fastify";
import * as CourseService from "../services/course.service.js";

export async function getCampuses(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const campuses = await CourseService.getUniqueCampuses();
    return reply.code(200).send(campuses);
  } catch (error) {
    reply.log.error(error);
    return reply.code(500).send({
      message: "Internal server error.",
    });
  }
}
