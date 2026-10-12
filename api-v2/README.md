# Getting Started
```
npm run dev 
``` 
Launches a server that will hot reload upon a file change see `package.json` 


### Directory Changes
`api-v2/` is an isolated directory that contains its own `package.json`. 


### /health

Is a trivial endpoint to test the current state of the server. `curl localhost:${port}/health` to run it 

### .env changes (if not mentioned assume old standard / unimplemented) 

`MODIFY` 'DB_HOST' -changed to-> 'HOST' = a bit more descriptive 

`NEW` 'DB_URL' = postgresql://<username>@localhost:5432/<db_name>


### From express to Fastify 
`src/index.ts` -- now runs http requests using `fastify` 

### middleware cors to `@fastify/cors` 
fastify uses its own plugin of cors compared to treating it as a middleware 
`npm install @fastify/cors` if there seems to be issues with the cors 

cors origin: 3001 --- taken from legacy configuration 




## New Plugins 
npm i drizzle-orm pg dotenv
npm i -D drizzle-kit tsx @types/pg

npm i fastify
npm i -D typescript @types/node tsx
