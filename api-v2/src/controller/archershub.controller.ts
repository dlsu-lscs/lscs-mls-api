import type { FastifyReply, FastifyRequest } from "fastify";
import * as ArchersHubService from "../services/archershub.service.js";

export async function getCampuses(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const campuses = await ArchersHubService.getCampuses();
    return reply.code(200).send(campuses);
  } catch (err: any) {
    reply.log.error(err);
    if (['No cookie file found.', 'No cookies found.', 'Session ID not found.'].includes(err.message)) {
      return reply.code(401).send({ message: 'No active session. Run /courses/fetch to authenticate.' });
    }
    return reply.code(500).send({ message: 'Internal server error.' });
  }
}

export async function getTerms(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const terms = await ArchersHubService.getTerms();
    return reply.code(200).send(terms);
  } catch (err: any) {
    reply.log.error(err);
    if (['No cookie file found.', 'No cookies found.', 'Session ID not found.'].includes(err.message)) {
      return reply.code(401).send({ message: 'No active session. Run /courses/fetch to authenticate.' });
    }
    return reply.code(500).send({ message: 'Internal server error.' });
  }
}

export async function getCourseList(
  req: FastifyRequest<{ Querystring: { campusNo: string; sessionId: string } }>,
  reply: FastifyReply,
) {
  try {
    const { campusNo, sessionId } = req.query;

    if (!campusNo || !sessionId) {
      return reply.code(400).send({ message: 'campusNo and sessionId are required.' });
    }

    const courses = await ArchersHubService.getCourseList(campusNo, sessionId);
    return reply.code(200).send(courses);
  } catch (err: any) {
    reply.log.error(err);
    if (['No cookie file found.', 'No cookies found.', 'Session ID not found.'].includes(err.message)) {
      return reply.code(401).send({ message: 'No active session. Run /courses/fetch to authenticate.' });
    }
    return reply.code(500).send({ message: 'Internal server error.' });
  }
}