import { FastifyRequest, FastifyReply } from "fastify";
import { getUidByGoogleId } from "../services/user.service.js";


export async function requireSelf(
  req: FastifyRequest<{
    Params: { id: String };
  }>,
  reply: FastifyReply) {

  if (!req.user?.userId) {
    return reply.code(401).send({ message: "Unauthorized" });
  }

  const authUid = await getUidByGoogleId(req.user.userId);

  if (authUid === null || authUid !== Number(req.params.id)) {
    return reply.code(403).send({ message: "Forbidden" });
  }


}
