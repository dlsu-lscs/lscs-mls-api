import Fastify from "fastify";  
import dotenv from 'dotenv';
import cors from '@fastify/cors';


dotenv.config();
const port = process.env.PORT || 3000;
const host = process.env.HOST || 'localhost';


const app = Fastify({
  logger: true, 
});

app.reigster(cors, {
  origin: 'http://localhost:3001';
});


app.get("/health", async() => {
  return {
    status: "ok",
    version: "v2 powered by Fastify"
  };
}); 

/**TODO: Register APIv2 route plugins here 
 *
 * note to self: how fastify register syntax 
 *
 * app.register(importControllerFile, {prefix: "/route/here"});
**/ 



const start = async () => {
  try{
    await app.listen({port, host });
    console.log(`mls-api is live on port http://${host}:${port}`);
  }catch(error){
    app.log.error(error);
    process.exit(1);
  }
}; 


start();
