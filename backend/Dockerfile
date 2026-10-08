# 1. aşama: TypeScript kodunu derle
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

# 2. aşama: sadece çalışma zamanı bağımlılıkları ve derlenmiş kod
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
USER node
EXPOSE 3000
# Önce migration + seed, ardından API.
CMD ["sh", "-c", "node dist/db/migrate.js && node dist/server.js"]
