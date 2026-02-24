# =========================
# BUILD STAGE
# =========================
FROM node:20-alpine AS build

WORKDIR /app

# copia apenas os arquivos do projeto angular
COPY frota-pro/package*.json ./
RUN npm ci

COPY frota-pro/ .
RUN npm run build

# =========================
# RUNTIME STAGE
# =========================
FROM nginx:alpine

# copia o build gerado
COPY --from=build /app/dist/ /usr/share/nginx/html

EXPOSE 80
