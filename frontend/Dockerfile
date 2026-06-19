# Builds the Vite SPA and serves the static output via nginx. Used by
# docker-compose.yml's `frontend` service (local one-command demo). The
# single-container deploy (deploy/Dockerfile) builds the same way but bundles
# nginx + uvicorn into one image instead — see that file for the prod path.
#
# Build context is the `frontend/` directory itself:
#   docker build -t womenaid-frontend frontend/
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
