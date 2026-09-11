# Instalación y ejecución

Estas instrucciones permiten correr AgroApp sin conocer cómo está desarrollado.

## Requisitos

| Herramienta | Versión | Para qué |
|:-|:-|:-|
| Node.js | 20 o superior (probado con 22 y 24) | ejecutar backend y frontend |
| pnpm | 8 o superior (`npm i -g pnpm`) | gestor de paquetes del monorepo |
| Docker Desktop | cualquiera reciente | base MySQL local (o usar un MySQL 8 propio) |

## 1. Clonar e instalar

```bash
git clone https://github.com/JereC4/TP-DSW-2025-3k03-Messina-Costantini-Enrico.git
cd TP-DSW-2025-3k03-Messina-Costantini-Enrico
pnpm install
```

## 2. Base de datos local

```bash
docker run -d --name agroapp-mysql -p 3307:3306 \
  -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=agro-dsw \
  -e MYSQL_USER=agro-dsw -e MYSQL_PASSWORD=agro-dsw \
  percona/percona-server:8.0
```

Cualquier MySQL 8 sirve: solo hay que ajustar `DATABASE_URL`.

## 3. Variables de entorno

```bash
cp packages/database/.env.example packages/database/.env   # DATABASE_URL para Prisma CLI
cp apps/server/.env.example apps/server/.env               # PORT, DATABASE_URL, JWT_SECRET, CORS_ORIGIN
cp apps/web/.env.example apps/web/.env                     # VITE_API_URL
```

Con el contenedor de arriba, `DATABASE_URL="mysql://agro-dsw:agro-dsw@localhost:3307/agro-dsw"` en ambos `.env`.

## 4. Migrar y cargar datos de ejemplo

```bash
pnpm db:migrate   # crea las tablas (prisma migrate dev)
pnpm db:seed      # roles, provincias/localidades, categorías, insumos con precio, usuarios demo, campos, servicios, solicitudes en todos los estados y valoraciones
```

El seed es idempotente: se puede volver a correr sin duplicar datos.

## 5. Ejecutar

```bash
pnpm dev
```

| Servicio | URL |
|:-|:-|
| Frontend | http://localhost:5173 |
| API | http://localhost:3000 |
| Swagger UI | http://localhost:3000/docs |
| Health check | http://localhost:3000/health |

Para correr solo una parte: `pnpm --filter server dev` o `pnpm --filter web dev`.

## 6. Usuarios de prueba

| Rol | Email | Contraseña |
|:-|:-|:-|
| ADMIN | admin@agroapp.dev | Admin123! |
| PRODUCTOR | productor@agroapp.dev | Productor123! |
| CONTRATISTA | contratista@agroapp.dev | Contratista123! |

## 7. Tests

```bash
pnpm test                          # unitarios + integración (server) y componentes (web)
pnpm --filter server test:unit     # solo unitarios del backend
pnpm --filter server test:integration  # integración contra la DB local
pnpm --filter web test:e2e         # Playwright (la primera vez: pnpm --filter web exec playwright install chromium)
```

Los tests de integración y e2e necesitan la base local migrada y con el seed cargado.

## 8. Build de producción

```bash
pnpm build                          # todos los paquetes
node apps/server/dist/index.js      # backend compilado
pnpm --filter web preview           # frontend compilado
```

## Problemas frecuentes

- **`ROLE_INVALID` al registrarse**: falta correr `pnpm db:seed`.
- **`Cannot find module '@repo/db'`**: correr `pnpm --filter @repo/db build` (se regenera el cliente de Prisma y los tipos).
- **CORS bloqueado**: revisar `CORS_ORIGIN` en `apps/server/.env` (debe incluir el origen del frontend).
- **El backend pega contra otra base**: el backend lee primero `apps/server/.env` y luego `packages/database/.env`; verificar cuál tiene `DATABASE_URL`.
