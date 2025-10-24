# Stage 1: Build the application
FROM node:20-alpine AS build
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Production environment
FROM node:20-alpine
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=build /usr/src/app/dist ./dist

ENV PORT=3000

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD [ "node", "-e", "http.get('http://localhost:3000/health', (res) => process.exit(res.statusCode == 200 ? 0 : 1))" ]

CMD [ "node", "dist/index.js" ]