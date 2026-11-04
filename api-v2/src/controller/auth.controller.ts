import type { FastifyReply, FastifyRequest } from "fastify";
import * as AuthService from "../services/auth.service.js";

export async function handleAuthentication(
  req: FastifyRequest<{ Body: { token?: string } }>,
  reply: FastifyReply,
) {
  const { token: accessToken } = req.body ?? {};

  if (!accessToken) {
    return reply.code(400).send({ message: "Access token is required." });
  }

  try {
    const result = await AuthService.googleAuth2(accessToken);
    return reply.code(200).send(result);
  } catch (error: any) {
    reply.log.error(error);
    if (error.message.includes("Error on authentication")) {
      return reply.code(403).send({ message: error.message });
    }
    return reply.code(500).send({ message: "Internal server error." });
  }
}

export async function handleCallback(
  req: FastifyRequest<{ Querystring: { code?: string } }>,
  reply: FastifyReply,
) {
  const { code } = req.query;

  if (!code) {
    return reply.code(400).send({ message: "Authorization code is missing" });
  }

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID as string,
        client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
        code,
        grant_type: "authorization_code",
        redirect_uri: process.env.GOOGLE_REDIRECT_URI as string,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Error on authentication.');
    }

    const tokenData = await tokenResponse.json() as { id_token?: string };
    const idToken = tokenData.id_token;

    if (!idToken) {
      throw new Error('Error on authentication.');
    }

    const result = await AuthService.googleAuth2(idToken);

    return reply.code(200).send({ token: result });
  } catch (error: any) {
    reply.log.error(error);
    if (error.message.includes("Error on authentication")) {
      return reply.code(403).send({ message: error.message });
    }
    return reply.code(500).send({ message: "Internal server error." });
  }
}