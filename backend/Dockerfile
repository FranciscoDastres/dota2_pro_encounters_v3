FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json

RUN npm ci

FROM deps AS build

COPY backend backend

RUN npm run build --workspace=backend

FROM node:22-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json

RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/backend/dist backend/dist

USER node

EXPOSE 3000

CMD ["node", "backend/dist/index.js"]
