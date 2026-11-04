import jwt from 'jsonwebtoken';
import type { FastifyRequest, FastifyReply } from "fastify";

interface JwtPayload {
  userId: string;
  email?: string;
  givenName?: string;
  familyName?: string;
  pictureUrl?: string;
}

declare module "fastify" {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}

export const authMiddleware = async (
  req: FastifyRequest,
  reply: FastifyReply,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return reply.code(401).send({ message: "Authentication required." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string,
    ) as JwtPayload;
    req.user = decoded;
  } catch {
    return reply.code(401).send({ message: "Invalid or expired token." });
  }
};

export default authMiddleware;