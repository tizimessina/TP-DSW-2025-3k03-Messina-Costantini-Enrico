# Imagen del backend. Se construye desde la raíz del monorepo:
#   docker build -f apps/server/Dockerfile .
# Una sola etapa a propósito: la imagen conserva el CLI de Prisma para poder
# correr migraciones y carga inicial con el mismo artefacto (servicio `migrate`
# del docker-compose), que es lo que hace que todo levante con un comando.

FROM node:22-slim

# openssl lo necesita el motor de consultas de Prisma.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

WORKDIR /app

# Primero solo los manifiestos: mientras no cambien, Docker reutiliza la capa
# de instalación aunque cambie el código.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json

RUN pnpm install --frozen-lockfile

COPY . .

# `@repo/db` genera el cliente de Prisma y sus tipos; el server compila contra eso.
RUN pnpm --filter @repo/db build \
  && pnpm --filter server build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "apps/server/dist/index.js"]
