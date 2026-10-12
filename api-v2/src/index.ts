import Fastify, { FastifyInstance } from "fastify";
import dotenv from 'dotenv';
import cors from '@fastify/cors';
import { pool } from './db/index.js';
import courseRoutes from "./routes/course.routes.js";

dotenv.config();
const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || 'localhost';

const app = Fastify({
  logger: true,
});

app.register(cors, {
  origin: 'http://localhost:3001',
});


app.get("/health", async (_request, reply) => {
  try {
    await pool.query("SELECT 1");
    return {
      status: "ok",
      version: "v2 powered by Fastify",
      checks: {
        api: "ok",
        database: "ok",
      },
    };
  } catch {
    return reply.status(503).send({
      status: "degraded",
      version: "v2 powered by Fastify",
      checks: {
        api: "ok",
        database: "error",
      },
    });
  }
});

/**TODO: Register APIv2 route plugins here 
 *
 * note to self: how fastify register syntax 
 *
 * app.register(importControllerFile, {prefix: "/route/here"});
**/

app.register(courseRoutes, { prefix: "/courses" });


const start = async () => {
  try {
    await app.listen({ port, host });
    console.log(`mls-api is live on port http://${host}:${port}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};


start();
