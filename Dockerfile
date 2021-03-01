FROM node:15.10.0-alpine3.11 as builder
WORKDIR /app

COPY ["package.json", "package-lock.json", "tsconfig.json", "./"]
RUN npm install

COPY ./src/ ./src
RUN npm run build

FROM node:15.10.0-alpine3.11
WORKDIR /app
ENV NODE_ENV production

COPY --from=builder ["/app/package*", "./"]
RUN npm install

COPY --from=builder ["/app/dist/", "./dist/"]
CMD npm run run-prod
