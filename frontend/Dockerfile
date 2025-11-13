FROM node:24-alpine AS base
WORKDIR /app
COPY package.json ./
RUN npm install

FROM base AS lint
COPY . .
RUN npm run check && \
    npm run lint

FROM base AS test
COPY . .
RUN npm run test
