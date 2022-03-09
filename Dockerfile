FROM node:gallium-alpine3.14 as builder
WORKDIR /app

COPY ["package.json", "package-lock.json", "tsconfig.json", "./"]
RUN npm ci

COPY ./src/ ./src
RUN npm run build

FROM node:gallium-alpine3.14
WORKDIR /app
ENV NODE_ENV production

COPY --from=builder ["/app/package*", "./"]
RUN npm ci

COPY --from=builder ["/app/dist/", "./dist/"]
CMD npm run run-prod
