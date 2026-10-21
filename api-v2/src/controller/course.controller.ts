import type { FastifyReply, FastifyRequest } from "fastify";
import * as CourseService from "../services/course.service.js";

export async function fetchCourses(
  req: FastifyRequest<{ Body?: { campus?: number; part?: number; term?: number; course?: string } }>,
  reply: FastifyReply,
) {
  try {
    const body = req.body ?? {};
    let campus = Number(body.campus);
    let part = Number(body.part);
    let term = Number(body.term);
    let course = body.course;

    if (!campus) campus = 0;
    if (!part) part = 0;
    if (!term) term = 0;
    if (!course) course = "";

    await CourseService.fetchCourses(campus, part, term, course);
    return reply.code(200).send({ message: "Courses fetched successfully." });
  } catch (err: any) {
    console.error("fetchCourses error:", err);
    if (["Parsing error", "OTP", "Fetch", "Login"].includes(err.message)) {
      return reply.code(400).send({ message: err.message });
    } else {
      return reply.code(500).send({ message: "Internal server error.", err: err.message });
    }
  }
}

export async function getCourseById(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return reply.code(400).send({ message: "Invalid course ID." });
    }

    const course = await CourseService.getCourseById(id);

    if (!course) {
      return reply.code(404).send({ message: "Course not found." });
    }
    return reply.code(200).send(course);
  } catch (error) {
    reply.log.error(error);
    return reply.code(500).send({ message: "Internal server error." });
  }
}

export async function getAllCoursesByCourseName(
  req: FastifyRequest<{ Params: { courseName: string } }>,
  reply: FastifyReply,
) {
  try {
    const name = req.params.courseName;

    if (!name) {
      return reply.code(400).send({ message: "No course name was given." });
    }

    const courses = await CourseService.getAllCoursesByCourseName(name);

    if (!courses || courses.length === 0) {
      return reply.code(404).send({ message: "Course/s not found." });
    }
    return reply.code(200).send(courses);
  } catch (error) {
    reply.log.error(error);
    return reply.code(500).send({ message: "Internal server error." });
  }
}

export async function getCampuses(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const campuses = await CourseService.getUniqueCampuses();
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
    const terms = await CourseService.getUniqueTerms();
    return reply.code(200).send(terms);
  } catch (error) {
    reply.log.error(error);
    return reply.code(500).send({ message: "Internal server error." });
  }
}

export async function getCourseList(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const courses = await CourseService.getCourseList();
    return reply.code(200).send(courses);
  } catch (error) {
    reply.log.error(error);
    return reply.code(500).send({ message: "Internal server error." });
  }
}
