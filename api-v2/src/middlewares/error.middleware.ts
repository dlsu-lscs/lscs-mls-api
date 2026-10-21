import type { FastifyError, FastifyRequest, FastifyReply } from "fastify";

export async function errorMiddleware(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  request.log.error({ err: error }, "Request error");

  // Validation errors
  if (error.validation) {
    return reply.code(400).send({
      statusCode: 400,
      error: "Bad Request",
      message: "Validation failed",
      details: error.validation,
    });
  }

  // Drizzle/PostgreSQL errors
  if (error.message.includes("duplicate key value violates unique constraint")) {
    return reply.code(409).send({
      statusCode: 409,
      error: "Conflict",
      message: "Resource already exists",
    });
  }

  if (error.message.includes("foreign key constraint")) {
    return reply.code(400).send({
      statusCode: 400,
      error: "Bad Request",
      message: "Referenced resource does not exist",
    });
  }

  if (error.message.includes("not null constraint")) {
    return reply.code(400).send({
      statusCode: 400,
      error: "Bad Request",
      message: "Required field is missing",
    });
  }

  // JWT errors
  if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
    return reply.code(401).send({
      statusCode: 401,
      error: "Unauthorized",
      message: "Invalid or expired token",
    });
  }

  // Fastify not found
  if (error.statusCode === 404 || error.code === "FST_ERR_NOT_FOUND") {
    return reply.code(404).send({
      statusCode: 404,
      error: "Not Found",
      message: "Route not found",
    });
  }

  // Default: internal server error
  const statusCode = error.statusCode ?? 500;
  return reply.code(statusCode).send({
    statusCode,
    error: statusCode >= 500 ? "Internal Server Error" : "Error",
    message: statusCode >= 500 ? "Internal server error" : error.message,
  });
}

export default errorMiddleware;