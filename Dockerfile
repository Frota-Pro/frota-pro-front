# =========================
# BUILD STAGE
# =========================
FROM node:20-alpine AS build
WORKDIR /app

# Copia os manifests do Angular que estão dentro da pasta frota-pro
COPY frota-pro/package*.json ./
RUN npm ci

# Copia o restante do projeto Angular
COPY frota-pro/ .
RUN npm run build

# =========================
# RUNTIME STAGE
# =========================
FROM nginx:alpine

# Ajuste aqui se seu dist gerar subpasta (ver passo 3)
COPY --from=build /app/dist/ /usr/share/nginx/html

EXPOSE 80
