# Getting Started
```
npm run dev 
``` 
Launches a server that will hot reload upon a file change see `package.json` 



## Migration changes so far 
`api-v2/` is an isolated directory that contains its own `package.json`. 

### .env changes (if not mentioned assume old standard / unimplemented) 

'DB_HOST' -changed to-> 'HOST' = a bit more descriptive


### From express to Fastify 
`src/index.ts` -- now runs http requests using `fastify` 

### middleware cors to `@fastify/cors` 
fastify uses its own plugin of cors compared to treating it as a middleware 
`npm install @fastify/cors` if there seems to be issues with the cors 

cors origin: 3001 --- taken from legacy configuration
