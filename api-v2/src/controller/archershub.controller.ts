import type { FastifyReply, FastifyRequest } from "fastify";
import * as ArchersHubService from "../services/archershub.service.js";

export async function getCampuses(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const campuses = await ArchersHubService.getCampuses();
    return reply.code(200).send(campuses);
  } catch (error) {
    reply.log.error(error);
    return reply.code(500).send({ message: "Internal server error." });
  }
}

export async function getTerms(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const terms = await ArchersHubService.getTerms();
    return reply.code(200).send(terms);
  } catch (error) {
    reply.log.error(error);
    return reply.code(500).send({ message: "Internal server error." });
  }
}

export async function getCoursesList(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const courses = await ArchersHubService.getCoursesList();
    return reply.code(200).send(courses);
  } catch (error) {
    reply.log.error(error);
    return reply.code(500).send({ message: "Internal server error." });
  }
}