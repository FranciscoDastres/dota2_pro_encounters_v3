FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json

RUN npm ci

ARG VITE_API_URL=
ARG VITE_KOFI_USERNAME=dnthdev
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_KOFI_USERNAME=$VITE_KOFI_USERNAME

COPY frontend frontend

RUN npm run build --workspace=frontend

FROM caddy:2-alpine

COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/frontend/dist /usr/share/caddy

EXPOSE 80 443
