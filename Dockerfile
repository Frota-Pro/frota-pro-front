# =========================
# BUILD STAGE
# =========================
FROM node:20-alpine AS build

WORKDIR /app

# Copia o package.json do Angular
COPY frota-pro/package*.json ./
RUN npm ci

# Copia o restante do Angular
COPY frota-pro/ .
RUN npm run build

# =========================
# RUNTIME STAGE
# =========================
FROM nginx:alpine

# Angular normalmente gera dist/<nome-do-projeto>/
# Vamos copiar tudo de dist
COPY --from=build /app/dist/frota-pro/browser/ /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
